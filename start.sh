#!/bin/bash

cd /Users/king/Documents/Codex/2026-05-07/korean_learn || exit 1

export MYSQL_HOST=127.0.0.1
export MYSQL_PORT=3306
export MYSQL_USER=korean_user
export MYSQL_PASSWORD='Leo@2050.'

/Users/king/.pyenv/versions/3.9.6/bin/python3 server.py
