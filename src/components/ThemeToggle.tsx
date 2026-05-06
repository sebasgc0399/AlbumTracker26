import { useEffect, useState } from 'react';
import { getStoredTheme, setTheme, type Theme } from '@/lib/theme';

const NEXT_THEME: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

const LABELS: Record<Theme, string> = {
  light: 'Tema: claro (cambiar a oscuro)',
  dark: 'Tema: oscuro (cambiar a sistema)',
  system: 'Tema: sistema (cambiar a claro)',
};

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setThemeState] = useState<Theme>('system');

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  function handleClick() {
    const next = NEXT_THEME[theme];
    setThemeState(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={LABELS[theme]}
      title={LABELS[theme]}
      className={`flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors active:bg-muted ${className ?? ''}`}
    >
      {theme === 'light' && <SunIcon />}
      {theme === 'dark' && <MoonIcon />}
      {theme === 'system' && <SystemIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}
