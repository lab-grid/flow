#!/usr/bin/env bash

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd "${script_dir}"
docker-compose build
docker run -v "${script_dir}:/app" -it labgrid/labflow-server:latest python server_test.py
