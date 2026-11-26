# Owner-only account storage draft

This SQL draft is for a future private account beta. It has not run against a hosted database and cannot change the public local app. Do not run it in a live environment without reviewing grants, storage policies, backups and deletion first.

- Authentication is assumed to belong to a managed platform matching the Supabase `auth.users`, `auth.uid()`, `anon` and `authenticated` interface. No authentication is provisioned here.
- PostgreSQL row-level checks apply to all operations. A signed-in account can see and edit only its garments and its own current styling consent. No permissions are granted to signed-out users. Owner IDs and generated image object keys cannot be updated by browser clients.
- The generated path is a future private storage key, not a public link. The separate `private-photos.sql` draft requires an existing private bucket and tests metadata restrictions in isolation. It is not a storage deployment. Before launch, lock down the bucket setting and test actual uploaded bytes, signed URL expiry, sync, replacement, deletion, and administrative cleanup with isolated accounts. Delete the file before deleting a garment row; any orphan object remains inaccessible to ordinary users and needs controlled cleanup.
- The `metadata-budget.sql` draft reserves capacity under a database lock, with a current-consent check and independent daily account and project ceilings. Its numeric defaults are unapproved examples, not spend limits or a live setting. Only the private backend role can execute the reservation; ordinary clients cannot read usage. Review row retention, provider billing limits, and actual multi-connection concurrency before production. The default app still sends no data to a model.

## Run the policy test without an account

Run from the repository root. This opens an in-memory database with two synthetic users, makes no database network connections and changes no project dependency.

```sh
scratch="$(mktemp -d)"
npm install --ignore-scripts --prefix "$scratch" @electric-sql/pglite@0.6.0
PGLITE_MODULE="$scratch/node_modules/@electric-sql/pglite/dist/index.js" node server/db/owner-only.tests.mjs
```

The test verifies table and synthetic storage policies, including resistance to a conflicting permissive policy. It does not exercise a real auth session, network API, production storage bucket, uploaded bytes, or object signing. See [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), and [PGlite](https://pglite.dev/docs/).
