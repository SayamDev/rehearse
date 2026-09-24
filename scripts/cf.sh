#!/bin/sh
# Builds for Cloudflare without local-only settings. The adapter bundles any .env files into
# the worker, and .env.local holds this computer's keys and the Ollama setting (which also
# turns off per-visitor limits). Online, the Groq key comes from `wrangler secret put` instead.
# Usage: scripts/cf.sh deploy | preview
set -e
cd "$(dirname "$0")/.."
if [ -f .env.local ]; then
  mv .env.local .env.local.deploying
  trap 'mv .env.local.deploying .env.local' EXIT INT TERM
fi
npx opennextjs-cloudflare build
if [ "${1:-deploy}" != "build-only" ]; then npx opennextjs-cloudflare "${1:-deploy}"; fi
