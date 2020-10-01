cd "${PSScriptRoot}"
docker-compose build
docker run -v "${PSScriptRoot}:/app" -it labgrid/labflow-server:latest python server_test.py
