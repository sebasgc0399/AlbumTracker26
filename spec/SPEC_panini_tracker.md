# SPEC — AlbumTracker26 · Fase 0+1: Setup + MVP

> Alcance: App instalable en celular que permite marcar las 994 láminas del álbum Panini Mundial 2026 como tenidas, contar repetidas, y ver progreso por equipo y total.
> Dependencias: Ninguna
> Estimado: 1 fin de semana (solo dev)
> Stack relevante: React 19 + TypeScript + Vite + Tailwind CSS v4 + Dexie.js + vite-plugin-pwa + Firebase Hosting

---

## Objetivo

Al terminar esta fase, el usuario puede abrir la app en su celular (instalada como PWA), navegar por los 48 equipos y secciones especiales del álbum, marcar cada lámina como "la tengo" con un tap, registrar cuántas repetidas tiene de cada una, y ver su progreso general y por equipo — todo funcionando 100% offline.

---

## Features

### F1: Seed Data — JSON de las 994 láminas

**Qué:** Archivo JSON estático con la metadata de las 994 láminas del álbum (980 set base FIFA + 14 promo Coca-Cola), organizado por sección y equipo. Este archivo se genera una vez y se incluye en el bundle de la app. Al abrir la app por primera vez, las láminas se cargan en IndexedDB vía Dexie.

**Estructura del álbum (994 láminas):**
- **Introducción:** 9 láminas (logo FIFA, trofeo, mascota, logo del torneo, sedes, etc.) — IDs: FWC1–FWC9
- **FIFA Museum (Historia):** 11 láminas de campeones históricos — IDs: FWC10–FWC20
- **48 Equipos × 20 láminas cada uno = 960 láminas:**
  - 1 escudo del equipo (tipo: `badge`, foil)
  - 1 foto de equipo (tipo: `team_photo`)
  - 18 jugadores (tipo: `player`)
  - IDs: `{COUNTRY_CODE}{1-20}` (ej: `USA1`, `COL1`, `ARG1`)
- **Coca-Cola:** 14 láminas promocionales con espacio físico dedicado en el álbum (sí cuentan en el total de 994, aunque no son parte del set base FIFA de 980) — IDs: `CC1`–`CC14`

**Criterio de done:**
- [ ] Existe `src/data/stickers.json` con las 980 láminas base + 14 de Coca-Cola
- [ ] Cada lámina tiene: `id` (string único), `number` (display), `name` (nombre del jugador o descripción), `team` (código país o `"FWC"`/`"CC"`), `teamName` (nombre completo), `group` (grupo del mundial o `"special"`), `section` (intro/museum/team/cocacola), `type` (badge/team_photo/player/special), `position` (número ordinal dentro de su equipo)
- [ ] Los equipos están organizados por grupo del Mundial (A–L, 4 equipos por grupo)
- [ ] El JSON es importado y usado como seed al inicializar la DB

**Archivos a crear/modificar:**
- `src/data/stickers.json` — JSON estático con las 980+12 láminas
- `src/data/teams.ts` — Constantes de los 48 equipos con código, nombre, grupo, y bandera emoji
- `src/data/generate-stickers.ts` — Script de Node para generar `stickers.json` desde `teams.ts` (los nombres de jugadores se llenan con placeholder "Jugador N" inicialmente y se actualizan después manualmente o con scraping)

**Notas de implementación:**
La parte tediosa es obtener los 864 nombres de jugadores (48 equipos × 18 jugadores). Estrategia pragmática en 2 pasos:

1. **v1 (MVP):** Generar el JSON con nombres placeholder (`"Jugador 1"`, `"Jugador 2"`, etc.). El usuario (Seba) identifica láminas por su **número** (ej: `COL7`), no por nombre del jugador — igual que en el álbum físico. Esto permite usar la app inmediatamente.
2. **v1.1 (Post-MVP):** Scraping o entrada manual de los nombres reales desde la checklist de checklistinsider.com. Esto es un data update, no un cambio de código — se regenera el JSON y se redeploya.

