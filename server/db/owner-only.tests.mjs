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
} finally {
  await db.close()
}
