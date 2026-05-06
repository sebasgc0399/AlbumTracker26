# SPEC — AlbumTracker26 · Fase 2: Gestión avanzada + Cambiaton

> Alcance: Convertir la data de tenencia y duplicados (capturada en Fase 0+1) en una herramienta de intercambio sin fricción para preparar listas Cambio/Busco, compartirlas en múltiples formatos, y gestionar intercambios en vivo en una cambiaton.
> Dependencias: Fase 0+1 completa (F1-F7 de [SPEC_panini_tracker.md](SPEC_panini_tracker.md)). Asume que existen `db.stickers`, `db.collection`, hooks `useProgress / useStickers / useCollection`, `BottomNav` y `DuplicatesPage` básico.
> Estimado: 1-2 fines de semana (solo dev)
> Stack relevante: React 19 + TypeScript + Tailwind CSS v4 + Dexie.js + React Router v7 + `lz-string` (nueva dependencia, ~3KB)

---

## Contexto

Tras Fase 0+1 el usuario tiene la colección capturada con detalle (cada lámina con `owned` y `count`), pero la app aún no **explota** esa data. Hoy, en una cambiaton (evento físico de intercambio entre coleccionistas), tendría que:

1. Abrir manualmente la vista de Repetidas y leer cada ID en voz alta.
2. Recordar de memoria qué le falta cuando otro le ofrece una lámina.
3. Tipear a mano la lista Cambio/Busco para mandar por WhatsApp antes del evento.

Cualquiera de los tres pasos es fricción inaceptable cuando hay 5 personas alrededor con sobres en la mano. Esta fase elimina los tres.

---

## Objetivo

Al terminar esta fase, el usuario puede:

- Ver con claridad sus repetidas agrupadas por equipo y ajustar la cantidad in-place sin abrir modal.
- Ver qué le falta priorizado por "casi completo" (motivación psicológica: "solo te falta 1 de Argentina").
- Filtrar cualquier grid existente (TeamPage / GroupPage) por _solo faltantes / solo repetidas / todas_.
- Compartir su lista Cambio/Busco en 3 formatos: texto WhatsApp, imagen PNG, y link compartible.
- Abrir el link compartible de otra persona y ver al instante el match con su propia colección ("le puedes dar X, te puede dar Y").
- En una cambiaton física, tipear el ID que otra persona le ofrece y recibir feedback visual + haptic instantáneo: 🟢 me sirve / 🔴 ya la tengo / 🟡 tengo repetida.

Todo 100% offline, sin backend nuevo, sin sync entre dispositivos.

---

## Features

### F1: Vista "Mis Repetidas" — gestión accionable

**Qué:** Reescribir `DuplicatesPage` (placeholder de F7 Fase 1) como una vista que agrupa repetidas por equipo, muestra el total de láminas disponibles para cambio (suma de `count - 1` de cada lámina con `count ≥ 2`), con stepper inline para ajustar cantidad sin abrir modal.

**Criterio de done:**
- [ ] Agrupación visual por equipo con header de cantidad (ej: "🇨🇴 Colombia — 7 repetidas")
- [ ] Cada lámina muestra ID, nombre, y badge `xN` donde N = `count - 1` (lo que sobra para cambiar)
- [ ] Stepper inline `+/-` actualiza `count` en IndexedDB inmediatamente vía mutation Dexie; si `count` llega a 1, la lámina desaparece de la vista (deja de ser repetida)
- [ ] Banner sticky en top con total global: "23 láminas para cambiar"
- [ ] Toggle de orden: "por equipo" / "más repetidas primero"
- [ ] Filtro: "ocultar Coca-Cola" (consistente con `useProgress` existente)

**Archivos a crear/modificar:**
- `src/pages/DuplicatesPage.tsx` — reescribir
- `src/components/DuplicateRow.tsx` — fila por lámina con stepper inline
- `src/components/TeamGroupHeader.tsx` — header de grupo (reutilizable en F2)
- `src/db/hooks.ts` — agregar `useDuplicatesByTeam()` que retorna `Map<teamCode, DuplicateEntry[]>`

**Notas de implementación:**
El stepper inline tiene que sentirse instantáneo. Como la mutation de Dexie es síncrona desde el punto de vista del componente y `useLiveQuery` reacciona en el siguiente frame, no hay latencia perceptible. Long-press en `+/-` para incremento rápido (interval 100ms) — útil cuando alguien tiene 5+ repetidas de una sola lámina.

---

### F2: Vista "Me Falta" — visibilidad + priorización

