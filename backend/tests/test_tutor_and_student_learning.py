from app.schemas.lms import AssignmentCreate, AssignmentResponse, ExamCreate, ExamResponse, LessonProgressResponse, SubmissionResponse, SubmissionReview


def test_assignment_and_exam_payloads_validate():
    assignment = AssignmentCreate(course_id="22222222-2222-2222-2222-222222222222", title="Week 1", due_date="2024-02-01T00:00:00", max_score=100)
    exam = ExamCreate(course_id="22222222-2222-2222-2222-222222222222", title="Midterm", duration_min=60, pass_score=70.0)

    assert assignment.max_score == 100
    assert exam.pass_score == 70.0


def test_submission_response_supports_status_and_score():
    submission = SubmissionResponse(id="33333333-3333-3333-3333-333333333333", assignment_id="22222222-2222-2222-2222-222222222222", student_id="11111111-1111-1111-1111-111111111111", status="submitted", submitted_at="2024-02-01T00:00:00")

    assert submission.status == "submitted"


def test_lesson_progress_and_submission_review_schemas_validate():
    progress = LessonProgressResponse(lesson_id="44444444-4444-4444-4444-444444444444", is_completed=True, watch_time_sec=480)
    review = SubmissionReview(score=92.5, feedback="Great work", status="graded")

    assert progress.is_completed is True
    assert review.score == 92.5
