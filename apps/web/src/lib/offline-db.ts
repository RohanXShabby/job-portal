const DB_NAME = "job-portal-offline";
const DB_VERSION = 1;
const JOBS_STORE = "jobs";
const DRAFTS_STORE = "drafts";

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(JOBS_STORE)) db.createObjectStore(JOBS_STORE);
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) db.createObjectStore(DRAFTS_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function put<T>(storeName: string, key: string, value: T) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function get<T>(storeName: string, key: string) {
  const db = await openDb();
  const value = await new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return value;
}

export const offlineDb = {
  cacheJobs: <T>(key: string, jobs: T) => put(JOBS_STORE, key, jobs),
  getCachedJobs: <T>(key: string) => get<T>(JOBS_STORE, key),
  saveDraft: (jobId: string, coverLetter: string) => put(DRAFTS_STORE, jobId, coverLetter),
  getDraft: (jobId: string) => get<string>(DRAFTS_STORE, jobId),
};
