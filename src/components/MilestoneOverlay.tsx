import { useEffect, useMemo, useState } from 'react';
import FlagIcon from './FlagIcon';
import { useMilestone } from '@/hooks/useMilestoneWatcher';
import { TEAMS } from '@/data/teams';
import { feedback } from '@/lib/feedback';
import type { Milestone, MilestoneKind } from '@/lib/milestones';

const AUTO_DISMISS_MS = 2_500;
const REDUCED_FLASH_MS = 400;

const CONFETTI_COLORS: Record<MilestoneKind, string[]> = {
  global: ['#16a34a', '#22c55e', '#4ade80'],
  team: ['#16a34a', '#facc15', '#fde68a'],
  group: ['#16a34a', '#3b82f6', '#93c5fd'],
  album: ['#facc15', '#fde68a', '#f59e0b', '#fbbf24'],
};

function isReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function buildFlagCodeMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const t of TEAMS) map.set(t.code, t.flagCode);
  return map;
}

async function fireConfetti(kind: MilestoneKind): Promise<void> {
  try {
    const mod = await import('canvas-confetti');
    const confetti = mod.default;
    const colors = CONFETTI_COLORS[kind];
    const base = {
      particleCount: 80,
      spread: 80,
      origin: { y: 0.6 },
      colors,
    } as const;
    confetti(base);
    if (kind === 'album') {
      // Doble disparo para el cierre del álbum.
      window.setTimeout(() => {
        confetti({ ...base, particleCount: 120, spread: 110 });
      }, 250);
    }
  } catch {
    // ignore: si falla la importación dinámica, solo nos perdemos el confetti
  }
}

export default function MilestoneOverlay() {
  const { currentMilestone, dismissCurrent } = useMilestone();
  const [flash, setFlash] = useState(false);

  const flagCodeMap = useMemo(buildFlagCodeMap, []);

  useEffect(() => {
    if (!currentMilestone) return;

    feedback({ kind: 'milestone' });

    const reduced = isReducedMotion();
    if (reduced) {
      setFlash(true);
      const flashId = window.setTimeout(() => setFlash(false), REDUCED_FLASH_MS);
      const dismissId = window.setTimeout(dismissCurrent, AUTO_DISMISS_MS);
      return () => {
        window.clearTimeout(flashId);
        window.clearTimeout(dismissId);
      };
    }

    void fireConfetti(currentMilestone.kind);
    const dismissId = window.setTimeout(dismissCurrent, AUTO_DISMISS_MS);
    return () => window.clearTimeout(dismissId);
  }, [currentMilestone, dismissCurrent]);

  if (!currentMilestone) return null;

  const isAlbum = currentMilestone.kind === 'album';
  const teamCode = currentMilestone.meta?.teamCode;
  const flagCode = teamCode ? flagCodeMap.get(teamCode) : undefined;

  return (
    <div
      role="dialog"
      aria-live="assertive"
      aria-label={currentMilestone.label}
      onClick={dismissCurrent}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm transition-colors duration-200 ${
        flash ? 'bg-primary/70' : ''
      }`}
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={(e) => {
          e.stopPropagation();
          dismissCurrent();
        }}
        className="absolute right-3 top-3 flex min-h-11 min-w-11 items-center justify-center rounded-full text-white/80 transition-colors active:bg-white/10"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      </button>

      <MilestoneCard milestone={currentMilestone} flagCode={flagCode} isAlbum={isAlbum} />
    </div>
  );
}

interface MilestoneCardProps {
  milestone: Milestone;
  flagCode: string | undefined;
  isAlbum: boolean;
}

function MilestoneCard({ milestone, flagCode, isAlbum }: MilestoneCardProps) {
  const phraseClass = isAlbum
    ? 'text-3xl font-extrabold tracking-tight text-foreground'
    : 'text-2xl font-bold text-foreground';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`pointer-events-auto flex max-w-sm flex-col items-center gap-4 rounded-2xl bg-background px-6 py-8 text-center shadow-2xl ${
        isAlbum ? 'ring-4 ring-foil' : 'border border-border'
      }`}
    >
      {flagCode && (
        <FlagIcon code={flagCode} alt={milestone.label} className="w-24 shadow" />
      )}
      {milestone.kind === 'group' && (
        <span className="font-mono text-5xl font-bold text-accent-museum">
          {milestone.meta?.groupLetter ?? ''}
        </span>
      )}
      {isAlbum && (
        <span
          aria-hidden="true"
          className="font-mono text-4xl font-extrabold text-foil"
        >
          994 / 994
        </span>
      )}
      <p className={phraseClass}>{milestone.phrase}</p>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        Toca para continuar
      </p>
    </div>
  );
}
