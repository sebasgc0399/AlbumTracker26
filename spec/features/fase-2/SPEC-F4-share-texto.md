# SPEC F4 — Compartir lista en texto (WhatsApp + clipboard)

> Dependencias: F0, F1, F2 (necesita el modelo de datos consolidado)
> Bloquea: F5 (reutiliza `formatTradeList`), F6 (reutiliza modelo)

## Qué

Botón "Compartir lista" en `DuplicatesPage` y `MissingPage` que arma texto plano formateado y lo manda al Web Share API si está disponible, fallback a Clipboard API.

## Criterio de done

- [ ] Botón en `DuplicatesPage` y `MissingPage`. Mismo componente reusado.
- [ ] Formato exacto:
  ```
  🟢 CAMBIO (23): COL3, COL7, COL12 (3) | ARG1, ARG14 (2) | BRA12 | ...
  🔴 BUSCO (15): ESP4, FRA9 | ITA1, ITA7 (2) | ...

  Panini Mundial 2026 — generado con AT26
  ```
- [ ] IDs ordenados con **natural sort**: `COL3, COL7, COL12` (no `COL12, COL3, COL7`). Usar `localeCompare(undefined, { numeric: true })`.
- [ ] Cuando hay 3+ del mismo equipo, mostrar `(N)` al final del grupo. Si hay <3, listar separados por coma sin agrupación.
- [ ] Lista vacía → omitir la sección entera (no `🟢 CAMBIO (0):`).
- [ ] Botón usa `navigator.share({ text })` si `canShare({ text })` retorna true; si no, copia al portapapeles con `navigator.clipboard.writeText` y muestra toast "Copiado al portapapeles"
- [ ] Toggle "incluir Coca-Cola" — default `false` (excluir), persiste en localStorage (`useLocalStoragePref('share.includeCC', false)`)
- [ ] Excluye láminas con `count === 1` de "Cambio" (solo `count ≥ 2` cuenta como repetida real)

## Archivos a crear/modificar

- `src/utils/formatTradeList.ts` (nuevo, **pure function**)
- `src/db/hooks.ts` (modificar) — agregar `useTradeableLists()`
- `src/components/ShareListButton.tsx` (nuevo)
- `src/pages/DuplicatesPage.tsx` (modificar) — agregar botón
- `src/pages/MissingPage.tsx` (modificar) — agregar botón

## Pure function `formatTradeList`

```ts
import type { TradeLists } from '@/utils/types';

interface FormatOptions {
  includeCC: boolean;
}

export function formatTradeList(lists: TradeLists, opts: FormatOptions): string;
```

**Sin imports de `dexie` ni `react`** — testeable trivialmente.

Lógica:
1. Filtrar duplicates: `extra >= 1` (count >= 2). Si `!includeCC`, descartar `team === 'CC'`.
2. Filtrar missing: idem.
3. Agrupar por `team`. Para cada grupo:
   - Si tiene 3+ entries: `COL3, COL7, COL12 (3)`
   - Si tiene 1-2: `COL3` o `COL3, COL7`
4. Concatenar grupos con ` | `.
5. Sort: `localeCompare(undefined, { numeric: true })`.
6. Si la sección queda vacía, omitirla entera.

## Hook `useTradeableLists()`

```ts
export function useTradeableLists(): TradeLists | undefined;
```

Reusa lógica de `useDuplicatesByTeam` (F1) y `useMissingByTeam` (F2). Devuelve `TradeLists` con `duplicates: TradeEntry[]`, `missing: Sticker[]`, y `nickname: localStorage['at26.pref.nickname']` si existe.

## Componente `ShareListButton`

```ts
interface ShareListButtonProps {
  // sin props, usa useTradeableLists internamente
}
```

- Render: `<button>` con label "Compartir lista" + ícono 💬 o similar
- Loading state si `lists === undefined`
- Disabled si ambas (duplicates y missing) están vacías
- onClick:
  1. Lee toggle CC desde localStorage
  2. Llama `formatTradeList(lists, { includeCC })`
  3. Si `navigator.canShare?.({ text })` → `navigator.share({ text })`. En catch (ej. user cancela), no hacer nada.
  4. Sino → `navigator.clipboard.writeText(text)` + toast "Copiado al portapapeles"

## Restricciones

- **NO commitees ni pushees**.
- **NO toques** archivos fuera de los listados.
- `formatTradeList.ts` debe ser pure (sin React, sin Dexie). Testeable en isolation.
