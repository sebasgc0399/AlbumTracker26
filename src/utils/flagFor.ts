import { TEAMS } from '@/data/teams';

export interface FlagInfo {
  flagCode: string | null;
  emoji: string;
}

const TEAMS_BY_CODE = new Map(TEAMS.map((t) => [t.code, t]));
const TEAMS_BY_NAME = new Map(TEAMS.map((t) => [t.name, t]));

export function flagInfoForTeamCode(code: string): FlagInfo {
  const team = TEAMS_BY_CODE.get(code);
  if (team) return { flagCode: team.flagCode, emoji: '' };
  if (code === 'CC') return { flagCode: null, emoji: '🥤' };
  if (code === 'FWC') return { flagCode: null, emoji: '🏆' };
  return { flagCode: null, emoji: '⚽' };
}

export function flagInfoForTeamName(name: string): FlagInfo {
  const team = TEAMS_BY_NAME.get(name);
  if (team) return { flagCode: team.flagCode, emoji: '' };
  if (name === 'Coca-Cola') return { flagCode: null, emoji: '🥤' };
  if (name === 'Introducción' || name === 'Museo FIFA') return { flagCode: null, emoji: '🏆' };
  return { flagCode: null, emoji: '⚽' };
}