Los escudos, fotos de equipo, láminas de introducción, museo y Coca-Cola SÍ tienen nombres descriptivos desde v1 (ej: "Escudo Colombia", "Foto de equipo Argentina", "Trofeo FIFA", "Coca-Cola Lamine Yamal").

---

### F2: Dexie DB Schema + Inicialización

**Qué:** Definir la base de datos IndexedDB vía Dexie con una tabla `stickers` para el catálogo completo y una tabla `collection` para el estado del usuario (qué tiene, cuántas repetidas). Al abrir la app por primera vez, se ejecuta el seed desde el JSON estático.

**Criterio de done:**
- [ ] La DB se crea automáticamente al abrir la app por primera vez
- [ ] La tabla `stickers` contiene las 994 láminas (980 base + 14 CC) con toda su metadata
- [ ] La tabla `collection` se inicializa vacía (el usuario la llena con taps)
- [ ] Si la DB ya existe (segunda visita), no se re-seedea
- [ ] `useLiveQuery` de Dexie funciona para queries reactivos en componentes React

**Archivos a crear/modificar:**
- `src/db/database.ts` — Definición de la DB Dexie, schemas, versión, e interfaces TypeScript
- `src/db/seed.ts` — Función `seedDatabase()` que carga el JSON en la tabla `stickers` si está vacía
- `src/db/hooks.ts` — Custom hooks: `useStickers(team?)`, `useCollection()`, `useProgress()`

**Notas de implementación:**

```typescript
// database.ts
import Dexie, { type EntityTable } from 'dexie';

interface Sticker {
  id: string;          // "COL7", "FWC1", "CC3"
  number: string;      // Display number (same as id for this album)
  name: string;        // "James Rodríguez" or "Jugador 7"
  team: string;        // "COL", "FWC", "CC"
  teamName: string;    // "Colombia", "Introducción", "Coca-Cola"
  group: string;       // "A", "B", ... "L", "special"
  section: string;     // "intro", "museum", "team", "cocacola"
  type: string;        // "badge", "team_photo", "player", "special"
  position: number;    // Ordinal within team (1-20)
}

interface CollectionEntry {
  stickerId: string;   // FK to Sticker.id
  owned: boolean;      // true = la tengo
  count: number;       // total que tengo (0 = no la tengo, 1 = la tengo sin repetida, 2+ = tiene repetidas)
}

const db = new Dexie('AlbumTracker26') as Dexie & {
  stickers: EntityTable<Sticker, 'id'>;
  collection: EntityTable<CollectionEntry, 'stickerId'>;
};

db.version(1).stores({
  stickers: 'id, team, group, section, type',
  collection: 'stickerId'
});
```

Separar `stickers` (catálogo inmutable) de `collection` (estado del usuario) permite:
- Re-seedear el catálogo sin perder el progreso del usuario
- Queries eficientes: "dame todas las de Colombia que NO tengo" = join stickers + collection

---

### F3: PWA Config — Instalable + Offline

**Qué:** Configurar vite-plugin-pwa para que la app sea instalable en Android/iOS, funcione 100% offline, y tenga manifest con nombre, iconos, y theme color.