**Qué:** Vista espejo de F1 pero para faltantes (`count === 0` o sin entry en `collection`). Agrupada por equipo. Por default ordena con los equipos **casi completos** arriba ("solo te falta 1 de Argentina") porque esa es la motivación psicológica más fuerte para intercambiar.

**Criterio de done:**
- [ ] Agrupación por equipo, ordenada por "menos faltantes primero" (priorización por default)
- [ ] Header muestra `X faltantes de 20` con mini barra de progreso
- [ ] Cada lámina faltante muestra ID + nombre, sin acciones inline (no se "des-faltea" desde acá; eso pasa en TeamPage o en F7 cambiaton)
- [ ] Toggle: "todos los equipos" / "casi completos (≤3 faltantes)"
- [ ] Acceso vía nueva tab inferior 🎯 "Me Falta" — reordena BottomNav: Inicio / Buscar / Repetidas / Me Falta

**Archivos a crear/modificar:**
- `src/pages/MissingPage.tsx` — nueva página
- `src/components/MissingRow.tsx` — fila simple por lámina faltante
- `src/components/BottomNav.tsx` — agregar 4ª tab
- `src/db/hooks.ts` — `useMissingByTeam()` agrupando faltantes

**Notas de implementación:**
Una lámina cuenta como "faltante" si:
1. No existe entry en `collection` con su `stickerId`, o
2. Existe entry pero `count === 0`.

El hook debe hacer left-join conceptual: parte de `db.stickers`, descarta las que tengan entry en `collection` con `count > 0`.

---

### F3: Filtros rápidos en grids existentes

**Qué:** En `TeamPage` y `GroupPage` (creados en F5 Fase 1) agregar chip-bar de filtros para mostrar solo faltantes / solo repetidas / todas. Permite escanear visualmente la colección con foco. No se agregan filtros en Home porque esa pantalla es resumen, no exploración.

**Criterio de done:**
- [ ] Chip-bar sticky bajo el header de TeamPage: `Todas` | `Me faltan` | `Repetidas`
- [ ] Filtro persiste en `sessionStorage` (no entre sesiones — es un toggle puntual, no preferencia)
- [ ] En modo `Me faltan`, los chips de StickerChip se renderizan en gris claro con borde punteado
- [ ] En modo `Repetidas`, solo aparecen chips con badge `xN`
- [ ] En GroupPage los 4 equipos del grupo respetan el filtro activo

**Archivos a crear/modificar:**
- `src/pages/TeamPage.tsx` — modificar
- `src/pages/GroupPage.tsx` — modificar
- `src/components/FilterChips.tsx` — chip-bar reutilizable

---

### F4: Generador de lista Cambio/Busco — texto + Web Share

**Qué:** Botón "Compartir lista" en `DuplicatesPage` y `MissingPage` que arma texto plano formateado y lo manda al Web Share API si está disponible, fallback a Clipboard API.

**Criterio de done:**
- [ ] Formato exacto:
  ```
  🟢 CAMBIO (23): COL3, COL7, COL12 (3) | ARG1, ARG14 (2) | BRA12 | ...
  🔴 BUSCO (15): ESP4, FRA9 | ITA1, ITA7 (2) | ...

  Panini Mundial 2026 — generado con AT26
  ```
- [ ] IDs ordenados alfanuméricamente. Cuando hay 3+ del mismo equipo, se muestra `(N)` al final del grupo; si hay menos, se listan separados por coma sin agrupación
- [ ] Botón usa `navigator.share()` si existe (`canShare({ text })`); si no, copia al portapapeles y muestra toast "Copiado"
- [ ] Opción para incluir/excluir Coca-Cola (toggle persistido en localStorage)
- [ ] Excluye láminas con `count === 1` de "Cambio" (solo `count ≥ 2` es repetida real)

**Archivos a crear/modificar:**
- `src/components/ShareListButton.tsx` — botón con lógica de share
- `src/utils/formatTradeList.ts` — pure function `(duplicates, missing, opts) => string`
- `src/db/hooks.ts` — `useTradeableLists()` retorna `{ duplicates: Sticker[], missing: Sticker[] }` con info de `count`

**Notas de implementación:**
Mantener la pure function (`formatTradeList.ts`) sin dependencias de Dexie ni React. Recibe arrays de stickers + opciones; retorna string. Esto la hace trivial de testear y también permite reutilizarla para F5 (imagen) y F6 (link).

---

### F5: Generador de imagen compartible

**Qué:** Variante "Compartir como imagen" del mismo botón de F4. Renderiza un canvas con grid visual: bandera del equipo + lista de IDs por sección Cambio/Busco. Comparte vía Web Share API con `files: [pngBlob]` o descarga directa.

