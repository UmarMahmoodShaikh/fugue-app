#!/bin/sh
set -eu

# Default values
: "${PORT:=8080}"
: "${NODE_ENV:=production}"

echo "Starting container — NODE_ENV=${NODE_ENV} PORT=${PORT}"
export PORT NODE_ENV

# Warn if the front-end build is missing in production
if [ "$NODE_ENV" = "production" ]; then
  if [ ! -d "/app/client/dist" ]; then
    echo "⚠️  Warning: /app/client/dist not found — react client may not be built"
  fi
fi

# Replace shell with the command so signals are forwarded to the app
exec "$@"

