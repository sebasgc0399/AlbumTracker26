import stickersData from '@/data/stickers.json';
import { db, type Sticker } from './database';

export async function seedDatabase(): Promise<void> {
  const existing = await db.stickers.count();
  if (existing > 0) return;
  await db.stickers.bulkAdd(stickersData as Sticker[]);
}
