# server

The Datalayer server provides a REST/JSON api documented with Swagger UI
(accessible at root of server).

## Authentication

The `server` expects secured API endpoints to be authenticated with
a JWT provided by auth0 in the `Authorization:` header:
<https://auth0.com/docs/libraries/auth0-spa-js>

Happy to help integrate this.

## Usage

To run the server locally:

```shell
docker-compose build
docker-compose up
```

The api can then be accessed by going to <http://localhost:5000/>

## Database Migrations

When changing the database models, use the following basic process:

* Change database models
* Create a new migration with: `FLASK_APP=server.py python -m flask db migrate -m "Your migration message goes here"`
* Review/Edit the generated migration in `migrations/versions/*`
* Apply migrations to real databases (flask will read from its config, so make sure you set the database uri correctly) with: `FLASK_APP=server.py python -m flask db upgrade`

Instead of running raw python commands, the server.sh script is provided which runs a docker container
with the project directory mounted as a volume. To use this script to generate a new migration:

```shell
./server.sh db migrate -m "Your migration message goes here"
./server.sh db upgrade
```

When working with a docker-compose setup, it may be advisable to shell-in to the running API container
as it already has properly setup network names on its interfaces:

```shell
# This command *does not* mount any volumes. Make sure you have already built and are running a
# container that has your migrations in it. If in doubt, docker-compose build && docker-compose
# up before doing this.
#
# This command will upgrade the connected db container run by docker-compose.
docker exec -it server_api_1 python -m flask db upgrade
```

See: https://flask-migrate.readthedocs.io/en/latest/
