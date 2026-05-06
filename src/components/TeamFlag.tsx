import FlagIcon from './FlagIcon';
import type { TeamFlagInfo } from '@/utils/flagFor';

interface TeamFlagProps {
  info: TeamFlagInfo;
  alt: string;
  className?: string;
}

export default function TeamFlag({ info, alt, className }: TeamFlagProps) {
  if (info.kind === 'flag') {
    return <FlagIcon code={info.code} alt={alt} className={className} />;
  }

  const tileText =
    info.kind === 'cocacola' ? 'CC' : info.kind === 'fifa' ? 'FIFA' : '·';
  const tileColor =
    info.kind === 'cocacola'
      ? 'bg-destructive text-destructive-foreground'
      : info.kind === 'fifa'
        ? 'bg-warning text-warning-foreground'
        : 'bg-muted text-muted-foreground';

  return (
    <span
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={`inline-flex items-center justify-center rounded-sm font-mono text-[0.625em] font-bold uppercase tracking-tight shadow-sm ${tileColor} ${className ?? ''}`}
      style={{ aspectRatio: '4 / 3' }}
    >
      {tileText}
    </span>
  );
}
