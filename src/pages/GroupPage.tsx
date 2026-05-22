import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { TEAMS } from '@/data/teams';
import { useCollection } from '@/db/hooks';
import ProgressBar from '@/components/ProgressBar';
import FlagIcon from '@/components/FlagIcon';
import FilterChips, { type FilterValue } from '@/components/FilterChips';
import TeamPickerSheet from '@/components/TeamPickerSheet';
import { useSessionStoragePref } from '@/hooks/useSessionStoragePref';

const ORDERED_GROUPS = Array.from(
  new Set(TEAMS.map((team) => team.group).filter((group) => group !== 'special')),
);
const VALID_GROUPS = new Set(ORDERED_GROUPS);
const STICKERS_PER_TEAM = 20;

// Altura aproximada del header sticky de GroupPage:
// py-3 (24) + row con h-10 (40) + border-b (1) ≈ 65px.
const HEADER_OFFSET_PX = 65;

interface TeamCounters {
  owned: number;
  missing: number;
  duplicates: number;
}

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const collection = useCollection();
  const navigate = useNavigate();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [filter, setFilter] = useSessionStoragePref<FilterValue>(
    `filter.group.${groupId ?? 'unknown'}`,
    'all',
  );

  if (!groupId || !VALID_GROUPS.has(groupId)) {
    return <Navigate to="/" replace />;
  }

  const teams = TEAMS.filter((team) => team.group === groupId);

  const currentIndex = ORDERED_GROUPS.indexOf(groupId);
  const prevGroup =
    ORDERED_GROUPS[(currentIndex - 1 + ORDERED_GROUPS.length) % ORDERED_GROUPS.length];
  const nextGroup = ORDERED_GROUPS[(currentIndex + 1) % ORDERED_GROUPS.length];

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Link
            to="/"
            state={{ fromGroup: groupId }}
            aria-label="Volver al inicio"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors active:bg-muted"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ←
            </span>
          </Link>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => navigate(`/group/${prevGroup}`)}
              aria-label={`Grupo anterior (${prevGroup})`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-muted active:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="min-w-0 text-center">
              <h1 className="text-xl font-bold text-foreground">Grupo {groupId}</h1>
              <p className="text-xs text-muted-foreground">
                {teams.length} equipos
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/group/${nextGroup}`)}
              aria-label={`Grupo siguiente (${nextGroup})`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-muted active:text-foreground"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            aria-label="Buscar equipo"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors active:bg-muted"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <FilterChips value={filter} onChange={setFilter} topOffset={HEADER_OFFSET_PX} />

      <main className="mx-auto max-w-md px-4 py-4">
        <ul className="grid grid-cols-1 gap-2">
          {teams.map((team) => {
            const counters: TeamCounters = { owned: 0, missing: 0, duplicates: 0 };
            if (collection) {
              for (let position = 1; position <= STICKERS_PER_TEAM; position += 1) {
                const entry = collection.get(`${team.code}${position}`);
                const count = entry?.count ?? 0;
                if (count > 0) counters.owned += 1;
                else counters.missing += 1;
                if (count >= 2) counters.duplicates += count - 1;
              }
            } else {
              counters.missing = STICKERS_PER_TEAM;
            }

            return (
              <li key={team.code}>
                <Link
                  to={`/team/${team.code}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-colors active:bg-muted"
                >
                  <FlagIcon
                    code={team.flagCode}
                    alt=""
                    className="w-12 shadow-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <p className="truncate text-base font-semibold text-foreground">
                        {team.name}
                      </p>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {filter === 'missing'
                          ? `${counters.missing} faltan`
                          : filter === 'duplicates'
                            ? `${counters.duplicates} rep.`
                            : `${counters.owned}/${STICKERS_PER_TEAM}`}
                      </span>
                    </div>
                    <ProgressBar value={counters.owned} max={STICKERS_PER_TEAM} />
                  </div>
                  <span aria-hidden="true" className="text-xl text-muted-foreground">
                    ›
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>

      <TeamPickerSheet
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
      />
    </div>
  );
}
