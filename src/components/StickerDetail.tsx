import { useEffect, useState } from 'react';
import type { CollectionEntry, Sticker } from '@/db/database';
import { setOwnedCount } from '@/db/mutations';
import QuantityStepper from './QuantityStepper';

interface StickerDetailProps {
  sticker: Sticker;
  entry: CollectionEntry | undefined;
  onClose: () => void;
}

export default function StickerDetail({ sticker, entry, onClose }: StickerDetailProps) {
  const count = entry?.count ?? 0;
  // Mounted state drives the slide-in: render at translate-y-full, then transition to 0.
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    setIsVisible(false);
    window.setTimeout(onClose, 200);
  }

  function handleChange(next: number) {
    void setOwnedCount(sticker.id, next);
  }

  function handleMarkMissing() {
    void setOwnedCount(sticker.id, 0);
    handleClose();
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        className={`absolute inset-x-0 bottom-0 rounded-t-2xl bg-background p-4 pb-8 shadow-xl transition-transform duration-200 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div
          className="mx-auto mb-4 h-1 w-12 rounded-full bg-muted"
          aria-hidden="true"
        />

        <div className="mb-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {sticker.id} · {sticker.teamName}
          </p>
          <h2 className="mt-1 text-xl font-bold text-foreground">
            {sticker.name}
          </h2>
        </div>

        <div className="mb-6">
          <p className="mb-2 text-center text-xs uppercase tracking-wide text-muted-foreground">
            Cantidad
          </p>
          <QuantityStepper value={count} onChange={handleChange} />
          {count > 1 && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {count - 1} {count - 1 === 1 ? 'repetida' : 'repetidas'}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleMarkMissing}
            className="w-full rounded-lg border border-border bg-background py-3 text-sm font-semibold text-muted-foreground transition-colors active:bg-muted"
          >
            No la tengo
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors active:opacity-80"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
