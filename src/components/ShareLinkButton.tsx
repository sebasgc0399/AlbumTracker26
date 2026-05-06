import { useEffect, useState } from 'react';
import { useTradeableLists } from '@/db/hooks';
import { encodeTradeList } from '@/utils/encodeTradeList';

type Toast = { message: string; key: number };

function isAbortError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: unknown }).name === 'AbortError'
  );
}

export default function ShareLinkButton() {
  const lists = useTradeableLists();
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const isLoading = lists === undefined;
  const isEmpty =
    !isLoading && lists.duplicates.length === 0 && lists.missing.length === 0;

  async function handleClick() {
    if (!lists) return;

    const result = encodeTradeList(lists);

    if (result.exceedsLimit) {
      setToast({
        message: 'Lista muy larga, achicá manualmente',
        key: Date.now(),
      });
      return;
    }

    const url = `${window.location.origin}/share#d=${result.hash}`;

    const canShare =
      typeof navigator.canShare === 'function' && navigator.canShare({ url });
    if (canShare && typeof navigator.share === 'function') {
      try {
        await navigator.share({ url });
      } catch (err) {
        if (isAbortError(err)) return;
        await fallbackCopy(url);
      }
      return;
    }
    await fallbackCopy(url);
  }

  async function fallbackCopy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setToast({ message: 'Link copiado', key: Date.now() });
    } catch {
      setToast({
        message: 'No se pudo copiar al portapapeles',
        key: Date.now(),
      });
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading || isEmpty}
        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span aria-hidden="true">🔗</span>
        <span>{isLoading ? 'Cargando…' : 'Compartir link'}</span>
      </button>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background shadow-lg"
        >
          {toast.message}
        </div>
      ) : null}
    </>
  );
}
