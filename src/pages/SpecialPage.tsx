import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useCollection, useStickersBySection } from '@/db/hooks';
import type { Sticker } from '@/db/database';
import { incrementCount } from '@/db/mutations';
import ProgressBar from '@/components/ProgressBar';
import StickerChip from '@/components/StickerChip';
import { feedback } from '@/lib/feedback';
import StickerDetail from '@/components/StickerDetail';
import FilterChips, { type FilterValue } from '@/components/FilterChips';
import { useSessionStoragePref } from '@/hooks/useSessionStoragePref';

// Header sticky equivalente al de TeamPage:
// py-3 (24) + row h-10 (40) + mt-2 (8) + ProgressBar h-2 (8) + border-b (1) ≈ 81px.
const HEADER_OFFSET_PX = 81;

interface SectionMeta {
  title: string;
  expectedTotal: number;
}

const SECTIONS: Record<string, SectionMeta> = {
  intro: { title: 'Introducción', expectedTotal: 9 },
  museum: { title: 'Museo FIFA', expectedTotal: 11 },
  cocacola: { title: 'Coca-Cola', expectedTotal: 14 },
};

export default function SpecialPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const meta = sectionId ? SECTIONS[sectionId] : undefined;

  const stickers = useStickersBySection(sectionId ?? '');
  const collection = useCollection();

  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  const [filter, setFilter] = useSessionStoragePref<FilterValue>(
    `filter.special.${sectionId ?? 'unknown'}`,
    'all',
  );

  const sortedStickers = useMemo<Sticker[] | undefined>(() => {
    if (!stickers) return undefined;
    return [...stickers].sort((a, b) => a.position - b.position);
  }, [stickers]);

  const visibleStickers = useMemo<Sticker[] | undefined>(() => {
    if (!sortedStickers) return undefined;
    if (filter !== 'duplicates') return sortedStickers;
    return sortedStickers.filter((sticker) => {
      const entry = collection?.get(sticker.id);
      return entry !== undefined && entry.count >= 2;
    });
  }, [sortedStickers, filter, collection]);

  if (!sectionId || !meta) {
    return <Navigate to="/" replace />;
  }

  const ownedCount =
    sortedStickers && collection
      ? sortedStickers.reduce((acc, sticker) => {
          const entry = collection.get(sticker.id);
          return entry && entry.count > 0 ? acc + 1 : acc;
        }, 0)
      : 0;
  const total = sortedStickers?.length ?? meta.expectedTotal;

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
            <Link
              to="/"
              aria-label="Volver al inicio"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors active:bg-muted"
            >
              <span aria-hidden="true" className="text-xl leading-none">
                ←
              </span>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold text-foreground">
                {meta.title}
              </h1>
              <p className="text-xs text-muted-foreground">Especiales</p>
            </div>
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
          <GridSkeleton expected={meta.expectedTotal} />
        ) : visibleStickers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {filter === 'duplicates'
              ? 'No tenés láminas repetidas en esta sección.'
              : filter === 'missing'
                ? 'Tenés todas las láminas de esta sección.'
                : 'No hay láminas para esta sección todavía.'}
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
    </div>
  );
}

function GridSkeleton({ expected }: { expected: number }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: expected }).map((_, idx) => (
        <div
          key={idx}
          className="aspect-square animate-pulse rounded-lg bg-muted"
        />
      ))}
    </div>
  );
}
