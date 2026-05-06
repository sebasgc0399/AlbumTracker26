export type FilterValue = 'all' | 'missing' | 'duplicates';

interface FilterChipsProps {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
  /**
   * Distancia desde el top en píxeles para el sticky positioning.
   * Debe coincidir con la altura del header sticky existente.
   */
  topOffset: number;
}

interface ChipDef {
  value: FilterValue;
  emoji: string;
  label: string;
  ariaLabel: string;
}

const CHIPS: ChipDef[] = [
  { value: 'all', emoji: '🔘', label: 'Todas', ariaLabel: 'Mostrar todas las láminas' },
  { value: 'missing', emoji: '❌', label: 'Me faltan', ariaLabel: 'Mostrar solo láminas faltantes' },
  { value: 'duplicates', emoji: '🔄', label: 'Repetidas', ariaLabel: 'Mostrar solo láminas repetidas' },
];

export default function FilterChips({ value, onChange, topOffset }: FilterChipsProps) {
  return (
    <div
      className="sticky z-10 border-b border-border bg-background/95 px-4 py-2 backdrop-blur"
      style={{ top: `${topOffset}px` }}
      role="tablist"
      aria-label="Filtro de láminas"
    >
      <div className="mx-auto flex max-w-md gap-2">
        {CHIPS.map((chip) => {
          const isActive = chip.value === value;
          return (
            <button
              key={chip.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={chip.ariaLabel}
              onClick={() => onChange(chip.value)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-full border px-2 py-1.5 text-xs font-medium transition-colors active:scale-95 ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-muted text-muted-foreground'
              }`}
            >
              <span aria-hidden="true">{chip.emoji}</span>
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
