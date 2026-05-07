# AlbumTracker26

PWA personal para trackear el álbum Panini Mundial 2026. El usuario marca cada una de las 994 láminas como "la tengo" con un tap, registra repetidas y ve progreso por equipo y total — todo 100% offline en el celular.

**Estado actual:** Fase 0+1 (Setup + MVP). Solo existe el SPEC en [spec/SPEC_panini_tracker.md](spec/SPEC_panini_tracker.md); el código aún no está iniciado. Cualquier comando, archivo o convención de abajo refleja la decisión del SPEC, no código existente.

## Stack

- **UI:** React 19 + TypeScript strict + Vite
- **Estilos:** Tailwind CSS v4 (CSS-first, sin `tailwind.config.ts`)
- **Persistencia local:** Dexie.js sobre IndexedDB (offline-first, sin backend)
- **PWA:** vite-plugin-pwa (manifest + service worker cache-first)
- **Routing:** React Router v7
- **Deploy:** Firebase Hosting (estático)

No hay backend propio: la app es 100% client-side. Firebase solo se usa como hosting estático.

## Comandos esperados

Una vez inicializado el proyecto con Vite, los comandos serán los estándar:

```bash
npm run dev          # Vite dev server
npm run build        # tsc + vite build
npm run preview      # Preview del build local
npm run lint         # ESLint sobre src/
firebase deploy      # Deploy a Firebase Hosting (tras npm run build)
```

> Hasta que exista `package.json`, no asumir que estos comandos funcionan — es la convención objetivo, no el estado actual.

## Estructura objetivo

```
src/
├── data/
│   ├── stickers.json          # Seed: 994 láminas con metadata
│   ├── teams.ts               # 48 equipos + grupos + banderas emoji
│   └── generate-stickers.ts   # Script Node que genera stickers.json
├── db/
│   ├── database.ts            # Dexie DB + interfaces TS
│   ├── seed.ts                # seedDatabase() — JSON → IndexedDB
│   └── hooks.ts               # useStickers, useCollection, useProgress
├── pages/
│   ├── HomePage.tsx           # Progreso general + grupos
│   ├── GroupPage.tsx           # 4 equipos del grupo
│   ├── TeamPage.tsx            # Grid de 20 láminas
│   └── DuplicatesPage.tsx      # Láminas con count > 1
├── components/                 # Un componente por archivo
├── App.tsx                     # Router + layout
├── main.tsx                    # Entry point + db init
└── index.css                   # Tailwind directives + @theme + html.dark overrides
```

## Modelo de datos

Dos tablas Dexie. La separación es deliberada: permite re-seedear el catálogo (ej. al cargar nombres reales de jugadores en v1.1) sin perder el progreso del usuario.

| Tabla        | Contenido                          | Mutabilidad                |
| ------------ | ---------------------------------- | -------------------------- |
| `stickers`   | Catálogo de las 994 láminas        | Inmutable (re-seed-only)   |
| `collection` | Estado del usuario (owned, count)  | Mutable en cada tap        |

```typescript
interface Sticker {
  id: string;        // "COL7", "FWC1", "CC3", "00" (caso especial)
  number: string;    // Display (== id en este álbum)
  name: string;      // "James Rodríguez" o "Jugador 7" (placeholder v1)
  team: string;      // "COL", "FWC", "CC"
  teamName: string;  // "Colombia", "Introducción", "Coca-Cola"
  group: string;     // "A".."L" o "special"
  section: string;   // "intro" | "museum" | "team" | "cocacola"
  type: string;      // "badge" | "team_photo" | "player" | "special"
  position: number;  // 1..20 dentro del equipo
}

interface CollectionEntry {
  stickerId: string; // FK a Sticker.id
  owned: boolean;    // true = la tengo
  count: number;     // 0 = no tengo, 1 = tengo, 2+ = repetidas
}
```

### Composición de las 994 láminas

- **9** intro: 1 "Panini" (`00`, sin prefijo FWC, etiqueta única en el álbum) + 8 FIFA World Cup (`FWC1`–`FWC8`: 2 Emblemas Oficiales + Mascotas + Eslogan + Balón Trionda + 3 Anfitriones CAN/MEX/USA)
- **11** museo FIFA (`FWC10`–`FWC20`)
- **960** equipos: 48 países × 20 láminas (1 escudo foil + 1 foto equipo + 18 jugadores), IDs `{COUNTRY_CODE}{1-20}` (ej. `ARG1`, `COL7`)
- **14** Coca-Cola promo (`CC1`–`CC14`) — confirmado contra el álbum físico edición Colombia

El usuario identifica láminas por **número/ID**, no por nombre del jugador (igual que en el álbum físico). Esto justifica que los nombres "Jugador 1..18" sean aceptables en el MVP.

## Convenciones

### Componentes

