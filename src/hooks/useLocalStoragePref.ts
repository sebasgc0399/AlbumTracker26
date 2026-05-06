import { useCallback, useEffect, useState } from 'react';

const PREFIX = 'at26.pref.';

function readValue<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function useLocalStoragePref<T>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  const [value, setValueState] = useState<T>(() => readValue(key, defaultValue));

  const setValue = useCallback(
    (next: T) => {
      setValueState(next);
      try {
        window.localStorage.setItem(PREFIX + key, JSON.stringify(next));
      } catch {
        // Storage cuota llena o modo incógnito con cuota cero — ignorar
      }
    },
    [key],
  );

  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.key !== PREFIX + key) return;
      if (event.newValue === null) {
        setValueState(defaultValue);
        return;
      }
      try {
        setValueState(JSON.parse(event.newValue) as T);
      } catch {
        // Ignorar valores corruptos en otra tab
      }
    }
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, defaultValue]);

  return [value, setValue];
}
