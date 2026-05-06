# SPEC F5 — Compartir lista como imagen PNG

> Dependencias: F0, F4 (modelo `TradeLists` y `useTradeableLists`)
> Paralelizable con: F6, F7

## Qué

Variante "Compartir como imagen" del botón de F4. Renderiza un canvas con grid visual: bandera del equipo + lista de IDs por sección Cambio/Busco. Comparte vía Web Share API con `files: [pngBlob]` o descarga directa.

## Criterio de done

- [ ] Canvas client-side, sin librerías externas (vanilla `CanvasRenderingContext2D`)
- [ ] Tamaño 1080×1920 lógico (vertical, formato story Instagram/WhatsApp). Backing store `* devicePixelRatio` para retina.
- [ ] Header: título "Mi lista — Mundial 2026", fecha del día, totales Cambio/Busco
- [ ] Cuerpo con dos secciones: 🟢 CAMBIO (con banderas + IDs) / 🔴 BUSCO (idem)
- [ ] Footer: "AT26 · generado offline"
- [ ] Web Share API si soporta `canShare({ files })` (chequeo explícito); si no, descarga directa del PNG con nombre `cambio-busco-AAAAMMDD.png`
- [ ] Funciona offline (todos los assets en bundle, sin fetch externo)
- [ ] Botón en `DuplicatesPage` y `MissingPage`, junto al `ShareListButton` de F4

## Archivos a crear/modificar

- `src/utils/renderTradeImage.ts` (nuevo)
- `src/components/ShareImageButton.tsx` (nuevo)
- `src/pages/DuplicatesPage.tsx` (modificar) — agregar botón
- `src/pages/MissingPage.tsx` (modificar) — agregar botón

## Función `renderTradeImage`

```ts
import type { TradeLists } from '@/utils/types';

export async function renderTradeImage(lists: TradeLists): Promise<Blob>;
```

Implementación:
1. `const canvas = document.createElement('canvas')` (off-DOM, no se monta)
2. `const dpr = window.devicePixelRatio || 1`
3. `canvas.width = 1080 * dpr; canvas.height = 1920 * dpr`
4. `ctx.scale(dpr, dpr)` para que las coordenadas sigan siendo 1080×1920 lógicas
5. Dibujar:
   - Fondo `bg-background` (blanco) con margin
   - Header con título grande + fecha (`new Date().toLocaleDateString('es')`)
   - Línea separadora verde (`#16a34a`)
   - Sección 🟢 CAMBIO con banderas emoji + IDs agrupados por equipo
   - Sección 🔴 BUSCO igual
   - Footer chico
6. `font-family`: `'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', system-ui, sans-serif` para que las banderas rendereen
7. `return new Promise(resolve => canvas.toBlob(blob => resolve(blob!), 'image/png'))`

## Componente `ShareImageButton`

- Render: `<button>` con label "Compartir como imagen" + ícono 🖼️
- onClick:
  1. `const blob = await renderTradeImage(lists)`
  2. `const file = new File([blob], 'cambio-busco-AAAAMMDD.png', { type: 'image/png' })`
  3. Si `navigator.canShare?.({ files: [file] })` → `navigator.share({ files: [file] })`. Catch cancelación.
  4. Sino → fallback descarga: crear `<a>` con `URL.createObjectURL(blob)`, `download` attr, simular click.

## Notas de implementación

- **Emoji rendering inconsistente en desktop Windows**: Segoe UI Emoji renderiza banderas como letras (`🇨🇴 → "CO"`). Aceptar como known issue documentado en commit message — el target es mobile.
- El canvas es off-DOM, no se monta en el árbol React. No re-render por cada cambio en `lists`.
- Generar el blob es síncrono salvo el `toBlob` final que es async (200-500ms en mobile típico).
- Tamaño esperado del PNG: 200-500 KB. Sin compresión adicional necesaria.

## Restricciones

- **NO commitees ni pushees**.
- **NO toques** archivos fuera de los listados.
- **NO uses** librerías externas (html-to-image, dom-to-image, etc.). Canvas vanilla.
