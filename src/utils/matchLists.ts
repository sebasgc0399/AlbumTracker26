import type { CollectionEntry, Sticker } from '@/db/database';

export interface MatchResult {
  canGive: Sticker[]; // mis duplicates que el otro busca (b)
  canReceive: Sticker[]; // sus duplicates (d) que yo busco
}

function naturalSortById(a: Sticker, b: Sticker): number {
  return a.id.localeCompare(b.id, undefined, { numeric: true });
}

export function matchLists(
  myCollection: Map<string, CollectionEntry>,
  myStickers: Sticker[],
  theirDuplicates: string[], // IDs (de payload.d)
  theirMissing: string[], // IDs (de payload.b)
): MatchResult {
  const theirDuplicatesSet = new Set(theirDuplicates);
  const theirMissingSet = new Set(theirMissing);

  const canGive: Sticker[] = [];
  const canReceive: Sticker[] = [];

  for (const sticker of myStickers) {
    const entry = myCollection.get(sticker.id);
    const myCount = entry?.count ?? 0;

    // Mis duplicates (count >= 2) ∩ sus missing
    if (myCount >= 2 && theirMissingSet.has(sticker.id)) {
      canGive.push(sticker);
    }

    // Mis missing (count == 0 / sin entry) ∩ sus duplicates
    if (myCount === 0 && theirDuplicatesSet.has(sticker.id)) {
      canReceive.push(sticker);
    }
  }

  canGive.sort(naturalSortById);
  canReceive.sort(naturalSortById);

  return { canGive, canReceive };
}
