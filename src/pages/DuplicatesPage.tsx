import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronsDownUp, ChevronsUpDown, Inbox, RefreshCw } from 'lucide-react';
import DuplicateRow from '@/components/DuplicateRow';
import ShareImageButton from '@/components/ShareImageButton';
import ShareLinkButton from '@/components/ShareLinkButton';
import ShareListButton from '@/components/ShareListButton';
import TeamFlag from '@/components/TeamFlag';
import TeamGroupHeader from '@/components/TeamGroupHeader';
import { useDuplicatesByTeam, type DuplicateEntry } from '@/db/hooks';
import { useLocalStoragePref } from '@/hooks/useLocalStoragePref';
import { flagInfoForTeamName } from '@/utils/flagFor';

type OrderMode = 'by-team' | 'most-duplicates';

// Snapshot de orden congelado para "Más repetidas". El orden se captura una
// vez al entrar al modo y se aplica como ranking estable. Sin esto, cada
// click en +/- reordena la lista en el momento (un sticker que sube su
// count salta a una posición más arriba), lo que rompe la posición visual
// del usuario que está editando varios seguidos.
interface FrozenOrder {
  teams: string[]; // teamNames en orden de mayor a menor sumExtra
  entries: Map<string, string[]>; // teamName → sticker IDs en orden
}

function teamFlagSlot(teamName: string) {
  return (
    <TeamFlag
      info={flagInfoForTeamName(teamName)}
      alt=""
      className="w-8 shadow-sm"
    />
  );
}

function sumExtra(entries: DuplicateEntry[]): number {
  let total = 0;
  for (const e of entries) total += e.extra;
  return total;
}

// Captura el orden "más repetidas primero" del estado actual de groups.
// Usado al entrar al modo y al click manual del botón "Reordenar".
function snapshotMostDuplicatesOrder(
  groups: Map<string, DuplicateEntry[]>,
): FrozenOrder {
  const arr = Array.from(groups.entries()).map(
    ([team, entries]) => [team, [...entries]] as [string, DuplicateEntry[]],
  );
  for (const [, entries] of arr) {
    entries.sort((a, b) => b.extra - a.extra);
  }
  arr.sort(([, a], [, b]) => sumExtra(b) - sumExtra(a));
  return {
    teams: arr.map(([t]) => t),
    entries: new Map(
      arr.map(([t, es]) => [t, es.map((e) => e.sticker.id)]),
    ),
  };
}

