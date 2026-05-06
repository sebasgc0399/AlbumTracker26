// Centralized sensory feedback: haptic + animation + (optional) sound.
// Single entry point for the app so each tap "feels the same" everywhere.

export type FeedbackKind =
  | 'tap'
  | 'newOwned'
  | 'duplicate'
  | 'milestone'
  | 'error';

export interface FeedbackOptions {
  kind: FeedbackKind;
  element?: HTMLElement | null;
}

const VIBRATE_PATTERNS: Record<FeedbackKind, number | number[]> = {
  tap: 10,
  newOwned: 30,
  duplicate: [10, 50, 10],
  milestone: [50, 30, 50, 30, 50],
  error: 80,
};

const ANIMATION_DURATIONS: Record<FeedbackKind, number> = {
  tap: 120,
  newOwned: 320,
  duplicate: 200,
  milestone: 0,
  error: 240,
};

const SOUND_FREQUENCIES: Record<FeedbackKind, number | null> = {
  tap: 800,
  newOwned: 1100,
  duplicate: 950,
  milestone: 600,
  error: 360,
};

const SOUND_PREF_KEY = 'at26.pref.sound';

function isReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SOUND_PREF_KEY) === 'true';
  } catch {
    return false;
  }
}

function getKeyframes(kind: FeedbackKind): Keyframe[] | null {
  switch (kind) {
    case 'tap':
      return [
        { transform: 'scale(1)' },
        { transform: 'scale(0.95)' },
        { transform: 'scale(1)' },
      ];
    case 'newOwned':
      return [
        { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(22,163,74,0.55)' },
        { transform: 'scale(1.04)', boxShadow: '0 0 0 12px rgba(22,163,74,0)' },
        { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(22,163,74,0)' },
      ];
    case 'duplicate':
      return [
        { transform: 'scale(1)' },
        { transform: 'scale(1.06)' },
        { transform: 'scale(1)' },
      ];
    case 'error':
      return [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(0)' },
      ];
    case 'milestone':
      return null;
  }
}

let audioCtxInstance: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioCtxInstance) return audioCtxInstance;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  try {
    audioCtxInstance = new Ctor();
  } catch {
    return null;
  }
  return audioCtxInstance;
}

function playSound(kind: FeedbackKind): void {
  const freq = SOUND_FREQUENCIES[kind];
  if (freq === null) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.frequency.value = freq;
  oscillator.type = 'sine';
  const start = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.08, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);
  oscillator.start(start);
  oscillator.stop(start + 0.1);
}

export function feedback({ kind, element }: FeedbackOptions): void {
  const reduced = isReducedMotion();

  if (!reduced && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(VIBRATE_PATTERNS[kind]);
    } catch {
      // ignore: some browsers throw on noisy patterns
    }
  }

  if (element && !reduced) {
    const keyframes = getKeyframes(kind);
    if (keyframes) {
      try {
        element.animate(keyframes, {
          duration: ANIMATION_DURATIONS[kind],
          easing: 'ease-out',
        });
      } catch {
        // Web Animations API unavailable; skip
      }
    }
  }

  if (isSoundEnabled()) {
    playSound(kind);
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SOUND_PREF_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore: private mode quota errors
  }
}

export function getSoundEnabled(): boolean {
  return isSoundEnabled();
}
