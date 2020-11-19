"""Makes audit fields foreign keys.

Revision ID: 1146a831fbfa
Revises: 9895123c372c
Create Date: 2020-11-19 13:18:42.280211

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1146a831fbfa'
down_revision = '9895123c372c'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_foreign_key(None, 'protocol', 'user', ['created_by'], ['id'])
    op.create_foreign_key(None, 'protocol_version', 'user', ['updated_by'], ['id'])
    op.create_foreign_key(None, 'run', 'user', ['created_by'], ['id'])
    op.create_foreign_key(None, 'run_version', 'user', ['updated_by'], ['id'])
    op.create_foreign_key(None, 'user', 'user', ['created_by'], ['id'])
    op.create_foreign_key(None, 'user_version', 'user', ['updated_by'], ['id'])
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'user_version', type_='foreignkey')
    op.drop_constraint(None, 'user', type_='foreignkey')
    op.drop_constraint(None, 'run_version', type_='foreignkey')
    op.drop_constraint(None, 'run', type_='foreignkey')
    op.drop_constraint(None, 'protocol_version', type_='foreignkey')
    op.drop_constraint(None, 'protocol', type_='foreignkey')
    # ### end Alembic commands ###