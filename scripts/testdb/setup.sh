#!/usr/bin/env bash
# Creates a throwaway local Postgres, applies the Supabase shim and every migration in order.
# Usage: scripts/testdb/setup.sh            (data dir: $PGDATA_DIR or /tmp/pd-testdb)
# TEST USE ONLY: this never connects to the real database.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
DATA="${PGDATA_DIR:-/tmp/pd-testdb}"
PORT="${PGPORT:-54329}"
RUNAS=""; [ "$(id -u)" = "0" ] && RUNAS="runuser -u postgres --"
if [ ! -f "$DATA/PG_VERSION" ]; then
  mkdir -p "$DATA"; [ -n "$RUNAS" ] && chown postgres "$DATA"
  $RUNAS "$PGBIN/initdb" -D "$DATA" -U postgres -A trust >/dev/null
fi
$RUNAS "$PGBIN/pg_ctl" -D "$DATA" -o "-p $PORT -k /tmp" -l "$DATA/log" status >/dev/null 2>&1 || \
  $RUNAS "$PGBIN/pg_ctl" -D "$DATA" -o "-p $PORT -k /tmp" -l "$DATA/log" -w start >/dev/null
PSQL="psql -h /tmp -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"
$PSQL -d postgres -c "drop database if exists permitdraft_test" -c "create database permitdraft_test"
$PSQL -d permitdraft_test -f "$ROOT/scripts/testdb/supabase_shim.sql"
$PSQL -d permitdraft_test -f "$ROOT/src/lib/data.sql"   # Foundable platform helpers (private.*)
n=0
for f in "$ROOT"/drizzle/migrations/*.sql; do
  $PSQL -d permitdraft_test -f "$f" || { echo "FAILED: $(basename "$f")"; exit 1; }
  n=$((n+1))
done
echo "OK: applied $n migrations to permitdraft_test (psql -h /tmp -p $PORT -U postgres permitdraft_test)"
