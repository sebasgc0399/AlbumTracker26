import { useEffect, useState } from 'react';
import type { BatchMutation } from '@/hooks/useBatchSession';

const VISIBLE_MS = 5_000;

interface UndoToastProps {
  mutation: BatchMutation | null;
  onUndo: () => void;
}

export default function UndoToast({ mutation, onUndo }: UndoToastProps) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!mutation) {
      setHidden(false);
      return;
    }
    setHidden(false);
    const id = window.setTimeout(() => setHidden(true), VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, [mutation]);

  if (!mutation || hidden) return null;

  const isDuplicate = mutation.prevCount > 0;
  const label = isDuplicate
    ? `+ ${mutation.stickerId} (rep. ${mutation.newCount})`
    : `+ ${mutation.stickerId}`;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex justify-center px-4"
    >
      <div className="pointer-events-auto relative flex items-center gap-3 overflow-hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg">
        <span className="font-mono tabular-nums">{label}</span>
        <button
          type="button"
          onClick={onUndo}
          className="min-h-11 min-w-11 rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-bold uppercase tracking-wide transition-colors hover:bg-primary-foreground/30 active:bg-primary-foreground/40"
        >
          Deshacer
        </button>
        <span
          key={mutation.ts}
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary-foreground/40"
          style={{ animation: `at26-countdown ${VISIBLE_MS}ms linear forwards` }}
        />
      </div>
    </div>
  );
}