**Criterio de done:**
- [ ] Canvas client-side, sin librerías externas (vanilla `CanvasRenderingContext2D`)
- [ ] Tamaño 1080×1920 (vertical, formato story Instagram/WhatsApp)
- [ ] Header con título "Mi lista — Mundial 2026", fecha del día, totales Cambio/Busco
- [ ] Cuerpo con dos columnas: 🟢 CAMBIO (con banderas + IDs) / 🔴 BUSCO (idem)
- [ ] Footer con marca `AT26 · generado offline`
- [ ] Web Share API si soporta `canShare({ files })`; si no, descarga directa del PNG con nombre `cambio-busco-AAAAMMDD.png`
- [ ] Funciona offline (todos los assets en bundle, sin fetch externo)

**Archivos a crear/modificar:**
- `src/components/ShareImageButton.tsx` — botón con render a canvas
- `src/utils/renderTradeImage.ts` — `renderTradeImage(lists) => Promise<Blob>`

**Notas de implementación:**
Las banderas son emoji (existen en `teams.ts`), se dibujan con `ctx.fillText()` usando el font system (Apple Color Emoji / Noto Color Emoji). En desktop puede haber inconsistencias de render — se acepta porque el target es móvil. El canvas se crea off-DOM (`document.createElement('canvas')`), no se monta.

---

### F6: Link compartible + comparador automático

**Qué:** Generar URL con la lista Cambio/Busco serializada en el hash (`#d=...`), comprimida con `lz-string`. Quien abra el link ve la lista del otro en una vista read-only. Si tiene la app instalada con su propia colección, **compara automáticamente** y muestra el match: "Le puedes dar X, Y, Z" (sus repetidas que están en el Busco del otro) y "Te puede dar A, B, C" (las repetidas del otro que están en su Busco). Match instantáneo, cero backend.

**Criterio de done:**
- [ ] Botón "Compartir link" en `DuplicatesPage` genera URL `https://<host>/share#d=<lz-string>` y la pasa a `navigator.share()` o portapapeles
- [ ] Payload comprimido < 2KB para listas típicas (~30-50 IDs cada lado); validado con prueba de carga máxima de 200 IDs
- [ ] Ruta `/share` en App.tsx renderiza `SharedListPage` que decodifica el hash y muestra read-only
- [ ] Si el visitante tiene colección propia (DB con entries), `SharedListPage` agrega bloque "Match con tu colección" con dos sub-listas
- [ ] Toggle "Mostrar todo" / "Solo matches"
- [ ] El link no expira ni requiere conexión salvo en el primer load (PWA cache se encarga)

**Archivos a crear/modificar:**
- `src/pages/SharedListPage.tsx` — vista read-only + comparador
- `src/utils/encodeTradeList.ts` — `encode(lists) => hashStr`, `decode(hashStr) => lists`
- `src/utils/matchLists.ts` — `match(myCollection, theirLists) => MatchResult`
- `src/App.tsx` — agregar ruta `/share`
- `package.json` — agregar `lz-string`

**Notas de implementación:**
El payload codificado es un objeto compacto `{ d: string[], b: string[] }` (duplicates / busco) — solo IDs, ya que el receptor reconstruye nombres y banderas desde su propio `stickers.json` local. Eso ya recorta ~70% del tamaño vs. enviar nombres completos. `lz-string.compressToEncodedURIComponent()` produce un string URL-safe sin necesidad de `encodeURIComponent` adicional.

---

### F7: Modo Cambiaton — escáner de IDs en vivo

**Qué:** Pantalla full-screen optimizada para intercambio cara a cara con otra persona. Input grande arriba; al tipear un ID y presionar Enter, la app responde con feedback visual + haptic instantáneo en 1 de 3 estados: 🟢 ME SIRVE (no la tengo) / 🔴 YA LA TENGO (count=1) / 🟡 TENGO REPETIDA (count≥2, podría darla yo). Lista debajo del input registra los últimos 10 IDs evaluados con su estado. Botón "Aceptar cambio" en estado 🟢 marca la lámina como tenida.

**Criterio de done:**
- [ ] Acceso vía botón destacado "Modo Cambiaton" en HomePage (FAB o card grande)
- [ ] Layout: input full-width 64px alto, fuente grande monospace, autofocus permanente
- [ ] Al submit (Enter): banner full-width 200px alto con color + ícono + ID + nombre del jugador del estado correspondiente, durante 1.5s
- [ ] Haptic feedback diferenciado por estado:
  - 🟢 Me sirve: vibración corta (50ms)
  - 🔴 Ya la tengo: doble vibración corta (50ms, pausa 80ms, 50ms)
  - 🟡 Tengo repetida: vibración larga (200ms)
