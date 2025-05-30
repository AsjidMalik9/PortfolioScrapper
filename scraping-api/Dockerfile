# Dockerfile for Laravel scraping-api
FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update \
    && apt-get install -y \
        libpq-dev \
        libzip-dev \
        unzip \
        git \
        curl \
        libpng-dev \
        libonig-dev \
        libxml2-dev \
        zip \
        libssl-dev \
    && docker-php-ext-install pdo pdo_pgsql zip

# Install Composer
COPY --from=composer:2.6 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy existing application directory contents
COPY . /var/www

# Install PHP dependencies
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Run Laravel migrations automatically
CMD php artisan migrate --force && php-fpm

# Copy existing application directory permissions
RUN chown -R www-data:www-data /var/www \
    && chmod -R 755 /var/www/storage

# Expose port 9000
EXPOSE 9000
