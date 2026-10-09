#!/bin/sh
set -eu

psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  --set=ON_ERROR_STOP=1 \
  --set=runtime_password="$TESSERA_RUNTIME_PASSWORD" \
  --set=migrator_password="$TESSERA_MIGRATOR_PASSWORD" \
  --file=/docker-entrypoint-initdb.d/00-bootstrap-roles.sql
