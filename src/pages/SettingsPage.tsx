import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStoredTheme, setTheme, type Theme } from '@/lib/theme';
import { getSoundEnabled, setSoundEnabled } from '@/lib/feedback';
import {
  exportCollection,
  downloadBackup,
  parseBackup,
  importCollection,
  markAllOwned,
  resetCollection,
  type BackupFile,
} from '@/lib/safety';
import InfoToast, { type InfoToastMessage } from '@/components/InfoToast';

const THEME_OPTIONS: { value: Theme; label: string; hint: string }[] = [
  { value: 'light', label: 'Claro', hint: 'Fondo blanco siempre' },
  { value: 'dark', label: 'Oscuro', hint: 'Fondo oscuro siempre' },
  { value: 'system', label: 'Sistema', hint: 'Sigue al sistema operativo' },
];

interface PendingImport {
  backup: BackupFile;
  totalEntries: number;
  ownedEntries: number;
}

type BulkAction = 'mark-all' | 'reset';

export default function SettingsPage() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [sound, setSoundState] = useState<boolean>(false);
  const [toast, setToast] = useState<InfoToastMessage | null>(null);
  const [pending, setPending] = useState<PendingImport | null>(null);
  const [pendingBulk, setPendingBulk] = useState<BulkAction | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toastIdRef = useRef(0);

  useEffect(() => {
    setThemeState(getStoredTheme());
    setSoundState(getSoundEnabled());
  }, []);

  function handleThemeChange(next: Theme) {
    setThemeState(next);
    setTheme(next);
  }

  function handleSoundChange(enabled: boolean) {
    setSoundState(enabled);
    setSoundEnabled(enabled);
  }

  function showToast(text: string, variant: InfoToastMessage['variant']) {
    toastIdRef.current += 1;
    setToast({ id: toastIdRef.current, text, variant });
  }

  async function handleExport() {
    if (busy) return;
    setBusy(true);
    try {
      const backup = await exportCollection();
      downloadBackup(backup);
      showToast(`Respaldo descargado · ${backup.entries.length} láminas`, 'success');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      showToast(`Error al exportar: ${msg}`, 'destructive');
    } finally {
      setBusy(false);
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const backup = parseBackup(text);
      const ownedEntries = backup.entries.filter((e) => e.count > 0).length;
      setPending({
        backup,
        totalEntries: backup.entries.length,
        ownedEntries,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      showToast(`Archivo inválido: ${msg}`, 'destructive');
    }
  }

  async function runImport(mode: 'replace' | 'merge') {
    if (!pending || busy) return;
    setBusy(true);
    try {
      const result = await importCollection(pending.backup, mode);
      setPending(null);
      showToast(`Progreso importado · ${result.imported} láminas`, 'success');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      showToast(`Error al importar: ${msg}`, 'destructive');
    } finally {
      setBusy(false);
    }
  }

  async function runBulk() {
    if (!pendingBulk || busy) return;
    setBusy(true);
    try {
      if (pendingBulk === 'mark-all') {
        const result = await markAllOwned();
        showToast(
          `Listo · ${result.added} marcadas (${result.alreadyOwned} ya tenías)`,
          'success',
        );
      } else {
        const result = await resetCollection();
        showToast(`Progreso vaciado · ${result.cleared} entradas borradas`, 'success');
      }
      setPendingBulk(null);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      showToast(`Error: ${msg}`, 'destructive');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Link
            to="/"
            aria-label="Volver al inicio"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors active:bg-muted"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ←
            </span>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Ajustes</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4">
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tema
          </h2>
          <div
            role="radiogroup"
            aria-label="Selección de tema"
            className="flex flex-col gap-2"
          >
            {THEME_OPTIONS.map((option) => {
              const isSelected = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleThemeChange(option.value)}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background active:bg-muted'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected ? 'border-primary' : 'border-border'
                    }`}
                  >
                    {isSelected && (
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {option.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{option.hint}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sonido
          </h2>
          <label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                Click al marcar
              </p>
              <p className="text-xs text-muted-foreground">
                Tono corto cuando sumás una lámina
              </p>
            </div>
            <input
              type="checkbox"
              checked={sound}
              onChange={(event) => handleSoundChange(event.target.checked)}
              className="h-5 w-5 shrink-0 accent-primary"
            />
          </label>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Respaldo de progreso
          </h2>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={busy}
              className="min-h-11 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors active:bg-primary/80 disabled:opacity-60"
            >
              Exportar progreso
            </button>
            <button
              type="button"
              onClick={handleImportClick}
              disabled={busy}
              className="min-h-11 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors active:bg-muted disabled:opacity-60"
            >
              Importar progreso
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            />
            <p className="px-1 text-xs text-muted-foreground">
              Descargá un archivo JSON con tu progreso o restauralo en otro dispositivo.
            </p>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Acciones rápidas
          </h2>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setPendingBulk('mark-all')}
              disabled={busy}
              className="min-h-11 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors active:bg-muted disabled:opacity-60"
            >
              Marcar todas como completadas
            </button>
            <button
              type="button"
              onClick={() => setPendingBulk('reset')}
              disabled={busy}
              className="min-h-11 rounded-lg border border-destructive/40 bg-background px-4 py-3 text-sm font-semibold text-destructive transition-colors active:bg-destructive/10 disabled:opacity-60"
            >
              Vaciar todo el progreso
            </button>
            <p className="px-1 text-xs text-muted-foreground">
              Marcar pone count=1 a las láminas sin marcar (preserva las repetidas).
              Vaciar borra todo el progreso de este dispositivo.
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">
            AlbumTracker26 — todo se guarda en este dispositivo, sin backend.
          </p>
        </section>
      </main>

      <InfoToast message={toast} onDismiss={() => setToast(null)} />

      {pending && (
        <ImportConfirmDialog
          pending={pending}
          busy={busy}
          onCancel={() => setPending(null)}
          onMerge={() => runImport('merge')}
          onReplace={() => runImport('replace')}
        />
      )}

      {pendingBulk && (
        <BulkConfirmDialog
          action={pendingBulk}
          busy={busy}
          onCancel={() => setPendingBulk(null)}
          onConfirm={runBulk}
        />
      )}
    </div>
  );
}

interface BulkConfirmDialogProps {
  action: BulkAction;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function BulkConfirmDialog({
  action,
  busy,
  onCancel,
  onConfirm,
}: BulkConfirmDialogProps) {
  const isReset = action === 'reset';
  const title = isReset ? 'Vaciar todo el progreso' : 'Marcar todas como completadas';
  const body = isReset
    ? 'Va a borrar todas tus láminas marcadas y todas las repetidas. Esta acción no se puede deshacer. Considerá exportar un respaldo primero.'
    : 'Va a marcar todas las láminas que aún no tenés con count=1. Las que ya tengas (incluyendo repetidas) quedan intactas.';
  const confirmLabel = isReset ? 'Sí, vaciar todo' : 'Sí, marcar todas';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-4 pt-16 backdrop-blur-sm sm:items-center sm:pb-16"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-2xl"
      >
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-foreground">{body}</p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`min-h-11 rounded-lg px-4 py-3 text-sm font-bold transition-colors disabled:opacity-60 ${
              isReset
                ? 'bg-destructive text-destructive-foreground active:bg-destructive/80'
                : 'bg-primary text-primary-foreground active:bg-primary/80'
            }`}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-11 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors active:bg-muted disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

interface ImportConfirmDialogProps {
  pending: PendingImport;
  busy: boolean;
  onCancel: () => void;
  onMerge: () => void;
  onReplace: () => void;
}

function ImportConfirmDialog({
  pending,
  busy,
  onCancel,
  onMerge,
  onReplace,
}: ImportConfirmDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirmar importación"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-4 pt-16 backdrop-blur-sm sm:items-center sm:pb-16"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-2xl"
      >
        <h3 className="text-lg font-bold text-foreground">Importar progreso</h3>
        <p className="mt-2 text-sm text-foreground">
          El respaldo tiene{' '}
          <span className="font-semibold">{pending.totalEntries}</span> entradas (
          <span className="font-semibold">{pending.ownedEntries}</span> con count &gt; 0).
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          ¿Querés <span className="font-semibold">reemplazar</span> tu progreso actual o{' '}
          <span className="font-semibold">combinar</span> (preserva el mayor count por
          lámina)?
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onMerge}
            disabled={busy}
            className="min-h-11 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors active:bg-primary/80 disabled:opacity-60"
          >
            Combinar
          </button>
          <button
            type="button"
            onClick={onReplace}
            disabled={busy}
            className="min-h-11 rounded-lg bg-destructive px-4 py-3 text-sm font-bold text-destructive-foreground transition-colors active:bg-destructive/80 disabled:opacity-60"
          >
            Reemplazar
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-11 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors active:bg-muted disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
