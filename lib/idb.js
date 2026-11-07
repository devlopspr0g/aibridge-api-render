// lib/idb.js - IndexedDB wrapper for AIBridge
import { openDB } from 'idb';

export const dbPromise = openDB('ai_bridge_db', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('memories')) {
      const store = db.createObjectStore('memories', { keyPath: 'id' });
      store.createIndex('by_workspace', 'workspace_id');
    }
    if (!db.objectStoreNames.contains('queue')) {
      db.createObjectStore('queue', { keyPath: 'id' });
    }
  },
});

export async function saveLocal(memory) {
  const db = await dbPromise;
  await db.put('memories', memory);
  await db.put('queue', { id: memory.id, ...memory });
}

export async function getQueue() {
  const db = await dbPromise;
  return db.getAll('queue');
}
