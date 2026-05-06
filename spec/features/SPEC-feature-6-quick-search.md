# SPEC F6 — Búsqueda Rápida por Número

> Dependencias: F2 (queries), F7 (existe la tab de búsqueda)
> Bloquea: nada (es la última feature)

## Qué

Campo de búsqueda que permite encontrar una lámina por su número (ej. `COL7`, `ARG12`, `FWC3`) y marcarla como tenida directamente. Es la feature más crítica para velocidad de uso al abrir sobres: el usuario abre un sobre de 7 láminas y las registra rápido tipeando los números.

## Criterio de done

- [ ] Input de búsqueda sticky en la parte superior de la Home (o pantalla dedicada)
- [ ] Resultados filtrados en tiempo real (autocomplete, sin debounce visible)
- [ ] Tap en resultado → marca lámina como tenida + limpia input para la siguiente
- [ ] Búsqueda parcial: `COL` muestra todas las de Colombia, `7` muestra todas las #7 de cualquier equipo
- [ ] Case-insensitive: `col7` y `COL7` matchean igual
- [ ] Si la lámina ya está tenida y el usuario la busca → marca como repetida (`count + 1`) en vez de no hacer nada

## Archivos a crear

- `src/components/QuickSearch.tsx` — Input con autocomplete y acción rápida
- `src/components/SearchResult.tsx` — Item de resultado con botón de marcar

## Flujo óptimo (abrir un sobre de 7 láminas)

1. Abrir app
2. Tocar campo de búsqueda
3. Escribir `COL7` → tap ✓ → input se limpia
4. Escribir `ARG3` → tap ✓ → input se limpia
5. Repetir × 7

Cada iteración debe ser <1.5s desde tap hasta input limpio.

## Notas

- Usar `useLiveQuery` con filtro de texto sobre `stickers.id` (Dexie tiene `.startsWith()` para prefix matching eficiente vía índice).
- **Comportamiento "marcar repetida si ya tengo"** es key — al abrir sobres es común tener ya la lámina, y queremos contar la repetida sin pasos extra.
- El input debe enfocarse automáticamente al entrar a la tab de búsqueda (`autoFocus` o `useRef + .focus()` en mount).
- En Android, `inputMode="text"` + `autoCapitalize="characters"` ayuda a que el teclado salga directo en mayúsculas.
- Mostrar máximo 8 resultados visibles, scroll si hay más.
