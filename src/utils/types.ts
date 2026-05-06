import type { Sticker } from '@/db/database';

export interface TradeEntry {
  sticker: Sticker;
  extra: number;
}

export interface TradeLists {
  duplicates: TradeEntry[];
  missing: Sticker[];
  nickname?: string;
}
