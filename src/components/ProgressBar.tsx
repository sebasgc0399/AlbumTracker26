import { useEffect, useState } from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
}

export default function ProgressBar({ value, max, label }: ProgressBarProps) {
  const target = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Defer to next frame so the browser paints width:0 first and animates to target.
    const id = requestAnimationFrame(() => setWidth(target));
    return () => cancelAnimationFrame(id);
  }, [target]);

  return (
    <div className="w-full">
      {label && (
        <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
