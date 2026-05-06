import { TEAMS } from '@/data/teams';
import { compressIdsToTokens } from './compressIds';
import type { TradeLists } from './types';

export interface FormatOptions {
  includeCC: boolean;
}

const FOOTER = 'Panini Mundial 2026 — generado con AT26';

const TEAMS_BY_CODE = new Map(TEAMS.map((t) => [t.code, t]));

function teamDisplayName(code: string): string {
  if (code === '') return 'Introducción';
  if (code === 'FWC') return 'FIFA';
  if (code === 'CC') return 'Coca-Cola';
  return TEAMS_BY_CODE.get(code)?.name ?? code;
}

function formatTeamLine(code: string, ids: string[]): string {
  const body = compressIdsToTokens(code, ids).join(', ');
  const name = teamDisplayName(code);
  if (ids.length >= 3) {
    return `${name}: ${body} (${ids.length})`;
  }
  return `${name}: ${body}`;
}

function buildSection(
  label: string,
  byTeam: Map<string, string[]>,
  total: number,
): string | null {
  if (total === 0) return null;
  const teams = Array.from(byTeam.keys()).sort((a, b) =>
    teamDisplayName(a).localeCompare(teamDisplayName(b)),
  );
  const lines = teams.map((code) =>
    formatTeamLine(code, byTeam.get(code) ?? []),
  );
  return `*${label} (${total})*\n${lines.join('\n')}`;
}

export function formatTradeList(
  lists: TradeLists,
  opts: FormatOptions,
): string {
  const dupByTeam = new Map<string, string[]>();
  let dupTotal = 0;
  for (const entry of lists.duplicates) {
    if (entry.extra < 1) continue;
    const team = entry.sticker.team;
    if (!opts.includeCC && team === 'CC') continue;
    let bucket = dupByTeam.get(team);
    if (!bucket) {
      bucket = [];
      dupByTeam.set(team, bucket);
    }
    bucket.push(entry.sticker.id);
    dupTotal += 1;
  }

  const missByTeam = new Map<string, string[]>();
  let missTotal = 0;
  for (const sticker of lists.missing) {
    const team = sticker.team;
    if (!opts.includeCC && team === 'CC') continue;
    let bucket = missByTeam.get(team);
    if (!bucket) {
      bucket = [];
      missByTeam.set(team, bucket);
    }
    bucket.push(sticker.id);
    missTotal += 1;
  }

  const cambio = buildSection('CAMBIO', dupByTeam, dupTotal);
  const busco = buildSection('BUSCO', missByTeam, missTotal);

  if (!cambio && !busco) return '';

  const sections: string[] = [];
  if (cambio) sections.push(cambio);
  if (busco) sections.push(busco);

  return `${sections.join('\n\n')}\n\n${FOOTER}`;
}
