#!/usr/bin/env bash

docker exec -it server_api_1 python -m flask "${@}"
