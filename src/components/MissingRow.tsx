import type { Sticker } from '@/db/database';

interface MissingRowProps {
  sticker: Sticker;
}

export default function MissingRow({ sticker }: MissingRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
      <span className="shrink-0 rounded bg-background px-2 py-0.5 font-mono text-xs font-bold tabular-nums text-foreground">
        {sticker.id}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
        {sticker.name}
      </span>
    </li>
  );
}