**Criterio de done:**
- [ ] Al visitar la URL en Chrome Android, aparece el prompt "Agregar a pantalla de inicio"
- [ ] La app instalada abre en modo standalone (sin barra del navegador)
- [ ] Todos los assets (JS, CSS, JSON, fuentes) funcionan offline después de la primera carga
- [ ] El manifest tiene nombre "AlbumTracker26", short_name "AT26", theme_color verde (#16a34a), íconos 192px y 512px
- [ ] El service worker usa estrategia cache-first para assets estáticos

**Archivos a crear/modificar:**
- `vite.config.ts` — Agregar `VitePWA()` plugin con manifest y workbox config
- `public/icon-192.png` — Ícono PWA 192x192 (placeholder: balón de fútbol simple)
- `public/icon-512.png` — Ícono PWA 512x512
- `public/icon-maskable.png` — Ícono maskable para Android

**Notas de implementación:**

```typescript
// vite.config.ts (sección PWA)
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,json,png,svg,woff2}'],
  },
  manifest: {
    name: 'AlbumTracker26 — Panini Mundial 2026',
    short_name: 'AT26',
    description: 'Lleva el control de tu álbum Panini del Mundial 2026',
    theme_color: '#16a34a',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
})
```

---

### F4: Pantalla Home — Progreso General + Navegación por Grupo

**Qué:** Pantalla principal que muestra el progreso total del álbum (X/994 láminas) con barra de progreso visual, y una lista de los 12 grupos del mundial (A–L) + secciones especiales como entry points para navegar a los equipos.

**Criterio de done:**
- [ ] Se muestra el contador "X de 994" con barra de progreso (porcentaje)
- [ ] Se muestra la cantidad de láminas repetidas totales
- [ ] Se listan los 12 grupos (A–L) con los nombres de los 4 equipos de cada grupo
- [ ] Cada grupo muestra un mini progreso (ej: "32/80" — 4 equipos × 20)
- [ ] Las secciones especiales (Intro, Museo FIFA, Coca-Cola) aparecen al inicio o final
- [ ] Al tocar un grupo, navega a la vista de equipos de ese grupo
- [ ] El diseño es mobile-first (optimizado para ~380px de ancho)

**Archivos a crear/modificar:**
- `src/pages/HomePage.tsx` — Pantalla principal con progreso y lista de grupos
- `src/components/ProgressBar.tsx` — Barra de progreso reutilizable (porcentaje + label)
- `src/components/GroupCard.tsx` — Card de un grupo con mini progreso y equipos
- `src/App.tsx` — Router setup con React Router v7

---

### F5: Pantalla de Equipo — Grid de Láminas + Toggle

**Qué:** Al entrar a un equipo, se muestra un grid de sus 20 láminas. Cada lámina es un "chip" que muestra su número y se puede tocar para marcarla como "la tengo". Un segundo tap abre un control para indicar cuántas repetidas tiene.

**Criterio de done:**
- [ ] Se muestra el nombre del equipo, bandera emoji, y progreso (ej: "12/20")
- [ ] Grid de 20 láminas en layout de 4 columnas (mobile-friendly)
- [ ] Cada chip muestra: número de lámina (ej: "COL7"), indicador visual de tipo (badge/foto/jugador)
- [ ] Tap simple en lámina no tenida → la marca como tenida (owned=true, count=1). Feedback visual inmediato (cambio de color: gris → verde)
- [ ] Tap simple en lámina ya tenida → abre mini modal/popover con: nombre del jugador, stepper para cantidad (1, 2, 3...), botón "No la tengo" para desmarcar (count=0)
- [ ] Los cambios persisten en IndexedDB inmediatamente (no hay botón "guardar")
- [ ] Las láminas de tipo `badge` y `team_photo` tienen un indicador visual diferente (ícono o borde)
- [ ] Haptic feedback en el tap si el dispositivo lo soporta (navigator.vibrate)

**Archivos a crear/modificar:**
- `src/pages/TeamPage.tsx` — Pantalla del equipo con grid de láminas
- `src/pages/GroupPage.tsx` — Pantalla intermedia que lista los 4 equipos de un grupo
- `src/components/StickerChip.tsx` — Chip individual de lámina (estados: missing/owned/duplicated)
- `src/components/StickerDetail.tsx` — Mini modal/bottom sheet con detalle y stepper de cantidad
- `src/components/QuantityStepper.tsx` — Control +/- para cantidad de repetidas

**Notas de implementación:**
El stepper de cantidad debe ser rápido. Patrón UX: botones +/- con long-press para incremento rápido. El color del chip refleja estado:
- Gris claro: no la tengo
- Verde: la tengo (count=1)
- Verde con badge numérico: la tengo + repetidas (count>1)

---

### F6: Búsqueda Rápida por Número

**Qué:** Un campo de búsqueda en la parte superior de la Home que permite buscar una lámina por su número (ej: "COL7", "ARG12", "FWC3") y marcarla como tenida directamente. Esto es clave para la velocidad al abrir sobres — el usuario abre un sobre de 7 láminas y las registra rápidamente escribiendo sus números.

**Criterio de done:**
- [ ] Input de búsqueda sticky en la Home
- [ ] Al escribir, se muestran resultados filtrados en tiempo real (autocomplete)
- [ ] Se puede marcar una lámina como tenida directamente desde el resultado de búsqueda con un tap
- [ ] Después de marcar, el input se limpia para registrar la siguiente lámina del sobre
- [ ] Soporta búsqueda parcial: "COL" muestra todas las de Colombia, "7" muestra todas las #7
- [ ] Funciona con input en mayúsculas o minúsculas

**Archivos a crear/modificar:**
- `src/components/QuickSearch.tsx` — Input de búsqueda con autocomplete y acción rápida
- `src/components/SearchResult.tsx` — Item de resultado con botón de marcar

**Notas de implementación:**
Este es el feature más importante para la velocidad de uso diario. El flujo óptimo al abrir un sobre:
1. Abrir app
2. Tocar campo de búsqueda
3. Escribir "COL7" → tap ✓ → input se limpia
4. Escribir "ARG3" → tap ✓ → input se limpia
5. Repetir para las 7 láminas del sobre

Usar `useLiveQuery` con un filtro de texto sobre `stickers.id` para búsqueda reactiva.

---

### F7: Navegación Bottom Tab

**Qué:** Barra de navegación inferior fija con 3 tabs: Home (progreso + grupos), Buscar (búsqueda rápida enfocada), y Repetidas (vista de todas las láminas con count>1).

**Criterio de done:**
- [ ] Bottom tab bar fija en todas las pantallas
- [ ] 3 tabs: 🏠 Inicio, 🔍 Buscar, 🔄 Repetidas
- [ ] Tab activo tiene indicador visual (color, underline, o ícono filled)
- [ ] La navegación no causa re-render del contenido de otras tabs (lazy rendering)
- [ ] El scroll de cada tab se mantiene independiente

**Archivos a crear/modificar:**
- `src/components/BottomNav.tsx` — Barra de navegación inferior
- `src/pages/DuplicatesPage.tsx` — Vista de todas las láminas repetidas (count>1)
- `src/App.tsx` — Actualizar router con las 3 rutas principales

**Notas de implementación:**
La vista de Repetidas sirve como base para la Fase 2 (compartir lista de cambios). Por ahora solo muestra las láminas con count>1 agrupadas por equipo con el total de repetidas de cada una.

---

## Orden de implementación

1. **F1 (Seed Data)** → Es la base de todo. Sin datos, no hay app. El script generador produce el JSON.
2. **F2 (Dexie DB)** → Depende de F1 (necesita el JSON para seedear). Define el modelo de datos.
3. **F3 (PWA Config)** → Independiente de F1/F2, pero necesaria antes del primer deploy. Se puede hacer en paralelo con F2.
4. **F4 (Home)** → Depende de F2 (necesita queries a la DB para el progreso).
5. **F5 (Team Page)** → Depende de F4 (navegación desde Home) y F2 (queries + mutations).
6. **F7 (Bottom Nav)** → Depende de F4 y F5 (necesita las páginas para navegar entre ellas).
7. **F6 (Quick Search)** → Depende de F2 (queries) y F7 (tab de búsqueda). Se hace al final porque refina la experiencia.

---

## Estructura de archivos

```
src/
├── data/
│   ├── stickers.json          # Seed data: 994 láminas con metadata
│   ├── teams.ts               # Constantes: 48 equipos + grupos + banderas
│   └── generate-stickers.ts   # Script Node para generar stickers.json
├── db/
│   ├── database.ts            # Dexie DB definition + interfaces
│   ├── seed.ts                # seedDatabase() — carga JSON → IndexedDB
│   └── hooks.ts               # useLiveQuery hooks: useStickers, useCollection, useProgress
├── pages/
│   ├── HomePage.tsx           # Progreso general + lista de grupos
│   ├── GroupPage.tsx           # 4 equipos de un grupo
│   ├── TeamPage.tsx            # Grid de 20 láminas de un equipo
│   └── DuplicatesPage.tsx      # Vista de todas las repetidas
├── components/
│   ├── ProgressBar.tsx         # Barra de progreso reutilizable
│   ├── GroupCard.tsx            # Card de grupo con mini progreso
│   ├── StickerChip.tsx          # Chip individual de lámina
│   ├── StickerDetail.tsx        # Modal/bottom sheet de detalle
│   ├── QuantityStepper.tsx      # Control +/- para cantidad
│   ├── QuickSearch.tsx          # Búsqueda rápida con autocomplete
│   ├── SearchResult.tsx         # Item de resultado de búsqueda
│   └── BottomNav.tsx            # Navegación inferior
├── App.tsx                      # Router + layout principal
├── main.tsx                     # Entry point + DB init
└── index.css                    # Tailwind directives + CSS custom
public/
├── icon-192.png
├── icon-512.png
└── icon-maskable.png
vite.config.ts                   # Vite + PWA plugin config
```

---

## Definiciones técnicas

### Separación catálogo vs. colección
- **Decisión:** Dos tablas separadas en Dexie (`stickers` + `collection`) en vez de una sola tabla con campos `owned`/`count`.
- **Razón:** Permite re-seedear el catálogo (actualizar nombres de jugadores) sin tocar el progreso del usuario. También hace los queries de "faltantes" más limpios: un left join conceptual donde `collection` no tiene entry = lámina faltante.

### Generación del seed data
- **Decisión:** Script de Node (`generate-stickers.ts`) que produce `stickers.json` estáticamente, en vez de construir la data en runtime.
- **Razón:** El JSON se incluye en el bundle de Vite y se cachea por el service worker. No hay costo de runtime ni de red después de la primera carga. Actualizar los nombres de jugadores es un cambio de data, no de lógica — se regenera el JSON y se redeploya.

### Navegación
- **Decisión:** React Router v7 con rutas: `/` (home), `/group/:groupId` (grupo), `/team/:teamId` (equipo), `/search` (búsqueda), `/duplicates` (repetidas).
- **Razón:** URLs semánticas que permiten deep linking y back button nativo del teléfono.

### Hosting
- **Decisión:** Firebase Hosting (tier gratis: 10GB bandwidth/mes, 1GB storage).
- **Razón:** Stack conocido, deploy con `firebase deploy`, HTTPS gratis, CDN global. Para una PWA personal, 10GB de bandwidth es más que suficiente. Si se necesita más, migrar a Cloudflare Pages es trivial (misma app estática).

---

## Checklist de completado

Al terminar esta fase, TODAS estas condiciones deben ser verdaderas:

- [ ] La app compila sin errores ni warnings de TypeScript
- [ ] `stickers.json` contiene exactamente 994 entries (980 base + 14 CC)
- [ ] Al abrir la app por primera vez, las láminas se cargan en IndexedDB
- [ ] El usuario puede navegar Home → Grupo → Equipo → ver láminas
- [ ] El usuario puede marcar una lámina como tenida con un tap
- [ ] El usuario puede registrar repetidas con el stepper +/-
- [ ] El progreso general (X/994) se actualiza en tiempo real
- [ ] El progreso por equipo (X/20) se actualiza en tiempo real
- [ ] La búsqueda rápida encuentra láminas por número (ej: "COL7")
- [ ] La vista de repetidas muestra todas las láminas con count>1
- [ ] La app es instalable como PWA en Android (prompt de instalación)
- [ ] La app funciona completamente offline después de la primera carga
- [ ] El deploy a Firebase Hosting funciona y la app es accesible via URL
- [ ] Los datos persisten entre sesiones (cerrar y abrir la app conserva el progreso)

---

## Siguiente fase

**Fase 2: Social + Backup** — Generador de lista de cambios (ofrezco/busco) con formato WhatsApp, Web Share API para compartir, y export/import JSON para backup de la colección. También: actualizar los nombres de jugadores con data real.
