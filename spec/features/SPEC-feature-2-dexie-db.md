# SPEC F2 — Dexie DB Schema + Inicialización

> Dependencias: F1 (necesita `stickers.json`)
> Bloquea: F4, F5, F6 (todas las pantallas leen de la DB)

## Qué

Definir IndexedDB vía Dexie con dos tablas: `stickers` (catálogo inmutable) y `collection` (estado del usuario). Al abrir la app por primera vez, se ejecuta el seed desde `stickers.json`.

## Criterio de done

- [ ] La DB se crea automáticamente al abrir la app por primera vez
- [ ] La tabla `stickers` contiene las 994 láminas con toda su metadata
- [ ] La tabla `collection` se inicializa vacía
- [ ] Si la DB ya existe (segunda visita), no se re-seedea (`db.stickers.count() === 0` como guard)
- [ ] `useLiveQuery` de `dexie-react-hooks` funciona para queries reactivos
- [ ] Hooks expuestos: `useStickers(team?)`, `useCollection()`, `useProgress()`

## Archivos a crear

- `src/db/database.ts` — Dexie DB definition + interfaces TS (`Sticker`, `CollectionEntry`)
- `src/db/seed.ts` — `seedDatabase()` que carga JSON → tabla `stickers` si está vacía
- `src/db/hooks.ts` — Custom hooks usando `useLiveQuery`

## Schema Dexie

```typescript
import Dexie, { type EntityTable } from 'dexie';

interface Sticker {
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

interface CollectionEntry {
  stickerId: string;
  owned: boolean;
  count: number;
}

const db = new Dexie('AlbumTracker26') as Dexie & {
  stickers: EntityTable<Sticker, 'id'>;
  collection: EntityTable<CollectionEntry, 'stickerId'>;
};

db.version(1).stores({
  stickers: 'id, team, group, section, type',
  collection: 'stickerId',
});
```

## Razón de las dos tablas separadas

- Re-seedear el catálogo (al cargar nombres reales de jugadores en v1.1) sin tocar el progreso del usuario.
- Queries de "faltantes" más limpios: lámina sin entry en `collection` = no la tengo.

## Notas

- `seedDatabase()` se llama desde `main.tsx` antes de `createRoot`, esperando la promesa.
- Los hooks reactivos requieren import específico: `import { useLiveQuery } from 'dexie-react-hooks'`, no de `dexie`.
- `useProgress()` debe devolver `{ owned: number; total: 994; duplicates: number }`. **El total es 994** — todas las láminas que tienen espacio físico en el álbum (incluye las 14 de Coca-Cola). `owned` suma entries con `count > 0` sin filtrar por sección. `duplicates` es `sum(count - 1)` para entries con `count > 1`.
