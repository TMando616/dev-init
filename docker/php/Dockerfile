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

EXPOSE 9000
CMD ["php-fpm"]