export default function DuplicatesPage() {
  const [order, setOrder] = useLocalStoragePref<OrderMode>(
    'duplicates.order',
    'by-team',
  );

  const groups = useDuplicatesByTeam();

  // El frozen order se reinicia al cambiar a "Por equipo" (no aplica) y se
  // captura la primera vez que groups está disponible en modo "Más repetidas".
  // Click en "Reordenar" lo recaptura con los counts actuales.
  const [frozenOrder, setFrozenOrder] = useState<FrozenOrder | null>(null);

  useEffect(() => {
    if (order !== 'most-duplicates') {
      if (frozenOrder !== null) setFrozenOrder(null);
      return;
    }
    if (frozenOrder === null && groups !== undefined) {
      setFrozenOrder(snapshotMostDuplicatesOrder(groups));
    }
  }, [order, groups, frozenOrder]);

  const reorderNow = useCallback(() => {
    if (!groups) return;
    setFrozenOrder(snapshotMostDuplicatesOrder(groups));
  }, [groups]);

  const orderedGroups = useMemo<[string, DuplicateEntry[]][] | undefined>(() => {
    if (!groups) return undefined;
    const arr = Array.from(groups.entries());
    if (order === 'most-duplicates') {
      if (frozenOrder) {
        // Aplicar ranking congelado. Items/equipos nuevos (no en el snapshot)
        // van al final con rank Infinity.
        const teamRank = new Map(frozenOrder.teams.map((t, i) => [t, i]));
        arr.sort(
          ([a], [b]) =>
            (teamRank.get(a) ?? Infinity) - (teamRank.get(b) ?? Infinity),
        );
        for (const [team, entries] of arr) {
          const ids = frozenOrder.entries.get(team);
          if (ids) {
            const entryRank = new Map(ids.map((id, i) => [id, i]));
            entries.sort(
              (a, b) =>
                (entryRank.get(a.sticker.id) ?? Infinity) -
                (entryRank.get(b.sticker.id) ?? Infinity),
            );
          } else {
            entries.sort((a, b) => b.extra - a.extra);
          }
        }
      } else {
        // Fallback (groups todavía no cargó cuando entró el modo): orden
        // dinámico hasta que useEffect capture el snapshot.
        for (const [, entries] of arr) {
          entries.sort((a, b) => b.extra - a.extra);
        }
        arr.sort(([, a], [, b]) => sumExtra(b) - sumExtra(a));
      }
    }
    return arr;
  }, [groups, order, frozenOrder]);

  const totalGlobal = useMemo(() => {
    if (!orderedGroups) return 0;
    let total = 0;
    for (const [, entries] of orderedGroups) total += sumExtra(entries);
    return total;
  }, [orderedGroups]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleTeam = (teamName: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(teamName)) next.delete(teamName);
      else next.add(teamName);
      return next;
    });
  };

  const allCollapsed =
    orderedGroups !== undefined &&
    orderedGroups.length > 0 &&
    orderedGroups.every(([t]) => collapsed.has(t));

  const toggleAll = () => {
    if (!orderedGroups) return;
    if (allCollapsed) {
      setCollapsed(new Set());
    } else {
      setCollapsed(new Set(orderedGroups.map(([t]) => t)));
    }
  };

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
        <ShareSection />

        <section className="mb-4">
          <div className="flex items-center justify-between gap-3">
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
          </div>
          {!isLoading && !isEmpty && (
            <div className="mt-2 flex justify-end gap-2">
              {order === 'most-duplicates' && (
                <button
                  type="button"
                  onClick={reorderNow}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors active:bg-muted"
                >
                  <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                  <span>Reordenar</span>
                </button>
              )}
              <button
                type="button"
                onClick={toggleAll}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors active:bg-muted"
              >
                {allCollapsed ? (
                  <ChevronsUpDown aria-hidden="true" className="h-3.5 w-3.5" />
                ) : (
                  <ChevronsDownUp aria-hidden="true" className="h-3.5 w-3.5" />
                )}
                <span>{allCollapsed ? 'Expandir todo' : 'Compactar todo'}</span>
              </button>
            </div>
          )}
        </section>

        {isLoading ? (
          <ListSkeleton />
        ) : isEmpty ? (
          <EmptyState />
        ) : (
          <ul className="flex flex-col gap-4">
            {orderedGroups.map(([teamName, entries]) => {
              const teamTotal = sumExtra(entries);
              const isCollapsed = collapsed.has(teamName);
              return (
                <li
                  key={teamName}
                  className="rounded-xl border border-border bg-background p-3"
                >
                  <div className={isCollapsed ? '' : 'mb-2'}>
                    <TeamGroupHeader
                      flagSlot={teamFlagSlot(teamName)}
                      name={teamName}
                      countLabel={`${teamTotal} repetida${
                        teamTotal === 1 ? '' : 's'
                      }`}
                      onToggle={() => toggleTeam(teamName)}
                      isCollapsed={isCollapsed}
                    />
                  </div>
                  {!isCollapsed && (
                    <ul className="flex flex-col gap-1">
                      {entries.map((entry) => (
                        <DuplicateRow key={entry.sticker.id} entry={entry} />
                      ))}
                    </ul>
                  )}
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

function ShareSection() {
  const [includeCC, setIncludeCC] = useLocalStoragePref<boolean>(
    'share.includeCC',
    false,
  );

  return (
    <section className="mb-4 rounded-xl border border-border bg-background p-3">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Compartir mi lista
      </h2>
      <div className="flex items-stretch gap-2">
        <ShareListButton />
        <ShareImageButton />
        <ShareLinkButton />
      </div>
      <label className="mt-3 inline-flex items-center gap-2 text-xs text-foreground">
        <input
          type="checkbox"
          checked={includeCC}
          onChange={(e) => setIncludeCC(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        Incluir Coca-Cola al compartir
      </label>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-background px-6 py-10 text-center">
      <Inbox
        aria-hidden="true"
        strokeWidth={1.5}
        className="h-10 w-10 text-muted-foreground/60"
      />
      <div>
        <p className="text-sm font-semibold text-foreground">
          No tenés repetidas todavía
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Cuando una lámina esté con count {'>'} 1 va a aparecer acá.
        </p>
      </div>
    </div>
  );
}
