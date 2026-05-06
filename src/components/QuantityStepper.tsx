import { useCallback, useEffect, useRef } from 'react';

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}

const LONG_PRESS_DELAY = 500;
const REPEAT_INTERVAL = 100;

export default function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 99,
}: QuantityStepperProps) {
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  // Refs needed because the long-press timers close over the value at press start.
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const apply = useCallback(
    (delta: number) => {
      const current = valueRef.current;
      const next = Math.min(max, Math.max(min, current + delta));
      if (next !== current) {
        onChangeRef.current(next);
      }
    },
    [min, max],
  );

  const startPress = useCallback(
    (delta: number) => {
      apply(delta);
      clearTimers();
      timeoutRef.current = window.setTimeout(() => {
        intervalRef.current = window.setInterval(() => {
          apply(delta);
        }, REPEAT_INTERVAL);
      }, LONG_PRESS_DELAY);
    },
    [apply, clearTimers],
  );

  const decDisabled = value <= min;
  const incDisabled = value >= max;

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        aria-label="Disminuir cantidad"
        disabled={decDisabled}
        onPointerDown={() => startPress(-1)}
        onPointerUp={clearTimers}
        onPointerLeave={clearTimers}
        onPointerCancel={clearTimers}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted text-2xl font-bold text-foreground transition-colors active:bg-border disabled:cursor-not-allowed disabled:opacity-40"
      >
        -
      </button>

      <span
        className="min-w-[3rem] text-center text-3xl font-bold tabular-nums text-foreground"
        aria-live="polite"
      >
        {value}
      </span>

      <button
        type="button"
        aria-label="Aumentar cantidad"
        disabled={incDisabled}
        onPointerDown={() => startPress(1)}
        onPointerUp={clearTimers}
        onPointerLeave={clearTimers}
        onPointerCancel={clearTimers}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground transition-colors active:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
