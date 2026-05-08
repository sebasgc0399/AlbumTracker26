import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SearchResult from '@/components/SearchResult';
import UndoToast from '@/components/UndoToast';
import BatchSummary from '@/components/BatchSummary';
import type { Sticker } from '@/db/database';
import { useCollection, useStickers } from '@/db/hooks';
import { incrementAndReturn } from '@/db/mutations';
import { feedback } from '@/lib/feedback';
import { useBatchSession } from '@/hooks/useBatchSession';

const MAX_VISIBLE = 8;
const FLASH_MS = 220;
const SOBRE_TARGET = 7;

// Letras base distintas (no diacríticos combinables) que normalize('NFD') no descompone.
// Necesario para buscar "odegaard" → "Ødegaard", "yamal" → "Yamal", etc.
const BASE_LETTER_MAP: Record<string, string> = {
  ø: 'o', æ: 'ae', å: 'a', ß: 'ss', đ: 'd', ł: 'l',
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[øæåßđł]/g, (ch) => BASE_LETTER_MAP[ch] ?? ch)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export default function SearchPage() {
  const stickers = useStickers();
  const collection = useCollection();
  const location = useLocation();
  const batch = useBatchSession();

  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [flashId, setFlashId] = useState<string | null>(null);

  // Focus on mount and whenever the user navigates back to /search.
  useEffect(() => {
    inputRef.current?.focus();
  }, [location.pathname]);

  useEffect(() => {
    if (!flashId) return;
    const timer = window.setTimeout(() => setFlashId(null), FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [flashId]);

  const sortedStickers = useMemo<Sticker[] | undefined>(() => {
    if (!stickers) return undefined;
    return [...stickers].sort((a, b) => {
      if (a.team !== b.team) return a.team.localeCompare(b.team);
      return a.position - b.position;
    });
  }, [stickers]);

  const trimmed = query.trim();
  const matches = useMemo<Sticker[]>(() => {
    if (!sortedStickers || trimmed.length === 0) return [];
    const needle = normalize(trimmed);

    // Score por relevancia: matches de código exacto primero, luego prefijo
    // de código, luego substring de código, después matches de nombre.
    // Esto evita que tipear "COL" muestre "Nicolás Otamendi" antes que COL1
    // — el código de equipo es la pista más usada al abrir un sobre.
    const scored: { sticker: Sticker; score: number }[] = [];
    for (const sticker of sortedStickers) {
      const idLower = sticker.id.toLowerCase();
      const nameNorm = normalize(sticker.name);
      let score: number;
      if (idLower === needle) score = 0;
      else if (idLower.startsWith(needle)) score = 1;
      else if (idLower.includes(needle)) score = 2;
      else if (nameNorm.startsWith(needle)) score = 3;
      else if (nameNorm.includes(needle)) score = 4;
      else continue;
      scored.push({ sticker, score });
    }

    // Stable sort: orden preexistente (team + position) se mantiene dentro
    // del mismo score gracias a Array.prototype.sort estable en V8.
    scored.sort((a, b) => a.score - b.score);
    return scored.map((s) => s.sticker);
  }, [sortedStickers, trimmed]);

  const visible = matches.slice(0, MAX_VISIBLE);
  const overflow = Math.max(0, matches.length - MAX_VISIBLE);

  async function handleTap(sticker: Sticker) {
    // Approximate kind from cache for instant haptic; the truthful prev
    // comes from the atomic transaction below for batch tracking.
    const cachedPrev = collection?.get(sticker.id)?.count ?? 0;
    feedback({ kind: cachedPrev === 0 ? 'newOwned' : 'duplicate' });

    setFlashId(sticker.id);
    setQuery('');
    inputRef.current?.focus();
    const { prev, next } = await incrementAndReturn(sticker.id);
    batch.recordTap(sticker.id, prev, next);
  }

  const isCatalogLoading = sortedStickers === undefined;
  const isCollectionLoading = collection === undefined;
  const showCounter = batch.isActive && batch.mutations.length > 0;
  const showSummary = batch.isClosed && batch.summary !== null;

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <h1 className="text-xl font-bold text-foreground">Buscar lámina</h1>
          <p className="text-xs text-muted-foreground">
            Tipeá el código o el nombre y tocá para sumarla
          </p>
          <div className="mt-3">
            <label htmlFor="sticker-search" className="sr-only">
              Código de lámina
            </label>
            <input
              ref={inputRef}
              id="sticker-search"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="COL7, Messi, Mbappé..."
              inputMode="text"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {showCounter && (
            <div className="mt-2 flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
              <span className="font-semibold">
                Sobre actual ·{' '}
                <span className="font-mono tabular-nums">
                  {batch.mutations.length} / {SOBRE_TARGET}
                </span>
              </span>
              <button
                type="button"
                onClick={batch.closeManually}
                aria-label="Cerrar sobre"
                className="ml-auto flex h-6 w-6 items-center justify-center rounded-full text-primary/70 transition-colors active:bg-primary/20"
              >
                <span aria-hidden="true" className="text-base leading-none">
                  ×
                </span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4">
        {isCatalogLoading || isCollectionLoading ? (
          <ListSkeleton />
        ) : trimmed.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Escribí el código (ej. COL7) o el nombre del jugador (ej. Messi)
              para marcarla.
            </p>
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No hay láminas que coincidan con "{trimmed}".
            </p>
          </div>
        ) : (
          <>
            <ul
              className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto"
              role="listbox"
              aria-label="Resultados de búsqueda"
            >
              {visible.map((sticker) => (
                <li key={sticker.id} role="option" aria-selected={false}>
                  <SearchResult
                    sticker={sticker}
                    entry={collection?.get(sticker.id)}
                    onTap={handleTap}
                    isFlashing={flashId === sticker.id}
                  />
                </li>
              ))}
            </ul>
            {overflow > 0 && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                +{overflow} más — afiná la búsqueda
              </p>
            )}
          </>
        )}
      </main>

      {!showSummary && (
        <UndoToast
          mutation={batch.lastMutation}
          onUndo={() => void batch.undoLast()}
        />
      )}

      {showSummary && (
        <BatchSummary
          summary={batch.summary}
          onUndoAll={() => void batch.undoAll()}
          onDismiss={batch.dismissSummary}
        />
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="h-16 animate-pulse rounded-lg border border-border bg-muted"
        />
      ))}
    </div>
  );
}
