import { Check, X, Copy, HelpCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CambiatonState } from './CambiatonResult';

export interface HistoryEntry {
  stickerId: string;
  state: CambiatonState;
  stickerName?: string;
  action?: 'accepted' | 'gave';
  timestamp: number;
}

interface CambiatonHistoryProps {
  entries: HistoryEntry[];
  onUndo: (entry: HistoryEntry) => void;
}

const STATE_ICONS: Record<CambiatonState, { Icon: LucideIcon; color: string }> =
  {
    serves: { Icon: Check, color: 'text-success' },
    have: { Icon: X, color: 'text-destructive' },
    duplicate: { Icon: Copy, color: 'text-warning' },
    invalid: { Icon: HelpCircle, color: 'text-muted-foreground' },
  };

function formatRelativeTime(timestamp: number, now: number): string {
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (diffSec < 60) return `hace ${diffSec} seg`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  return `hace ${diffHr} h`;
}

export default function CambiatonHistory({
  entries,
  onUndo,
}: CambiatonHistoryProps) {
  if (entries.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-sm text-muted-foreground">
        Sin evaluaciones todavía.
      </p>
    );
  }

  const now = Date.now();

  return (
    <ul className="flex flex-col divide-y divide-border" aria-label="Historial">
      {entries.map((entry, idx) => (
        <li
          key={`${entry.stickerId}-${entry.timestamp}-${idx}`}
          className="flex h-16 items-center gap-3 px-3"
        >
          {(() => {
            const { Icon, color } = STATE_ICONS[entry.state];
            return (
              <Icon
                aria-hidden="true"
                strokeWidth={2.5}
                className={`h-5 w-5 shrink-0 ${color}`}
              />
            );
          })()}

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-base font-bold tabular-nums text-foreground">
                {entry.stickerId}
              </span>
              {entry.stickerName && (
                <span className="truncate text-xs text-muted-foreground">
                  {entry.stickerName}
                </span>
              )}
            </div>
            <p className="text-[0.7rem] text-muted-foreground">
              {formatRelativeTime(entry.timestamp, now)}
            </p>
          </div>

          {entry.action && (
            <span
              className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${
                entry.action === 'accepted'
                  ? 'bg-success text-success-foreground'
                  : 'bg-warning text-warning-foreground'
              }`}
            >
              {entry.action === 'accepted' ? 'Aceptada' : 'Entregada'}
            </span>
          )}

          {entry.action && (
            <button
              type="button"
              onClick={() => onUndo(entry)}
              className="rounded-md border border-border bg-background px-2 py-1 text-[0.7rem] font-medium text-foreground transition-colors active:bg-muted"
            >
              Deshacer
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
