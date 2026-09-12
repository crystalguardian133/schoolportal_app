#!/bin/sh
set -e

APP_PID=""
REVERB_PID=""
QUEUE_PID=""

cleanup() {
  echo "Stopping background services..."
  [ -n "$APP_PID" ] && kill "$APP_PID" 2>/dev/null || true
  [ -n "$REVERB_PID" ] && kill "$REVERB_PID" 2>/dev/null || true
  [ -n "$QUEUE_PID" ] && kill "$QUEUE_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  exit 0
}

trap cleanup INT TERM

# Optional: on a redeploy (container start) refresh dependencies so the
# running image picks up the latest composer/npm patches without a rebuild.
# DISABLED by default -- npm run build is memory-heavy and can OOM the
# container on cloud build services. Set UPDATE_DEPENDENCIES=true to enable.
if [ "${UPDATE_DEPENDENCIES:-false}" = "true" ]; then
  echo "Redeploy: updating dependencies..."
  mkdir -p /tmp/composer /tmp/npm
  export COMPOSER_HOME="${COMPOSER_HOME:-/tmp/composer}"
  export NPM_CONFIG_CACHE="${NPM_CONFIG_CACHE:-/tmp/npm}"
  composer update --no-dev --no-interaction --prefer-dist \
    || echo "WARNING: composer update failed, using bundled vendor/"
  npm update \
    || echo "WARNING: npm update failed, using bundled node_modules/"
  npm run build \
    || echo "WARNING: asset build failed, keeping previous build/"
else
  echo "Skipping dependency update (UPDATE_DEPENDENCIES != true)"
fi

start_services() {
  echo "Starting Reverb WebSocket server on port ${REVERB_PORT:-8081}..."
  php artisan reverb:start --port="${REVERB_PORT:-8081}" >/dev/null 2>&1 &
  REVERB_PID=$!

  # Queue worker is required so queued jobs run (e.g. SendAnnouncementPushNotification).
  # The container's default QUEUE_CONNECTION=database, but skip when sync/local.
  if [ "${QUEUE_CONNECTION:-database}" != "sync" ]; then
    echo "Starting queue worker..."
    php artisan queue:work --sleep=1 --tries=3 >/dev/null 2>&1 &
    QUEUE_PID=$!
  fi

  echo "Starting server on port ${PORT:-8080}..."
  php artisan serve --host=0.0.0.0 --port="${PORT:-8080}" &
  APP_PID=$!

  wait "$APP_PID"
}

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

  start_services
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

start_services