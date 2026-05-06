import { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useTradeableLists } from '@/db/hooks';
import { useLocalStoragePref } from '@/hooks/useLocalStoragePref';
import { renderTradeImage } from '@/utils/renderTradeImage';

type Toast = { message: string; key: number };

function isAbortError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: unknown }).name === 'AbortError'
  );
}

function todayFilename(): string {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `cambio-busco-${ymd}.png`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ShareImageButton() {
  const lists = useTradeableLists();
  const [includeCC] = useLocalStoragePref<boolean>('share.includeCC', false);
  const [isRendering, setIsRendering] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const isLoading = lists === undefined;

  const isEmpty = useMemo(() => {
    if (!lists) return true;
    const dup = lists.duplicates.filter(
      (e) => e.extra >= 1 && (includeCC || e.sticker.team !== 'CC'),
    );
    const miss = lists.missing.filter(
      (s) => includeCC || s.team !== 'CC',
    );
    return dup.length === 0 && miss.length === 0;
  }, [lists, includeCC]);

  async function handleClick() {
    if (!lists || isRendering) return;
    if (isEmpty) {
      setToast({ message: 'No hay nada para compartir', key: Date.now() });
      return;
    }

    setIsRendering(true);
    try {
      const blob = await renderTradeImage(lists);
      const filename = todayFilename();
      const file = new File([blob], filename, { type: 'image/png' });

      const canShareFiles =
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] });

      if (canShareFiles && typeof navigator.share === 'function') {
        try {
          await navigator.share({ files: [file] });
          setToast({ message: 'Imagen compartida', key: Date.now() });
        } catch (err) {
          if (isAbortError(err)) return;
          downloadBlob(blob, filename);
          setToast({ message: 'Imagen descargada', key: Date.now() });
        }
      } else {
        downloadBlob(blob, filename);
        setToast({ message: 'Imagen descargada', key: Date.now() });
      }
    } catch {
      setToast({ message: 'No se pudo generar la imagen', key: Date.now() });
    } finally {
      setIsRendering(false);
    }
  }

  const disabled = isLoading || isEmpty || isRendering;
  const label = isLoading ? 'Cargando…' : isRendering ? 'Generando…' : 'Imagen';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ImageIcon aria-hidden="true" className="h-4 w-4" />
        <span>{label}</span>
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
