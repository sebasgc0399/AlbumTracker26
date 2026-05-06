import { useMemo } from 'react';
import { TEAMS } from '@/data/teams';
import DuplicateRow from '@/components/DuplicateRow';
import ShareListButton from '@/components/ShareListButton';
import TeamGroupHeader from '@/components/TeamGroupHeader';
import { useDuplicatesByTeam, type DuplicateEntry } from '@/db/hooks';
import { useLocalStoragePref } from '@/hooks/useLocalStoragePref';

type OrderMode = 'by-team' | 'most-duplicates';

const FLAG_BY_TEAM_NAME = new Map(TEAMS.map((team) => [team.name, team.flag]));

function flagForTeamName(teamName: string): string {
  const flag = FLAG_BY_TEAM_NAME.get(teamName);
  if (flag) return flag;
  if (teamName === 'Coca-Cola') return '🥤';
  if (teamName === 'Introducción' || teamName === 'Museo FIFA') return '🏆';
  return '⚽';
}

function sumExtra(entries: DuplicateEntry[]): number {
  let total = 0;
  for (const e of entries) total += e.extra;
  return total;
}

export default function DuplicatesPage() {
  const [order, setOrder] = useLocalStoragePref<OrderMode>(
    'duplicates.order',
    'by-team',
  );
  const [hideCC, setHideCC] = useLocalStoragePref<boolean>(
    'duplicates.hideCC',
    false,
  );

  const groups = useDuplicatesByTeam({ hideCC });

  const orderedGroups = useMemo<[string, DuplicateEntry[]][] | undefined>(() => {
    if (!groups) return undefined;
    const arr = Array.from(groups.entries());
    if (order === 'most-duplicates') {
      for (const [, entries] of arr) {
        entries.sort((a, b) => b.extra - a.extra);
      }
      arr.sort(([, a], [, b]) => sumExtra(b) - sumExtra(a));
    }
    return arr;
  }, [groups, order]);

  const totalGlobal = useMemo(() => {
    if (!orderedGroups) return 0;
    let total = 0;
    for (const [, entries] of orderedGroups) total += sumExtra(entries);
    return total;
  }, [orderedGroups]);

  const isLoading = orderedGroups === undefined;
  const isEmpty = !isLoading && orderedGroups.length === 0;

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <h1 className="text-xl font-bold text-foreground">Repetidas</h1>
          <p className="text-xs tabular-nums text-muted-foreground">
            <span className="font-semibold text-foreground">{totalGlobal}</span>{' '}
            láminas para cambiar
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4">
        <section className="mb-4">
          <ShareListButton />
        </section>

        <section className="mb-4 flex flex-wrap items-center gap-2">
          <div
            role="radiogroup"
            aria-label="Orden"
            className="inline-flex rounded-full border border-border bg-background p-0.5 text-xs"
          >
            <button
              type="button"
              role="radio"
              aria-checked={order === 'by-team'}
              onClick={() => setOrder('by-team')}
              className={`rounded-full px-3 py-1 transition-colors ${
                order === 'by-team'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              Por equipo
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={order === 'most-duplicates'}
              onClick={() => setOrder('most-duplicates')}
              className={`rounded-full px-3 py-1 transition-colors ${
                order === 'most-duplicates'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              Más repetidas
            </button>
          </div>

          <label className="ml-auto inline-flex items-center gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              checked={hideCC}
              onChange={(e) => setHideCC(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Ocultar Coca-Cola
          </label>
        </section>

        {isLoading ? (
          <ListSkeleton />
        ) : isEmpty ? (
          <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No tenés repetidas todavía.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {orderedGroups.map(([teamName, entries]) => {
              const teamTotal = sumExtra(entries);
              return (
                <li
                  key={teamName}
                  className="rounded-xl border border-border bg-background p-3"
                >
                  <div className="mb-2">
                    <TeamGroupHeader
                      flag={flagForTeamName(teamName)}
                      name={teamName}
                      countLabel={`${teamTotal} repetida${
                        teamTotal === 1 ? '' : 's'
                      }`}
                    />
                  </div>
                  <ul className="flex flex-col gap-1">
                    {entries.map((entry) => (
                      <DuplicateRow key={entry.sticker.id} entry={entry} />
                    ))}
                  </ul>
                </li>
              );
            })}
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
