import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Intentionally opens only a fresh in-memory database; never accepts a database URL.
const pgliteFile = process.env.PGLITE_MODULE
if (!pgliteFile) throw new Error('PGLITE_MODULE must point to a local PGlite ESM entry point.')
const { PGlite } = await import(pathToFileURL(resolve(pgliteFile)).href)
const db = new PGlite()
const accountA = '10000000-0000-0000-0000-000000000001'
const accountB = '10000000-0000-0000-0000-000000000002'
const pieceA = '20000000-0000-0000-0000-000000000001'
const pieceB = '20000000-0000-0000-0000-000000000002'
const candidate = '20000000-0000-0000-0000-000000000003'

const ownerPieces = 'select id, owner_id, name, photo_object_key from public.closet_garments order by id'
const add = 'insert into public.closet_garments (id, owner_id, name, category) values ($1, $2, $3, $4)'
const denied = { code: '42501' }

async function asAccount(user) {
  await db.exec('reset role; set role authenticated')
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user])
}

try {
  // Minimal throwaway stand-in for the managed server's roles and auth.uid function.
  await db.exec(`
    create role anon noinherit;
    create role authenticated noinherit;
    create schema auth;
    grant usage on schema auth to authenticated;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable
      as 'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
  `)
  const migration = await readFile(new URL('./owner-only.sql', import.meta.url), 'utf8')
  await db.exec(migration)
  await db.query('insert into auth.users(id) values ($1), ($2)', [accountA, accountB])
  await db.query(add, [pieceA, accountA, 'Owner A photo', 'Tops'])
  await db.query(add, [pieceB, accountB, 'Owner B photo', 'Bottoms'])
  await db.query('insert into public.closet_styling_consent (owner_id, version, enabled) values ($1, $3, true), ($2, $3, false)',
    [accountA, accountB, 'wardrobe-metadata-v1'])

  await db.exec('set role anon')
  await assert.rejects(db.query(ownerPieces), denied)
  await assert.rejects(db.query('select * from public.closet_styling_consent'), denied)

  await asAccount('')
  assert.deepEqual((await db.query(ownerPieces)).rows, [])

  await asAccount(accountA)
  assert.deepEqual((await db.query(ownerPieces)).rows, [{
    id: pieceA, owner_id: accountA, name: 'Owner A photo', photo_object_key: `${accountA}/${pieceA}/garment.jpg`,
  }])
  assert.equal((await db.query('select * from public.closet_garments where id = $1', [pieceB])).rows.length, 0)
  assert.equal((await db.query('update public.closet_garments set name = $1 where id = $2 returning id', ['Forbidden', pieceB])).rows.length, 0)
  assert.equal((await db.query('delete from public.closet_garments where id = $1 returning id', [pieceB])).rows.length, 0)
  await assert.rejects(db.query(add, [candidate, accountB, 'Wrong owner', 'Dresses']), denied)
  await assert.rejects(db.query('update public.closet_garments set owner_id = $1 where id = $2', [accountB, pieceA]), denied)
  await assert.rejects(db.query('update public.closet_garments set photo_object_key = $1 where id = $2', ['external/path', pieceA]), (error) => ['42501', '428C9'].includes(error.code))
  await db.query(add, [candidate, accountA, 'Owner A second piece', 'Dresses'])
  assert.equal((await db.query(ownerPieces)).rows.length, 2)
  assert.deepEqual((await db.query('update public.closet_garments set color = $1 where id = $2 returning color', ['Blue', pieceA])).rows, [{ color: 'Blue' }])
  assert.deepEqual((await db.query('select owner_id, enabled from public.closet_styling_consent')).rows, [{ owner_id: accountA, enabled: true }])
  assert.equal((await db.query('update public.closet_styling_consent set enabled = true where owner_id = $1 returning owner_id', [accountB])).rows.length, 0)
  await db.query('update public.closet_styling_consent set enabled = false where owner_id = $1', [accountA])
  await db.query('delete from public.closet_garments where id = $1', [candidate])

  await asAccount(accountB)
  assert.deepEqual((await db.query(ownerPieces)).rows, [{
    id: pieceB, owner_id: accountB, name: 'Owner B photo', photo_object_key: `${accountB}/${pieceB}/garment.jpg`,
  }])
  assert.deepEqual((await db.query('select owner_id, enabled from public.closet_styling_consent')).rows, [{ owner_id: accountB, enabled: false }])

  await asAccount(accountA)
  assert.deepEqual((await db.query('select owner_id, enabled from public.closet_styling_consent')).rows, [{ owner_id: accountA, enabled: false }])
  console.log('Verified local database isolation: signed-out denial, two independent owners, protected photo keys, and owner-only revocable consent.')
  // This schema contains metadata only; there are no actual stored image bytes.
  await db.exec(`
    reset role;
    create schema storage;
    create table storage.buckets (id text primary key, public boolean not null);
    create table storage.objects (bucket_id text references storage.buckets(id), name text, primary key (bucket_id, name));
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon, authenticated;
    grant select, insert, update, delete on storage.objects to anon, authenticated;
    create policy old_broad_policy on storage.objects for all to anon, authenticated using (true) with check (true);
  `)
  const photoMigration = await readFile(new URL('./private-photos.sql', import.meta.url), 'utf8')
  await assert.rejects(db.exec(photoMigration), /must exist and be private/)
  await db.exec('rollback')
  const privateBucket = 'mfc-wardrobe-private-v1'
  const otherBucket = 'ordinary'
  await db.query('insert into storage.buckets (id, public) values ($1, true), ($2, false)', [privateBucket, otherBucket])
  await assert.rejects(db.exec(photoMigration), /must exist and be private/)
  await db.exec('rollback')
  await db.query('update storage.buckets set public = false where id = $1', [privateBucket])
  await db.exec(photoMigration)

  const photoA = `${accountA}/${pieceA}/garment.jpg`
  const photoB = `${accountB}/${pieceB}/garment.jpg`
  const putPhoto = 'insert into storage.objects (bucket_id, name) values ($1, $2)'
  const visiblePhotos = 'select name from storage.objects where bucket_id = $1 order by name'
  await db.query(putPhoto, [otherBucket, 'unrelated-file'])
  await db.exec('set role anon')
  assert.deepEqual((await db.query(visiblePhotos, [privateBucket])).rows, [])
  assert.deepEqual((await db.query(visiblePhotos, [otherBucket])).rows, [{ name: 'unrelated-file' }])
  await assert.rejects(db.query(putPhoto, [privateBucket, photoA]), denied)

  await asAccount(accountA)
  await db.query(putPhoto, [privateBucket, photoA])
  await assert.rejects(db.query(putPhoto, [privateBucket, photoB]), denied)
  await assert.rejects(db.query(putPhoto, [privateBucket, `${accountA}/not-a-registered-garment/garment.jpg`]), denied)
  await assert.rejects(db.query('update storage.objects set bucket_id = $1, name = $2 where bucket_id = $3',
    [privateBucket, photoB, otherBucket]), denied)
  assert.equal((await db.query('update storage.objects set name = $1 where name = $2 returning name',
    ['moved', photoA])).rows.length, 0)

  await asAccount(accountB)
  assert.deepEqual((await db.query(visiblePhotos, [privateBucket])).rows, [])
  await db.query(putPhoto, [privateBucket, photoB])
  assert.deepEqual((await db.query(visiblePhotos, [privateBucket])).rows, [{ name: photoB }])
  assert.equal((await db.query('delete from storage.objects where name = $1 returning name', [photoA])).rows.length, 0)
  await asAccount(accountA)
  assert.deepEqual((await db.query(visiblePhotos, [privateBucket])).rows, [{ name: photoA }])
  assert.deepEqual((await db.query('delete from storage.objects where name = $1 returning name', [photoA])).rows, [{ name: photoA }])
  await db.exec('reset role; set role anon')
  assert.deepEqual((await db.query(visiblePhotos, [privateBucket])).rows, [])
  console.log('Verified future image metadata policies: private bucket required, two isolated owners, no anonymous access even with an older broad policy.')
} finally {
  await db.close()
}
