import { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { TEAMS } from '@/data/teams';
import { useCollection, useStickers } from '@/db/hooks';
import type { Sticker } from '@/db/database';
import { incrementCount } from '@/db/mutations';
import ProgressBar from '@/components/ProgressBar';
import FlagIcon from '@/components/FlagIcon';
import StickerChip from '@/components/StickerChip';
import { feedback } from '@/lib/feedback';
import StickerDetail from '@/components/StickerDetail';
import FilterChips, { type FilterValue } from '@/components/FilterChips';
import TeamPickerSheet from '@/components/TeamPickerSheet';
import { useSessionStoragePref } from '@/hooks/useSessionStoragePref';

// Altura aproximada del header sticky de TeamPage:
// py-3 (24) + row h-10 (40) + mt-2 (8) + ProgressBar h-2 (8) + border-b (1) ≈ 81px.
const HEADER_OFFSET_PX = 81;

export default function TeamPage() {
  const { teamCode } = useParams<{ teamCode: string }>();
  const team = teamCode
    ? TEAMS.find((candidate) => candidate.code === teamCode)
    : undefined;

  const stickers = useStickers(team?.code);
  const collection = useCollection();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [filter, setFilter] = useSessionStoragePref<FilterValue>(
    `filter.team.${teamCode ?? 'unknown'}`,
    'all',
  );

  const sortedStickers = useMemo<Sticker[] | undefined>(() => {
    if (!stickers) return undefined;
    return [...stickers].sort((a, b) => a.position - b.position);
  }, [stickers]);

  // En modo `duplicates` filtramos directamente la lista; el resto se renderiza completo.
  const visibleStickers = useMemo<Sticker[] | undefined>(() => {
    if (!sortedStickers) return undefined;
    if (filter !== 'duplicates') return sortedStickers;
    return sortedStickers.filter((sticker) => {
      const entry = collection?.get(sticker.id);
      return entry !== undefined && entry.count >= 2;
    });
  }, [sortedStickers, filter, collection]);

  if (!teamCode || !team) {
    return <Navigate to="/" replace />;
  }

  const ownedCount =
    sortedStickers && collection
      ? sortedStickers.reduce((acc, sticker) => {
          const entry = collection.get(sticker.id);
          return entry && entry.count > 0 ? acc + 1 : acc;
        }, 0)
      : 0;
  const duplicatesCount =
    sortedStickers && collection
      ? sortedStickers.reduce((acc, sticker) => {
          const entry = collection.get(sticker.id);
          return entry && entry.count >= 2 ? acc + (entry.count - 1) : acc;
        }, 0)
      : 0;
  const total = sortedStickers?.length ?? 20;

  function handleTap(sticker: Sticker) {
    const entry = collection?.get(sticker.id);
    const isFirstTap = !entry || entry.count === 0;
    feedback({ kind: isFirstTap ? 'newOwned' : 'tap' });
    if (isFirstTap) {
      void incrementCount(sticker.id);
    } else {
      setActiveStickerId(sticker.id);
    }
  }

  const fallbackPath = `/group/${team.group}`;

  function handleBack() {
    // location.key === 'default' = primer entry del SPA stack (deep link, refresh,
    // URL pegada). Sin history previo, fallback al grupo del equipo.
    if (location.key === 'default') {
      navigate(fallbackPath, { replace: true });
    } else {
      navigate(-1);
    }
  }

  const activeSticker =
    activeStickerId && sortedStickers
      ? sortedStickers.find((sticker) => sticker.id === activeStickerId)
      : undefined;
  const activeEntry =
    activeStickerId && collection ? collection.get(activeStickerId) : undefined;

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              aria-label={`Volver al grupo ${team.group}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors active:bg-muted"
            >
              <span aria-hidden="true" className="text-xl leading-none">
                ←
              </span>
            </button>
            <FlagIcon
              code={team.flagCode}
              alt=""
              className="w-12 shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold text-foreground">
                {team.name}
              </h1>
              <p className="text-xs text-muted-foreground">
                Grupo {team.group}
                {duplicatesCount > 0 && (
                  <>
                    {' · '}
                    <span className="font-semibold text-foreground">
                      {duplicatesCount}
                    </span>{' '}
                    repetida{duplicatesCount === 1 ? '' : 's'}
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              aria-label="Buscar equipo"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors active:bg-muted"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
              {ownedCount}/{total}
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar value={ownedCount} max={total} />
          </div>
        </div>
      </header>

      <FilterChips value={filter} onChange={setFilter} topOffset={HEADER_OFFSET_PX} />

      <main className="mx-auto max-w-md px-4 py-4">
        {visibleStickers === undefined ? (
          <GridSkeleton />
        ) : visibleStickers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {filter === 'duplicates'
              ? 'No tenés láminas repetidas en este equipo.'
              : filter === 'missing'
                ? 'Tenés todas las láminas de este equipo.'
                : 'No hay láminas para este equipo todavía.'}
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {visibleStickers.map((sticker) => (
              <StickerChip
                key={sticker.id}
                sticker={sticker}
                entry={collection?.get(sticker.id)}
                onTap={handleTap}
                variant={filter === 'missing' ? 'missing-mode' : 'default'}
              />
            ))}
          </div>
        )}
      </main>

      {activeSticker && (
        <StickerDetail
          sticker={activeSticker}
          entry={activeEntry}
          onClose={() => setActiveStickerId(null)}
        />
      )}

      <TeamPickerSheet
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        currentTeamCode={team.code}
      />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: 20 }).map((_, idx) => (
        <div
          key={idx}
          className="aspect-square animate-pulse rounded-lg bg-muted"
        />
      ))}
    </div>
  );
}
