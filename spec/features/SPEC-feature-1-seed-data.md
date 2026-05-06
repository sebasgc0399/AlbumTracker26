# SPEC F1 — Seed Data: JSON de las 992 láminas

> Dependencias: ninguna (pero requiere setup base de Vite + TS antes)
> Bloquea: F2 (la DB necesita el JSON para seedear), F4-F6 (queries dependen de los datos)

## Qué

Archivo JSON estático con la metadata de las 992 láminas del álbum, organizado por sección y equipo. Se incluye en el bundle de Vite y se carga en IndexedDB la primera vez que se abre la app.

## Composición del álbum (992 láminas)

| Sección       | Cantidad | IDs                           |
| ------------- | -------- | ----------------------------- |
| Introducción  | 9        | `FWC1`–`FWC9`                 |
| FIFA Museum   | 11       | `FWC10`–`FWC20`               |
| Equipos × 48  | 960      | `{COUNTRY}{1-20}` (ej. `COL7`) |
| Coca-Cola     | 12       | `CC1`–`CC12`                  |

Cada equipo: 1 escudo (`badge`, foil) + 1 foto equipo (`team_photo`) + 18 jugadores (`player`).

## Criterio de done

- [ ] `src/data/stickers.json` existe con exactamente 992 entries
- [ ] Cada entry tiene: `id`, `number`, `name`, `team`, `teamName`, `group`, `section`, `type`, `position`
- [ ] Equipos organizados por grupo del Mundial (A–L, 4 equipos por grupo)
- [ ] Jugadores con nombre placeholder (`"Jugador 1"`...`"Jugador 18"`) — se actualizan en v1.1
- [ ] Escudos, fotos de equipo, intro, museo y CC tienen nombres descriptivos reales (ej. "Escudo Colombia")
- [ ] El JSON se importa correctamente en TS (tipo `Sticker[]`)

## Archivos a crear

- `src/data/teams.ts` — Constantes: 48 equipos con `code`, `name`, `group`, `flag` (emoji)
- `src/data/generate-stickers.ts` — Script Node que produce `stickers.json` desde `teams.ts`
- `src/data/stickers.json` — Output del script (committeado al repo)

## Estrategia para los 48 equipos

Los 48 países del Mundial 2026 con sus grupos están en la documentación oficial de FIFA. Cada equipo necesita: código ISO (3 letras), nombre completo en español, grupo (A–L), bandera emoji.

Países anfitriones (clasificados directo): USA, MEX, CAN. Resto vía clasificatorias regionales.

## Notas

- El usuario identifica láminas por **número/ID**, no por nombre del jugador. Esto valida los placeholders en MVP.
- El script `generate-stickers.ts` se corre con `npx tsx src/data/generate-stickers.ts` y escribe el output a disco.
- v1.1 (post-MVP) actualiza nombres reales — es un data update, no un cambio de código.
