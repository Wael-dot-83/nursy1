"""Add unique constraints for child date combinations

Revision ID: c8dcfb08146f
Revises: f446a5a2d95f
Create Date: 2025-11-01 09:55:13.274071

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8dcfb08146f'
down_revision: Union[str, None] = 'f446a5a2d95f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # SQLite requires batch mode for ALTER statements
    with op.batch_alter_table('daily_reports', schema=None) as batch_op:
        # Add unique constraint to prevent duplicate reports for same child/date
        batch_op.create_unique_constraint(
            'uq_daily_reports_child_date',
            ['child_id', 'date']
        )

    with op.batch_alter_table('attendance', schema=None) as batch_op:
        # Add unique constraint to prevent duplicate attendance for same child/date
        batch_op.create_unique_constraint(
            'uq_attendance_child_date',
            ['child_id', 'date']
        )


def downgrade() -> None:
    # SQLite requires batch mode for ALTER statements
    with op.batch_alter_table('attendance', schema=None) as batch_op:
        batch_op.drop_constraint('uq_attendance_child_date', type_='unique')

    with op.batch_alter_table('daily_reports', schema=None) as batch_op:
        batch_op.drop_constraint('uq_daily_reports_child_date', type_='unique')
