import type { ReactNode } from 'react';

interface TeamGroupHeaderProps {
  flagSlot: ReactNode;
  name: string;
  countLabel: string;
}

export default function TeamGroupHeader({
  flagSlot,
  name,
  countLabel,
}: TeamGroupHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0">{flagSlot}</span>
      <h2 className="flex-1 truncate text-base font-semibold text-foreground">
        {name}
      </h2>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {countLabel}
      </span>
    </div>
  );
}
