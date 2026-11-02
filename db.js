let connection;
export async function openDB() {
  if (!connection) connection = new Promise((resolve, reject) => {
    const r = indexedDB.open('offline-ecdict', 1);
    r.onupgradeneeded = () => { for (const name of ['entries', 'forms', 'meta']) r.result.createObjectStore(name, { keyPath: 'key' }); };
    r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
  }).catch(error => { connection = null; throw error; });
  return connection;
}
export async function get(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const r = db.transaction(store).objectStore(store).get(key);
    r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
  });
}
export async function commit(store, rows, state, reset = false) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['entries','forms','meta'], 'readwrite');
    tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || new Error('导入事务中断'));
    if (reset) { tx.objectStore('entries').clear(); tx.objectStore('forms').clear(); }
    for (const row of rows) tx.objectStore(store).put(row);
    tx.objectStore('meta').put({ key: 'state', ...state });
  });
}
export const manifest = () => fetch(chrome.runtime.getURL('data/manifest.json')).then(r => { if (!r.ok) throw new Error('词库文件缺失'); return r.json(); });
export function normalize(text) { return text.normalize('NFKC').trim().replace(/^[“”"'‘’.,!?;:()]+|[“”"'‘’.,!?;:()]+$/g, '').replace(/\s+/g, ' ').toLowerCase(); }
export async function lookup(text) {
  const info = await manifest(), state = await get('meta','state');
  if (!state?.ready || state.version !== info.version) throw new Error('请点击扩展图标，打开词库设置并完成导入。');
  const key = normalize(text), exact = await get('entries',key);
  if (exact) return exact;
  const aliases = await get('forms',key);
  for (const word of aliases?.words || []) { const entry = await get('entries',word); if (entry) return entry; }
  return null;
}
