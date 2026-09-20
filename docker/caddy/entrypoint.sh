#!/bin/sh
set -eu

CONFIG=/etc/caddy/Caddyfile
BASE=/etc/caddy/Caddyfile.base

cp "$BASE" "$CONFIG"

if [ -n "${CADDY_DOMAIN:-}" ]; then
  {
    printf '\n%s {\n' "$CADDY_DOMAIN"
    if [ -n "${CADDY_TLS_CERT:-}" ] && [ -n "${CADDY_TLS_KEY:-}" ]; then
      printf '\ttls %s %s\n' "$CADDY_TLS_CERT" "$CADDY_TLS_KEY"
    fi
    printf '\timport common\n}\n'
  } >> "$CONFIG"
fi

exec caddy run --config "$CONFIG" --adapter caddyfile
