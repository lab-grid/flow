#!/usr/bin/env sh

set -e
set -o pipefail

react_env_vars="$(env | grep REACT_APP_)"
react_config_js="/usr/share/nginx/html/config.js"
react_config_js_written="/usr/share/nginx/html/config.js.written"

if [ ! -f "${react_config_js_written}" ]; then
    echo "process.env = {};" >> "${react_config_js}"
    for env_var in ${react_env_vars}; do
        echo "process.env.${env_var};" >> "${react_config_js}"
    done
fi

if [ -z "${PORT}" ]; then
    export PORT=80
fi
envsubst '${PORT}' < /etc/nginx/conf.d/default.template > /etc/nginx/conf.d/default.conf

if [ -z "${@}" ]; then
    nginx -g 'daemon off;'
else
    ${@}
fi
