import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Sticker } from '@/db/database';
import { useCollection, useStickers } from '@/db/hooks';
import { useLocalStoragePref } from '@/hooks/useLocalStoragePref';
import { decodeTradeList, type EncodedPayload } from '@/utils/encodeTradeList';
import { matchLists, type MatchResult } from '@/utils/matchLists';
import { flagInfoForTeamName } from '@/utils/flagFor';
import FlagIcon from '@/components/FlagIcon';
import TeamGroupHeader from '@/components/TeamGroupHeader';

function teamFlagSlot(teamName: string) {
  const info = flagInfoForTeamName(teamName);
  if (info.flagCode) {
    return <FlagIcon code={info.flagCode} alt="" className="w-8 shadow-sm" />;
  }
  return (
    <span className="text-2xl leading-none" aria-hidden="true">
      {info.emoji}
    </span>
  );
}

function naturalSortIds(ids: string[]): string[] {
  return ids.slice().sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
}

interface ParsedHash {
  payload: EncodedPayload | null;
  hadHash: boolean;
}

function readHash(): ParsedHash {
  if (typeof window === 'undefined') {
    return { payload: null, hadHash: false };
  }
  const raw = window.location.hash;
  // Formato esperado: #d=ABC123...
  if (!raw || !raw.startsWith('#d=')) {
    return { payload: null, hadHash: raw.length > 1 };
  }
  const data = raw.slice(3);
  return { payload: decodeTradeList(data), hadHash: true };
}

interface StickerListProps {
  title: string;
  count: number;
  stickers: Sticker[];
  emptyHint?: string;
}