- [ ] Lista de últimos 10 IDs evaluados debajo del banner, scrollable, con undo
- [ ] Botón "Aceptar cambio" en estado 🟢 → marca lámina como `owned: true, count: 1` y reproduce confirmación visual
- [ ] Botón "Salir" muestra resumen de la sesión: "Evaluaste 23 IDs · aceptaste 7 cambios"
- [ ] El input se limpia tras cada submit y mantiene autofocus
- [ ] Normalización: `col7`, `COL7`, `COL 7` — todos resuelven al mismo ID

**Archivos a crear/modificar:**
- `src/pages/CambiatonPage.tsx` — pantalla full-screen
- `src/components/CambiatonInput.tsx` — input con autofocus permanente y normalización
- `src/components/CambiatonResult.tsx` — banner de resultado animado
- `src/components/CambiatonHistory.tsx` — lista de los últimos 10
- `src/utils/normalizeStickerId.ts` — normaliza variantes de input al ID canónico
- `src/App.tsx` — agregar ruta `/cambiaton`
- `src/pages/HomePage.tsx` — botón de acceso

**Notas de implementación:**
`navigator.vibrate` no existe en iOS Safari (CLAUDE.md gotcha). Wrappear cada llamada en `if ('vibrate' in navigator)`. El feedback visual con color y tamaño grande es el primary channel; la vibración es enhancement.

Mantener autofocus es delicado: cuando el banner aparece y desaparece, el input puede perder focus. Solución: tras cada submit, `setTimeout(() => inputRef.current?.focus(), 0)` y al cerrar el banner, lo mismo.

---

## Orden de implementación

1. **F1 (Repetidas accionable)** → Base de visibilidad. Reescribe `DuplicatesPage`. Sin dependencias internas.
2. **F2 (Faltantes priorizada)** → Mirror de F1. Reutiliza `TeamGroupHeader`. Agrega 4ª tab a BottomNav.
3. **F3 (Filtros en grids)** → Refina experiencia existente. Independiente de F1/F2 pero más útil después de tenerlas.
4. **F4 (Compartir texto)** → Primera capacidad de cambiaton. Crea `formatTradeList.ts` que será reutilizado por F5/F6.
5. **F5 (Compartir imagen)** → Depende de F4 para el modelo de datos (stickers + count). Render canvas independiente.
6. **F6 (Link compartible + comparador)** → Feature estrella. Requiere F4 (formato lista) consolidado y `lz-string` instalado.
7. **F7 (Modo cambiaton en vivo)** → UX más experimental, lo último. Independiente del resto técnicamente, pero conviene tenerlo al final para iterar UX con la app ya completa.

---

## Estructura de archivos resultante

Archivos nuevos marcados con `(+)`, modificados con `(*)`:

```
src/
├── data/
│   ├── stickers.json
│   └── teams.ts
├── db/
│   ├── database.ts
│   ├── seed.ts
│   └── hooks.ts                       (*) +useDuplicatesByTeam, useMissingByTeam, useTradeableLists
├── pages/
│   ├── HomePage.tsx                   (*) +botón Modo Cambiaton
│   ├── GroupPage.tsx                  (*) +FilterChips
│   ├── TeamPage.tsx                   (*) +FilterChips
│   ├── DuplicatesPage.tsx             (*) reescrito completo (F1)
│   ├── MissingPage.tsx                (+) F2
│   ├── SharedListPage.tsx             (+) F6
│   └── CambiatonPage.tsx              (+) F7
├── components/
│   ├── ProgressBar.tsx
│   ├── GroupCard.tsx
│   ├── BottomNav.tsx                  (*) +4ª tab Me Falta
│   ├── DuplicateRow.tsx               (+) F1
│   ├── MissingRow.tsx                 (+) F2
│   ├── TeamGroupHeader.tsx            (+) F1, reutilizado en F2
│   ├── FilterChips.tsx                (+) F3
│   ├── ShareListButton.tsx            (+) F4
│   ├── ShareImageButton.tsx           (+) F5
│   ├── CambiatonInput.tsx             (+) F7
│   ├── CambiatonResult.tsx            (+) F7
│   └── CambiatonHistory.tsx           (+) F7
├── utils/                              (+) carpeta nueva
│   ├── formatTradeList.ts             (+) F4
│   ├── renderTradeImage.ts            (+) F5
│   ├── encodeTradeList.ts             (+) F6
│   ├── matchLists.ts                  (+) F6
│   └── normalizeStickerId.ts          (+) F7
├── App.tsx                            (*) +rutas /share, /cambiaton
└── ...
package.json                           (*) +lz-string
```

