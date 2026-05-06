import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';
import type { TradeLists } from './types';
import { MAX_SHARE_PAYLOAD_BYTES } from './constants';

export interface EncodedPayload {
  v: 1; // versionado day-1
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

export function encodeTradeList(lists: TradeLists): EncodeResult {
  const d = lists.duplicates.map((entry) => entry.sticker.id);
  const b = lists.missing.map((sticker) => sticker.id);

  const trimmedNickname = lists.nickname?.slice(0, 24).trim();
  const n = trimmedNickname && trimmedNickname.length > 0 ? trimmedNickname : undefined;

  const payload: EncodedPayload = n ? { v: 1, d, b, n } : { v: 1, d, b };

  const json = JSON.stringify(payload);
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
  if (obj.v !== 1) return null; // futuro-proof
  if (!isStringArray(obj.d)) return null;
  if (!isStringArray(obj.b)) return null;
  if (obj.n !== undefined && typeof obj.n !== 'string') return null;

  const result: EncodedPayload = { v: 1, d: obj.d, b: obj.b };
  if (typeof obj.n === 'string' && obj.n.length > 0) {
    result.n = obj.n;
  }
  return result;
}
