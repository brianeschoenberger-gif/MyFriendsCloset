import type { ClosetItem } from '../types'

export const wardrobeDatabase = 'mfc-wardrobe-v2'
const bucket = 'wardrobe'
const itemsKey = 'items'

export class WardrobeEditConflict extends Error {
  constructor() { super('This piece changed in another tab. Reopen it before saving your changes.') }
}

export function requireCurrentPiece(items: ClosetItem[], previous: ClosetItem, exactVersion = true) {
  const latest = items.find((item) => item.id === previous.id)
  if (!latest || (exactVersion && latest.updatedAt !== previous.updatedAt)) throw new WardrobeEditConflict()
  return latest
}

export async function openWardrobeDatabase(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(wardrobeDatabase, 1)
    let blocked = false
    request.onupgradeneeded = () => { request.result.createObjectStore(bucket) }
    request.onerror = () => reject(request.error ?? new Error('Wardrobe storage could not be opened.'))
    request.onblocked = () => { blocked = true; reject(new Error('Close other closet tabs and try again.')) }
    request.onsuccess = () => {
      const db = request.result
      if (blocked) { db.close(); return }
      db.onversionchange = () => db.close()
      resolve(db)
    }
  })
}

export async function transactWardrobe(
  database: IDBDatabase, fallback: ClosetItem[], change?: (current: ClosetItem[]) => ClosetItem[], requireExisting = false,
) {
  return new Promise<ClosetItem[]>((resolve, reject) => {
    const transaction = database.transaction(bucket, 'readwrite')
    const shelf = transaction.objectStore(bucket)
    const read = shelf.get(itemsKey)
    let result: ClosetItem[]
    let validationError: unknown
    read.onsuccess = () => {
      try {
        if ((requireExisting || read.result !== undefined) && !Array.isArray(read.result)) throw new Error('Wardrobe storage needs recovery.')
        const current: ClosetItem[] = read.result ?? fallback
        result = change ? change(current) : current
        if (read.result === undefined || result !== current) shelf.put(result, itemsKey)
      } catch (error) { validationError = error; transaction.abort() }
    }
    transaction.oncomplete = () => resolve(result)
    transaction.onabort = () => reject(validationError ?? transaction.error ?? new Error('Wardrobe storage did not save.'))
    transaction.onerror = () => { /* The abort event reports the caller-visible error. */ }
  })
}

export async function readWardrobe(database: IDBDatabase): Promise<ClosetItem[]> {
  return new Promise<ClosetItem[]>((resolve, reject) => {
    const transaction = database.transaction(bucket, 'readonly')
    const request = transaction.objectStore(bucket).get(itemsKey)
    transaction.onabort = () => reject(transaction.error ?? new Error('Could not reread the wardrobe.'))
    transaction.oncomplete = () => Array.isArray(request.result)
      ? resolve(request.result as ClosetItem[])
      : reject(new Error('Wardrobe storage needs recovery.'))
  })
}
