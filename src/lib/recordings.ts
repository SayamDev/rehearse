"use client";

/**
 * Recordings of spoken answers, kept only in this browser (IndexedDB) and only
 * when the user turns on "Keep recordings" in Me. Nothing is uploaded.
 * Only the best few are kept, so storage stays small.
 */

export type Recording = {
  takeId: string;
  question: string;
  role: string;
  score: number;
  createdAt: string;
  audio: Blob;
};

const DB = "rehearse-audio";
const STORE = "recordings";
const KEEP = 10;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "takeId" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => {
      db.close();
      resolve(req ? req.result : undefined);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/** All saved recordings, best first. */
export async function listRecordings(): Promise<Recording[]> {
  try {
    const all = (await run<Recording[]>("readonly", (s) => s.getAll())) ?? [];
    return all.sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

/** Saves a recording, then keeps only the best few. */
export async function saveRecording(rec: Recording): Promise<void> {
  try {
    await run("readwrite", (s) => s.put(rec));
    const all = await listRecordings();
    const extra = all.slice(KEEP);
    if (extra.length) await run("readwrite", (s) => extra.forEach((r) => s.delete(r.takeId)));
  } catch {
    // Storage blocked or full: the answer is still saved, just without audio.
  }
}

export async function deleteRecordings(): Promise<void> {
  try {
    await run("readwrite", (s) => s.clear());
  } catch {
    // Nothing to clear.
  }
}
