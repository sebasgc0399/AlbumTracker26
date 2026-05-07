import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const OFFLINE_VISIBLE_MS = 3_000;
// Polling de updates cada 1h para sesiones largas. La detección por defecto
// solo dispara al cargar la app y al volver del background, así que si el
// usuario deja la PWA abierta horas y deployamos, no se entera hasta que
// pierda foco. 1h es suficiente para esta app (sesiones cortas, deploys raros).
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      window.setInterval(() => {
        void registration.update();
      }, UPDATE_CHECK_INTERVAL_MS);
    },
  });

  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!offlineReady) return;
    const id = window.setTimeout(() => setOfflineReady(false), OFFLINE_VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, [offlineReady, setOfflineReady]);

  if (offlineReady && !needRefresh) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4"
      >
        <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-success px-4 py-2 text-sm font-semibold text-success-foreground shadow-lg">
          <span>Listo para usar offline</span>
        </div>
      </div>
    );
  }

  if (!needRefresh) return null;

  function handleUpdate() {
    setUpdating(true);
    void updateServiceWorker(true);
  }

  function handleDismiss() {
    setNeedRefresh(false);
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-3"
    >
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border border-border bg-foreground px-4 py-3 text-background shadow-2xl">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-background/60">
            Actualización
          </p>
          <p className="truncate text-sm font-semibold">
            Nueva versión disponible. Tocá para actualizar.
          </p>
        </div>
        <button
          type="button"
          onClick={handleUpdate}
          disabled={updating}
          className="min-h-11 shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wide text-primary-foreground transition-colors active:bg-primary/80 disabled:opacity-60"
        >
          {updating ? 'Actualizando' : 'Actualizar'}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Posponer actualización"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-background/60 transition-colors active:bg-background/10"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            ×
          </span>
        </button>
      </div>
    </div>
  );
}
