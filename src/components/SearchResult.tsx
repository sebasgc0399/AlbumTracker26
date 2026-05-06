import { TEAMS } from '@/data/teams';
import type { CollectionEntry, Sticker } from '@/db/database';

interface SearchResultProps {
  sticker: Sticker;
  entry: CollectionEntry | undefined;
  onTap: (sticker: Sticker) => void;
  isFlashing?: boolean;
}

const FLAG_BY_TEAM = new Map(TEAMS.map((team) => [team.code, team.flag]));

function flagFor(teamCode: string): string {
  if (FLAG_BY_TEAM.has(teamCode)) return FLAG_BY_TEAM.get(teamCode) ?? '';
  if (teamCode === 'CC') return '🥤';
  if (teamCode === 'FWC') return '🏆';
  return '⚽';
}

export default function SearchResult({
  sticker,
  entry,
  onTap,
  isFlashing = false,
}: SearchResultProps) {
  const count = entry?.count ?? 0;
  const isOwned = count > 0;
  const isDuplicated = count > 1;

  const flashClasses = isFlashing
    ? 'bg-success/30 ring-2 ring-success'
    : 'bg-background hover:bg-muted active:bg-muted';

  return (
    <button
      type="button"
      onClick={() => onTap(sticker)}
      aria-label={`Sumar lámina ${sticker.id}${isOwned ? `, tengo ${count}` : ''}`}
      className={`flex h-16 w-full items-center gap-3 rounded-lg border border-border px-3 text-left transition-colors ${flashClasses}`}
    >
      <span className="shrink-0 text-2xl leading-none" aria-hidden="true">
        {flagFor(sticker.team)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-bold tabular-nums text-foreground">
            {sticker.id}
          </span>
          <span className="min-w-0 truncate text-sm text-foreground">
            {sticker.name}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {sticker.teamName}
        </p>
      </div>
      {isOwned ? (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
            isDuplicated
              ? 'bg-warning text-foreground'
              : 'bg-primary text-primary-foreground'
          }`}
          aria-label={isDuplicated ? `Tengo ${count}` : 'Tengo 1'}
        >
          ✓ {count}
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="shrink-0 text-xs text-muted-foreground"
        >
          —
        </span>
      )}
    </button>
  );
}
