import type { BatchSummary as BatchSummaryData } from '@/hooks/useBatchSession';

const VISIBLE_MS = 10_000;

interface BatchSummaryProps {
  summary: BatchSummaryData | null;
  onUndoAll: () => void;
  onDismiss: () => void;
}

function summaryText(summary: BatchSummaryData): string {
  const { newCount, duplicateCount } = summary;
  const parts: string[] = [];
  if (newCount > 0) parts.push(`${newCount} nueva${newCount === 1 ? '' : 's'}`);
  if (duplicateCount > 0) parts.push(`${duplicateCount} repetida${duplicateCount === 1 ? '' : 's'}`);
  if (parts.length === 0) return 'Sobre cerrado';
  return parts.join(', ');
}

export default function BatchSummary({ summary, onUndoAll, onDismiss }: BatchSummaryProps) {
  if (!summary || summary.totalTaps === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-16 z-40 flex justify-center px-3 pb-2"
    >
      <div className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-foreground text-background shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-background/60">
              Sobre cerrado
            </p>
            <p className="truncate text-sm font-semibold">{summaryText(summary)}</p>
          </div>
          <button
            type="button"
            onClick={onUndoAll}
            className="min-h-11 shrink-0 rounded-full bg-warning px-4 py-2 text-xs font-bold uppercase tracking-wide text-warning-foreground transition-colors active:bg-warning/80"
          >
            Deshacer todo
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Cerrar resumen"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-background/60 transition-colors active:bg-background/10"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ×
            </span>
          </button>
        </div>
        <span
          key={summary.totalTaps}
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-warning/60"
          style={{ animation: `at26-countdown ${VISIBLE_MS}ms linear forwards` }}
        />
      </div>
    </div>
  );
}