- Export default: `export default function StickerChip() {}`
- Props como `interface`, no `type`
- Un componente por archivo, archivo nombrado igual que el componente
- Lógica >10 líneas → extraer a hook en `src/db/hooks.ts` o `src/hooks/`

### TypeScript

- `interface` para shapes, `type` para uniones/aliases
- Nunca `any`. Usar `unknown` + type guard
- Tipos de dominio (`Sticker`, `CollectionEntry`) viven en `src/db/database.ts`

### Tailwind v4 CSS-first

- **No existe `tailwind.config.ts`.** Tokens, custom variants y CSS vars van en `src/index.css` con `@theme { ... }`. Los docs de Tailwind v3 sobre `tailwind.config.ts` no aplican.
- **No usar `@theme inline`** salvo que estés seguro: el modificador `inline` baked-in los valores en cada utility class (genera `background-color: oklch(1 0 0)` literal en vez de `var(--color-background)`), por lo que overrides por cascade (ej. `html.dark { --color-background: ... }` para dark mode) NO propagan. F12 ya migró a `@theme` plain — mantenerlo así si querés que los tokens respondan a la clase `.dark`.
- **Dark mode via clase `.dark` en `<html>`**. F12 declara `@custom-variant dark (&:where(.dark, .dark *))` para utilities `dark:foo`, y un bloque `html.dark { --color-x: ... }` con tokens invertidos en oklch. La clase la aplica `src/lib/theme.ts` + un script pre-paint inline en `index.html` que evita el flash.
- Mobile-first siempre — el viewport objetivo es ~380px (celular en mano abriendo sobres). Estilos base son mobile, breakpoints solo agregan.
- No usar `@apply` en componentes; sí en `@layer base` para resets globales.

### Dexie

- **`useLiveQuery` para todo**, no llamadas imperativas en componentes. Los queries son reactivos por diseño.
- Un solo objeto `db` exportado desde `src/db/database.ts`. No hay múltiples DBs.
- Mutaciones (toggle owned, +/- count) escriben directo a IndexedDB sin "guardar" — la UI se actualiza vía `useLiveQuery`.

### Naming

- Hooks: `use[Entidad][Acción]` → `useStickers`, `useCollection`, `useProgress`
- Handlers: `handle[Acción]` → `handleTap`, `handleIncrement`
- Booleanos: `is/has/can` → `isOwned`, `hasDuplicates`
- IDs de lámina: siempre uppercase (`COL7`, no `col7`). La búsqueda es case-insensitive en el input pero el almacenamiento es uppercase.

### Git

- Conventional Commits en español: `feat(home): agregar progreso por grupo`
- Commits atómicos por sub-feature (F1, F2, ...)
- Ramas `feat/<feature>` para cambios no triviales

## MCPs disponibles

Hay 4 MCPs configurados para este proyecto. Úsalos a demanda cuando aporten valor; no son obligatorios.

- **context7** — Antes de escribir código con APIs de Tailwind v4, Dexie, vite-plugin-pwa, React 19, React Router v7. La sintaxis de Tailwind v4 CSS-first (`@theme`, `@custom-variant`, dark mode con clase) no está bien cubierta en training data; preferir context7 sobre asunciones.
- **playwright** — Validar el flujo crítico (búsqueda → tap → siguiente) en viewport móvil 380×800. Probar instalabilidad PWA y comportamiento offline tras `npm run build && npm run preview`.
- **firebase** — Deploy a Firebase Hosting (`firebase_init`, `firebase_get_project`, `firebase_get_sdk_config`). El proyecto NO usa Auth/Firestore/Storage — ignorar esos tools.
- **chrome-devtools** — Auditorías Lighthouse (`lighthouse_audit`) para validar score PWA, manifest y service worker. Performance traces en mobile cuando el grid de 20 láminas se vea lento.

Configuración en [.mcp.json](.mcp.json) (project-scoped) y heredada de user scope para context7/playwright.

## Gotchas

