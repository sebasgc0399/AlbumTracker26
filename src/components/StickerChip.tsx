import type { CollectionEntry, Sticker } from '@/db/database';

interface StickerChipProps {
  sticker: Sticker;
  entry: CollectionEntry | undefined;
  onTap: (sticker: Sticker) => void;
  variant?: 'default' | 'missing-mode';
}

export default function StickerChip({
  sticker,
  entry,
  onTap,
  variant = 'default',
}: StickerChipProps) {
  const count = entry?.count ?? 0;
  const isOwned = count > 0;
  const isDuplicated = count > 1;
  const isFoil = sticker.type === 'badge';
  const isTeamPhoto = sticker.type === 'team_photo';

  // En "missing-mode", las láminas que NO faltan (ya las tengo) se atenúan
  // para mantener el contexto del grid completo, pero foco visual en lo faltante.
  const isDimmedByFilter = variant === 'missing-mode' && isOwned;

  const stateClasses = isDimmedByFilter
    ? 'bg-muted/40 text-muted-foreground/60'
    : isOwned
      ? 'bg-primary text-primary-foreground'
      : 'bg-muted text-muted-foreground';

  // Foils get a thicker gold ring; team photos get a dashed border to differentiate.
  // En missing-mode atenuado forzamos un borde punteado para refuerzo visual.
  const typeClasses = isDimmedByFilter
    ? 'border border-dashed border-border opacity-50'
    : isFoil
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

      {isFoil && !isDimmedByFilter && (
        <span
          className="absolute left-1 top-1 text-[0.65rem] leading-none"
          aria-hidden="true"
          title="Foil"
        >
          ★
        </span>
      )}

      {isTeamPhoto && !isDimmedByFilter && (
        <span
          className="absolute left-1 top-1 text-[0.65rem] leading-none"
          aria-hidden="true"
          title="Foto de equipo"
        >
          ◫
        </span>
      )}

      {isDuplicated && !isDimmedByFilter && (
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
