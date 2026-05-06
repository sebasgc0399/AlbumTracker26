import type { CollectionEntry, Sticker } from '@/db/database';
import TeamFlag from './TeamFlag';
import { flagInfoForTeamCode } from '@/utils/flagFor';

interface SearchResultProps {
  sticker: Sticker;
  entry: CollectionEntry | undefined;
  onTap: (sticker: Sticker) => void;
  isFlashing?: boolean;
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

  const flagInfo = flagInfoForTeamCode(sticker.team);

  return (
    <button
      type="button"
      onClick={() => onTap(sticker)}
      aria-label={`Sumar lámina ${sticker.id}${isOwned ? `, tengo ${count}` : ''}`}
      className={`flex h-16 w-full items-center gap-3 rounded-lg border border-border px-3 text-left transition-colors ${flashClasses}`}
    >
      <TeamFlag info={flagInfo} alt="" className="w-8 shrink-0 shadow-sm" />
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
