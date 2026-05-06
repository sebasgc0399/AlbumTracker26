# SPEC F7 — Modo Cambiaton (escáner de IDs en vivo)

> Dependencias: F0 (token --color-destructive)
> Paralelizable con: F5, F6

## Qué

Pantalla full-screen optimizada para intercambio cara a cara con otra persona. Input grande arriba; al tipear un ID y presionar Enter, la app responde con feedback visual + haptic instantáneo en uno de **4 estados**. Lista de últimos 10 IDs evaluados con undo.

## Estados

| Estado | Condición | Color | Vibración | Acción disponible |
| ------ | --------- | ----- | --------- | ----------------- |
| 🟢 ME SIRVE | No la tengo (`count === 0` o sin entry) | success (verde) | `[50]` | "Aceptar cambio" → `setOwnedCount(stickerId, 1)` |
| 🔴 YA LA TENGO | `count === 1` | destructive (rojo) | `[50, 80, 50]` | (informativo, sin acción) |
| 🟡 TENGO REPETIDA | `count >= 2` | warning (amarillo) | `[200]` | "Entregar repetida" → `decrementCount(stickerId)` |
| ⚪ ID NO EXISTE | ID no está en `db.stickers` | muted (gris) | (sin vibración) | (informativo, sin acción) |

## Criterio de done

- [ ] Acceso vía botón destacado "Modo Cambiaton" en HomePage (FAB o card grande)
- [ ] Layout full-screen sin BottomNav (preserva foco al teclado)
- [ ] Input full-width 64px alto, fuente grande monospace, autofocus permanente
- [ ] Al submit (Enter): banner full-width 200px alto con color + ícono + ID + nombre del jugador del estado correspondiente, durante 1.5s
- [ ] Haptic feedback diferenciado por estado (ver tabla)
- [ ] Lista de últimos 10 IDs evaluados debajo del banner, scrollable, con botón undo (revierte el último cambio si hubo acción)
- [ ] Botón "Aceptar cambio" en estado 🟢 → `setOwnedCount(stickerId, 1)` + confirmación visual
- [ ] Botón "Entregar repetida" en estado 🟡 → `decrementCount(stickerId)` + confirmación visual
- [ ] Botón "Salir" → resumen: "Evaluaste {N} IDs · aceptaste {M} cambios · entregaste {K} repetidas" → vuelve a HomePage
- [ ] El input se limpia tras cada submit y mantiene autofocus (vía `requestAnimationFrame`)
- [ ] Normalización: `col7`, `COL7`, `COL 7` resuelven al mismo ID `COL7`

## Archivos a crear/modificar

- `src/utils/normalizeStickerId.ts` (nuevo, **pure function**)
- `src/pages/CambiatonPage.tsx` (nuevo)
- `src/components/CambiatonInput.tsx` (nuevo)
- `src/components/CambiatonResult.tsx` (nuevo)
- `src/components/CambiatonHistory.tsx` (nuevo)
- `src/App.tsx` (modificar) — agregar ruta `/cambiaton` (sin BottomNav, igual que `/share` de F6)
- `src/pages/HomePage.tsx` (modificar) — agregar acceso a `/cambiaton`

## Pure function `normalizeStickerId`

```ts
export function normalizeStickerId(input: string): string;
```

- Trim, uppercase, remove all spaces (`col 7` → `COL7`)
- Sin imports externos. Testeable trivialmente.

## Componentes

### `CambiatonInput`
- Input full-width controlado, ref forwarded para el autofocus
- onSubmit (Enter): emite `onSubmit(normalized)` y limpia el input
- Tras submit, `requestAnimationFrame(() => ref.focus())` — más fiable que `setTimeout(0)` en Safari mobile

### `CambiatonResult`
- Props: `{ state: 'serves' | 'have' | 'duplicate' | 'invalid'; sticker?: Sticker; onAction?: () => void }`
- Banner 200px con color según estado + ícono + ID + nombre
- Si `state === 'serves'`, botón "Aceptar cambio"
- Si `state === 'duplicate'`, botón "Entregar repetida"
- Animación slide-in desde arriba al mount
- Vibrate al mount: leer pattern desde tabla de estados, `if ('vibrate' in navigator) navigator.vibrate(pattern)`

### `CambiatonHistory`
- Props: `{ entries: HistoryEntry[]; onUndo: (id: string) => void }`
- Cada entry: ID, nombre, estado (con color), timestamp, botón undo si hubo acción
- Scroll vertical, mostrar últimos 10
- Estilo: row alta 64px

## CambiatonPage state

```ts
interface HistoryEntry {
  stickerId: string;
  state: 'serves' | 'have' | 'duplicate' | 'invalid';
  action?: 'accepted' | 'gave';
  timestamp: number;
}

const [history, setHistory] = useState<HistoryEntry[]>([]);
const [currentResult, setCurrentResult] = useState<HistoryEntry | null>(null);
```

- Submit → normalizar ID → buscar en `db.stickers.get(id)` → determinar estado leyendo `db.collection.get(id)`
- Push a history (max 10, drop oldest)
- Set `currentResult` para mostrar el banner
- Si `accept`/`give` → mutation correspondiente + actualizar history entry con `action`

## Notas de implementación

- **Sin BottomNav**: `/cambiaton` está fuera del layout con BottomNav (igual que `/share`). El return a HomePage es manual vía botón "Salir".
- **Haptic en iOS**: `'vibrate' in navigator` puede ser `true` en iOS Safari pero la función no hace nada. Aceptar — el feedback visual es primary channel.
- **Undo**: si la acción fue `accepted`, undo llama `setOwnedCount(stickerId, 0)`. Si fue `gave`, undo llama `incrementCount(stickerId)`.
- **Nombre del jugador**: leerlo de `db.stickers.get(id)` cuando se determina el estado. Cachear en el history entry para no re-leer.

## Restricciones

- **NO commitees ni pushees**.
- **NO toques** archivos fuera de los listados.
- `normalizeStickerId.ts` debe ser pure (sin React, sin Dexie).
