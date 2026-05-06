import { useMemo } from 'react';
import { TEAMS } from '@/data/teams';
import { useCollection, useStickers } from '@/db/hooks';
import type { Sticker } from '@/db/database';

interface DuplicateItem {
  sticker: Sticker;
  extra: number;
}

interface DuplicateGroup {
  teamCode: string;
  teamName: string;
  flag: string;
  totalDuplicates: number;
  stickers: DuplicateItem[];
}

const FLAG_BY_TEAM = new Map(TEAMS.map((team) => [team.code, team.flag]));

// Order: TEAMS array order (mirrors Mundial groups A→L), then specials at the end.
// This matches HomePage's mental map (group A first, then B...) so the user
// scans repetidas in the same order they explore the album.
const TEAM_ORDER = new Map<string, number>(
  TEAMS.map((team, idx) => [team.code, idx]),
);
const SPECIAL_ORDER: Record<string, number> = {
  FWC: 1000,
  CC: 1001,
};

function teamOrder(code: string): number {
  return TEAM_ORDER.get(code) ?? SPECIAL_ORDER[code] ?? 9999;
}

function flagFor(teamCode: string): string {
  if (FLAG_BY_TEAM.has(teamCode)) return FLAG_BY_TEAM.get(teamCode) ?? '';
  if (teamCode === 'CC') return '🥤';
  if (teamCode === 'FWC') return '🏆';
  return '⚽';
}

export default function DuplicatesPage() {
  const stickers = useStickers();
  const collection = useCollection();

  const groups = useMemo<DuplicateGroup[] | undefined>(() => {
    if (!stickers || !collection) return undefined;

    const buckets = new Map<string, DuplicateGroup>();

    for (const sticker of stickers) {
      const entry = collection.get(sticker.id);
      if (!entry || entry.count <= 1) continue;
      const extra = entry.count - 1;

      let bucket = buckets.get(sticker.team);
      if (!bucket) {
        bucket = {
          teamCode: sticker.team,
          teamName: sticker.teamName,
          flag: flagFor(sticker.team),
          totalDuplicates: 0,
          stickers: [],
        };
        buckets.set(sticker.team, bucket);
      }
      bucket.totalDuplicates += extra;
      bucket.stickers.push({ sticker, extra });
    }

    for (const bucket of buckets.values()) {
      bucket.stickers.sort(
        (a, b) => a.sticker.position - b.sticker.position,
      );
    }

    return Array.from(buckets.values()).sort(
      (a, b) => teamOrder(a.teamCode) - teamOrder(b.teamCode),
    );
  }, [stickers, collection]);

  const isLoading = groups === undefined;
  const isEmpty = !isLoading && groups.length === 0;

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <h1 className="text-xl font-bold text-foreground">Repetidas</h1>
          <p className="text-xs text-muted-foreground">
            Láminas con más de una copia
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4">
        {isLoading ? (
          <ListSkeleton />
        ) : isEmpty ? (
          <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No tenés repetidas todavía. Cuando registres láminas con
              count &gt; 1, aparecerán acá.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {groups.map((group) => (
              <li
                key={group.teamCode}
                className="rounded-xl border border-border bg-background p-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-2xl leading-none">{group.flag}</span>
                  <h2 className="flex-1 truncate text-base font-semibold text-foreground">
                    {group.teamName}
                  </h2>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {group.totalDuplicates} repetida
                    {group.totalDuplicates === 1 ? '' : 's'}
                  </span>
                </div>
                <ul className="flex flex-col gap-1">
                  {group.stickers.map(({ sticker, extra }) => (
                    <li
                      key={sticker.id}
                      className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2"
                    >
                      <span className="shrink-0 rounded bg-background px-2 py-0.5 text-xs font-bold tabular-nums text-foreground">
                        {sticker.id}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {sticker.name}
                      </span>
                      <span
                        className="shrink-0 rounded-full bg-warning px-2 py-0.5 text-xs font-bold tabular-nums text-foreground"
                        aria-label={`${extra} repetidas`}
                      >
                        +{extra}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className="h-32 animate-pulse rounded-xl border border-border bg-muted"
        />
      ))}
    </div>
  );
}
