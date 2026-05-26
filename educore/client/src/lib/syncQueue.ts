// ============================================================
// EduCore: Offline Sync Queue
// File: educore/client/src/lib/syncQueue.ts
// Matches blueprint spec exactly (Section 5)
// ============================================================

import Dexie, { type Table } from 'dexie';

export interface PendingMutation {
  id?: number;
  endpoint: string;
  payload: Record<string, unknown>;
  timestamp: number;
  attempts: number;
}

class OfflineDatabase extends Dexie {
  public mutationQueue!: Table<PendingMutation, number>;

  constructor() {
    super('EduCoreOfflineStorage');
    this.version(1).stores({
      mutationQueue: '++id, endpoint, timestamp',
    });
  }
}

const offlineDb = new OfflineDatabase();

export async function queueOfflineMutation(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<void> {
  await offlineDb.mutationQueue.add({
    endpoint,
    payload,
    timestamp: Date.now(),
    attempts: 0,
  });

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    await (registration as any).sync.register('educore-sync-queue');
  }
}

export async function getPendingMutations(): Promise<PendingMutation[]> {
  return offlineDb.mutationQueue.orderBy('timestamp').toArray();
}

export async function removeMutation(id: number): Promise<void> {
  await offlineDb.mutationQueue.delete(id);
}

export async function incrementAttempts(id: number): Promise<void> {
  await offlineDb.mutationQueue
    .where('id').equals(id)
    .modify(m => { m.attempts += 1; });
}

// Flush queue when back online — call this once on app startup
export async function flushQueue(token: string): Promise<void> {
  const pending = await getPendingMutations();
  for (const mutation of pending) {
    try {
      const res = await fetch(mutation.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(mutation.payload),
      });
      if (res.ok && mutation.id != null) {
        await removeMutation(mutation.id);
      } else {
        if (mutation.id != null) await incrementAttempts(mutation.id);
      }
    } catch {
      if (mutation.id != null) await incrementAttempts(mutation.id);
    }
  }
}
