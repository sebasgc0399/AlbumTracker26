import type { CollectionEntry, Sticker } from '@/db/database';

interface StickerChipProps {
  sticker: Sticker;
  entry: CollectionEntry | undefined;
  onTap: (sticker: Sticker) => void;
}

export default function StickerChip({ sticker, entry, onTap }: StickerChipProps) {
  const count = entry?.count ?? 0;
  const isOwned = count > 0;
  const isDuplicated = count > 1;
  const isFoil = sticker.type === 'badge';
  const isTeamPhoto = sticker.type === 'team_photo';

  const stateClasses = isOwned
    ? 'bg-primary text-primary-foreground'
    : 'bg-muted text-muted-foreground';

  // Foils get a thicker gold ring; team photos get a dashed border to differentiate.
  const typeClasses = isFoil
    ? 'ring-2 ring-foil ring-offset-1 ring-offset-background'
    : isTeamPhoto
      ? 'border-2 border-dashed border-muted-foreground/60'
      : 'border border-border';

  return (
    <button
      type="button"
      onClick={() => onTap(sticker)}
      aria-label={`Lámina ${sticker.id}${isOwned ? `, tengo ${count}` : ', no tengo'}`}
      aria-pressed={isOwned}
      className={`relative flex aspect-square items-center justify-center rounded-lg p-1 text-center transition-colors active:scale-95 ${stateClasses} ${typeClasses}`}
    >
      <div className="flex flex-col items-center justify-center leading-tight">
        <span className="text-[0.6rem] font-medium opacity-70">{sticker.team}</span>
        <span className="text-lg font-bold tabular-nums">{sticker.position}</span>
      </div>

      {isFoil && (
        <span
          className="absolute left-1 top-1 text-[0.65rem] leading-none"
          aria-hidden="true"
          title="Foil"
        >
          ★
        </span>
      )}

      {isTeamPhoto && (
        <span
          className="absolute left-1 top-1 text-[0.65rem] leading-none"
          aria-hidden="true"
          title="Foto de equipo"
        >
          ◫
        </span>
      )}

      {isDuplicated && (
        <span
          className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-warning px-1 text-[0.65rem] font-bold text-foreground shadow"
          aria-label={`${count - 1} repetidas`}
        >
          +{count - 1}
        </span>
      )}
    </button>
  );
}
