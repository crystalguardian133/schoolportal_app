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

# --- Internal Reverb coordinates (plain HTTP, container-local) ---
# TLS terminates at the reverse proxy, so everything INSIDE the container
# (Reverb bind + the PHP broadcast client in config/broadcasting.php) must
# stay plain HTTP on the internal port. The public https/443 values live ONLY
# in the VITE_* build args baked into the JS bundle -- never here. Without
# this, a runtime REVERB_SCHEME=https makes PHP POST events to
# https://<host>:8081 (TLS against a non-TLS server) and every realtime emit
# fails while Web Push keeps working, which looks exactly like "push arrives
# but the bell stays grey".
export REVERB_HOST="${REVERB_HOST:-0.0.0.0}"
export REVERB_PORT="${REVERB_PORT:-8081}"
export REVERB_SCHEME="http"
echo "Internal Reverb endpoint: http://${REVERB_HOST}:${REVERB_PORT} (TLS terminates at proxy)"

# Detect whether the application was fully seeded (admin user exists).
# Returns 0 (true) when seeded, 1 otherwise. Seeding is skipped only when the
# DatabaseSeeder completed (admin@example.com present); a partial seed
# (roles/school_year only) will still re-run to completion.
db_has_seed_data() {
  [ "$(php artisan app:db-has-seed-data 2>/dev/null)" = "yes" ]
}

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

  # Fail loud, not silent: clients show a grey bell with zero console errors
  # when Reverb never actually bound. Keys/secrets are never logged here.
  echo "Waiting for Reverb on 127.0.0.1:${REVERB_PORT:-8081}..."
  REVERB_READY=""
  for _i in $(seq 1 15); do
    if curl -s -o /dev/null -m 2 "http://127.0.0.1:${REVERB_PORT:-8081}/" 2>/dev/null; then
      REVERB_READY="yes"
      break
    fi
    sleep 1
  done
  if [ "$REVERB_READY" = "yes" ]; then
    echo "Reverb is accepting connections (pid $REVERB_PID)."
  else
    echo "WARNING: Reverb port ${REVERB_PORT:-8081} is not accepting connections after 15s."
    echo "Realtime broadcasts WILL FAIL (see [WS] lines); Web Push is unaffected."
  fi

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

if ! STATUS="$(php artisan app:db-status 2>&1)"; then
  echo "Database is unreachable or its state could not be determined. Aborting startup to protect existing data."
  echo "---- Diagnostic output from app:db-status ----"
  echo "$STATUS"
  echo "-----------------------------------------------"
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
  if db_has_seed_data; then
    echo "Skipping seed (database already contains data)"
  else
    echo "Running seeders..."
    php artisan db:seed --force
  fi
else
  echo "Skipping seed (RUN_SEED not set to true)"
fi

start_services