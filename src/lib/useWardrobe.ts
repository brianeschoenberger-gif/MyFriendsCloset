import { useEffect, useRef, useState } from 'react'
import type { ClosetItem } from '../types'
import { isQuotaError, storageKeys, type StorageFailure } from './storage'
import { openWardrobeDatabase, transactWardrobe } from './wardrobeStore'

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

  async function save(change: (current: ClosetItem[]) => ClosetItem[]) {
    if (busy.current) return false
    busy.current = true
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
      return true
    } catch (error) {
      setFailure(saveFailure(error))
      return false
    } finally { db?.close(); busy.current = false }
  }

  return [items, save, failure, () => setFailure(null), loading] as const
}
