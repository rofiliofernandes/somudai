#!/usr/bin/env bash
# Runs every migration plus supabase/tests/rls_test.sql against a throwaway
# Postgres database. Needs psql and a local Postgres you can create databases on.
# Usage: PGHOST=... PGPORT=... PGUSER=postgres scripts/test-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."

DB="somudai_test_$$"
createdb "$DB"
trap 'dropdb --if-exists "$DB"' EXIT

run() { psql -X -q -v ON_ERROR_STOP=1 -d "$DB" "$@"; }

run -f supabase/tests/stub_supabase.sql
for f in supabase/migrations/*.sql; do
  echo "migrating: $f"
  run -f "$f"
done
run -o /dev/null -f supabase/tests/rls_test.sql 2>&1 | sed 's/^psql:[^ ]* NOTICE:  /  /'
