import { useEffect, useState } from 'react';
import type { Sticker } from '@/db/database';
import { feedback, type FeedbackKind } from '@/lib/feedback';

export type CambiatonState = 'serves' | 'have' | 'duplicate' | 'invalid';

const STATE_TO_FEEDBACK: Record<CambiatonState, FeedbackKind> = {
  serves: 'newOwned',
  have: 'tap',
  duplicate: 'duplicate',
  invalid: 'error',
};

interface CambiatonResultProps {
  state: CambiatonState;
  sticker?: Sticker;
  inputId: string;
  onAcceptCambio?: () => void;
  onGiveDuplicate?: () => void;
  onClose?: () => void;
}

interface StateConfig {
  bg: string;
  text: string;
  icon: string;
  label: string;
}

const STATE_CONFIG: Record<CambiatonState, StateConfig> = {
  serves: {
    bg: 'bg-success',
    text: 'text-success-foreground',
    icon: '🟢',
    label: 'ME SIRVE',
  },
  have: {
    bg: 'bg-destructive',
    text: 'text-destructive-foreground',
    icon: '🔴',
    label: 'YA LA TENGO',
  },
  duplicate: {
    bg: 'bg-warning',
    text: 'text-warning-foreground',
    icon: '🟡',
    label: 'TENGO REPETIDA',
  },
  invalid: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    icon: '⚪',
    label: 'ID NO EXISTE',
  },
};

export default function CambiatonResult({
  state,
  sticker,
  inputId,
  onAcceptCambio,
  onGiveDuplicate,
  onClose,
}: CambiatonResultProps) {
  const config = STATE_CONFIG[state];
  // Slide-in animation: render at translate-y-full, then transition to 0.
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    feedback({ kind: STATE_TO_FEEDBACK[state] });
  }, [state]);

  const displayId = sticker?.id ?? inputId;
  const displayName = sticker?.name;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative h-[200px] w-full overflow-hidden rounded-lg shadow-md transition-transform duration-200 ease-out ${config.bg} ${config.text} ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-lg font-bold transition-colors hover:bg-black/20"
        >
          ×
        </button>
      )}

      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-3 text-center">
        <span className="text-4xl leading-none" aria-hidden="true">
          {config.icon}
        </span>
        <p className="text-lg font-bold uppercase tracking-wide">
          {config.label}
        </p>
        <p className="font-mono text-2xl font-bold tabular-nums">
          {displayId}
        </p>
        {displayName && (
          <p className="text-sm opacity-90">{displayName}</p>
        )}

        {state === 'serves' && onAcceptCambio && (
          <button
            type="button"
            onClick={onAcceptCambio}
            className="mt-1 rounded-lg bg-black/20 px-4 py-2 text-sm font-semibold transition-colors hover:bg-black/30 active:bg-black/40"
          >
            Aceptar cambio
          </button>
        )}

        {state === 'duplicate' && onGiveDuplicate && (
          <button
            type="button"
            onClick={onGiveDuplicate}
            className="mt-1 rounded-lg bg-black/20 px-4 py-2 text-sm font-semibold transition-colors hover:bg-black/30 active:bg-black/40"
          >
            Entregar repetida
          </button>
        )}
      </div>
    </div>
  );
}
