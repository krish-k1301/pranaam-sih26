// Uploaded files live in IndexedDB so they survive a refresh. Every call fails soft: the demo still works without it.
const DB = 'pramaan-files'
const STORE = 'files'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  try {
    const db = await open()
    return await new Promise<T>((resolve, reject) => {
      const r = run(db.transaction(STORE, mode).objectStore(STORE))
      r.onsuccess = () => resolve(r.result)
      r.onerror = () => reject(r.error)
    })
  } catch {
    return undefined
  }
}

export const putFile = (id: string, blob: Blob) => tx('readwrite', (s) => s.put(blob, id))
export const getFile = (id: string) => tx<Blob>('readonly', (s) => s.get(id))
export const clearFiles = () => tx('readwrite', (s) => s.clear())

export async function sha256OfFile(file: Blob): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
