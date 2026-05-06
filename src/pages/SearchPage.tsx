import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SearchResult from '@/components/SearchResult';
import type { Sticker } from '@/db/database';
import { useCollection, useStickers } from '@/db/hooks';
import { incrementCount } from '@/db/mutations';

const MAX_VISIBLE = 8;
const FLASH_MS = 220;
const TOAST_MS = 1600;

interface Toast {
  id: number;
  message: string;
}

export default function SearchPage() {
  const stickers = useStickers();
  const collection = useCollection();
  const location = useLocation();

  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [flashId, setFlashId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  // Focus on mount and whenever the user navigates back to /search.
  useEffect(() => {
    inputRef.current?.focus();
  }, [location.pathname]);

  useEffect(() => {
    if (!flashId) return;
    const timer = window.setTimeout(() => setFlashId(null), FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [flashId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const sortedStickers = useMemo<Sticker[] | undefined>(() => {
    if (!stickers) return undefined;
    // Stable order: team order in catalog, then by position. Same mental
    // model as TeamPage so prefix searches surface "COL1, COL2..." in order.
    return [...stickers].sort((a, b) => {
      if (a.team !== b.team) return a.team.localeCompare(b.team);
      return a.position - b.position;
    });
  }, [stickers]);

  const trimmed = query.trim();
  const matches = useMemo<Sticker[]>(() => {
    if (!sortedStickers || trimmed.length === 0) return [];
    const upper = trimmed.toUpperCase();
    return sortedStickers.filter((sticker) =>
      sticker.id.toUpperCase().includes(upper),
    );
  }, [sortedStickers, trimmed]);

  const visible = matches.slice(0, MAX_VISIBLE);
  const overflow = Math.max(0, matches.length - MAX_VISIBLE);

  function vibrate() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }

  function handleTap(sticker: Sticker) {
    const previousCount = collection?.get(sticker.id)?.count ?? 0;
    const nextCount = previousCount + 1;

    vibrate();
    void incrementCount(sticker.id);

    setFlashId(sticker.id);
    setToast({
      id: Date.now(),
      message:
        nextCount >= 2
          ? `Sumada ${sticker.id} (+${nextCount - 1} repetida${nextCount - 1 === 1 ? '' : 's'})`
          : `Sumada ${sticker.id}`,
    });

    setQuery('');
    inputRef.current?.focus();
  }

  const isCatalogLoading = sortedStickers === undefined;
  const isCollectionLoading = collection === undefined;

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <h1 className="text-xl font-bold text-foreground">Buscar lámina</h1>
          <p className="text-xs text-muted-foreground">
            Tipeá el código y tocá para sumarla
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
              placeholder="COL7, ARG12, FWC3..."
              inputMode="text"
              autoCapitalize="characters"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-base uppercase tracking-wide text-foreground placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4">
        {isCatalogLoading || isCollectionLoading ? (
          <ListSkeleton />
        ) : trimmed.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Escribí el código de la lámina (ej. COL7, ARG12, FWC3) para
              marcarla.
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

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex justify-center px-4"
        >
          <div className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg">
            {toast.message}
          </div>
        </div>
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
