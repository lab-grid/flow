Set-Location "${PSScriptRoot}"
docker-compose build server
docker-compose run --rm server python server_test.py
