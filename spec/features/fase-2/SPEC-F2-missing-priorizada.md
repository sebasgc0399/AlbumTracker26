# SPEC F2 — MissingPage (faltantes priorizada) + 4ª tab

> Dependencias: F0
> Bloquea: F4 (modelo de datos), F6 (matchLists usa missing)
> Paralelizable con: F1, F3

## Qué

Vista espejo de F1 pero para faltantes (`count === 0` o sin entry). Agrupada por equipo, ordena "menos faltantes primero" (motivación psicológica: "solo te falta 1 de Argentina"). Agrega 4ª tab al BottomNav.

## Criterio de done

- [ ] Acceso vía nueva tab inferior 🎯 "Me Falta" → `/missing`. BottomNav reordenado: Inicio / Buscar / Repetidas / Me Falta
- [ ] Agrupación por equipo, ordenada por "menos faltantes primero"
- [ ] Header por equipo con `TeamGroupHeader` (creado en F1) + texto `X faltantes de 20` + ProgressBar mini
- [ ] Cada faltante como `MissingRow`: `id`, nombre. Sin acciones inline (el "des-faltear" ocurre en TeamPage o F7 cambiaton)
- [ ] Toggle "todos / casi completos (≤ALMOST_COMPLETE_THRESHOLD)" persistido en localStorage (`useLocalStoragePref('missing.almostOnly', false)`)
- [ ] Equipos 100% completos NO aparecen en ninguno de los dos modos
- [ ] Skeleton mientras `useMissingByTeam` devuelve `undefined`
- [ ] Empty state: si no faltan láminas, mensaje "Felicitaciones, completaste el álbum"

## Archivos a crear/modificar

- `src/pages/MissingPage.tsx` (nuevo)
- `src/components/MissingRow.tsx` (nuevo)
- `src/components/BottomNav.tsx` (modificar) — agregar 4ª tab
- `src/App.tsx` (modificar) — agregar ruta `/missing`
- `src/db/hooks.ts` (modificar) — agregar `useMissingByTeam()`

## Hook `useMissingByTeam()`

Left-join conceptual desde `useStickers()` descartando los que tengan entry `count > 0` en `useCollection()`:

```ts
export interface MissingEntry {
  sticker: Sticker;
}

export function useMissingByTeam(opts: { almostOnly: boolean }):
  Map<string, { entries: MissingEntry[]; totalForTeam: number }> | undefined;
```

- Itera todos los stickers del catálogo
- Una lámina cuenta como "faltante" si: no existe entry en `collection`, o existe entry con `count === 0`
- Si `almostOnly: true`, descartar grupos con > `ALMOST_COMPLETE_THRESHOLD` faltantes
- Excluir grupos con 0 faltantes (equipos completos)
- Importar `ALMOST_COMPLETE_THRESHOLD` desde `@/utils/constants`

## BottomNav 4ª tab

En `src/components/BottomNav.tsx`, agregar:
```tsx
<NavLink to="/missing">🎯 Me Falta</NavLink>
```
Cada tab pasa a `flex-1` = 95px en viewport 380px. Verificar que el texto y emoji caben sin truncate visible.

## Notas de implementación

- El ordenamiento "menos faltantes primero" prioriza la motivación psicológica del usuario.
- El `TeamGroupHeader` se comparte con F1 — si F1 todavía no terminó, este SPEC debería implementar también el header (el primero en mergear lo crea, el segundo lo importa). El orquestador resuelve la dependencia al integrar.
- Para grupos especiales (Introducción, Museo FIFA, Coca-Cola), también aplicar el filtro "almostOnly" si tienen ≤3 faltantes.

## Restricciones

- **NO commitees ni pushees**.
- **NO toques** archivos fuera de los listados.
- Si `TeamGroupHeader` ya existe (de F1 mergeado antes), reusalo en vez de duplicarlo.
