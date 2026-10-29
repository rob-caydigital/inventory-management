#!/usr/bin/env bash
# Copies this repo's client app (without node_modules) as the test input.
set -eu
REPO_ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"
mkdir -p client
tar -C "$REPO_ROOT/client" --exclude=node_modules --exclude=dist -cf - . | tar -C client -xf -
