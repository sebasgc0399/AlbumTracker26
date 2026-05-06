import { TEAMS } from '@/data/teams';

export type TeamFlagInfo =
  | { kind: 'flag'; code: string }
  | { kind: 'cocacola' }
  | { kind: 'fifa' }
  | { kind: 'generic' };

const TEAMS_BY_CODE = new Map(TEAMS.map((t) => [t.code, t]));
const TEAMS_BY_NAME = new Map(TEAMS.map((t) => [t.name, t]));

export function flagInfoForTeamCode(code: string): TeamFlagInfo {
  const team = TEAMS_BY_CODE.get(code);
  if (team) return { kind: 'flag', code: team.flagCode };
  if (code === 'CC') return { kind: 'cocacola' };
  if (code === 'FWC') return { kind: 'fifa' };
  return { kind: 'generic' };
}

export function flagInfoForTeamName(name: string): TeamFlagInfo {
  const team = TEAMS_BY_NAME.get(name);
  if (team) return { kind: 'flag', code: team.flagCode };
  if (name === 'Coca-Cola') return { kind: 'cocacola' };
  if (name === 'Introducción' || name === 'Museo FIFA') return { kind: 'fifa' };
  return { kind: 'generic' };
}
