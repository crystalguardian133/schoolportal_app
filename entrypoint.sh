#!/bin/sh
set -e

echo "Caching config..."
php artisan config:cache
php artisan route:cache 2>/dev/null || true
php artisan view:cache 2>/dev/null || true

MODE="${RUN_MIGRATIONS:-auto}"

if ! STATUS="$(php artisan app:db-status)"; then
  echo "Database is unreachable or its state could not be determined. Aborting startup to protect existing data."
  exit 1
fi

echo "Database status: $STATUS"

if [ "$STATUS" = "external" ] && [ "$MODE" != "always" ]; then
  echo "WARNING: The database already contains data but is not tracked by Laravel migrations."
  echo "Skipping migrations and seed to avoid data loss."
  echo "Set RUN_MIGRATIONS=always only if you understand the schema and want to force migrations."

  if [ "$APP_DEPLOY_STRICT" = "true" ]; then
    echo "APP_DEPLOY_STRICT=true: aborting container startup because existing untracked data was detected."
    exit 1
  fi

  echo "Starting server without running migrations..."
  php artisan reverb:start --port="${REVERB_PORT:-8080}" >/dev/null 2>&1 &
  php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"
  exit 0
fi

if [ "$MODE" = "never" ]; then
  echo "RUN_MIGRATIONS=never: skipping migrations"
else
  echo "Running migrations..."
  php artisan migrate --force
fi

if [ "$RUN_SEED" = "true" ]; then
  if [ "$STATUS" = "empty" ]; then
    echo "Running seeders..."
    php artisan db:seed --force
  else
    echo "Skipping seed (database already contains data)"
  fi
else
  echo "Skipping seed (RUN_SEED not set to true)"
fi

echo "Starting Reverb WebSocket server..."
php artisan reverb:start --port="${REVERB_PORT:-8080}" >/dev/null 2>&1 &

echo "Starting server..."
php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"
