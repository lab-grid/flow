#!/usr/bin/env sh

set -e
set -o pipefail

react_env_vars="$(env | grep REACT_APP_ || true)"
react_config_js="/usr/share/nginx/html/config.js"

echo "window.process = {env: {}};" >> "${react_config_js}"
for env_var in ${react_env_vars}; do
    echo "window.process.env.${env_var}\";" | sed -e 's/=/="/' >> "${react_config_js}"
done

if [ -z "${PORT}" ]; then
    export PORT=80
fi
envsubst '${PORT}' < /etc/nginx/conf.d/default.template > /etc/nginx/conf.d/default.conf

if [ -z "${@}" ]; then
    nginx -g 'daemon off;'
else
    ${@}
fi
