# SPEC — Catálogo Panini Mundial 2026 real (v1.1 data update)

> Dependencias: F1 (seed-data), F2 (dexie-db), F8 (search), F16 (banderas)
> Bloquea: ninguna

## Qué

Reemplazar el catálogo aproximado del MVP con el catálogo oficial del álbum Panini
FIFA World Cup 2026. Originalmente el SPEC era solo "nombres reales de jugadores",
pero al cruzar con la fuente oficial descubrimos tres divergencias que requieren
ampliar el alcance:

1. **Nombres de jugadores:** las 864 láminas de tipo `player` tenían placeholder
   `"Jugador N"` — ahora cargan los nombres reales de la checklist Panini.
2. **Lista de equipos:** `teams.ts` tenía 10 selecciones que NO clasificaron
   (Italy, Denmark, Poland, Venezuela, Bolivia, Cameroon, Nigeria, Mali, Costa
   Rica, Jamaica) y le faltaban las 10 que sí clasificaron y aparecen en el álbum
   (Czechia, Bosnia y Herzegovina, Haiti, Scotland, Curaçao, Sweden, Austria,
   Norway, RD Congo, Cabo Verde). También los grupos del sorteo eran ficticios.
3. **Estructura posicional:** el código generaba la foto de equipo en `position 2`,
   pero en el álbum físico la foto de equipo está en `position 13`. Las posiciones
   2-12 son los primeros 11 jugadores y las posiciones 14-20 son los últimos 7.

## Criterio de done

- [x] `src/data/teams.ts` lista los 48 equipos del sorteo oficial Mundial 2026
      (5 dic 2025) con sus grupos A-L, códigos FIFA y `flagCode` ISO 2-letter
- [x] `src/data/players.ts` existe y exporta `PLAYERS: Record<string, readonly string[]>`
      con 48 entradas y 18 strings cada una
- [x] Cada nombre de los 23 equipos confirmados sigue formato `Nombre Apellido`
      con tildes correctas verificadas (Mbappé, Müller, Díaz, Muñoz, Ríos, etc.)
- [x] Los 25 equipos pendientes de captura del usuario tienen placeholder
      explícito `"Pendiente {CODE} {N}"` — fácilmente greppable
- [x] `src/data/generate-stickers.ts` mapea posición → tipo según estructura real:
      pos 1 = badge, pos 13 = team_photo, pos 2-12 y 14-20 = player
- [x] El generador valida que cada equipo en `PLAYERS` tenga 18 strings no vacías
- [x] `src/data/stickers.json` regenerado: 992 entries, 0 ocurrencias de "Jugador "
- [x] `src/db/database.ts` define versión 3 con upgrade callback que limpia y
      re-seedea la tabla `stickers` desde el JSON nuevo. La tabla `collection`
      (owned/count) NO se toca — el progreso del usuario se preserva
- [x] `src/pages/SearchPage.tsx` matchea contra `id` Y `name` con normalización
      (lowercase + remove diacritics). Buscar "diaz" devuelve COL20
- [x] El placeholder y copy del input de búsqueda se actualiza para hint del
      nuevo comportamiento ("COL7, Messi, Mbappé...")
- [x] El input de búsqueda deja de forzar uppercase (afectaba la UX al tipear
      nombres como "Messi" que se veían como "MESSI")
- [x] `npm run flags:sync` copia las 10 banderas SVG nuevas (ba, cz, ht, gb-sct,
      cw, se, at, no, cd, cv) y elimina las 10 obsoletas
- [x] `npm run build` compila sin errores TypeScript
- [ ] Capturas de los 25 equipos pendientes recibidas y nombres completados
- [ ] Build de producción y verificación end-to-end en navegador

## No incluye

- No modifica el formato del ID (`COL20` sigue siendo el identificador primario)
- No agrega highlighting del término buscado en los resultados
- No cambia la grilla de `TeamPage.tsx` ni `StickerDetail.tsx` — solo se beneficia
  automáticamente del nuevo `sticker.name`
- No incluye nombres de jugadores Coca-Cola promo (CC1-CC12) — esos siguen como
  "Coca-Cola Especial N" salvo que Panini publique nombres específicos
- No agrega los 11 stickers nuevos como "futuro nombre Cabo Verde" — todos los
  países pendientes tienen placeholders explícitos hasta tener captura

## Archivos creados/modificados

- `src/data/teams.ts` (reescrito) — 48 equipos del sorteo oficial Mundial 2026
- `src/data/players.ts` (**nuevo**) — fuente de verdad de los 864 nombres
- `src/data/generate-stickers.ts` (modificado) — import PLAYERS, validación de
  roster, lógica posicional corregida (pos 13 = team_photo)
- `src/data/stickers.json` (regenerado) — 992 entries con catálogo Panini real
- `src/db/database.ts` (modificado) — agregado bloque `db.version(3)` con upgrade
- `src/pages/SearchPage.tsx` (modificado) — helper `normalize`, filtro extendido,
  placeholder actualizado, input sin uppercase forzado