- **`useLiveQuery` requiere import específico**: `import { useLiveQuery } from 'dexie-react-hooks'`, no de `dexie`. La integración React vive en un paquete separado.
- **Re-seed condicional**: el seed solo corre si `db.stickers.count() === 0`. Si se incluyera incondicional, cada apertura de la app reescribiría el catálogo entero.
- **Service worker + dev**: vite-plugin-pwa por default sirve sin SW en `npm run dev`. Probar comportamiento offline real con `npm run build && npm run preview`, no en dev.
- **PWA install prompt en iOS**: Safari iOS no muestra el prompt automático "Agregar a inicio". El usuario debe hacerlo manual desde el menú compartir. Solo en Android Chrome aparece el prompt nativo.
- **`navigator.vibrate` no existe en iOS Safari** — el haptic feedback de F5 es opcional y debe estar tras un check `if ('vibrate' in navigator)`. No assumir presencia.
- **Tailwind class purge en JSON dinámico**: si una clase Tailwind se construye dinámicamente (ej. `bg-${color}-500`), Tailwind v4 no la detecta y la purga. Para colores condicionales por estado de lámina, usar mapeo explícito (`const COLORS = { owned: 'bg-green-500', ... }`).
- **IndexedDB en modo incógnito**: Firefox/Safari incógnito tienen quota cero o muy baja. La app puede aparentar funcionar y perder datos al cerrar pestaña. No es bug — es comportamiento del navegador en private mode.
- **Migraciones Dexie nunca tocan la tabla `collection`**: el catálogo (`stickers`) es re-seedable, los datos del usuario no. Si una migración necesita transformar la collection, usá `modify()` (mutación in-place por entry) — nunca `clear()` + `bulkAdd()`. Un solo `collection.clear()` borra todo el progreso del usuario sin recovery posible. La regla es estricta: los únicos lugares que pueden llamar `collection.clear()` son funciones dedicadas en `src/lib/safety.ts` (`importCollection()` modo 'replace' y `resetCollection()`), invocadas desde `/settings` con dialog de confirmación destructivo. Cualquier nuevo callsite de `clear()` requiere el mismo patrón: función dedicada en safety.ts + confirmación explícita del usuario.

## Filosofía del proyecto

Es un proyecto personal de fin de semana, no enterprise. Las decisiones priorizan **velocidad de uso al abrir un sobre** sobre cualquier otra cosa: el flujo crítico es búsqueda → tap → siguiente. Cualquier feature que añada fricción a ese loop (login, sync remoto, confirmaciones modales) necesita justificación explícita.

Si una feature parece overkill para "1 usuario, 1 álbum, 1 fin de semana de dev", probablemente lo es.

## Nombres de jugadores: pendientes de re-verificar

La fuente de los 864 nombres en [src/data/players.ts](src/data/players.ts) es una mezcla de la app oficial Panini (que el usuario me pasó por capturas) y correcciones del jugador real conocido cuando la app tenía typos OCR claros. Hay sospechas concretas de typos OCR donde mi versión difiere de la app — el árbitro final es el álbum físico impreso. Cuando el usuario pegue la lámina o pueda comparar, validamos cada uno y sacamos el item de esta lista.

Formato: `{ID}: "{lo que tengo guardado}" — sospecha "{alternativa}"`

- [ ] **AUS18**: "Kusini Yengi" — sospecha "Kusini Vengi" (la app dice Vengi, mi versión asume Y por jugador real)
- [ ] **AUT7**: "Stefan Posch" — sospecha "Stefan Bosch" (la app dice Bosch, mi versión asume P)
- [ ] **AUT10**: "Xaver Schlager" — sospecha "Xavier Schlager" (la app dice Xavier)
- [ ] **BEL9**: "Youri Tielemans" — sospecha "Youri Tieleman" (la app dice sin S)
- [ ] **ARG12**: "Leandro Paredes" — sospecha "Leonardo Paredes" (la app dice Leonardo)
- [ ] **BRA15**: "Rodrygo" — sospecha "Rodrigo" (la app dice Rodrigo, mi versión usa Y por nombre artístico)
- [ ] **CRO19**: "Andrej Kramarić" — sospecha "Andrej Krsmarić" (la app dice Krsmaric)
- [ ] **ECU14**: "John Yeboah" — sospecha "John Vebuah" (la app dice Vebuah)
- [ ] **GHA17**: "André Ayew" — la app mostraba "Andrew aYEW" (typo OCR claro, pero confirmar el acento del álbum)
- [ ] **GHA19**: "Osman Buhari" — sospecha "Osman Bukari" (la app dice Buhari, mi instinto dice Bukari, real conocido)
- [ ] **JPN3**: "Henry Heroki Mochizuki" — la app cortaba a "Henry Heroki" (verificar si el álbum lleva el apellido completo)
- [ ] **USA15**: "Malik Tillman" — sospecha "Malim Tillman" (la app dice Malim)
- [ ] **EGY20**: "Omar Marmoush" — la app dice "Omar Marsmoush" (verificar)
- [ ] **CUW7**: "Shurandy Sambo" — la app dice "Shurandy Shambo"
- [ ] **CUW9**: "Godfried Roemeratoe" — la app dice "Godfriend"
- [ ] **SEN16**: "Iliman Ndiaye" — la app dice "Liman Ndiaye"
- [ ] **SCO18**: "Lyndon Dykes" — la app dice "Lyndon Dykus" en una vista y "Dykes" en otra
- [ ] **SCO20**: "Ben Cannon Doak" — verificar (el real es solo "Ben Doak")
- [ ] **KOR**: confirmar orden — quedó como "given-name family-name" (Heung-min Son), no Korean style (Son Heung-min)

Procedimiento: el usuario va pegando láminas o consulta el álbum, manda captura/foto del sticker físico con código visible, yo (o futura sesión) compara contra `players.ts` y, si coincide o se corrige, sacamos el item de esta lista. Si todos quedan limpios, esta sección entera se borra.
