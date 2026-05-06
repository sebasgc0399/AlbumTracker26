import { useState } from 'react';

interface FlagIconProps {
  code: string;
  alt: string;
  className?: string;
}

export default function FlagIcon({ code, alt, className }: FlagIconProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`inline-flex items-center justify-center rounded-sm bg-muted font-mono text-[0.625em] uppercase tracking-tight text-muted-foreground ${className ?? ''}`}
      >
        {code.split('-')[0]}
      </span>
    );
  }

  return (
    <img
      src={`/flags/${code}.svg`}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`inline-block rounded-sm object-cover ${className ?? ''}`}
      style={{ aspectRatio: '4 / 3' }}
    />
  );
}
