import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface TeamGroupHeaderProps {
  flagSlot: ReactNode;
  name: string;
  countLabel: string;
  onToggle?: () => void;
  isCollapsed?: boolean;
}

export default function TeamGroupHeader({
  flagSlot,
  name,
  countLabel,
  onToggle,
  isCollapsed,
}: TeamGroupHeaderProps) {
  const content = (
    <>
      <span className="shrink-0">{flagSlot}</span>
      <h2 className="flex-1 truncate text-base font-semibold text-foreground">
        {name}
      </h2>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {countLabel}
      </span>
      {onToggle ? (
        <span aria-hidden="true" className="shrink-0 text-muted-foreground">
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </span>
      ) : null}
    </>
  );

  if (onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!isCollapsed}
        className="-mx-1 flex w-[calc(100%+0.5rem)] items-center gap-2 rounded-md px-1 py-1 text-left transition-colors active:bg-muted"
      >
        {content}
      </button>
    );
  }

  return <div className="flex items-center gap-2">{content}</div>;
}
