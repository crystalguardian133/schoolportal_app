FROM php:8.4-fpm as builder

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

# Copy the rest of the app
COPY . .

RUN composer dump-autoload --optimize

# Create .env for build-time artisan commands (wayfinder needs Laravel to boot)
ARG APP_KEY
RUN cp .env.example .env && \
    sed -i "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" .env

# Build-time env vars for Vite
ARG VITE_APP_NAME
ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST
ARG VITE_REVERB_PORT
ARG VITE_REVERB_SCHEME
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY
ENV VITE_REVERB_HOST=$VITE_REVERB_HOST
ENV VITE_REVERB_PORT=$VITE_REVERB_PORT
ENV VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME

# TEMP DEBUG: run wayfinder directly to see the real error
RUN php artisan wayfinder:generate --with-form

RUN npm run build

# Make entrypoint executable
RUN chmod +x /var/www/html/entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/var/www/html/entrypoint.sh"]