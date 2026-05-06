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
  const isMuseum = sticker.section === 'museum';
  const isCocaCola = sticker.section === 'cocacola';

  // En "missing-mode", las láminas que NO faltan (ya las tengo) se atenúan
  // para mantener el contexto del grid completo, pero foco visual en lo faltante.
  const isDimmedByFilter = variant === 'missing-mode' && isOwned;

  const stateClasses = isDimmedByFilter
    ? 'bg-muted/40 text-muted-foreground/60'
    : isOwned
      ? 'bg-primary text-primary-foreground'
      : isCocaCola
        ? 'bg-accent-cocacola/10 text-foreground'
        : isMuseum
          ? 'bg-accent-museum/10 text-foreground'
          : 'bg-muted text-muted-foreground';

  // Foils get a thicker gold ring; team photos get a dashed border to differentiate.
  // En missing-mode atenuado forzamos un borde punteado para refuerzo visual.
  const typeClasses = isDimmedByFilter
    ? 'border border-dashed border-border opacity-50'
    : isFoil
      ? 'ring-2 ring-foil ring-offset-1 ring-offset-background'
      : isTeamPhoto
        ? 'border-2 border-dashed border-muted-foreground/60'
        : isCocaCola
          ? 'ring-1 ring-accent-cocacola/40'
          : isMuseum
            ? 'ring-1 ring-accent-museum/40'
            : 'border border-border';

  // Display tal cual aparece impreso en el álbum: "ARG 1", "FWC 10", "CC 14",
  // y para la lámina especial "00" (Panini) sin prefijo, solo "00".
  // Antes mostrábamos `position` que era "1..N" relativo a la sección — eso
  // funcionaba en grids de equipo pero rompía en museo (chips decían 1..11
  // mientras el álbum dice FWC10..FWC20).
  const showsTeamPrefix = sticker.team !== '' && sticker.id.startsWith(sticker.team);
  const displayNumber = showsTeamPrefix
    ? sticker.id.slice(sticker.team.length)
    : sticker.id;

  return (
    <button
      type="button"
      onClick={() => onTap(sticker)}
      aria-label={`Lámina ${sticker.id}${isOwned ? `, tengo ${count}` : ', no tengo'}`}
      aria-pressed={isOwned}
      className={`relative flex aspect-square items-center justify-center rounded-lg p-1 text-center transition-colors active:scale-95 ${stateClasses} ${typeClasses}`}
    >
      <div className="flex flex-col items-center justify-center leading-tight">
        {showsTeamPrefix && (
          <span className="font-mono text-[0.6rem] font-medium opacity-70">{sticker.team}</span>
        )}
        <span className="font-mono text-lg font-bold tabular-nums">{displayNumber}</span>
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
