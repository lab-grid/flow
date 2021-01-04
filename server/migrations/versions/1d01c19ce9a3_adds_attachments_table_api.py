"""Adds attachments table/API.

Revision ID: 1d01c19ce9a3
Revises: 26152434f3f5
Create Date: 2021-01-07 18:36:54.657972

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1d01c19ce9a3'
down_revision = '26152434f3f5'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('attachment',
    sa.Column('is_deleted', sa.Boolean(), nullable=True),
    sa.Column('created_on', sa.DateTime(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=256), nullable=True),
    sa.Column('mimetype', sa.String(length=64), nullable=True),
    sa.Column('data', sa.LargeBinary(), nullable=True),
    sa.Column('created_by', sa.String(length=64), nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('run_version_attachment',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('run_version_id', sa.Integer(), nullable=True),
    sa.Column('attachment_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['attachment_id'], ['attachment.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['run_version_id'], ['run_version.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_foreign_key(None, 'sample', 'sample_version', ['version_id'], ['id'], use_alter=True)
    op.create_foreign_key(None, 'sample', 'protocol_version', ['protocol_version_id'], ['id'], use_alter=True)
    op.create_foreign_key(None, 'sample', 'run_version', ['run_version_id'], ['id'], use_alter=True)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'sample', type_='foreignkey')
    op.drop_constraint(None, 'sample', type_='foreignkey')
    op.drop_constraint(None, 'sample', type_='foreignkey')
    op.drop_table('run_version_attachment')
    op.drop_table('attachment')
    # ### end Alembic commands ###
