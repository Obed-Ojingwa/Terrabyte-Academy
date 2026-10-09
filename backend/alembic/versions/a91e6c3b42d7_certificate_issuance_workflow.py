"""add certificate recipient display names

Revision ID: a91e6c3b42d7
Revises: b7f4c2d91a60
Create Date: 2026-10-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a91e6c3b42d7"
down_revision: Union[str, None] = "b7f4c2d91a60"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("certificate_name", sa.String(length=150), nullable=True))
    op.add_column("certificates", sa.Column("recipient_name", sa.String(length=150), nullable=True))


def downgrade() -> None:
    op.drop_column("certificates", "recipient_name")
    op.drop_column("users", "certificate_name")