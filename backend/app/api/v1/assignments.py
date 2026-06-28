from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select
from sqlalchemy.orm import joinedload
from app.database import get_db
from app.api.deps import get_current_user, require_admin, require_tutor
from app.models.assignment import Assignment, Submission
from app.models.course import Course
from app.models.enrollment import Enrollment
from datetime import datetime
from app.schemas.lms import AssignmentCreate, AssignmentResponse, AssignmentUpdate, SubmissionCreate, SubmissionResponse, SubmissionReview

router = APIRouter(prefix="/assignments", tags=["Assignments"])


async def _student_can_access_assignment(current_user, assignment: Assignment, db: AsyncSession) -> bool:
    role_name = current_user.role.name
    if role_name in {"super_admin", "admin"}:
        return True
    if role_name == "tutor":
        course_result = await db.execute(select(Course).where(Course.id == assignment.course_id))
        course = course_result.scalar_one_or_none()
        return assignment.tutor_id == current_user.id or (course and course.tutor_id == current_user.id)
    if assignment.tutor_id and assignment.tutor_id == current_user.id:
        return True
    enrollment_result = await db.execute(
        select(Enrollment).where(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == assignment.course_id,
            Enrollment.status.in_(["active", "pending", "completed"]),
        )
    )
    return enrollment_result.scalar_one_or_none() is not None


@router.get("/", response_model=list[AssignmentResponse])
async def list_assignments(
    course_id: str | None = Query(None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Assignment).options(joinedload(Assignment.course), joinedload(Assignment.tutor), joinedload(Assignment.submissions))
    if course_id:
        query = query.where(Assignment.course_id == course_id)
    role_name = current_user.role.name
    if role_name == "tutor":
        query = query.where(or_(Assignment.tutor_id == current_user.id, Course.tutor_id == current_user.id))
    elif role_name not in {"super_admin", "admin"}:
        enrolled_courses = (
            await db.execute(
                select(Enrollment.course_id).where(
                    Enrollment.student_id == current_user.id,
                    Enrollment.status.in_(["active", "pending", "completed"]),
                )
            )
        ).scalars().all()
        if enrolled_courses:
            query = query.where(Assignment.course_id.in_(list(enrolled_courses)))
        else:
            return []
    result = await db.execute(query.order_by(Assignment.created_at.desc()))
    return result.scalars().all()


@router.get("/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(assignment_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Assignment)
        .options(joinedload(Assignment.course), joinedload(Assignment.tutor), joinedload(Assignment.submissions))
        .where(Assignment.id == assignment_id)
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if not await _student_can_access_assignment(current_user, assignment, db):
        raise HTTPException(status_code=403, detail="Not authorized")
    return assignment


@router.post("/", response_model=AssignmentResponse, status_code=201)
async def create_assignment(
    payload: AssignmentCreate,
    current_user=Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    course_result = await db.execute(select(Course).where(Course.id == payload.course_id))
    course = course_result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    role_name = current_user.role.name
    if role_name not in {"super_admin", "admin"}:
        if role_name != "tutor":
            raise HTTPException(status_code=403, detail="Not authorized")
        if course.tutor_id is not None and course.tutor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if payload.tutor_id is not None and payload.tutor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        tutor_id = current_user.id
    else:
        tutor_id = payload.tutor_id

    assignment_data = payload.model_dump(exclude={"tutor_id"})
    assignment = Assignment(**assignment_data, tutor_id=tutor_id)
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment


@router.put("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: str,
    payload: AssignmentUpdate,
    current_user=Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    role_name = current_user.role.name
    if role_name not in {"super_admin", "admin"}:
        course_result = await db.execute(select(Course).where(Course.id == assignment.course_id))
        course = course_result.scalar_one_or_none()
        if assignment.tutor_id != current_user.id and (not course or course.tutor_id != current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(assignment, field, value)

    await db.commit()
    await db.refresh(assignment)
    return assignment


@router.post("/{assignment_id}/submissions", response_model=SubmissionResponse, status_code=201)
async def create_submission(
    assignment_id: str,
    payload: SubmissionCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    assignment = (await db.execute(select(Assignment).where(Assignment.id == assignment_id))).scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    submission = (
        await db.execute(
            select(Submission)
            .where(
                Submission.assignment_id == assignment_id,
                Submission.student_id == current_user.id,
            )
        )
    ).scalar_one_or_none()

    if submission is None:
        submission = Submission(
            assignment_id=assignment_id,
            student_id=current_user.id,
            status="submitted",
            text_response=payload.text_response,
            s3_key=payload.s3_key,
        )
        db.add(submission)
    else:
        submission.text_response = payload.text_response
        submission.s3_key = payload.s3_key
        submission.status = "submitted"
        submission.submitted_at = datetime.utcnow()

    await db.commit()
    await db.refresh(submission)
    return submission


@router.put("/{assignment_id}/submissions/{submission_id}", response_model=SubmissionResponse)
async def review_submission(
    assignment_id: str,
    submission_id: str,
    payload: SubmissionReview,
    current_user=Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    submission = (
        await db.execute(
            select(Submission).where(Submission.id == submission_id, Submission.assignment_id == assignment_id)
        )
    ).scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    assignment_result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = assignment_result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    role_name = current_user.role.name
    if role_name not in {"super_admin", "admin"}:
        course_result = await db.execute(select(Course).where(Course.id == assignment.course_id))
        course = course_result.scalar_one_or_none()
        if assignment.tutor_id != current_user.id and (not course or course.tutor_id != current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized")

    submission.score = payload.score
    submission.feedback = payload.feedback
    submission.status = payload.status
    await db.commit()
    await db.refresh(submission)
    return submission


@router.delete("/{assignment_id}", status_code=204)
async def delete_assignment(
    assignment_id: str,
    current_user=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    await db.delete(assignment)
    await db.commit()
