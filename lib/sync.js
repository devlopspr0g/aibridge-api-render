// lib/sync.js - Syncs IndexedDB queue to Supabase + Render backend
import { getQueue, dbPromise } from './idb.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export async function syncToCloud() {
  const queue = await getQueue();
  if (queue.length === 0) return { synced: 0 };

  console.log(`Syncing ${queue.length} memories...`);

  // 1. Push to Supabase
  const { error } = await supabase
    .from('memories')
    .upsert(queue, { onConflict: 'id' });

  if (error) throw error;

  // 2. Clear queue after success
  const db = await dbPromise;
  for (const item of queue) {
    await db.delete('queue', item.id);
  }

  // 3. Also update your Render memories.json (optional backup)
  // This will be done in server.js

  return { synced: queue.length };
}