function StickerList({ title, count, stickers, emptyHint }: StickerListProps) {
  const byTeam = useMemo(() => {
    const map = new Map<string, Sticker[]>();
    for (const sticker of stickers) {
      let bucket = map.get(sticker.teamName);
      if (!bucket) {
        bucket = [];
        map.set(sticker.teamName, bucket);
      }
      bucket.push(sticker);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [stickers]);

  return (
    <section className="rounded-xl border border-border bg-background p-3">
      <header className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          {title}
        </h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          ({count})
        </span>
      </header>
      {stickers.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {emptyHint ?? 'Nada por acá.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {byTeam.map(([teamName, items]) => (
            <li key={teamName}>
              <div className="mb-1">
                <TeamGroupHeader
                  flagSlot={teamFlagSlot(teamName)}
                  name={teamName}
                  countLabel={`${items.length}`}
                />
              </div>
              <p className="break-words pl-8 font-mono text-xs text-muted-foreground">
                {naturalSortIds(items.map((s) => s.id)).join(', ')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface RawIdsListProps {
  title: string;
  count: number;
  ids: string[];
  stickersById: Map<string, Sticker>;
}

function RawIdsList({ title, count, ids, stickersById }: RawIdsListProps) {
  const byTeam = useMemo(() => {
    const map = new Map<string, string[]>();
    const unknownIds: string[] = [];
    for (const id of ids) {
      const sticker = stickersById.get(id);
      if (!sticker) {
        unknownIds.push(id);
        continue;
      }
      let bucket = map.get(sticker.teamName);
      if (!bucket) {
        bucket = [];
        map.set(sticker.teamName, bucket);
      }
      bucket.push(id);
    }
    const result = Array.from(map.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    if (unknownIds.length > 0) {
      result.push(['Desconocidos', unknownIds]);
    }
    return result;
  }, [ids, stickersById]);

  return (
    <section className="rounded-xl border border-border bg-background p-3">
      <header className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          {title}
        </h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          ({count})
        </span>
      </header>
      {ids.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nada por acá.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {byTeam.map(([teamName, items]) => (
            <li key={teamName}>
              <div className="mb-1">
                <TeamGroupHeader
                  flagSlot={teamFlagSlot(teamName)}
                  name={teamName}
                  countLabel={`${items.length}`}
                />
              </div>
              <p className="break-words pl-8 font-mono text-xs text-muted-foreground">
                {naturalSortIds(items).join(', ')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function SharedListPage() {
  const navigate = useNavigate();
  const [parsed] = useState<ParsedHash>(() => readHash());
  const [showAll, setShowAll] = useLocalStoragePref<boolean>(
    'share.showAll',
    true,
  );
  const [toast, setToast] = useState<string | null>(null);

  const stickers = useStickers();
  const collection = useCollection();
  const collectionCount = useLiveQuery(() => db.collection.count());

  // Toast efímero
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Si decode falla → toast + redirect
  useEffect(() => {
    if (parsed.payload === null) {
      setToast('Link inválido');
      const id = window.setTimeout(() => navigate('/'), 1200);
      return () => window.clearTimeout(id);
    }
  }, [parsed.payload, navigate]);

  const stickersById = useMemo(() => {
    const map = new Map<string, Sticker>();
    if (stickers) {
      for (const s of stickers) map.set(s.id, s);
    }
    return map;
  }, [stickers]);

  const matchResult: MatchResult | null = useMemo(() => {
    if (!parsed.payload || !stickers || !collection) return null;
    if (collectionCount === undefined || collectionCount === 0) return null;
    return matchLists(
      collection,
      stickers,
      parsed.payload.d,
      parsed.payload.b,
    );
  }, [parsed.payload, stickers, collection, collectionCount]);

  const payload = parsed.payload;

  // Estado: hash inválido → solo render del toast + redirect en useEffect
  if (!payload) {
    return (
      <div className="min-h-screen bg-background pb-20 text-foreground">
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto max-w-md">
            <h1 className="text-xl font-bold text-foreground">
              Lista compartida
            </h1>
          </div>
        </header>
        <main className="mx-auto max-w-md px-4 py-4">
          <p className="text-sm text-muted-foreground">
            Link inválido. Redirigiendo…
          </p>
        </main>
        {toast ? (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background shadow-lg"
          >
            {toast}
          </div>
        ) : null}
      </div>
    );
  }

  const headerTitle = payload.n ? `Lista de ${payload.n}` : 'Lista compartida';
  const isLoading =
    stickers === undefined ||
    collection === undefined ||
    collectionCount === undefined;
  const isVisitor = !isLoading && collectionCount === 0;

  return (
    <div className="min-h-screen bg-background pb-8 text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <h1 className="text-xl font-bold text-foreground">{headerTitle}</h1>
          <p className="text-xs tabular-nums text-muted-foreground">
            <span className="font-semibold text-foreground">
              {payload.d.length}
            </span>{' '}
            cambia ·{' '}
            <span className="font-semibold text-foreground">
              {payload.b.length}
            </span>{' '}
            busca
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : isVisitor ? (
          <>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <h2 className="mb-1 text-sm font-bold text-primary">
                Instalá AT26
              </h2>
              <p className="text-xs text-muted-foreground">
                Para registrar tu colección y ver el match con esta lista,
                instalá AlbumTracker26 desde el menú de tu navegador.
              </p>
            </div>

            <RawIdsList
              title="Cambia"
              count={payload.d.length}
              ids={payload.d}
              stickersById={stickersById}
            />
            <RawIdsList
              title="Busca"
              count={payload.b.length}
              ids={payload.b}
              stickersById={stickersById}
            />
          </>
        ) : matchResult ? (
          <>
            <section className="rounded-xl border border-border bg-background p-3">
              <h2 className="mb-3 text-base font-bold text-foreground">
                Match con tu colección
              </h2>
              <div className="flex flex-col gap-3">
                <StickerList
                  title={`Le puedes dar (${matchResult.canGive.length})`}
                  count={matchResult.canGive.length}
                  stickers={matchResult.canGive}
                  emptyHint="No tenés repetidas que el otro busque."
                />
                <StickerList
                  title={`Te puede dar (${matchResult.canReceive.length})`}
                  count={matchResult.canReceive.length}
                  stickers={matchResult.canReceive}
                  emptyHint="Sus repetidas no coinciden con lo que te falta."
                />
              </div>
            </section>

            <label className="inline-flex items-center gap-2 self-start text-xs text-foreground">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Mostrar todo (no solo matches)
            </label>

            {showAll ? (
              <>
                <RawIdsList
                  title="Su lista — Cambia"
                  count={payload.d.length}
                  ids={payload.d}
                  stickersById={stickersById}
                />
                <RawIdsList
                  title="Su lista — Busca"
                  count={payload.b.length}
                  ids={payload.b}
                  stickersById={stickersById}
                />
              </>
            ) : null}
          </>
        ) : null}
      </main>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
