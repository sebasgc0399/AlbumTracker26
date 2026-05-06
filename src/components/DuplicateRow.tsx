import type { DuplicateEntry } from '@/db/hooks';
import { setOwnedCount } from '@/db/mutations';
import { MAX_DUPLICATE_COUNT } from '@/utils/constants';
import QuantityStepper from './QuantityStepper';

interface DuplicateRowProps {
  entry: DuplicateEntry;
}

export default function DuplicateRow({ entry }: DuplicateRowProps) {
  const { sticker, count } = entry;

  return (
    <li className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2">
      <span className="shrink-0 rounded bg-background px-2 py-0.5 font-mono text-xs font-bold tabular-nums text-foreground">
        {sticker.id}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
        {sticker.name}
      </span>
      <QuantityStepper
        compact
        value={count}
        onChange={(next) => {
          void setOwnedCount(sticker.id, next);
        }}
        min={1}
        max={MAX_DUPLICATE_COUNT}
      />
    </li>
  );
}
