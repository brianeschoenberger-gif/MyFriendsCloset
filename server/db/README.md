# Owner-only account storage draft

This SQL draft is for a future private account beta. It has not run against a hosted database and cannot change the public local app. Do not run it in a live environment without reviewing grants, storage policies, backups and deletion first.

- Authentication is assumed to belong to a managed platform matching the Supabase `auth.users`, `auth.uid()`, `anon` and `authenticated` interface. No authentication is provisioned here.
- PostgreSQL row-level checks apply to all operations. A signed-in account can see and edit only its garments and its own current styling consent. No permissions are granted to signed-out users. Owner IDs and generated image object keys cannot be updated by browser clients.
- The generated path is a future private storage key, not a public link. This draft does not grant object access, upload photos, provide users or invite friends. Before launch, configure a private bucket and test uploaded object reads/writes, signed URL expiry, sync, revocation and deletion with isolated accounts.
- Run an identity and consent check immediately before reserving the hosted styling budget. The default is no model data transfer.

## Run the policy test without an account

Run from the repository root. This opens an in-memory database with two synthetic users, makes no database network connections and changes no project dependency.

```sh
scratch="$(mktemp -d)"
npm install --ignore-scripts --prefix "$scratch" @electric-sql/pglite@0.6.0
PGLITE_MODULE="$scratch/node_modules/@electric-sql/pglite/dist/index.js" node server/db/owner-only.tests.mjs
```

The test verifies the SQL grants and policies, not a real auth session, network API, storage bucket, or object signing. See [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), and [PGlite](https://pglite.dev/docs/).
