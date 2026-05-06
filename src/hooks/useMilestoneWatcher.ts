import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useStickers, useCollection } from '@/db/hooks';
import {
  buildMilestone,
  computeReachedSet,
  detectCrossings,
  type GroupProgress,
  type Milestone,
  type TeamProgress,
} from '@/lib/milestones';

const STORAGE_KEY = 'at26.milestones.reached';

interface MilestoneContextValue {
  currentMilestone: Milestone | null;
  dismissCurrent: () => void;
}

const MilestoneContext = createContext<MilestoneContextValue | null>(null);

function readPersistedReached(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    const out = new Set<string>();
    for (const item of parsed) {
      if (typeof item === 'string') out.add(item);
    }
    return out;
  } catch {
    return new Set();
  }
}

function persistReached(set: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore: quota exceeded / private mode
  }
}

interface ComputedSnapshot {
  ready: boolean;
  ownedTotal: number;
  perTeam: Map<string, TeamProgress>;
  perGroup: Map<string, GroupProgress>;
}

interface MilestoneProviderProps {
  children: ReactNode;
}

export function MilestoneProvider({ children }: MilestoneProviderProps) {
  const stickers = useStickers();
  const collection = useCollection();

  const snapshot = useMemo<ComputedSnapshot>(() => {
    if (!stickers || !collection) {
      return {
        ready: false,
        ownedTotal: 0,
        perTeam: new Map(),
        perGroup: new Map(),
      };
    }

    const perTeam = new Map<string, TeamProgress>();
    const perGroup = new Map<string, GroupProgress>();
    let ownedTotal = 0;

    for (const sticker of stickers) {
      const entry = collection.get(sticker.id);
      const isOwned = !!entry && entry.count > 0;
      if (isOwned) ownedTotal += 1;

      const tp = perTeam.get(sticker.team);
      if (tp) {
        tp.total += 1;
        if (isOwned) tp.owned += 1;
      } else {
        perTeam.set(sticker.team, {
          owned: isOwned ? 1 : 0,
          total: 1,
          teamName: sticker.teamName,
        });
      }

      const groupKey = sticker.group;
      const gp = perGroup.get(groupKey);
      if (gp) {
        gp.total += 1;
        if (isOwned) gp.owned += 1;
      } else {
        perGroup.set(groupKey, { owned: isOwned ? 1 : 0, total: 1 });
      }
    }

    return { ready: true, ownedTotal, perTeam, perGroup };
  }, [stickers, collection]);

  const reachedRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const perTeamRef = useRef<Map<string, TeamProgress>>(new Map());
  const perGroupRef = useRef<Map<string, GroupProgress>>(new Map());

  const [queue, setQueue] = useState<Milestone[]>([]);

  useEffect(() => {
    if (!snapshot.ready) return;

    perTeamRef.current = snapshot.perTeam;
    perGroupRef.current = snapshot.perGroup;

    const nextReached = computeReachedSet(
      { owned: snapshot.ownedTotal, total: 992 },
      snapshot.perTeam,
      snapshot.perGroup,
    );

    if (!initializedRef.current) {
      // Silent init: el primer cómputo con datos cargados no celebra nada.
      // Mergea con localStorage para preservar hitos ya celebrados en sesiones previas.
      const persisted = readPersistedReached();
      const initial = new Set<string>([...persisted, ...nextReached]);
      reachedRef.current = initial;
      initializedRef.current = true;
      persistReached(initial);
      return;
    }

    const crossedIds = detectCrossings(reachedRef.current, nextReached);
    if (crossedIds.length > 0) {
      const newMilestones: Milestone[] = [];
      for (const id of crossedIds) {
        const m = buildMilestone(id, snapshot.perTeam, snapshot.perGroup);
        if (m) newMilestones.push(m);
      }
      if (newMilestones.length > 0) {
        setQueue((prev) => [...prev, ...newMilestones]);
      }
    }

    // Una vez celebrado, queda celebrado: nunca removemos IDs aunque el progreso baje.
    const merged = new Set<string>([...reachedRef.current, ...nextReached]);
    reachedRef.current = merged;
    persistReached(merged);
  }, [snapshot]);

  const dismissCurrent = useCallback(() => {
    setQueue((prev) => (prev.length === 0 ? prev : prev.slice(1)));
  }, []);

  const currentMilestone = queue[0] ?? null;

  const value = useMemo<MilestoneContextValue>(
    () => ({ currentMilestone, dismissCurrent }),
    [currentMilestone, dismissCurrent],
  );

  return createElement(MilestoneContext.Provider, { value }, children);
}

export function useMilestone(): MilestoneContextValue {
  const ctx = useContext(MilestoneContext);
  if (!ctx) {
    throw new Error('useMilestone debe usarse dentro de <MilestoneProvider>');
  }
  return ctx;
}
