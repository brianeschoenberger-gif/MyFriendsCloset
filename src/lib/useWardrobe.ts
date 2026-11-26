import { useEffect, useRef, useState } from 'react'
import type { ClosetItem } from '../types'
import { isQuotaError, storageKeys, type StorageFailure } from './storage'
import { openWardrobeDatabase, readWardrobe, transactWardrobe, WardrobeEditConflict } from './wardrobeStore'

const changeChannel = 'mfc-local-wardrobe-changes'
const migratedKey = 'mfc-wardrobe-migrated-v2'
type Backend = 'indexed' | 'legacy' | 'blocked'

function readLegacy(fallback: ClosetItem[]) {
  try {
    const value = window.localStorage.getItem(storageKeys.items)
    if (!value) return { items: fallback, migrated: window.localStorage.getItem(migratedKey) === '1', invalid: false }
    const parsed: unknown = JSON.parse(value)
    return { items: Array.isArray(parsed) ? parsed as ClosetItem[] : fallback, migrated: window.localStorage.getItem(migratedKey) === '1', invalid: !Array.isArray(parsed) }
  } catch {
    return { items: fallback, migrated: false, invalid: true }
  }
}

function retainMigrationMarker() {
  // The IndexedDB transaction must complete before the previous storage is removed.
  // If the old storage is unavailable, the browser still keeps the durable IndexedDB copy.
  try {
    window.localStorage.removeItem(storageKeys.items)
    window.localStorage.setItem(migratedKey, '1')
  } catch { /* Missing access to localStorage must not hide a successful IndexedDB write. */ }
}

function saveFailure(error: unknown, fallbackMessage?: string): StorageFailure {
  if (error instanceof WardrobeEditConflict) return { key: storageKeys.items, kind: 'edit-conflict', isQuotaError: false, message: error.message }
  return {
    key: storageKeys.items,
    isQuotaError: isQuotaError(error),
    message: fallbackMessage ?? (isQuotaError(error)
      ? 'This browser is out of local closet space. Free space or choose smaller photos.'
      : 'Your wardrobe change was not saved. Try reopening the app in this browser.'),
  }
}

export function useWardrobe(defaultItems: ClosetItem[]) {
  const [legacy] = useState(() => readLegacy(defaultItems))
  const [items, setItems] = useState(legacy.items)
  const [loading, setLoading] = useState(typeof indexedDB !== 'undefined')
  const [failure, setFailure] = useState<StorageFailure | null>(null)
  const current = useRef(legacy.items)
  const opening = useRef<Promise<Backend> | null>(null)
  const busy = useRef(false)
  const mutation = useRef(0)
  const channel = useRef<BroadcastChannel | null>(null)
  const flushRefresh = useRef<(() => void) | null>(null)

  useEffect(() => {
    let mounted = true
    if (!opening.current) opening.current = (async () => {
      if (typeof indexedDB === 'undefined') return legacy.migrated || legacy.invalid ? 'blocked' : 'legacy'
      let db: IDBDatabase | undefined
      try {
        db = await openWardrobeDatabase()
        // Do not silently seed over an inaccessible old store or a missing migrated wardrobe.
        current.current = await transactWardrobe(db, legacy.items, undefined, legacy.migrated || legacy.invalid)
        retainMigrationMarker()
        return 'indexed'
      } catch {
        return legacy.migrated || legacy.invalid || db ? 'blocked' : 'legacy'
      } finally { db?.close() }
    })()
    void opening.current.then((backend) => {
      if (!mounted) return
      setItems(current.current)
      setLoading(false)
      if (backend === 'blocked') setFailure(saveFailure(null, 'Your stored wardrobe could not be opened. Close other closet tabs or reopen this browser. Existing data was not replaced.'))
    })
    return () => { mounted = false }
  }, [legacy])

  useEffect(() => {
    let mounted = true
    let queued = false
    let refreshing = false
    async function refresh() {
      if (!mounted) return
      if (busy.current || refreshing) { queued = true; return }
      refreshing = true
      const before = mutation.current
      let db: IDBDatabase | undefined
      try {
        const backend = await opening.current
        if (!mounted) return
        if (mutation.current !== before || busy.current) { queued = true; return }
        let snapshot: ClosetItem[] | undefined
        if (backend === 'indexed') {
          db = await openWardrobeDatabase()
          snapshot = await readWardrobe(db)
        } else if (backend === 'legacy') {
          const stored = readLegacy(defaultItems)
          if (!stored.invalid && !stored.migrated) snapshot = stored.items
        }
        if (!mounted) return
        if (mutation.current !== before || busy.current) { queued = true; return }
        if (snapshot) {
          current.current = snapshot
          setItems(snapshot)
        }
      } catch {
        // Background refresh must never replace the last good state with empty data.
      } finally {
        db?.close()
        refreshing = false
        if (queued && !busy.current && mounted) { queued = false; void refresh() }
      }
    }
    function onVisibility() { if (document.visibilityState === 'visible') void refresh() }
    function onStorage(event: StorageEvent) { if (event.key === storageKeys.items) void refresh() }
    function onMessage() { void refresh() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('storage', onStorage)
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel.current = new BroadcastChannel(changeChannel)
        channel.current.addEventListener('message', onMessage)
      }
    } catch { /* Visibility changes still refresh the latest snapshot. */ }
    flushRefresh.current = () => { if (queued && !refreshing) { queued = false; void refresh() } }

    return () => {
      mounted = false
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('storage', onStorage)
      channel.current?.close()
      channel.current = null
      flushRefresh.current = null
    }
  }, [defaultItems])

  async function save(change: (current: ClosetItem[]) => ClosetItem[]) {
    if (busy.current) return false
    busy.current = true
    mutation.current += 1
    let db: IDBDatabase | undefined
    try {
      const backend = await opening.current
      if (!backend || backend === 'blocked') throw new Error('Wardrobe not ready')
      let next: ClosetItem[]
      if (backend === 'indexed') {
        db = await openWardrobeDatabase()
        next = await transactWardrobe(db, current.current, change, true)
      } else {
        next = change(current.current)
        window.localStorage.setItem(storageKeys.items, JSON.stringify(next))
      }
      current.current = next
      setItems(next)
      setFailure(null)
      try { channel.current?.postMessage('changed') } catch { /* The durable save already finished. */ }
      return true
    } catch (error) {
      setFailure(saveFailure(error))
      return false
    } finally { db?.close(); busy.current = false; flushRefresh.current?.() }
  }

  return [items, save, failure, () => setFailure(null), loading] as const
}
