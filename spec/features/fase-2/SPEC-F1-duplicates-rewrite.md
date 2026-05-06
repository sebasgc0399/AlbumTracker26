# SPEC F1 — DuplicatesPage rewrite (gestión accionable)

> Dependencias: F0
> Bloquea: F4 (modelo `useTradeableLists` reusa lógica), F6 (matchLists usa duplicates)

## Qué

Reescribir [src/pages/DuplicatesPage.tsx](src/pages/DuplicatesPage.tsx) **desde cero** (decisión del usuario). Vista que agrupa repetidas por equipo, muestra el total disponible para cambio, con stepper inline para ajustar cantidad sin abrir modal.

## Criterio de done

- [ ] Banner sticky `top-0 z-10` con total global: "X láminas para cambiar". Usa `tabular-nums` para evitar layout shift al animar.
- [ ] Agrupación por equipo con `TeamGroupHeader` (flag + nombre + cantidad de repetidas del grupo)
- [ ] Cada lámina con repetidas se muestra como `DuplicateRow`: `id`, nombre, badge `xN` donde N = `count - 1`, stepper inline `+/-`
- [ ] Stepper inline persiste vía `incrementCount`/`decrementCount` (existentes en `src/db/mutations.ts`); cap superior `MAX_DUPLICATE_COUNT = 20`
- [ ] Si `count` llega a 1, la lámina desaparece de la vista (deja de ser repetida) — `useLiveQuery` recalcula
- [ ] Toggle "por equipo / más repetidas primero" persistido en localStorage (`useLocalStoragePref('duplicates.order', 'by-team')`)
- [ ] Toggle "ocultar Coca-Cola" persistido en localStorage (`useLocalStoragePref('duplicates.hideCC', false)`)
- [ ] Skeleton mientras `useDuplicatesByTeam` devuelve `undefined`
- [ ] Empty state: si no hay repetidas, mensaje "No tenés repetidas todavía"

## Archivos a crear/modificar

- `src/pages/DuplicatesPage.tsx` — reescrito
- `src/components/DuplicateRow.tsx` (nuevo) — fila con stepper inline
- `src/components/TeamGroupHeader.tsx` (nuevo) — header reutilizable (lo reusa F2)
- `src/db/hooks.ts` (modificar) — agregar `useDuplicatesByTeam()`

## Hook `useDuplicatesByTeam()`

Derivar en cliente (sin tocar Dexie directamente) desde `useStickers()` + `useCollection()`:

```ts
export interface DuplicateEntry {
  sticker: Sticker;
  count: number;
  extra: number; // count - 1
}

export function useDuplicatesByTeam(opts: { hideCC: boolean }):
  Map<string, DuplicateEntry[]> | undefined;
```

Devuelve `Map<teamName, DuplicateEntry[]>` para iterar fácil. Si `hideCC: true`, descartar entries con `section === 'cocacola'`.

## Notas de implementación

- El stepper inline tiene que sentirse instantáneo. `useLiveQuery` reacciona en el siguiente frame — no hay latencia perceptible.
- Reusa `QuantityStepper` existente — ya tiene long-press para incremento rápido.
- Para "más repetidas primero", ordenar por `extra` desc dentro de cada grupo de equipo, pero también el orden de los grupos cambia: equipos con más repetidas totales arriba.
- Banner sticky debe respetar el header global del layout — verificar z-index (header `z-10`, BottomNav `z-40`, banner debe quedar bajo el header pero sobre el contenido).

## Restricciones

- **NO commitees ni pushees**. El orquestador lo hace tras verificar.
- **NO toques** archivos fuera de los listados.
