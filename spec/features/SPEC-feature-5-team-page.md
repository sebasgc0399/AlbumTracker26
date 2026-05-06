# SPEC F5 — Pantalla de Equipo: Grid de Láminas + Toggle

> Dependencias: F2 (mutations + queries), F4 (navegación desde Home)
> Bloquea: F7 (la tab Inicio entra acá), F6 (la búsqueda navega acá al elegir resultado)

## Qué

Al entrar a un equipo, grid de sus 20 láminas. Cada lámina es un "chip" con su número. Tap simple en lámina no tenida → la marca como tenida. Tap en lámina ya tenida → abre detalle con stepper para registrar repetidas.

## Criterio de done

- [ ] Header del equipo: nombre, bandera emoji, progreso (`12/20`)
- [ ] Grid de 20 láminas en 4 columnas (mobile)
- [ ] Cada chip muestra: número (`COL7`), indicador visual del tipo (badge/foto/jugador)
- [ ] Tap en lámina **no tenida** → `owned=true, count=1` + cambio de color gris→verde
- [ ] Tap en lámina **ya tenida** → bottom sheet con: nombre, stepper +/-, botón "No la tengo" para `count=0`
- [ ] Cambios persisten en IndexedDB inmediatamente (sin botón guardar)
- [ ] Láminas tipo `badge` y `team_photo` con indicador visual diferente (ícono o borde)
- [ ] Haptic feedback en tap si el dispositivo lo soporta (`navigator.vibrate(10)` con check de presencia)
- [ ] Existe pantalla intermedia `GroupPage` que lista los 4 equipos del grupo

## Archivos a crear

- `src/pages/GroupPage.tsx` — Lista los 4 equipos del grupo (`/group/:groupId`)
- `src/pages/TeamPage.tsx` — Grid de las 20 láminas (`/team/:teamCode`)
- `src/components/StickerChip.tsx` — Chip individual con estados missing/owned/duplicated
- `src/components/StickerDetail.tsx` — Bottom sheet con detalle + stepper
- `src/components/QuantityStepper.tsx` — Control +/- para cantidad de repetidas

## Estados visuales del chip

- **Gris claro:** `count === 0` o entry inexistente en `collection` — no la tengo
- **Verde:** `count === 1` — la tengo, sin repetidas
- **Verde con badge numérico:** `count > 1` — la tengo + N-1 repetidas

## Notas

- El stepper debe ser rápido. Patrón: botones +/- con long-press para incremento rápido (acelerador).
- `navigator.vibrate` no existe en iOS Safari → check `if ('vibrate' in navigator)` antes de llamar.
- Bottom sheet vs modal: bottom sheet es preferido en mobile (pulgar alcanza más fácil que centro de pantalla).
- La mutación a `collection` es upsert: si no existe entry, crear; si existe, actualizar. Dexie `put()` cubre ambos casos.
- Los foils (`badge`) tradicionalmente se ven distintos en el álbum físico — usar borde dorado o ícono ⭐ para diferenciar.
