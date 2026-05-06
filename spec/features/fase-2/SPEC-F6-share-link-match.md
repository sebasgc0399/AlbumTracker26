# SPEC F6 — Link compartible + comparador automático

> Dependencias: F0 (lz-string + useLocalStoragePref), F4 (modelo TradeLists + useTradeableLists)
> Paralelizable con: F5, F7

## Qué

Generar URL con la lista Cambio/Busco serializada en el hash (`#d=...`), comprimida con `lz-string`. Quien abra el link ve la lista del otro en una vista read-only. Si tiene la app instalada con su propia colección, **compara automáticamente** y muestra el match.

## Criterio de done

- [ ] Botón "Compartir link" en `DuplicatesPage` genera URL `${location.origin}/share#d=<lz-string>` y la pasa a `navigator.share({ url })` o portapapeles
- [ ] Payload comprimido < `MAX_SHARE_PAYLOAD_BYTES` (1900) para listas típicas (~30-50 IDs)
- [ ] Si excede, toast "Lista muy larga, achicá manualmente" + no compartir
- [ ] Ruta `/share` en App.tsx renderiza `SharedListPage` que decodifica el hash
- [ ] Si decode falla (hash corrupto o vacío) → toast "Link inválido" + redirect a `/`
- [ ] Si `db.collection.count() === 0` (visitante sin colección): vista read-only con flag + IDs + nombres reconstruidos desde `stickers.json` local + CTA "Instalá AT26 para ver el match con tu colección"
- [ ] Si hay colección: bloque "Match con tu colección" con dos sub-listas:
  - **Le puedes dar:** sus repetidas (mías de F4 hooks) que están en el "Busco" del otro
  - **Te puede dar:** las repetidas del otro que están en mi "Busco"
- [ ] Toggle "Mostrar todo / Solo matches" persistido en localStorage (`useLocalStoragePref('share.showAll', true)`)
- [ ] Settings simple para nickname: input en HomePage o pantalla settings que escribe `at26.pref.nickname` en localStorage
- [ ] Header de SharedListPage: "Lista de {n}" si hay nickname, fallback "Lista compartida"
- [ ] Funciona offline tras la primera carga (PWA cache)

## Archivos a crear/modificar

- `src/utils/encodeTradeList.ts` (nuevo, **pure function**)
- `src/utils/matchLists.ts` (nuevo, **pure function**)
- `src/pages/SharedListPage.tsx` (nuevo)
- `src/components/ShareLinkButton.tsx` (nuevo)
- `src/pages/HomePage.tsx` (modificar) — agregar input de nickname o link a settings
- `src/pages/DuplicatesPage.tsx` (modificar) — agregar botón ShareLinkButton
- `src/App.tsx` (modificar) — agregar ruta `/share`

## Pure functions

### `encodeTradeList`
```ts
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { TradeLists } from '@/utils/types';

interface EncodedPayload {
  v: 1;          // versionado day-1
  d: string[];   // duplicate sticker IDs (count >= 2)
  b: string[];   // missing sticker IDs
  n?: string;    // nickname opcional, max 24 chars
}

export function encodeTradeList(lists: TradeLists): string;
export function decodeTradeList(hash: string): TradeLists | null;
```

- `encode`: construye `EncodedPayload`, `JSON.stringify`, `compressToEncodedURIComponent`. Trim nickname a 24 chars.
- `decode`: `decompressFromEncodedURIComponent`, `JSON.parse`, validar shape + `v === 1`. Si falla, retornar `null`.
- **Reconstrucción de Sticker** desde IDs: NO se hace acá (se hace en `SharedListPage` con su `stickers.json` local). Esta función solo serializa IDs.

### `matchLists`
```ts
import type { Sticker, CollectionEntry } from '@/db/database';
import type { TradeLists } from '@/utils/types';

export interface MatchResult {
  canGive: Sticker[];      // mis duplicates que el otro busca
  canReceive: Sticker[];   // sus duplicates que yo busco
}

export function matchLists(
  myCollection: Map<string, CollectionEntry>,
  myStickers: Sticker[],            // catálogo local
  theirLists: TradeLists,
): MatchResult;
```

Pura. Sin imports de Dexie/React.

Lógica:
1. Extraer mis duplicates: `myCollection` filtrar `count >= 2`, mapear a `Sticker[]` cruzando con `myStickers`
2. Extraer mis missing: `myStickers` que NO están en `myCollection` con `count > 0`
3. `canGive` = mis duplicates ∩ `theirLists.missing`
4. `canReceive` = `theirLists.duplicates` ∩ mis missing

## Página `SharedListPage`

Ruta `/share`. Layout:
- Header con "Lista de {n}" o "Lista compartida"
- Si DB vacía: lista read-only del emisor + banner CTA install
- Si DB con colección:
  - Bloque "Match con tu colección" arriba (canGive + canReceive)
  - Toggle "Mostrar todo / Solo matches"
  - Lista completa del emisor abajo

**Sin BottomNav en `/share`**: la ruta debe estar fuera del wrapper de BottomNav, o el componente decide no renderizarla. Para mantener `App.tsx` simple, conviene una variable `const isShareRoute = location.pathname === '/share'` en App.tsx que condiciona el render de `<BottomNav />`.

## Notas de implementación

- **Nickname**: el flujo de settings puede ser un simple `<input>` en HomePage que persiste con `useLocalStoragePref('nickname', '')`. No hace falta una pantalla settings dedicada.
- **lz-string API**: `compressToEncodedURIComponent` produce un string URL-safe que NO necesita `encodeURIComponent` adicional. La URL final tiene formato `https://host/share#d=ABC123...`.
- **Validar tamaño post-encode**: `if (encoded.length > MAX_SHARE_PAYLOAD_BYTES)` mostrar toast y no continuar.
- **Hash vs query param**: el hash NO llega al servidor. Importante para privacidad y para que el SW cachee `/share` sin variar por contenido.

## Restricciones

- **NO commitees ni pushees**.
- **NO toques** archivos fuera de los listados.
- Las pure functions NO deben importar de `dexie` ni `react`.
