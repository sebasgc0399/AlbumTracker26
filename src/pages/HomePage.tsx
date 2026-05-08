import { ArrowLeftRight, Share2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { TEAMS } from '@/data/teams';
import { useCollection, useProgress } from '@/db/hooks';
import GroupCard from '@/components/GroupCard';
import ProgressBar from '@/components/ProgressBar';
import ThemeToggle from '@/components/ThemeToggle';

const GROUP_IDS = Array.from(
  new Set(TEAMS.map((team) => team.group)),
).sort();

interface SpecialSection {
  id: string;
  name: string;
  description: string;
  // IDs de las láminas en esta sección. Coincide con el catálogo (stickers.json):
  // intro=FWC1..FWC9, museum=FWC10..FWC20, cocacola=CC1..CC14.
  stickerIds: readonly string[];
}

function range(prefix: string, from: number, to: number): string[] {
  const out: string[] = [];
  for (let i = from; i <= to; i += 1) out.push(`${prefix}${i}`);
  return out;
}

const SPECIAL_SECTIONS: readonly SpecialSection[] = [
  // Intro = 1 lámina "00" (Panini, sin prefijo FWC) + FWC1..FWC8.
  { id: 'intro', name: 'Introducción', description: '9 láminas', stickerIds: ['00', ...range('FWC', 1, 8)] },
  { id: 'museum', name: 'Museo FIFA', description: '11 láminas', stickerIds: range('FWC', 10, 20) },
  { id: 'cocacola', name: 'Coca-Cola', description: '14 láminas (promo)', stickerIds: range('CC', 1, 14) },
];

export default function HomePage() {
  const progress = useProgress();
  const collection = useCollection();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-primary">
              AlbumTracker<span className="font-mono text-foil">26</span>
            </h1>
            <p className="text-xs text-muted-foreground">Panini Mundial 2026</p>
          </div>
          <ThemeToggle />
          <Link
            to="/settings"
            aria-label="Ajustes"
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors active:bg-muted"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4">
        <section className="mb-6 rounded-xl border border-border bg-background p-4">
          {progress === undefined ? (
            <ProgressSkeleton />
          ) : (
            <>
              <div className="mb-1 flex items-baseline justify-between">
                <p className="text-3xl font-bold tabular-nums text-foreground">
                  {progress.owned}
                  <span className="text-base font-normal text-muted-foreground">
                    {' '}de {progress.total}
                  </span>
                </p>
                <p className="text-lg font-semibold tabular-nums text-primary">
                  {Math.round((progress.owned / progress.total) * 100)}%
                </p>
              </div>
              {progress.duplicates > 0 && (
                <p className="mb-3 text-xs text-muted-foreground">
                  {progress.duplicates} repetidas
                </p>
              )}
              <div className={progress.duplicates > 0 ? '' : 'mt-3'}>
                <ProgressBar value={progress.owned} max={progress.total} />
              </div>
            </>
          )}
        </section>

        <section className="mb-6">
          <button
            type="button"
            onClick={() => navigate('/cambiaton')}
            className="flex w-full items-center gap-3 rounded-xl bg-warning px-4 py-4 text-left text-warning-foreground shadow-sm transition-transform active:scale-[0.98]"
          >
            <ArrowLeftRight
              aria-hidden="true"
              strokeWidth={2}
              className="h-7 w-7 shrink-0"
            />
            <div className="flex-1">
              <h3 className="text-base font-bold">Modo Cambiaton</h3>
              <p className="text-xs opacity-90">
                Para intercambiar en vivo cara a cara
              </p>
            </div>
            <span className="text-xl leading-none" aria-hidden="true">
              →
            </span>
          </button>
        </section>

        {progress !== undefined && progress.duplicates > 0 && (
          <section className="mb-6">
            <Link
              to="/duplicates"
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-background px-4 py-4 text-left text-foreground shadow-sm transition-colors active:bg-muted"
            >
              <Share2
                aria-hidden="true"
                strokeWidth={2}
                className="h-7 w-7 shrink-0 text-primary"
              />
              <div className="flex-1">
                <h3 className="text-base font-bold">
                  <span className="tabular-nums">{progress.duplicates}</span>{' '}
                  repetida{progress.duplicates === 1 ? '' : 's'} para cambiar
                </h3>
                <p className="text-xs text-muted-foreground">
                  Compartí tu lista por WhatsApp o link
                </p>
              </div>
              <span className="text-xl leading-none" aria-hidden="true">
                →
              </span>
            </Link>
          </section>
        )}

        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Grupos
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {GROUP_IDS.map((groupId) => (
              <GroupCard
                key={groupId}
                groupId={groupId}
                collection={collection}
              />
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Especiales
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {SPECIAL_SECTIONS.map((section) => {
              const total = section.stickerIds.length;
              let owned = 0;
              if (collection) {
                for (const id of section.stickerIds) {
                  const entry = collection.get(id);
                  if (entry && entry.count > 0) owned += 1;
                }
              }
              return (
                <Link
                  key={section.id}
                  to={`/special/${section.id}`}
                  className="block rounded-lg border border-border bg-background p-3 transition-colors active:bg-muted"
                >
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold text-foreground">
                      {section.name}
                    </h3>
                    <div className="flex shrink-0 items-baseline gap-2">
                      <span className="text-xs text-muted-foreground">
                        {section.description}
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {owned}/{total}
                      </span>
                    </div>
                  </div>
                  <ProgressBar value={owned} max={total} />
                </Link>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}

function ProgressSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="h-8 w-32 rounded bg-muted" />
        <div className="h-6 w-12 rounded bg-muted" />
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-muted" />
    </div>
  );
}
