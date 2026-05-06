import { useCallback, useState } from 'react';

const PREFIX = 'at26.session.';

function readValue<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = window.sessionStorage.getItem(PREFIX + key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function useSessionStoragePref<T>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  const [value, setValueState] = useState<T>(() => readValue(key, defaultValue));

  const setValue = useCallback(
    (next: T) => {
      setValueState(next);
      try {
        window.sessionStorage.setItem(PREFIX + key, JSON.stringify(next));
      } catch {
        // Storage cuota llena o modo incógnito con cuota cero — ignorar
      }
    },
    [key],
  );

  return [value, setValue];
}
