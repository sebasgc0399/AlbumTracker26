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

// Versión 4: catálogo Coca-Cola corregido a 14 láminas (era 12)
//   - El álbum físico tiene CC1..CC14, no CC1..CC12 como decía la SPEC inicial.
//   - Los nombres CC1..CC14 ahora son los jugadores reales (eran "Coca-Cola Especial N").
//   - Total real del álbum: 994, no 992.
//
// Misma estrategia que v3: re-seedear `stickers` desde el JSON nuevo. La tabla
// `collection` queda intacta — los IDs de las CC existentes (CC1..CC12) no
// cambian y los dos nuevos (CC13, CC14) simplemente aparecen como "no tengo".
db.version(4)
  .stores({
    stickers: 'id, team, group, section, type',
    collection: 'stickerId',
  })
  .upgrade(async (tx) => {
    const stickersTable = tx.table<Sticker>('stickers');
    await stickersTable.clear();
    await stickersTable.bulkAdd(stickersData as Sticker[]);
  });

// Versión 5: catálogo intro corregido — los nombres FWC1..FWC9 que la SPEC
// había asumido ("Logo FIFA", "Trofeo", 3 mascotas separadas, 3 sedes) no
// matcheaban el álbum físico ni la app oficial Panini. La intro real son 9
// láminas: una etiquetada "00" (Panini de marca, sin prefijo FWC) + FWC1..FWC8
// (Emblemas, Mascotas como un solo sticker, Eslogan, Balón Trionda, Anfitrión
// CAN/MEX/USA). Total del álbum sigue en 994.
//
// Misma estrategia que v3/v4: re-seedear `stickers`. La tabla `collection`
// queda intacta — los IDs FWC3..FWC9 cambian de significado (entries existentes
// quedan asociadas a stickers con nombres distintos) y FWC9 desaparece (entries
// huérfanas, no aparecen en UI). Aceptable porque los nombres anteriores eran
// incorrectos: el progreso anterior en intro era ya semánticamente inválido.
db.version(5)
  .stores({
    stickers: 'id, team, group, section, type',
    collection: 'stickerId',
  })
  .upgrade(async (tx) => {
    const stickersTable = tx.table<Sticker>('stickers');
    await stickersTable.clear();
    await stickersTable.bulkAdd(stickersData as Sticker[]);
  });

// Versión 6: catálogo Museo FIFA corregido contra el álbum físico + intro
// con emblemas distinguibles.
//   - Museo, rango: FWC10..FWC20 → FWC9..FWC19. La SPEC inicial asumió que
//     el museo empezaba en FWC10 porque pensó que FWC9 era parte de intro;
//     en realidad intro va 00 + FWC1..FWC8 y FWC9 abre el museo.
//   - Museo, subset de campeones: solo coincidía 4/11 con la app oficial
//     Panini. Reemplazado por el subset real (Italia 1934, Uruguay 1950,
//     Alemania Occidental 1954, Brasil 1962, Alemania Occidental 1974,
//     Argentina 1986, Brasil 1994, Brasil 2002, Italia 2006, Alemania 2014,
//     Argentina 2022).
//   - Museo, formato del nombre: de "Campeón {Año} - {País}" a "Foto del
//     equipo ({País} {Año})" para reflejar lo que rotula el álbum (son fotos
//     del equipo campeón, no medallas/trofeos).
//   - Intro, FWC1/FWC2: ambos eran "Emblema Oficial" (indistinguibles en
//     UI). El álbum los numera 1/2 y 2/2 — actualizado a "Emblema Oficial 1/2"
//     y "Emblema Oficial 2/2".
//
// Misma estrategia que v3..v5: re-seedear `stickers`. La tabla `collection`
// queda intacta — entries existentes en FWC10..FWC19 cambian de significado
// (apuntan ahora a campeones distintos) y FWC20 desaparece (entries huérfanas
// no se renderizan). Aceptable porque el rango y el subset anteriores eran
// incorrectos: cualquier progreso previo en el museo era ya semánticamente
// inválido.
db.version(6)
  .stores({
    stickers: 'id, team, group, section, type',
    collection: 'stickerId',
  })
  .upgrade(async (tx) => {
    const stickersTable = tx.table<Sticker>('stickers');
    await stickersTable.clear();
    await stickersTable.bulkAdd(stickersData as Sticker[]);
  });

// Versión 7: correcciones de nombres de jugadores tras validación contra el
// álbum físico (sesión 2026-05-06, 8 países revisados: PAN, NOR, TUR, SWE,
// POR, CZE, MAR, ALG = 144 jugadores verificados manualmente).
//   - SWE16 "Roony Bardghi" → "Roony Bardghji" (la app omitía la J)
//   - MAR15 "Ismaël Saibari" → "Ismael Saibari" (sin diéresis francesa, así
//     lo imprime el álbum para este nombre específico)
//   - ALG6 "Mohamed Amine" → "Mohamed Amine Tougai" (apellido faltante)
//   - ALG15 "Por confirmar" → "Riyad Mahrez" (no era slot quemado, Panini sí
//     lo asignó al capitán argelino)
//   - ALG17 "Anis Hadj" → "Anis Hadj Moussa" (apellido truncado)
//
// Misma estrategia que v3..v6: re-seedear `stickers`. La tabla `collection`
// queda intacta — los IDs no cambian, solo el nombre asociado a cada sticker.
// Si el usuario tenía marcadas SWE16/MAR15/ALG6/ALG15/ALG17, el progreso se
// preserva (el "tengo esa lámina" sigue siendo válido aunque el nombre
// mostrado sea distinto).
db.version(7)
  .stores({
    stickers: 'id, team, group, section, type',
    collection: 'stickerId',
  })
  .upgrade(async (tx) => {
    const stickersTable = tx.table<Sticker>('stickers');
    await stickersTable.clear();
    await stickersTable.bulkAdd(stickersData as Sticker[]);
  });
