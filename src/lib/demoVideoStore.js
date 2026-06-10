const DB_NAME = 'dojang-video-db';
const STORE = 'blobs';
const META_KEY = 'dojang-video-meta';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDemoVideoBlob(id, blob) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getDemoVideoBlob(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export function loadVideoMeta() {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveVideoMeta(meta) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function getVideoMetaEntry(id) {
  return loadVideoMeta()[id] ?? null;
}

export function setVideoMetaEntry(id, entry) {
  const meta = loadVideoMeta();
  meta[id] = entry;
  saveVideoMeta(meta);
}

export function deleteVideoMetaEntry(id) {
  const meta = loadVideoMeta();
  delete meta[id];
  saveVideoMeta(meta);
}
