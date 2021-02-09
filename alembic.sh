#!/usr/bin/env bash

docker-compose exec server alembic ${@}
