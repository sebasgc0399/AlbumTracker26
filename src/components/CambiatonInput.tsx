import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { normalizeStickerId } from '@/utils/normalizeStickerId';

interface CambiatonInputProps {
  onSubmit: (normalizedId: string) => void;
  disabled?: boolean;
}

export interface CambiatonInputHandle {
  focus: () => void;
}

function CambiatonInput(
  { onSubmit, disabled }: CambiatonInputProps,
  ref: React.Ref<CambiatonInputHandle>,
) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeStickerId(value);
    if (normalized.length === 0) return;
    onSubmit(normalized);
    setValue('');
    // requestAnimationFrame is more reliable than setTimeout(0) on Safari mobile
    // for re-focusing inputs after submit (avoids losing the soft keyboard).
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={disabled}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck={false}
        inputMode="text"
        placeholder="ID (ej. COL7)"
        aria-label="ID de lámina"
        className="h-16 w-full rounded-lg border-2 border-border bg-background px-4 text-2xl font-bold uppercase tracking-wider tabular-nums text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none disabled:opacity-50"
      />
    </form>
  );
}

export default forwardRef(CambiatonInput);
