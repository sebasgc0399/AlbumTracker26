import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CollectionEntry, type Sticker } from './database';

export function useStickers(team?: string): Sticker[] | undefined {
  return useLiveQuery(
    () =>
      team
        ? db.stickers.where('team').equals(team).toArray()
        : db.stickers.toArray(),
    [team],
  );
}

export function useCollection(): Map<string, CollectionEntry> | undefined {
  return useLiveQuery(async () => {
    const entries = await db.collection.toArray();
    return new Map(entries.map((entry) => [entry.stickerId, entry]));
  });
}

export interface ProgressSummary {
  owned: number;
  total: 992;
  duplicates: number;
}

export function useProgress(): ProgressSummary | undefined {
  return useLiveQuery(async () => {
    const entries = await db.collection.toArray();

    let owned = 0;
    let duplicates = 0;
    for (const entry of entries) {
      if (entry.count > 0) {
        owned += 1;
      }
      if (entry.count > 1) {
        duplicates += entry.count - 1;
      }
    }

    return { owned, total: 992, duplicates };
  });
}
