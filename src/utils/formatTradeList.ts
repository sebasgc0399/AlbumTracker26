import { TEAMS } from '@/data/teams';
import { compareCodesByTournament } from '@/lib/teamOrder';
import { compressIdsToTokens } from './compressIds';
import type { TradeLists } from './types';

export interface FormatOptions {
  includeCC: boolean;
  byTournament: boolean;
}

const FOOTER = 'Panini Mundial 2026 — generado con AT26';

const TEAMS_BY_CODE = new Map(TEAMS.map((t) => [t.code, t]));

// Subdivision flags (Inglaterra, Escocia) usan secuencias Unicode especiales,
// no el patrón ISO-2 estándar de regional indicators.
const SUBDIVISION_FLAGS: Record<string, string> = {
  'gb-eng': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'gb-sct': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
};

function flagEmoji(flagCode: string): string {
  const subdivision = SUBDIVISION_FLAGS[flagCode];
  if (subdivision) return subdivision;
  if (flagCode.length !== 2) return '';
  return flagCode
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('');
}

// Etiqueta compacta: código de 3 letras + bandera emoji. Caso especial para
// secciones que no son países (intro/museo FWC, Coca-Cola, lámina "00").
function teamLabel(code: string): string {
  if (code === '') return 'Intro';
  if (code === 'FWC') return 'FWC 🏆';
  if (code === 'CC') return 'CC 🥤';
  const team = TEAMS_BY_CODE.get(code);
  if (!team) return code;
  const flag = flagEmoji(team.flagCode);
  return flag ? `${code} ${flag}` : code;
}

function formatTeamLine(code: string, ids: string[]): string {
  const body = compressIdsToTokens(code, ids).join(', ');
  const label = teamLabel(code);
  if (ids.length >= 3) {
    return `${label}: ${body} (${ids.length})`;
  }
  return `${label}: ${body}`;
}

function buildSection(
  label: string,
  byTeam: Map<string, string[]>,
  total: number,
  byTournament: boolean,
): string | null {
  if (total === 0) return null;
  // Orden de torneo (default) sigue el array TEAMS (Grupo A→L); alfabético es
  // la alternativa. Equipos no-país (CC, FWC) caen al final con MAX_SAFE_INTEGER.
  const teams = Array.from(byTeam.keys()).sort((a, b) =>
    byTournament ? compareCodesByTournament(a, b) : a.localeCompare(b),
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

  const cambio = buildSection('CAMBIO', dupByTeam, dupTotal, opts.byTournament);
  const busco = buildSection('BUSCO', missByTeam, missTotal, opts.byTournament);

  if (!cambio && !busco) return '';

  const sections: string[] = [];
  if (cambio) sections.push(cambio);
  if (busco) sections.push(busco);

  return `${sections.join('\n\n')}\n\n${FOOTER}`;
}
