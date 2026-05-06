import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStoredTheme, setTheme, type Theme } from '@/lib/theme';
import { getSoundEnabled, setSoundEnabled } from '@/lib/feedback';

const THEME_OPTIONS: { value: Theme; label: string; hint: string }[] = [
  { value: 'light', label: 'Claro', hint: 'Fondo blanco siempre' },
  { value: 'dark', label: 'Oscuro', hint: 'Fondo oscuro siempre' },
  { value: 'system', label: 'Sistema', hint: 'Sigue al sistema operativo' },
];

export default function SettingsPage() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [sound, setSoundState] = useState<boolean>(false);

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

        <section className="rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">
            AlbumTracker26 — todo se guarda en este dispositivo, sin backend.
          </p>
        </section>
      </main>
    </div>
  );
}
