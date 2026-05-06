import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { revertToCount } from '@/db/mutations';

const INACTIVITY_MS = 30_000;
const SUMMARY_TTL_MS = 10_000;

export interface BatchMutation {
  stickerId: string;
  prevCount: number;
  newCount: number;
  ts: number;
}

type Phase = 'idle' | 'active' | 'closed';

export interface BatchSummary {
  newCount: number;
  duplicateCount: number;
  totalTaps: number;
}

export interface BatchSession {
  mutations: BatchMutation[];
  isActive: boolean;
  isClosed: boolean;
  lastMutation: BatchMutation | null;
  summary: BatchSummary | null;
  recordTap: (stickerId: string, prevCount: number, newCount: number) => void;
  undoLast: () => Promise<void>;
  undoAll: () => Promise<void>;
  closeManually: () => void;
  dismissSummary: () => void;
}

function computeSummary(mutations: BatchMutation[]): BatchSummary {
  let newCount = 0;
  let duplicateCount = 0;
  for (const m of mutations) {
    if (m.prevCount === 0) newCount += 1;
    else duplicateCount += 1;
  }
  return { newCount, duplicateCount, totalTaps: mutations.length };
}

export function useBatchSession(): BatchSession {
  const [phase, setPhase] = useState<Phase>('idle');
  const [mutations, setMutations] = useState<BatchMutation[]>([]);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Inactivity timer: in 'active', close after 30s since last tap.
  useEffect(() => {
    if (phase !== 'active' || mutations.length === 0) return;
    const lastTs = mutations[mutations.length - 1].ts;
    const elapsed = Date.now() - lastTs;
    const remaining = INACTIVITY_MS - elapsed;
    if (remaining <= 0) {
      setPhase('closed');
      return;
    }
    const id = window.setTimeout(() => setPhase('closed'), remaining);
    return () => window.clearTimeout(id);
  }, [phase, mutations]);

  // Summary TTL: in 'closed', wipe back to idle after 10s.
  useEffect(() => {
    if (phase !== 'closed') return;
    const id = window.setTimeout(() => {
      setMutations([]);
      setPhase('idle');
    }, SUMMARY_TTL_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  const recordTap = useCallback(
    (stickerId: string, prevCount: number, newCount: number) => {
      const entry: BatchMutation = {
        stickerId,
        prevCount,
        newCount,
        ts: Date.now(),
      };
      setMutations((prev) => {
        // If we were closed (showing summary) and a new tap arrives,
        // start a fresh batch — discard the previous summary.
        if (phaseRef.current === 'closed') return [entry];
        return [...prev, entry];
      });
      setPhase('active');
    },
    [],
  );

  const undoLast = useCallback(async () => {
    let popped: BatchMutation | undefined;
    setMutations((prev) => {
      if (prev.length === 0) return prev;
      popped = prev[prev.length - 1];
      return prev.slice(0, -1);
    });
    if (popped) {
      await revertToCount(popped.stickerId, popped.prevCount);
    }
  }, []);

  const undoAll = useCallback(async () => {
    // Snapshot current mutations before the state update.
    let snapshot: BatchMutation[] = [];
    setMutations((prev) => {
      snapshot = prev;
      return [];
    });
    setPhase('idle');
    // Revert in reverse order so chained operations on the same id unwind correctly.
    for (let i = snapshot.length - 1; i >= 0; i -= 1) {
      const m = snapshot[i];
      await revertToCount(m.stickerId, m.prevCount);
    }
  }, []);

  const closeManually = useCallback(() => {
    setPhase((prev) => (prev === 'active' ? 'closed' : prev));
  }, []);

  const dismissSummary = useCallback(() => {
    setMutations([]);
    setPhase('idle');
  }, []);

  const lastMutation = mutations.length > 0 ? mutations[mutations.length - 1] : null;
  const summary = useMemo(
    () => (phase === 'closed' && mutations.length > 0 ? computeSummary(mutations) : null),
    [phase, mutations],
  );

  return {
    mutations,
    isActive: phase === 'active',
    isClosed: phase === 'closed',
    lastMutation,
    summary,
    recordTap,
    undoLast,
    undoAll,
    closeManually,
    dismissSummary,
  };
}
