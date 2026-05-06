# SPEC F0 — Pre-requisitos Fase 2

> Owner: orquestador (NO se delega a agente)
> Bloquea: todas las features de Fase 2 (F1-F7)

## Qué

Setup baseline antes de delegar features. Toca: dep nueva, schema migration Dexie v2, tokens CSS faltantes, hooks de persistencia, dir `src/utils/` con constants y types compartidos.

## Cambios

### 1. Dependencia nueva
```bash
npm install lz-string@^1.5.0
```

### 2. Schema migration Dexie v2 (`src/db/database.ts`)
Bumpear a versión 2 con `upgrade` callback que arregla el `teamName` viejo de FWC10–FWC20 (los seedeados antes del fix `feat(data): teamName 'Museo FIFA'`):

```ts
db.version(2).upgrade(async (tx) => {
  await tx.table('stickers')
    .where('section').equals('museum')
    .modify({ teamName: 'Museo FIFA' });
});
```

Mantener `db.version(1).stores(...)` intacto (Dexie requiere todas las versiones previas).

### 3. Open explícito (`src/main.tsx`)
Agregar `await db.open()` antes de `seedDatabase()` para evitar race condition con upgrade async:

```ts
import { db } from '@/db/database';
import { seedDatabase } from '@/db/seed';
// ...
await db.open();
await seedDatabase();
```

### 4. Token CSS rojo (`src/index.css`)
Agregar dentro de `@theme inline`:
```css
--color-destructive: oklch(0.6 0.22 25);
--color-destructive-foreground: oklch(1 0 0);
```

### 5. Hooks de persistencia

`src/hooks/useLocalStoragePref.ts` (nuevo):
```ts
export function useLocalStoragePref<T>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void];
```
- Key prefix interno: `at26.pref.{key}` (no exponerlo en signature)
- `useState` inicial leyendo `localStorage` con `try/catch` + `JSON.parse`
- Setter actualiza state y `localStorage` en el mismo callback
- Listener `window.addEventListener('storage', ...)` para sync entre tabs

`src/hooks/useSessionStoragePref.ts` (nuevo):
- Mismo shape, sin sync entre tabs
- Key prefix `at26.session.{key}`

### 6. Utils compartidos (`src/utils/`)

`src/utils/constants.ts`:
```ts
export const ALMOST_COMPLETE_THRESHOLD = 3;
export const MAX_SHARE_PAYLOAD_BYTES = 1900;
export const MAX_DUPLICATE_COUNT = 20;
```

`src/utils/types.ts`:
```ts
import type { Sticker } from '@/db/database';

export interface TradeEntry {
  sticker: Sticker;
  extra: number; // count - 1, lo que sobra para cambiar
}

export interface TradeLists {
  duplicates: TradeEntry[];
  missing: Sticker[];
  nickname?: string;
}
```

## Criterio de done

- [ ] `package.json` lista `lz-string` en `dependencies`
- [ ] `db.version(2).upgrade(...)` corre sin errores al abrir la app con DB v1 existente
- [ ] `main.tsx` espera `db.open()` antes de seed
- [ ] Tokens `--color-destructive` y `--color-destructive-foreground` accesibles desde Tailwind (`bg-destructive`, `text-destructive-foreground`)
- [ ] `useLocalStoragePref` y `useSessionStoragePref` exportados desde `src/hooks/`
- [ ] `src/utils/constants.ts` y `src/utils/types.ts` exportan los símbolos listados
- [ ] `npx tsc -b` pasa
- [ ] `npm run build` pasa

## Archivos
- `package.json` (modificar)
- `src/db/database.ts` (modificar)
- `src/main.tsx` (modificar)
- `src/index.css` (modificar)
- `src/hooks/useLocalStoragePref.ts` (nuevo)
- `src/hooks/useSessionStoragePref.ts` (nuevo)
- `src/utils/constants.ts` (nuevo)
- `src/utils/types.ts` (nuevo)
