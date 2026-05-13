#!/bin/bash

set -e

cd "$(dirname "$0")"

if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ -x ".venv/bin/python" ]; then
  .venv/bin/python server.py
else
  python3 server.py
fi
