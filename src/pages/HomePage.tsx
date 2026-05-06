import { useNavigate } from 'react-router-dom';
import { TEAMS } from '@/data/teams';
import { useCollection, useProgress } from '@/db/hooks';
import { useLocalStoragePref } from '@/hooks/useLocalStoragePref';
import GroupCard from '@/components/GroupCard';
import ProgressBar from '@/components/ProgressBar';

const GROUP_IDS = Array.from(
  new Set(TEAMS.map((team) => team.group)),
).sort();

interface SpecialSection {
  id: string;
  name: string;
  count: number;
  description: string;
}

const SPECIAL_SECTIONS: readonly SpecialSection[] = [
  { id: 'intro', name: 'Introducción', count: 9, description: '9 láminas' },
  { id: 'museum', name: 'Museo FIFA', count: 11, description: '11 láminas' },
  { id: 'cocacola', name: 'Coca-Cola', count: 12, description: '12 láminas (promo)' },
];

export default function HomePage() {
  const progress = useProgress();
  const collection = useCollection();
  const navigate = useNavigate();
  const [nickname, setNickname] = useLocalStoragePref<string>('nickname', '');

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <h1 className="text-xl font-bold text-primary">AlbumTracker26</h1>
          <p className="text-xs text-muted-foreground">Panini Mundial 2026</p>
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
            <span className="text-3xl leading-none" aria-hidden="true">
              🔄
            </span>
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
            {SPECIAL_SECTIONS.map((section) => (
              <div
                key={section.id}
                className="rounded-lg border border-border bg-background p-3"
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-base font-semibold text-foreground">
                    {section.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {section.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6 rounded-lg border border-border bg-background p-3">
          <label
            htmlFor="nickname-input"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Tu nombre (para compartir listas)
          </label>
          <input
            id="nickname-input"
            type="text"
            maxLength={24}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Sin nombre"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
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
