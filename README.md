# LabFlow

An open-source configurable LIMS for biotech labs.

## Development

Development docker containers that support hot code reloading on edit are provided.

To run labflow in development mode:

```
# First, setup your environment.
cp example.env .env

# Edit the .env file to contain secrets appropriate for your environment.

docker-compose build
docker-compose up
```

Once the database, server, and webapp are running, the database itself needs to have its schema setup/updated.

### Updating your database

Whenever changes to the database schema for labflow are made, new migration(s) get created in the
`server/migrations/versions/` directory. To update your database to the latest version, first start
the database and server containers, then run:

```
./server.sh db upgrade
```
