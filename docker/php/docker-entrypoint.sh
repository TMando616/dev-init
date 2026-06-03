#!/bin/sh
set -e

# storage/app/temp_code is overlaid by the ./backend bind mount at runtime, so any
# ownership set in the image layer is masked. Fix it here (entrypoint runs as root
# before php-fpm drops to www-data) so php-fpm workers can always write temp code,
# regardless of the host directory's owner.
mkdir -p storage/app/temp_code
chown -R www-data:www-data storage/app/temp_code

# Chain to the base image's entrypoint so its own setup still runs.
exec docker-php-entrypoint "$@"
