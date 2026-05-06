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

export async function decrementCount(stickerId: string): Promise<void> {
  const entry = await db.collection.get(stickerId);
  const next = Math.max(0, (entry?.count ?? 0) - 1);
  await db.collection.put({
    stickerId,
    owned: next > 0,
    count: next,
  });
}
