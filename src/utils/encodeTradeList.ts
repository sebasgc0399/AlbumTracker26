import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';
import type { TradeLists } from './types';
import { MAX_SHARE_PAYLOAD_BYTES } from './constants';

// Representación interna unificada (siempre arrays). El "v" del wire format
// (1 = arrays planos, 2 = strings packed por prefijo) se decide en encode
// y se normaliza a esta forma en decode.
export interface EncodedPayload {
  v: 1;
  d: string[]; // duplicate sticker IDs (count >= 2)
  b: string[]; // missing sticker IDs (busco)
  n?: string; // nickname opcional, max 24 chars
}

export interface EncodeResult {
  hash: string;
  bytes: number;
  exceedsLimit: boolean;
}

function isStringArray(value: unknown): value is string[] {
  if (!Array.isArray(value)) return false;
  for (const item of value) {
    if (typeof item !== 'string') return false;
  }
  return true;
}

// Compacta una lista de IDs agrupando por prefijo de equipo. Reduce tamaño
// porque "ALG10,ALG12,ALG14" pasa a "ALG:10,12,14" — el prefijo se escribe
// una vez por equipo en vez de N veces.
//
// Tokens separados por "|". Un token con ":" es un grupo, sin ":" es un
// literal de un solo ID (caso "00", la lámina sin prefijo numérico).
//
//   ["ALG10","ALG12","ARG10","00"] → "ALG:10,12|ARG:10|00"
function packIds(ids: string[]): string {
  const groups = new Map<string, number[]>();
  const literals: string[] = [];
  for (const id of ids) {
    const match = id.match(/^([A-Z]+)(\d+)$/);
    if (match) {
      const [, prefix, num] = match;
      let bucket = groups.get(prefix);
      if (!bucket) {
        bucket = [];
        groups.set(prefix, bucket);
      }
      bucket.push(parseInt(num, 10));
    } else {
      literals.push(id);
    }
  }
  const tokens: string[] = [];
  for (const prefix of [...groups.keys()].sort()) {
    const nums = groups.get(prefix)!.sort((a, b) => a - b);
    tokens.push(`${prefix}:${nums.join(',')}`);
  }
  for (const lit of literals.sort()) {
    tokens.push(lit);
  }
  return tokens.join('|');
}

function unpackIds(packed: string): string[] {
  if (!packed) return [];
  const ids: string[] = [];
  for (const token of packed.split('|')) {
    if (!token) continue;
    const colonIdx = token.indexOf(':');
    if (colonIdx === -1) {
      ids.push(token);
      continue;
    }
    const prefix = token.slice(0, colonIdx);
    const nums = token.slice(colonIdx + 1).split(',');
    for (const n of nums) {
      if (n) ids.push(`${prefix}${n}`);
    }
  }
  return ids;
}

export function encodeTradeList(lists: TradeLists): EncodeResult {
  const d = lists.duplicates.map((entry) => entry.sticker.id);
  const b = lists.missing.map((sticker) => sticker.id);

  const trimmedNickname = lists.nickname?.slice(0, 24).trim();
  const n = trimmedNickname && trimmedNickname.length > 0 ? trimmedNickname : undefined;

  // Wire format v=2: d/b son strings packed por prefijo.
  const wirePayload = n
    ? { v: 2, d: packIds(d), b: packIds(b), n }
    : { v: 2, d: packIds(d), b: packIds(b) };

  const json = JSON.stringify(wirePayload);
  const hash = compressToEncodedURIComponent(json);
  // compressToEncodedURIComponent emite ASCII URL-safe → length === bytes.
  const bytes = hash.length;
  const exceedsLimit = bytes > MAX_SHARE_PAYLOAD_BYTES;

  return { hash, bytes, exceedsLimit };
}

export function decodeTradeList(hash: string): EncodedPayload | null {
  if (!hash) return null;

  let json: string | null;
  try {
    json = decompressFromEncodedURIComponent(hash);
  } catch {
    return null;
  }
  if (json === null || json === '') return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;

  if (typeof obj.v !== 'number') return null;
  if (obj.n !== undefined && typeof obj.n !== 'string') return null;

  let d: string[];
  let b: string[];

  if (obj.v === 1) {
    // Wire format legacy: d/b son arrays de strings.
    if (!isStringArray(obj.d)) return null;
    if (!isStringArray(obj.b)) return null;
    d = obj.d;
    b = obj.b;
  } else if (obj.v === 2) {
    // Wire format actual: d/b son strings packed por prefijo.
    if (typeof obj.d !== 'string') return null;
    if (typeof obj.b !== 'string') return null;
    d = unpackIds(obj.d);
    b = unpackIds(obj.b);
  } else {
    return null;
  }

  const result: EncodedPayload = { v: 1, d, b };
  if (typeof obj.n === 'string' && obj.n.length > 0) {
    result.n = obj.n;
  }
  return result;
}
