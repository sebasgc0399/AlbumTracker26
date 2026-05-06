import { TEAMS } from '@/data/teams';
import type { TradeLists } from './types';

const CANVAS_W = 1080;
const CANVAS_H = 1920;
const PADDING = 60;
const EMOJI_FONT_STACK =
  "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', system-ui, sans-serif";

const FLAG_BY_TEAM_CODE = new Map(TEAMS.map((t) => [t.code, t.flag]));

function flagForTeamCode(code: string): string {
  const flag = FLAG_BY_TEAM_CODE.get(code);
  if (flag) return flag;
  if (code === 'CC') return '🥤';
  if (code === 'FWC') return '🏆';
  return '⚽';
}

function readIncludeCC(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem('at26.pref.share.includeCC');
    if (raw === null) return false;
    return JSON.parse(raw) === true;
  } catch {
    return false;
  }
}

function naturalSortIds(ids: string[]): string[] {
  return ids
    .slice()
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

interface TeamGroup {
  code: string;
  flag: string;
  ids: string[];
}

function groupIdsByTeam(
  pairs: { team: string; id: string }[],
): TeamGroup[] {
  const map = new Map<string, string[]>();
  for (const { team, id } of pairs) {
    let bucket = map.get(team);
    if (!bucket) {
      bucket = [];
      map.set(team, bucket);
    }
    bucket.push(id);
  }
  const teams = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
  return teams.map((code) => ({
    code,
    flag: flagForTeamCode(code),
    ids: naturalSortIds(map.get(code) ?? []),
  }));
}

function setFont(
  ctx: CanvasRenderingContext2D,
  size: number,
  weight: 'normal' | 'bold' = 'normal',
): void {
  ctx.font = `${weight === 'bold' ? 'bold ' : ''}${size}px ${EMOJI_FONT_STACK}`;
}

function wrapTokens(
  ctx: CanvasRenderingContext2D,
  tokens: string[],
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let current = '';
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const sep = i === 0 || current === '' ? '' : ', ';
    const candidate = current === '' ? token : current + sep + token;
    const w = ctx.measureText(candidate).width;
    if (w > maxWidth && current !== '') {
      lines.push(current + ',');
      current = token;
    } else {
      current = candidate;
    }
  }
  if (current !== '') lines.push(current);
  return lines;
}

interface SectionPlan {
  groupLines: { flag: string; lines: string[] }[];
  truncatedRemaining: number;
}

function planSection(
  ctx: CanvasRenderingContext2D,
  groups: TeamGroup[],
  bodyFontSize: number,
  maxWidth: number,
  maxLines: number,
): SectionPlan {
  setFont(ctx, bodyFontSize, 'normal');
  const groupLines: { flag: string; lines: string[] }[] = [];
  let usedLines = 0;
  let truncatedRemaining = 0;

  for (let g = 0; g < groups.length; g++) {
    const group = groups[g];
    const flagPrefix = `${group.flag}  `;
    const flagWidth = ctx.measureText(flagPrefix).width;
    const idsAvailable = maxWidth - flagWidth;
    const wrapped = wrapTokens(ctx, group.ids, idsAvailable);

    const remainingLines = maxLines - usedLines;
    if (remainingLines <= 0) {
      // Count remaining IDs across this and later groups
      truncatedRemaining += group.ids.length;
      for (let k = g + 1; k < groups.length; k++) {
        truncatedRemaining += groups[k].ids.length;
      }
      break;
    }

    if (wrapped.length <= remainingLines) {
      groupLines.push({ flag: group.flag, lines: wrapped });
      usedLines += wrapped.length;
    } else {
      // Take partial lines, then approximate remaining IDs in this group + later
      const taken = wrapped.slice(0, remainingLines);
      groupLines.push({ flag: group.flag, lines: taken });
      usedLines += taken.length;
      // Approximate IDs not shown by counting commas in lines we didn't render
      const skippedText = wrapped.slice(remainingLines).join(' ');
      const skippedIds = skippedText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0).length;
      truncatedRemaining += skippedIds;
      for (let k = g + 1; k < groups.length; k++) {
        truncatedRemaining += groups[k].ids.length;
      }
      break;
    }
  }

  return { groupLines, truncatedRemaining };
}

