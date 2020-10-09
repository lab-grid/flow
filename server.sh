#!/usr/bin/env bash

docker-compose exec server python -m flask "${@}"
