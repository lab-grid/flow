import server

from api.protocol import api as protocols
from api.run import api as runs
from api.user import api as users
from api.group import api as groups
from api.search import api as search

from api.health import api as server_health


app = server.app
api = server.api
api.add_namespace(protocols)
api.add_namespace(runs)
api.add_namespace(users)
api.add_namespace(groups)
api.add_namespace(search)

api.add_namespace(server_health)


if __name__ == '__main__':
    app.run()
