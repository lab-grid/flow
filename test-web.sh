#!/usr/bin/env bash

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd "${script_dir}"
docker-compose build web
docker-compose run --rm web npm run test
