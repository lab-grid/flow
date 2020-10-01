import server

from api.compound import api as compounds
from api.derivation import api as derivations
from api.layer import api as layers
from api.protocol import api as protocols
from api.run import api as runs
from api.demo_run import api as demo_runs

from api.health import api as server_health


app = server.app
api = server.api
api.add_namespace(compounds)
api.add_namespace(derivations)
api.add_namespace(layers)
api.add_namespace(protocols)
api.add_namespace(runs)
api.add_namespace(demo_runs)

api.add_namespace(server_health)


if __name__ == '__main__':
    app.run()
