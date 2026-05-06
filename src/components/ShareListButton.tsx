import { useEffect, useMemo, useState } from 'react';
import { useTradeableLists } from '@/db/hooks';
import { useLocalStoragePref } from '@/hooks/useLocalStoragePref';
import { formatTradeList } from '@/utils/formatTradeList';

type Toast = { message: string; key: number };

function isAbortError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: unknown }).name === 'AbortError'
  );
}

export default function ShareListButton() {
  const lists = useTradeableLists();
  const [includeCC, setIncludeCC] = useLocalStoragePref<boolean>(
    'share.includeCC',
    false,
  );
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const text = useMemo(() => {
    if (!lists) return '';
    return formatTradeList(lists, { includeCC });
  }, [lists, includeCC]);

  const isLoading = lists === undefined;
  const isEmpty = !isLoading && text.length === 0;

  async function handleClick() {
    if (!lists) return;
    if (text.length === 0) {
      setToast({ message: 'No hay nada para compartir', key: Date.now() });
      return;
    }

    const canShare =
      typeof navigator.canShare === 'function' && navigator.canShare({ text });
    if (canShare && typeof navigator.share === 'function') {
      try {
        await navigator.share({ text });
      } catch (err) {
        if (isAbortError(err)) return;
        await fallbackCopy(text);
      }
      return;
    }
    await fallbackCopy(text);
  }

  async function fallbackCopy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setToast({ message: 'Copiado al portapapeles', key: Date.now() });
    } catch {
      setToast({
        message: 'No se pudo copiar al portapapeles',
        key: Date.now(),
      });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading || isEmpty}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span aria-hidden="true">💬</span>
        <span>{isLoading ? 'Cargando…' : 'Compartir lista'}</span>
      </button>

      <label className="inline-flex items-center gap-2 text-xs text-foreground">
        <input
          type="checkbox"
          checked={includeCC}
          onChange={(e) => setIncludeCC(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        Incluir Coca-Cola
      </label>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background shadow-lg"
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
