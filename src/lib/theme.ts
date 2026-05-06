// Theme management: light / dark / system with localStorage persistence.
// The pre-paint script in index.html already applies the `dark` class on
// the documentElement before the first paint, avoiding light → dark flash.
// This module re-applies on toggles and subscribes to system changes.

const THEME_KEY = 'at26.theme';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const META_THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#16a34a',
  dark: '#171717',
};

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // ignore
  }
  return 'system';
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme !== 'system') return theme;
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', META_THEME_COLORS[resolved]);
}

export function setTheme(theme: Theme): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore: private mode
    }
  }
  applyTheme(theme);
}

export function subscribeToSystemTheme(): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    if (getStoredTheme() === 'system') applyTheme('system');
  };
  media.addEventListener('change', handler);
  return () => media.removeEventListener('change', handler);
}
