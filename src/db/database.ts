import Dexie, { type EntityTable } from 'dexie';

export interface Sticker {
  id: string;
  number: string;
  name: string;
  team: string;
  teamName: string;
  group: string;
  section: string;
  type: string;
  position: number;
}

export interface CollectionEntry {
  stickerId: string;
  owned: boolean;
  count: number;
}

export const db = new Dexie('AlbumTracker26') as Dexie & {
  stickers: EntityTable<Sticker, 'id'>;
  collection: EntityTable<CollectionEntry, 'stickerId'>;
};

db.version(1).stores({
  stickers: 'id, team, group, section, type',
  collection: 'stickerId',
});
