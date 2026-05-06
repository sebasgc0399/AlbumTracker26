# SPEC F3 — FilterChips en TeamPage y GroupPage

> Dependencias: F0
> Paralelizable con: F1, F2

## Qué

En `TeamPage` y `GroupPage` (creados en Fase 1) agregar chip-bar de filtros para mostrar solo faltantes / solo repetidas / todas. Permite escanear visualmente la colección con foco. Persistencia en `sessionStorage` (toggle puntual, no preferencia personal).

## Criterio de done

- [ ] Chip-bar sticky bajo el header de TeamPage: `Todas` | `Me faltan` | `Repetidas`
- [ ] Mismo chip-bar en GroupPage (4 equipos del grupo respetan el filtro activo)
- [ ] Filtro persistido en `sessionStorage` por-key (`useSessionStoragePref('filter.team.{teamCode}', 'all')` para TeamPage; `useSessionStoragePref('filter.group.{groupId}', 'all')` para GroupPage)
- [ ] En modo `Me faltan`, los chips de StickerChip se renderizan en gris claro con borde punteado
- [ ] En modo `Repetidas`, solo aparecen chips con badge `xN` (los demás se ocultan o atenúan, decisión visual del implementador)
- [ ] Chip activo marcado con `bg-primary text-primary-foreground`
- [ ] El componente `StickerChip` recibe nuevo prop opcional `variant?: 'default' | 'missing-mode'` que controla el render visual

## Archivos a crear/modificar

- `src/components/FilterChips.tsx` (nuevo) — chip-bar reutilizable
- `src/components/StickerChip.tsx` (modificar) — agregar prop `variant` opcional
- `src/pages/TeamPage.tsx` (modificar) — integrar FilterChips
- `src/pages/GroupPage.tsx` (modificar) — integrar FilterChips

## Componente `FilterChips`

```ts
export type FilterValue = 'all' | 'missing' | 'duplicates';

interface FilterChipsProps {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
}
```

Render: 3 botones `<button>` en row, sticky bajo el header. Tap toggle.

## Cambio en `StickerChip`

Agregar prop opcional `variant?: 'default' | 'missing-mode'`:
- `default` (sin prop): comportamiento actual
- `missing-mode`: si la lámina NO falta (count > 0), renderizar gris claro + borde punteado. Si falta, render normal (verde si owned, gris muted si no — el comportamiento ya existe).

El propósito: en TeamPage filtrado a "Me faltan", mostrar TODOS los chips pero atenuados los que no aplican, en vez de simplemente ocultarlos. Mantiene el contexto del grid completo.

**Decisión alterna válida** (si el implementador prefiere): en vez de prop `variant`, simplemente mostrar/ocultar según el filtro. Sin embargo el SPEC pide la atenuación visual. Si el implementador encuentra que eso no se ve bien, puede reportar en su reporte final y proponer alternativa.

## Restricciones

- **NO commitees ni pushees**.
- **NO toques** `src/App.tsx` (las rutas las agrega F2; F3 solo modifica las páginas existentes).
- **NO toques** otros archivos fuera de los listados.
- El chip-bar es sticky pero debe quedar BAJO el header sticky existente. z-index: header `z-20`, chip-bar `z-10`.
