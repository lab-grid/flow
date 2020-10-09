Set-Location "${PSScriptRoot}"
docker-compose build web
docker-compose run --rm web npm run test
