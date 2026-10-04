"""add exam attempt and scheduling policy

Revision ID: b7f4c2d91a60
Revises: 8cfba8153e4d
Create Date: 2026-10-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "b7f4c2d91a60"
down_revision: Union[str, None] = "8cfba8153e4d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("exams", sa.Column("available_from", sa.DateTime(timezone=True), nullable=True))
    op.add_column("exams", sa.Column("available_until", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "exams",
        sa.Column("max_attempts", sa.Integer(), server_default="1", nullable=False),
    )
    op.create_check_constraint(
        "ck_exams_max_attempts", "exams", "max_attempts BETWEEN 1 AND 10"
    )
    op.create_check_constraint(
        "ck_exams_availability_window",
        "exams",
        "available_from IS NULL OR available_until IS NULL OR available_from < available_until",
    )

    op.add_column("exam_results", sa.Column("attempt_number", sa.Integer(), nullable=True))
    op.add_column("exam_results", sa.Column("started_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("exam_results", sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("exam_results", sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "exam_results",
        sa.Column("status", sa.String(length=30), server_default="graded", nullable=False),
    )
    op.add_column(
        "exam_results",
        sa.Column("auto_score", sa.Numeric(precision=8, scale=2), nullable=True),
    )
    op.add_column(
        "exam_results",
        sa.Column("manual_grades", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column("exam_results", sa.Column("feedback", sa.Text(), nullable=True))
    op.alter_column(
        "exam_results",
        "score",
        existing_type=sa.Numeric(precision=5, scale=2),
        type_=sa.Numeric(precision=8, scale=2),
        existing_nullable=True,
    )

    op.execute(
        sa.text(
            """
            WITH ranked_results AS (
                SELECT result.id,
                       ROW_NUMBER() OVER (
                           PARTITION BY result.exam_id, result.student_id
                           ORDER BY result.taken_at, result.id
                       ) AS attempt_number,
                       result.taken_at,
                       exam.duration_min
                FROM exam_results AS result
                JOIN exams AS exam ON exam.id = result.exam_id
            )
            UPDATE exam_results AS result
            SET attempt_number = ranked_results.attempt_number,
                started_at = (ranked_results.taken_at AT TIME ZONE 'UTC') - (ranked_results.duration_min * INTERVAL '1 minute'),
                expires_at = ranked_results.taken_at AT TIME ZONE 'UTC',
                submitted_at = ranked_results.taken_at AT TIME ZONE 'UTC',
                auto_score = result.score,
                manual_grades = '{}'::jsonb
            FROM ranked_results
            WHERE result.id = ranked_results.id
            """
        )
    )
    op.alter_column("exam_results", "attempt_number", nullable=False, server_default="1")
    op.alter_column("exam_results", "started_at", nullable=False)
    op.create_check_constraint(
        "ck_exam_results_attempt_number", "exam_results", "attempt_number >= 1"
    )
    op.create_check_constraint(
        "ck_exam_results_status",
        "exam_results",
        "status IN ('in_progress', 'expired', 'pending_review', 'graded')",
    )
    op.create_index(
        "ix_exam_results_exam_student", "exam_results", ["exam_id", "student_id"]
    )
    op.create_unique_constraint(
        "uq_exam_results_attempt",
        "exam_results",
        ["exam_id", "student_id", "attempt_number"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_exam_results_attempt", "exam_results", type_="unique")
    op.drop_index("ix_exam_results_exam_student", table_name="exam_results")
    op.drop_constraint("ck_exam_results_status", "exam_results", type_="check")
    op.drop_constraint("ck_exam_results_attempt_number", "exam_results", type_="check")
    op.drop_column("exam_results", "feedback")
    op.drop_column("exam_results", "manual_grades")
    op.drop_column("exam_results", "auto_score")
    op.drop_column("exam_results", "status")
    op.drop_column("exam_results", "submitted_at")
    op.drop_column("exam_results", "expires_at")
    op.drop_column("exam_results", "started_at")
    op.drop_column("exam_results", "attempt_number")

    op.drop_constraint("ck_exams_availability_window", "exams", type_="check")
    op.drop_constraint("ck_exams_max_attempts", "exams", type_="check")
    op.drop_column("exams", "max_attempts")
    op.drop_column("exams", "available_until")
    op.drop_column("exams", "available_from")
