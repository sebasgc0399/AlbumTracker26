import { TEAMS } from '@/data/teams';

const INDEX_BY_CODE = new Map(TEAMS.map((t, i) => [t.code, i]));
const INDEX_BY_NAME = new Map(TEAMS.map((t, i) => [t.name, i]));

// Equipos no-país (CC, FWC) o desconocidos van al final y dentro de ese
// bucket se sortean alfabéticamente entre sí.
export function tournamentIndexForCode(code: string): number {
  return INDEX_BY_CODE.get(code) ?? Number.MAX_SAFE_INTEGER;
}

export function tournamentIndexForName(name: string): number {
  return INDEX_BY_NAME.get(name) ?? Number.MAX_SAFE_INTEGER;
}

export function compareCodesByTournament(a: string, b: string): number {
  const ia = tournamentIndexForCode(a);
  const ib = tournamentIndexForCode(b);
  return ia !== ib ? ia - ib : a.localeCompare(b);
}

export function compareNamesByTournament(a: string, b: string): number {
  const ia = tournamentIndexForName(a);
  const ib = tournamentIndexForName(b);
  return ia !== ib ? ia - ib : a.localeCompare(b);
}
