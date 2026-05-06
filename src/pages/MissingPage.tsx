import { TEAMS } from '@/data/teams';
import { useMissingByTeam } from '@/db/hooks';
import { useLocalStoragePref } from '@/hooks/useLocalStoragePref';
import { ALMOST_COMPLETE_THRESHOLD } from '@/utils/constants';
import MissingRow from '@/components/MissingRow';
import ProgressBar from '@/components/ProgressBar';

const FLAG_BY_TEAM_NAME = new Map(TEAMS.map((team) => [team.name, team.flag]));

function flagFor(teamName: string): string {
  if (FLAG_BY_TEAM_NAME.has(teamName)) {
    return FLAG_BY_TEAM_NAME.get(teamName) ?? '';
  }
  // Special groups in the album.
  if (teamName === 'Coca-Cola') return '🥤';
  if (teamName === 'Introducción' || teamName === 'Museo FIFA') return '🏆';
  return '⚽';
}

export default function MissingPage() {
  const [almostOnly, setAlmostOnly] = useLocalStoragePref<boolean>(
    'missing.almostOnly',
    false,
  );
  const groups = useMissingByTeam({ almostOnly });

  const isLoading = groups === undefined;
  const isEmpty = !isLoading && groups.size === 0;

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <h1 className="text-xl font-bold text-foreground">Me Falta</h1>
          <p className="text-xs text-muted-foreground">
            Láminas que aún no tenés, agrupadas por equipo
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 pt-3">
        <div
          role="tablist"
          aria-label="Filtro de faltantes"
          className="flex gap-1 rounded-full border border-border bg-muted p-1 text-xs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!almostOnly}
            onClick={() => setAlmostOnly(false)}
            className={`flex-1 rounded-full px-3 py-1.5 transition-colors ${
              !almostOnly
                ? 'bg-background font-semibold text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            Todos los equipos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={almostOnly}
            onClick={() => setAlmostOnly(true)}
            className={`flex-1 rounded-full px-3 py-1.5 transition-colors ${
              almostOnly
                ? 'bg-background font-semibold text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            Casi completos (≤{ALMOST_COMPLETE_THRESHOLD})
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-md px-4 py-4">
        {isLoading ? (
          <ListSkeleton />
        ) : isEmpty ? (
          <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {almostOnly
                ? 'Ningún equipo cumple el filtro casi completos.'
                : 'Felicitaciones, completaste el álbum.'}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {Array.from(groups.entries()).map(([teamName, data]) => {
              const missingCount = data.entries.length;
              const ownedCount = data.totalForTeam - missingCount;
              return (
                <li
                  key={teamName}
                  className="rounded-xl border border-border bg-background p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-2xl leading-none">
                      {flagFor(teamName)}
                    </span>
                    <h2 className="flex-1 truncate text-base font-semibold text-foreground">
                      {teamName}
                    </h2>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {missingCount} de {data.totalForTeam}
                    </span>
                  </div>
                  <div className="mb-3">
                    <ProgressBar value={ownedCount} max={data.totalForTeam} />
                  </div>
                  <ul className="flex flex-col gap-1">
                    {data.entries.map(({ sticker }) => (
                      <MissingRow key={sticker.id} sticker={sticker} />
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
