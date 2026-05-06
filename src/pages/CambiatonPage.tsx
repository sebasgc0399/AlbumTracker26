import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/db/database';
import {
  decrementCount,
  incrementCount,
  setOwnedCount,
} from '@/db/mutations';
import CambiatonInput, {
  type CambiatonInputHandle,
} from '@/components/CambiatonInput';
import CambiatonResult, {
  type CambiatonState,
} from '@/components/CambiatonResult';
import CambiatonHistory, {
  type HistoryEntry,
} from '@/components/CambiatonHistory';

const HISTORY_CAP = 10;

export default function CambiatonPage() {
  const navigate = useNavigate();
  const inputRef = useRef<CambiatonInputHandle>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentResult, setCurrentResult] = useState<HistoryEntry | null>(
    null,
  );
  const [showExitSummary, setShowExitSummary] = useState(false);

  async function handleSubmit(normalizedId: string) {
    const sticker = await db.stickers.get(normalizedId);

    let entry: HistoryEntry;

    if (!sticker) {
      entry = {
        stickerId: normalizedId,
        state: 'invalid',
        timestamp: Date.now(),
      };
    } else {
      const collectionEntry = await db.collection.get(normalizedId);
      const count = collectionEntry?.count ?? 0;

      let state: CambiatonState;
      if (count === 0) state = 'serves';
      else if (count === 1) state = 'have';
      else state = 'duplicate';

      entry = {
        stickerId: sticker.id,
        state,
        stickerName: sticker.name,
        timestamp: Date.now(),
      };
    }

    setHistory((prev) => {
      const next = [entry, ...prev];
      return next.slice(0, HISTORY_CAP);
    });
    setCurrentResult(entry);
  }

  function updateEntryAction(
    target: HistoryEntry,
    action: 'accepted' | 'gave' | undefined,
  ) {
    setHistory((prev) =>
      prev.map((h) =>
        h.timestamp === target.timestamp && h.stickerId === target.stickerId
          ? { ...h, action }
          : h,
      ),
    );
  }

  async function handleAcceptCambio() {
    if (!currentResult || currentResult.state !== 'serves') return;
    await setOwnedCount(currentResult.stickerId, 1);
    updateEntryAction(currentResult, 'accepted');
    setCurrentResult(null);
    inputRef.current?.focus();
  }

  async function handleGiveDuplicate() {
    if (!currentResult || currentResult.state !== 'duplicate') return;
    await decrementCount(currentResult.stickerId);
    updateEntryAction(currentResult, 'gave');
    setCurrentResult(null);
    inputRef.current?.focus();
  }

  function handleCloseResult() {
    setCurrentResult(null);
    inputRef.current?.focus();
  }

  async function handleUndo(entry: HistoryEntry) {
    if (!entry.action) return;
    if (entry.action === 'accepted') {
      await setOwnedCount(entry.stickerId, 0);
    } else if (entry.action === 'gave') {
      await incrementCount(entry.stickerId);
    }
    updateEntryAction(entry, undefined);
    inputRef.current?.focus();
  }

  function handleExitClick() {
    setShowExitSummary(true);
  }

  function handleConfirmExit() {
    navigate('/');
  }

  function handleCancelExit() {
    setShowExitSummary(false);
    inputRef.current?.focus();
  }

  const evaluatedCount = history.length;
  const acceptedCount = history.filter((h) => h.action === 'accepted').length;
  const gaveCount = history.filter((h) => h.action === 'gave').length;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-primary">Modo Cambiaton</h1>
            <p className="text-[0.7rem] text-muted-foreground">
              Tipeá un ID y presioná Enter
            </p>
          </div>
          <button
            type="button"
            onClick={handleExitClick}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition-colors active:bg-muted"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="sticky top-[60px] z-[5] border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <CambiatonInput ref={inputRef} onSubmit={handleSubmit} />
        </div>
      </div>

      {currentResult && (
        <div className="border-b border-border px-4 py-3">
          <div className="mx-auto max-w-md">
            <CambiatonResult
              key={`${currentResult.stickerId}-${currentResult.timestamp}`}
              state={currentResult.state}
              sticker={
                currentResult.state === 'invalid'
                  ? undefined
                  : {
                      id: currentResult.stickerId,
                      number: currentResult.stickerId,
                      name: currentResult.stickerName ?? '',
                      team: '',
                      teamName: '',
                      group: '',
                      section: '',
                      type: '',
                      position: 0,
                    }
              }
              inputId={currentResult.stickerId}
              onAcceptCambio={
                currentResult.state === 'serves'
                  ? handleAcceptCambio
                  : undefined
              }
              onGiveDuplicate={
                currentResult.state === 'duplicate'
                  ? handleGiveDuplicate
                  : undefined
              }
              onClose={handleCloseResult}
            />
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-1 py-2">
        <h2 className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Últimas evaluaciones
        </h2>
        <CambiatonHistory entries={history} onUndo={handleUndo} />
      </main>

      {showExitSummary && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-background p-5 shadow-xl">
            <h2 className="mb-3 text-lg font-bold text-foreground">
              Resumen del Cambiaton
            </h2>
            <p className="mb-1 text-sm text-foreground">
              Evaluaste <strong>{evaluatedCount}</strong> IDs
            </p>
            <p className="mb-1 text-sm text-foreground">
              Aceptaste <strong>{acceptedCount}</strong> cambios
            </p>
            <p className="mb-5 text-sm text-foreground">
              Entregaste <strong>{gaveCount}</strong> repetidas
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirmExit}
                className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors active:opacity-80"
              >
                Volver a inicio
              </button>
              <button
                type="button"
                onClick={handleCancelExit}
                className="w-full rounded-lg border border-border bg-background py-3 text-sm font-semibold text-muted-foreground transition-colors active:bg-muted"
              >
                Seguir aquí
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
