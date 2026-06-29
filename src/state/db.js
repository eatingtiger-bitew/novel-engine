let db;

export async function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('novel-engine-v1', 1);
    r.onupgradeneeded = e => e.target.result.createObjectStore('kv');
    r.onsuccess = e => { db = e.target.result; res(); };
    r.onerror = e => rej(e);
  });
}

export function dbSet(k, v) {
  return new Promise((res, rej) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(v, k);
    tx.oncomplete = res;
    tx.onerror = rej;
  });
}

export function dbGet(k) {
  return new Promise((res, rej) => {
    const tx = db.transaction('kv', 'readonly');
    const r = tx.objectStore('kv').get(k);
    r.onsuccess = () => res(r.result);
    r.onerror = rej;
  });
}
