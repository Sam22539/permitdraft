# Local test database (test use only)

A throwaway Postgres that mirrors the live PermitDraft database schema, for building and testing without touching real data.

```bash
scripts/testdb/setup.sh                      # creates permitdraft_test and applies everything
psql -h /tmp -p 54329 -U postgres permitdraft_test -f scripts/testdb/isolation_test.sql
```

What `setup.sh` does, in order:
1. Starts a local Postgres (data in `/tmp/pd-testdb`, port 54329).
2. Runs `supabase_shim.sql`: stand-ins for the Supabase pieces the migrations expect. These are the `anon`/`authenticated`/`service_role` roles, `auth.users`, `auth.sessions`, `auth.uid()` and `auth.jwt()` (which read the signed-in user from `request.jwt.claims`, as the API does), plus `storage.buckets` and the `extensions` schema.
3. Runs `src/lib/data.sql`, Foundable's own platform helpers (`private.*`), unchanged.
4. Runs all `drizzle/migrations/*.sql` in order. **As of Nov 24, all 30 apply cleanly.**

`isolation_test.sql` signs in as an office reviewer and checks that they see their own company's packets and nothing from another company. A signed-in stranger sees nothing. It runs in a transaction and rolls back.

**Never point these scripts at the real database.** The shim is a test stand-in, not Supabase.
