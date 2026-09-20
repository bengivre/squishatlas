#!/bin/sh
set -eu

UPLOADS_DIR="${UPLOADS_DIR:-/data/uploads}"

if [ -n "$UPLOADS_DIR" ]; then
  mkdir -p "$UPLOADS_DIR"
  # Named volumes mount as root; the app runs as nextjs and must write here.
  chown nextjs:nodejs "$UPLOADS_DIR"
fi

exec su-exec nextjs "$@"
