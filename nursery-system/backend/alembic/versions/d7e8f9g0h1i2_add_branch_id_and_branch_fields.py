"""add_branch_id_and_branch_fields

Revision ID: d7e8f9g0h1i2
Revises: c8dcfb08146f
Create Date: 2025-11-05 20:41:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd7e8f9g0h1i2'
down_revision = 'c8dcfb08146f'
branch_labels = None
depends_on = None


def upgrade():
    # Add branch_id to users table
    op.add_column('users', sa.Column('branch_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_users_branch_id', 'users', 'branches', ['branch_id'], ['id'])
    
    # Add name_normalized and is_active to branches table
    op.add_column('branches', sa.Column('name_normalized', sa.String(length=255), nullable=True))
    op.add_column('branches', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))
    
    # Create index on branch name_normalized
    op.create_index('ix_branches_name_normalized', 'branches', ['name_normalized'])
    
    # Update existing branches to have normalized names
    op.execute("""
        UPDATE branches 
        SET name_normalized = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9\u0600-\u06FF\s]', '', 'g'))
        WHERE name_normalized IS NULL
    """)
    
    # Make name_normalized not nullable after data migration
    op.alter_column('branches', 'name_normalized', nullable=False)


def downgrade():
    # Drop index
    op.drop_index('ix_branches_name_normalized', table_name='branches')
    
    # Remove columns from branches
    op.drop_column('branches', 'is_active')
    op.drop_column('branches', 'name_normalized')
    
    # Remove branch_id from users
    op.drop_constraint('fk_users_branch_id', 'users', type_='foreignkey')
    op.drop_column('users', 'branch_id')
