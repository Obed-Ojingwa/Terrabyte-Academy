"""set exam pass score to 40 percent

Revision ID: c4a7f1832b90
Revises: a91e6c3b42d7
Create Date: 2026-10-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4a7f1832b90"
down_revision: Union[str, None] = "a91e6c3b42d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(sa.text("UPDATE exams SET pass_score = 40"))
    op.create_check_constraint(
        "ck_exams_pass_score", "exams", "pass_score = 40"
    )
    op.alter_column(
        "exams",
        "pass_score",
        existing_type=sa.Numeric(precision=5, scale=2),
        server_default="40",
    )


def downgrade() -> None:
    op.drop_constraint("ck_exams_pass_score", "exams", type_="check")
    op.alter_column(
        "exams",
        "pass_score",
        existing_type=sa.Numeric(precision=5, scale=2),
        server_default=None,
    )