function renderSection(
  ctx: CanvasRenderingContext2D,
  startY: number,
  headerEmoji: string,
  headerLabel: string,
  total: number,
  headerColor: string,
  plan: SectionPlan,
  bodyFontSize: number,
  lineHeight: number,
  groupGap: number,
  leftX: number,
): number {
  let y = startY;

  setFont(ctx, 40, 'bold');
  ctx.fillStyle = headerColor;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${headerEmoji} ${headerLabel} (${total})`, leftX, y);
  y += 56;

  setFont(ctx, bodyFontSize, 'normal');
  ctx.fillStyle = '#1f2937';

  for (const group of plan.groupLines) {
    const flagPrefix = `${group.flag}  `;
    const flagW = ctx.measureText(flagPrefix).width;
    for (let i = 0; i < group.lines.length; i++) {
      if (i === 0) {
        ctx.fillText(flagPrefix, leftX, y);
        ctx.fillText(group.lines[i], leftX + flagW, y);
      } else {
        ctx.fillText(group.lines[i], leftX + flagW, y);
      }
      y += lineHeight;
    }
    y += groupGap;
  }

  if (plan.truncatedRemaining > 0) {
    setFont(ctx, bodyFontSize - 4, 'normal');
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`+ ${plan.truncatedRemaining} más`, leftX, y);
    y += lineHeight;
  }

  return y;
}

export async function renderTradeImage(lists: TradeLists): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_W * dpr;
  canvas.height = CANVAS_H * dpr;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.scale(dpr, dpr);

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const includeCC = readIncludeCC();
  const contentLeft = PADDING;
  const contentRight = CANVAS_W - PADDING;
  const contentWidth = contentRight - contentLeft;

  // Filter + group by team
  const dupPairs: { team: string; id: string }[] = [];
  for (const entry of lists.duplicates) {
    if (entry.extra < 1) continue;
    if (!includeCC && entry.sticker.team === 'CC') continue;
    dupPairs.push({ team: entry.sticker.team, id: entry.sticker.id });
  }
  const missPairs: { team: string; id: string }[] = [];
  for (const sticker of lists.missing) {
    if (!includeCC && sticker.team === 'CC') continue;
    missPairs.push({ team: sticker.team, id: sticker.id });
  }

  const dupGroups = groupIdsByTeam(dupPairs);
  const missGroups = groupIdsByTeam(missPairs);
  const dupTotal = dupPairs.length;
  const missTotal = missPairs.length;

  // Header
  let y = PADDING + 70;
  ctx.fillStyle = '#0f172a';
  setFont(ctx, 56, 'bold');
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Mi lista — Mundial 2026', contentLeft, y);
  y += 50;

  setFont(ctx, 28, 'normal');
  ctx.fillStyle = '#6b7280';
  ctx.fillText(new Date().toLocaleDateString('es'), contentLeft, y);
  y += 44;

  setFont(ctx, 32, 'normal');
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`🟢 ${dupTotal}  ·  🔴 ${missTotal}`, contentLeft, y);
  y += 40;

  // Separator
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(contentLeft, y, contentWidth, 4);
  y += 40;

  // Body layout: split available vertical space between Cambio and Busco
  const bodyFontSize = 30;
  const lineHeight = 44;
  const groupGap = 14;

  const footerY = CANVAS_H - PADDING - 30;
  const bodyTop = y;
  const bodyBottom = footerY - 40;
  const bodyHeight = bodyBottom - bodyTop;

  // Reserve header (56px) + breathing space per section; split rest in half.
  const sectionHeaderReserve = 56;
  const halfHeight = Math.floor(bodyHeight / 2);
  const linesPerSection = Math.max(
    1,
    Math.floor((halfHeight - sectionHeaderReserve) / lineHeight) - 1,
  );

  // Plan both sections; if one section under-uses its budget, redistribute.
  let dupPlan = planSection(
    ctx,
    dupGroups,
    bodyFontSize,
    contentWidth,
    linesPerSection,
  );
  let missPlan = planSection(
    ctx,
    missGroups,
    bodyFontSize,
    contentWidth,
    linesPerSection,
  );

  const dupUsedLines = dupPlan.groupLines.reduce(
    (acc, g) => acc + g.lines.length,
    0,
  );
  const missUsedLines = missPlan.groupLines.reduce(
    (acc, g) => acc + g.lines.length,
    0,
  );
  const totalBudget = linesPerSection * 2;
  if (dupPlan.truncatedRemaining > 0 && missUsedLines < linesPerSection) {
    const extra = linesPerSection - missUsedLines;
    dupPlan = planSection(
      ctx,
      dupGroups,
      bodyFontSize,
      contentWidth,
      Math.min(totalBudget, linesPerSection + extra),
    );
  } else if (missPlan.truncatedRemaining > 0 && dupUsedLines < linesPerSection) {
    const extra = linesPerSection - dupUsedLines;
    missPlan = planSection(
      ctx,
      missGroups,
      bodyFontSize,
      contentWidth,
      Math.min(totalBudget, linesPerSection + extra),
    );
  }

  // Render sections
  if (dupTotal > 0) {
    y = renderSection(
      ctx,
      y,
      '🟢',
      'CAMBIO',
      dupTotal,
      '#16a34a',
      dupPlan,
      bodyFontSize,
      lineHeight,
      groupGap,
      contentLeft,
    );
    y += 28;
  } else {
    setFont(ctx, 40, 'bold');
    ctx.fillStyle = '#16a34a';
    ctx.fillText('🟢 CAMBIO (0)', contentLeft, y);
    y += 56;
    setFont(ctx, bodyFontSize - 2, 'normal');
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Sin repetidas todavía.', contentLeft, y);
    y += lineHeight + 12;
  }

  if (missTotal > 0) {
    y = renderSection(
      ctx,
      y,
      '🔴',
      'BUSCO',
      missTotal,
      '#dc2626',
      missPlan,
      bodyFontSize,
      lineHeight,
      groupGap,
      contentLeft,
    );
  } else {
    setFont(ctx, 40, 'bold');
    ctx.fillStyle = '#dc2626';
    ctx.fillText('🔴 BUSCO (0)', contentLeft, y);
    y += 56;
    setFont(ctx, bodyFontSize - 2, 'normal');
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Álbum completo.', contentLeft, y);
  }

  // Footer
  setFont(ctx, 22, 'normal');
  ctx.fillStyle = '#9ca3af';
  const nicknameSuffix = lists.nickname ? ` · ${lists.nickname}` : '';
  ctx.fillText(
    `AT26 · generado offline${nicknameSuffix}`,
    contentLeft,
    footerY,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('canvas.toBlob returned null'));
    }, 'image/png');
  });
}
