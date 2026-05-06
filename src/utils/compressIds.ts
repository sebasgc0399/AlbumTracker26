// Compresión de listas de IDs de stickers a tokens cortos para compartir.
// "ARG1..ARG20" se vuelve ["1-20"]; "ARG1, ARG2, ARG4" se vuelve ["1-2", "4"].

function compressNumericRunsToTokens(nums: number[]): string[] {
  if (nums.length === 0) return [];
  const sorted = [...nums].sort((a, b) => a - b);
  const out: string[] = [];
  let start = sorted[0];
  let end = start;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      out.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = start;
    }
  }
  out.push(start === end ? `${start}` : `${start}-${end}`);
  return out;
}

export function compressIdsToTokens(
  teamCode: string,
  ids: string[],
): string[] {
  // Sin prefijo de equipo (ej. lámina "00" Panini), listar IDs literales.
  if (teamCode === '') {
    return ids
      .slice()
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }
  const numeric: number[] = [];
  const literals: string[] = [];
  for (const id of ids) {
    let suffix = id;
    if (id.startsWith(teamCode)) {
      suffix = id.slice(teamCode.length);
    }
    if (/^\d+$/.test(suffix)) {
      numeric.push(parseInt(suffix, 10));
    } else {
      literals.push(id);
    }
  }
  return [...compressNumericRunsToTokens(numeric), ...literals];
}

export function countIdsInToken(token: string): number {
  const m = token.match(/^(\d+)-(\d+)$/);
  if (m) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    return Math.max(0, b - a + 1);
  }
  return 1;
}