- `package.json` (modificado) — script `generate:stickers`
- `public/flags/` (regenerado vía `npm run flags:sync`) — 10 banderas nuevas

## Notas técnicas

### Lista de equipos por grupo (sorteo oficial Mundial 2026)

| Grupo | Equipos                                  |
| ----- | ---------------------------------------- |
| A     | MEX · RSA · KOR · CZE                    |
| B     | CAN · BIH · QAT · SUI                    |
| C     | BRA · MAR · HAI · SCO                    |
| D     | USA · PAR · AUS · TUR                    |
| E     | GER · CUW · CIV · ECU                    |
| F     | NED · JPN · SWE · TUN                    |
| G     | BEL · EGY · IRN · NZL                    |
| H     | ESP · CPV · KSA · URU                    |
| I     | FRA · SEN · IRQ · NOR                    |
| J     | ARG · ALG · AUT · JOR                    |
| K     | POR · COD · UZB · COL                    |
| L     | ENG · CRO · GHA · PAN                    |

### Estructura posicional del álbum

```
position 1     -> escudo (badge)
position 2-12  -> 11 jugadores (índices 0..10 en PLAYERS[code])
position 13    -> foto de equipo (team_photo)
position 14-20 -> 7 jugadores (índices 11..17 en PLAYERS[code])
```

Helper en generate-stickers.ts:
```typescript
function playerIndexFromPosition(position: number): number {
  if (position >= 2 && position <= 12) return position - 2;
  if (position >= 14 && position <= 20) return position - 3;
  throw new Error(`Posición ${position} no corresponde a un jugador`);
}
```

### Migración Dexie v3

Limpia la tabla `stickers` y la re-seedea desde el JSON nuevo. Es necesario porque
muchos campos cambian (nombre, type, equipo eliminado/agregado), y un upgrade
selectivo (solo `name`) sería más complejo y propenso a inconsistencias.

```typescript
db.version(3)
  .stores({ stickers: 'id, team, group, section, type', collection: 'stickerId' })
  .upgrade(async (tx) => {
    const stickersTable = tx.table<Sticker>('stickers');
    await stickersTable.clear();
    await stickersTable.bulkAdd(stickersData as Sticker[]);
  });
```

La tabla `collection` se preserva intacta. Las entradas huérfanas (de equipos
eliminados como ITA, DEN) quedan en la tabla pero no se mostrarán en la UI porque
no hay sticker que las referencie.

### Búsqueda con normalización en SearchPage.tsx

```typescript
const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const matches = useMemo<Sticker[]>(() => {
  if (!sortedStickers || trimmed.length === 0) return [];
  const needle = normalize(trimmed);
  return sortedStickers.filter(
    (sticker) =>
      sticker.id.toLowerCase().includes(needle) ||
      normalize(sticker.name).includes(needle),
  );
}, [sortedStickers, trimmed]);
```

## Equipos pendientes (esperando captura del álbum físico)

Los siguientes 25 equipos tienen placeholder `"Pendiente {CODE} {N}"` y se
completarán cuando el usuario provea captura de la página correspondiente:

RSA, CZE, BIH, QAT, MAR, HAI, SCO, PAR, TUR, CUW, SWE, BEL, NZL, CPV, KSA,
SEN, IRQ, NOR, ALG, AUT, JOR, COD, UZB, GHA, PAN.

Equipos confirmados (23): ARG, AUS, BRA, CAN, CIV, COL, CRO, ECU, EGY, ENG,
ESP, FRA, GER, IRN, JPN, KOR, MEX, NED, POR, SUI, TUN, URU, USA.

## Verificación end-to-end

1. `npm run flags:sync` → "Copied 48/48 SVGs", "Pruned 10 stale SVG(s)" ✅
2. `npm run generate:stickers` → "Total: 992", "Escrito: ...stickers.json" ✅
3. `grep -c "Jugador " src/data/stickers.json` → `0` ✅
4. Verificación manual de stickers conocidos:
   - `ARG2` = "Emiliano Martínez" ✅
   - `ARG13` = "Foto de equipo Argentina" ✅
   - `COL13` = "Foto de equipo Colombia" ✅
   - `COL20` = "Luis Díaz" ✅
   - `FRA20` = "Kylian Mbappé" ✅
5. `npm run build` → sin errores TypeScript ✅
6. `npm run dev` + DevTools (pendiente):
   - IndexedDB AlbumTracker26 sube a versión 3 al primer load
   - Tabla `stickers` con 992 entries, nombres reales en player type
   - Tabla `collection` con `owned`/`count` previos intactos
   - SearchPage: buscar "messi" devuelve ARG17, "diaz" devuelve COL20
   - Tap en resultado incrementa count y limpia input
