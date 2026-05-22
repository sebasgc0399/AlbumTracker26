import { useCallback, useEffect, useState } from 'react';

const PREFIX = 'at26.pref.';
// CustomEvent para sincronizar instancias del hook dentro de la MISMA tab.
// El StorageEvent nativo solo dispara cross-tab — sin esto, componentes
// hermanos no se enteran cuando uno cambia la pref.
const SAME_TAB_EVENT = 'at26.pref.changed';

interface PrefChangeDetail {
  key: string;
  raw: string | null;
}

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
      let raw: string | null;
      try {
        raw = JSON.stringify(next);
        window.localStorage.setItem(PREFIX + key, raw);
      } catch {
        // Storage cuota llena o modo incógnito con cuota cero — ignorar
        return;
      }
      window.dispatchEvent(
        new CustomEvent<PrefChangeDetail>(SAME_TAB_EVENT, {
          detail: { key, raw },
        }),
      );
    },
    [key],
  );

  useEffect(() => {
    function applyRaw(raw: string | null) {
      if (raw === null) {
        setValueState(defaultValue);
        return;
      }
      try {
        setValueState(JSON.parse(raw) as T);
      } catch {
        // Ignorar valores corruptos
      }
    }
    function handleStorageChange(event: StorageEvent) {
      if (event.key !== PREFIX + key) return;
      applyRaw(event.newValue);
    }
    function handleSameTab(event: Event) {
      const detail = (event as CustomEvent<PrefChangeDetail>).detail;
      if (!detail || detail.key !== key) return;
      applyRaw(detail.raw);
    }
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(SAME_TAB_EVENT, handleSameTab);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(SAME_TAB_EVENT, handleSameTab);
    };
  }, [key, defaultValue]);

  return [value, setValue];
}
