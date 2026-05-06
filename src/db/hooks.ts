import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CollectionEntry, type Sticker } from './database';
import { ALMOST_COMPLETE_THRESHOLD } from '@/utils/constants';

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

export interface DuplicateEntry {
  sticker: Sticker;
  count: number;
  extra: number;
}

export function useDuplicatesByTeam(opts: {
  hideCC: boolean;
}): Map<string, DuplicateEntry[]> | undefined {
  const stickers = useStickers();
  const collection = useCollection();

  if (!stickers || !collection) return undefined;

  const buckets = new Map<string, DuplicateEntry[]>();
  for (const sticker of stickers) {
    if (opts.hideCC && sticker.team === 'CC') continue;
    const entry = collection.get(sticker.id);
    if (!entry || entry.count < 2) continue;
    let bucket = buckets.get(sticker.teamName);
    if (!bucket) {
      bucket = [];
      buckets.set(sticker.teamName, bucket);
    }
    bucket.push({ sticker, count: entry.count, extra: entry.count - 1 });
  }

  return buckets;
}

export interface MissingEntry {
  sticker: Sticker;
}

export interface MissingTeamData {
  entries: MissingEntry[];
  totalForTeam: number;
}

export function useMissingByTeam(opts: {
  almostOnly: boolean;
}): Map<string, MissingTeamData> | undefined {
  const stickers = useStickers();
  const collection = useCollection();

  if (!stickers || !collection) return undefined;

  // 1) Total stickers per teamName from the catalog (20 normal teams,
  //    9 intro, 11 museum, 12 Coca-Cola).
  const totalsByTeam = new Map<string, number>();
  for (const sticker of stickers) {
    totalsByTeam.set(
      sticker.teamName,
      (totalsByTeam.get(sticker.teamName) ?? 0) + 1,
    );
  }

  // 2) Bucket missing stickers by teamName, preserving catalog order
  //    inside each bucket (stickers come out of useStickers() in id order).
  const buckets = new Map<string, MissingEntry[]>();
  for (const sticker of stickers) {
    const entry = collection.get(sticker.id);
    if (entry && entry.count > 0) continue;
    let bucket = buckets.get(sticker.teamName);
    if (!bucket) {
      bucket = [];
      buckets.set(sticker.teamName, bucket);
    }
    bucket.push({ sticker });
  }

  // 3) Build the final Map ordered by entries.length ASC (less missing first).
  //    Insertion order matters — Map preserves it, and the page renders in iteration order.
  const sorted = Array.from(buckets.entries())
    .filter(([, entries]) => entries.length > 0)
    .filter(
      ([, entries]) =>
        !opts.almostOnly || entries.length <= ALMOST_COMPLETE_THRESHOLD,
    )
    .sort(([, a], [, b]) => a.length - b.length);

  const result = new Map<string, MissingTeamData>();
  for (const [teamName, entries] of sorted) {
    result.set(teamName, {
      entries,
      totalForTeam: totalsByTeam.get(teamName) ?? entries.length,
    });
  }

  return result;
}
