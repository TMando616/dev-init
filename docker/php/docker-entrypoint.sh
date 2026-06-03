#!/bin/sh
set -e

# storage/app/temp_code is overlaid by the ./backend bind mount at runtime, so any
# ownership set in the image layer is masked. Fix it here (entrypoint runs as root
# before php-fpm drops to www-data) so php-fpm workers can always write temp code,
# regardless of the host directory's owner.
mkdir -p storage/app/temp_code
chown -R www-data:www-data storage/app/temp_code

# Grant www-data access to the mounted Docker socket. The host's docker group GID
# varies per machine, so detect it from the socket at runtime instead of guessing a
# build-time GID. This keeps code execution working on any host without manual setup.
if [ -S /var/run/docker.sock ]; then
    SOCK_GID=$(stat -c '%g' /var/run/docker.sock)
    if ! getent group "$SOCK_GID" >/dev/null 2>&1; then
        addgroup -g "$SOCK_GID" dockersock
    fi
    GROUP_NAME=$(getent group "$SOCK_GID" | cut -d: -f1)
    if ! id -nG www-data | tr ' ' '\n' | grep -qx "$GROUP_NAME"; then
        adduser www-data "$GROUP_NAME"
    fi
fi

# Chain to the base image's entrypoint so its own setup still runs.
exec docker-php-entrypoint "$@"
