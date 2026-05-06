import { db } from './database';

export async function setOwnedCount(stickerId: string, count: number): Promise<void> {
  const safe = Math.max(0, Math.floor(count));
  await db.collection.put({
    stickerId,
    owned: safe > 0,
    count: safe,
  });
}

export async function incrementCount(stickerId: string): Promise<void> {
  const entry = await db.collection.get(stickerId);
  const next = (entry?.count ?? 0) + 1;
  await db.collection.put({
    stickerId,
    owned: true,
    count: next,
  });
}

export interface IncrementResult {
  prev: number;
  next: number;
}

export async function incrementAndReturn(stickerId: string): Promise<IncrementResult> {
  return db.transaction('rw', db.collection, async () => {
    const entry = await db.collection.get(stickerId);
    const prev = entry?.count ?? 0;
    const next = prev + 1;
    await db.collection.put({
      stickerId,
      owned: true,
      count: next,
    });
    return { prev, next };
  });
}

export async function decrementCount(stickerId: string): Promise<void> {
  const entry = await db.collection.get(stickerId);
  const next = Math.max(0, (entry?.count ?? 0) - 1);
  await db.collection.put({
    stickerId,
    owned: next > 0,
    count: next,
  });
}

export async function revertToCount(stickerId: string, prevCount: number): Promise<void> {
  const safe = Math.max(0, Math.floor(prevCount));
  if (safe === 0) {
    await db.collection.delete(stickerId);
    return;
  }
  await db.collection.put({
    stickerId,
    owned: true,
    count: safe,
  });
}
