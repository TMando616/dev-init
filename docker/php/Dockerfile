FROM php:8.4-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    postgresql-dev \
    icu-dev \
    docker-cli

# Install PHP extensions
RUN docker-php-ext-install pdo_pgsql pgsql gd xml zip bcmath intl

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/backend

# Pre-create temp_code directory with www-data ownership so php-fpm workers can write to it.
# Without this, running artisan commands as root (e.g. in tests) creates the directory as root,
# which blocks writes from the www-data php-fpm workers at runtime.
RUN mkdir -p storage/app/temp_code && chown -R www-data:www-data storage/app/temp_code

# Allow www-data (php-fpm workers) to access the Docker socket mounted from the host.
# DOCKER_GID must match the host's docker group GID (check with: getent group docker | cut -d: -f3).
# php-fpm calls initgroups() when switching to www-data, so the group must exist in /etc/group.
ARG DOCKER_GID=1001
RUN addgroup -g ${DOCKER_GID} dockersock && adduser www-data dockersock

EXPOSE 9000
CMD ["php-fpm"]
