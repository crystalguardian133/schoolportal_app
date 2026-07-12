#!/bin/sh
set -e

echo "Caching config..."
php artisan config:cache

echo "Running migrations..."
php artisan migrate --force

if [ "$RUN_SEED" = "true" ]; then
  echo "Running seeders..."
  php artisan db:seed --force
else
  echo "Skipping seed (RUN_SEED not set to true)"
fi

echo "Starting server..."
php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"