FROM php:8.3-fpm as builder

# Install system deps + PHP extensions
RUN apt-get update && apt-get install -y \
    git curl unzip libpng-dev libonig-dev libxml2-dev libzip-dev \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Install Node 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

WORKDIR /var/www/html

# Copy composer files first for better layer caching
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --optimize-autoloader

# Copy package files for better layer caching
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Now copy the rest of the app (this invalidates cache less often)
COPY . .

# Re-run composer scripts now that full app is present (artisan needs the full app)
RUN composer dump-autoload --optimize

# Build-time env vars for Vite (VITE_* vars get baked into the JS bundle here)
ARG VITE_APP_NAME
ARG VITE_PUSHER_APP_KEY
ARG VITE_PUSHER_HOST
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_PUSHER_APP_KEY=$VITE_PUSHER_APP_KEY
ENV VITE_PUSHER_HOST=$VITE_PUSHER_HOST

# Laravel needs a temporary APP_KEY for artisan commands to run during build (wayfinder plugin calls artisan)
RUN php artisan key:generate --show > /tmp/tempkey.txt || true

# Build React/Vite assets — this is where wayfinder:generate runs via php artisan
RUN npm run build

EXPOSE 8080
CMD php artisan config:cache && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8080