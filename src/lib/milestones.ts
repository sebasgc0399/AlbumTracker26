export type MilestoneKind = 'global' | 'team' | 'group' | 'album';

export interface MilestoneMeta {
  teamCode?: string;
  groupLetter?: string;
}

export interface Milestone {
  id: string;
  kind: MilestoneKind;
  label: string;
  phrase: string;
  meta?: MilestoneMeta;
}

export interface TeamProgress {
  owned: number;
  total: number;
  teamName: string;
}

export interface GroupProgress {
  owned: number;
  total: number;
}

export interface ProgressSnapshot {
  owned: number;
  total: number;
}

export const GLOBAL_THRESHOLDS = [10, 25, 50, 100, 250, 500, 750, 980] as const;

const GLOBAL_PHRASES: Record<number, string> = {
  10: 'Diez láminas. Esto recién empieza.',
  25: 'Veinticinco. Vas tomando ritmo.',
  50: 'Cincuenta. Ya hay álbum.',
  100: 'Cien láminas. Vas en serio.',
  250: 'Doscientas cincuenta. Cuarto del camino.',
  500: 'Quinientas. Mitad del álbum.',
  750: 'Setecientas cincuenta. La recta final.',
  980: 'Novecientas ochenta. Casi entero.',
};

const ALBUM_TOTAL = 994;
const TEAM_TOTAL = 20;
const GROUP_TOTAL = 80;

const VALID_GROUPS = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']);

function isExcludedTeam(teamCode: string): boolean {
  // FWC (intro + museo) y CC (Coca-Cola) cuentan para el global y el álbum,
  // pero no son hitos jugables de "equipo" ni pertenecen a grupos A-L.
  return teamCode === 'FWC' || teamCode === 'CC';
}

export function computeReachedSet(
  progress: ProgressSnapshot,
  perTeam: Map<string, TeamProgress>,
  perGroup: Map<string, GroupProgress>,
): Set<string> {
  const reached = new Set<string>();

  for (const threshold of GLOBAL_THRESHOLDS) {
    if (progress.owned >= threshold) {
      reached.add(`global:${threshold}`);
    }
  }

  if (progress.owned >= ALBUM_TOTAL) {
    reached.add('album');
  }

  for (const [teamCode, tp] of perTeam) {
    if (isExcludedTeam(teamCode)) continue;
    if (tp.total >= TEAM_TOTAL && tp.owned >= tp.total) {
      reached.add(`team:${teamCode}`);
    }
  }

  for (const [letter, gp] of perGroup) {
    if (!VALID_GROUPS.has(letter)) continue;
    if (gp.total >= GROUP_TOTAL && gp.owned >= gp.total) {
      reached.add(`group:${letter}`);
    }
  }

  return reached;
}

function priorityOf(id: string): number {
  if (id === 'album') return 0;
  if (id.startsWith('group:')) return 1;
  if (id.startsWith('team:')) return 2;
  return 3;
}

export function detectCrossings(
  prevReached: Set<string>,
  nextReached: Set<string>,
): string[] {
  const crossed: string[] = [];
  for (const id of nextReached) {
    if (!prevReached.has(id)) crossed.push(id);
  }
  // Orden por prioridad: si el usuario cruza varios a la vez, el "más grande"
  // (álbum > grupo > equipo > global) se muestra primero en la cola.
  crossed.sort((a, b) => priorityOf(a) - priorityOf(b));
  return crossed;
}

export function buildMilestone(
  id: string,
  perTeam: Map<string, TeamProgress>,
  _perGroup: Map<string, GroupProgress>,
): Milestone | null {
  if (id === 'album') {
    return {
      id,
      kind: 'album',
      label: 'Álbum completo',
      phrase: 'ÁLBUM COMPLETO. ESTO PASÓ.',
    };
  }

  if (id.startsWith('global:')) {
    const raw = id.slice('global:'.length);
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return null;
    const phrase = GLOBAL_PHRASES[n];
    if (!phrase) return null;
    return {
      id,
      kind: 'global',
      label: `${n} láminas`,
      phrase,
    };
  }

  if (id.startsWith('team:')) {
    const teamCode = id.slice('team:'.length);
    if (!teamCode || isExcludedTeam(teamCode)) return null;
    const tp = perTeam.get(teamCode);
    const teamName = tp?.teamName ?? teamCode;
    return {
      id,
      kind: 'team',
      label: teamName,
      phrase: `Equipo ${teamName} completo.`,
      meta: { teamCode },
    };
  }

  if (id.startsWith('group:')) {
    const letter = id.slice('group:'.length);
    if (!VALID_GROUPS.has(letter)) return null;
    return {
      id,
      kind: 'group',
      label: `Grupo ${letter}`,
      phrase: `Grupo ${letter} listo.`,
      meta: { groupLetter: letter },
    };
  }

  return null;
}