---

## Definiciones técnicas

### Link compartible vía hash URL + lz-string, no backend

- **Decisión:** Serializar la lista Cambio/Busco en el hash (`#d=...`) del URL con `lz-string` para compresión.
- **Razón:** Filosofía 100% client-side del proyecto. Hash del URL no llega al servidor (privacidad: nadie sabe qué listas se comparten). Listas típicas (~30-50 IDs cada lado) caben holgadamente en <2KB comprimidos. Sin costo recurrente de hosting de DB de listas, sin expiración, sin sync. La PWA cacheada en el dispositivo del receptor procesa el link incluso offline tras el primer load.

### Imagen vía canvas vanilla, no `html-to-image` ni libs pesadas

- **Decisión:** Renderizar la imagen directamente en `CanvasRenderingContext2D`, sin librerías de DOM-to-image.
- **Razón:** La PWA debe funcionar offline; canvas es API nativa, sin dependencias. `html-to-image` y similares pesan 50-100KB y arrastran complejidad de fonts/CSS que no se necesita acá. ~150 líneas de código vanilla cubren el caso completo.

### Modo cambiaton separado de QuickSearch (F6 Fase 1)

- **Decisión:** Pantalla y ruta dedicadas (`/cambiaton`), no extensión de QuickSearch.
- **Razón:** Contextos distintos. QuickSearch registra láminas que **abro de un sobre nuevo** (target action: marcar como tenida). Cambiaton evalúa láminas que **otra persona me ofrece** (target action: decidir aceptar/rechazar). Feedback visual distinto (silencioso vs ruidoso), haptic distinto, action button distinto. Mezclarlos perjudica ambos: QuickSearch perdería su rapidez, Cambiaton perdería su claridad.

### Comparador automático sin sync

- **Decisión:** El match entre lista compartida y colección local corre 100% en el cliente del receptor del link, contra su propia DB Dexie.
- **Razón:** Dos PWAs distintas, sin servidor común. El emisor manda IDs en el hash; el receptor compara contra `db.collection` local. Cero infraestructura, cero latencia, funciona offline una vez que el link se cargó la primera vez.

---

## Checklist de completado

Al terminar esta fase, TODAS estas condiciones deben ser verdaderas:

- [ ] La app compila sin errores ni warnings de TypeScript
- [ ] `DuplicatesPage` muestra repetidas agrupadas por equipo con stepper inline funcional
- [ ] Cambiar `count` en el stepper persiste en IndexedDB inmediatamente y la vista reacciona vía `useLiveQuery`
- [ ] `MissingPage` muestra faltantes priorizados por "casi completos primero"
- [ ] BottomNav tiene 4 tabs: Inicio / Buscar / Repetidas / Me Falta
- [ ] `TeamPage` y `GroupPage` tienen chip-bar de filtros funcional con persistencia en sessionStorage
- [ ] El botón "Compartir lista" genera texto correcto y dispara `navigator.share()` o copia al portapapeles
- [ ] El botón "Compartir como imagen" produce un PNG 1080×1920 válido y lo comparte/descarga
- [ ] El botón "Compartir link" genera URL con hash `#d=...` < 2KB para listas típicas
- [ ] Abrir un link `/share#d=...` desde otro dispositivo (o pestaña) muestra la lista correctamente
- [ ] Si el receptor tiene colección propia, ve el bloque "Match con tu colección" con sub-listas correctas
- [ ] El modo Cambiaton recibe input, normaliza y devuelve uno de los 3 estados con color + haptic + nombre de jugador
- [ ] Aceptar cambio en estado 🟢 marca la lámina como tenida y se ve en TeamPage al volver
- [ ] Todo funciona offline tras la primera carga (validar con Network throttling: Offline)
- [ ] Las funciones puras (`formatTradeList`, `encodeTradeList`, `matchLists`, `normalizeStickerId`) no importan de `dexie` ni `react`

---

## Siguiente fase

**Fase 3: Polish + Backup** — Candidatos a evaluar al cerrar esta fase, no comprometidos:

- Scraping/entrada manual de nombres reales de jugadores (data update, no código)
- Dark mode con `@theme inline` Tailwind v4
- Export/import JSON de la colección para backup manual
- Estadísticas históricas: cuándo completé cada equipo, cuántas láminas tapeé por día
- Onboarding de primera apertura explicando el flujo cambiaton
