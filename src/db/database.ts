import Dexie, { type EntityTable } from 'dexie';
import stickersData from '@/data/stickers.json';

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

db.version(2)
  .stores({
    stickers: 'id, team, group, section, type',
    collection: 'stickerId',
  })
  .upgrade(async (tx) => {
    await tx
      .table('stickers')
      .where('section')
      .equals('museum')
      .modify({ teamName: 'Museo FIFA' });
  });

// Versión 3: catálogo Panini real
//   - Reescribe teams.ts con los 48 equipos del sorteo oficial (algunos países cambiaron)
//   - Reescribe nombres de jugadores con la checklist oficial (eran "Jugador N")
//   - Mueve team_photo de position 2 a position 13 (estructura real del álbum)
//
// Estrategia: borrar y re-seedar la tabla `stickers` desde el JSON nuevo.
// La tabla `collection` se preserva intacta — el progreso del usuario sigue indexado
// por stickerId, y los IDs de equipos comunes (ARG, BRA, etc.) no cambian. Las
// entradas de collection huérfanas (de equipos eliminados como ITA, DEN) quedan en
// la tabla pero no se mostrarán en la UI porque no hay sticker que las referencie.
db.version(3)
  .stores({
    stickers: 'id, team, group, section, type',
    collection: 'stickerId',
  })
  .upgrade(async (tx) => {
    const stickersTable = tx.table<Sticker>('stickers');
    await stickersTable.clear();
    await stickersTable.bulkAdd(stickersData as Sticker[]);
  });
