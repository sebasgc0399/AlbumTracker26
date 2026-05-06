# AlbumTracker26

PWA personal para trackear el álbum Panini Mundial 2026. El usuario marca cada una de las 992 láminas como "la tengo" con un tap, registra repetidas y ve progreso por equipo y total — todo 100% offline en el celular.

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
│   ├── stickers.json          # Seed: 992 láminas con metadata
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
└── index.css                   # Tailwind directives + @theme inline
```

## Modelo de datos

Dos tablas Dexie. La separación es deliberada: permite re-seedear el catálogo (ej. al cargar nombres reales de jugadores en v1.1) sin perder el progreso del usuario.

| Tabla        | Contenido                          | Mutabilidad                |
| ------------ | ---------------------------------- | -------------------------- |
| `stickers`   | Catálogo de las 992 láminas        | Inmutable (re-seed-only)   |
| `collection` | Estado del usuario (owned, count)  | Mutable en cada tap        |

```typescript
interface Sticker {
  id: string;        // "COL7", "FWC1", "CC3"
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

### Composición de las 992 láminas

- **9** intro (`FWC1`–`FWC9`)
- **11** museo FIFA (`FWC10`–`FWC20`)
- **960** equipos: 48 países × 20 láminas (1 escudo foil + 1 foto equipo + 18 jugadores), IDs `{COUNTRY_CODE}{1-20}` (ej. `ARG1`, `COL7`)
- **12** Coca-Cola promo (`CC1`–`CC12`)

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

- **No existe `tailwind.config.ts`.** Tokens, custom variants y CSS vars van en `src/index.css` con `@theme inline { ... }`. Los docs de Tailwind v3 sobre `tailwind.config.ts` no aplican.
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

## Gotchas

- **`useLiveQuery` requiere import específico**: `import { useLiveQuery } from 'dexie-react-hooks'`, no de `dexie`. La integración React vive en un paquete separado.
- **Re-seed condicional**: el seed solo corre si `db.stickers.count() === 0`. Si se incluyera incondicional, cada apertura de la app reescribiría el catálogo entero.
- **Service worker + dev**: vite-plugin-pwa por default sirve sin SW en `npm run dev`. Probar comportamiento offline real con `npm run build && npm run preview`, no en dev.
- **PWA install prompt en iOS**: Safari iOS no muestra el prompt automático "Agregar a inicio". El usuario debe hacerlo manual desde el menú compartir. Solo en Android Chrome aparece el prompt nativo.
- **`navigator.vibrate` no existe en iOS Safari** — el haptic feedback de F5 es opcional y debe estar tras un check `if ('vibrate' in navigator)`. No assumir presencia.
- **Tailwind class purge en JSON dinámico**: si una clase Tailwind se construye dinámicamente (ej. `bg-${color}-500`), Tailwind v4 no la detecta y la purga. Para colores condicionales por estado de lámina, usar mapeo explícito (`const COLORS = { owned: 'bg-green-500', ... }`).
- **IndexedDB en modo incógnito**: Firefox/Safari incógnito tienen quota cero o muy baja. La app puede aparentar funcionar y perder datos al cerrar pestaña. No es bug — es comportamiento del navegador en private mode.

## Filosofía del proyecto

Es un proyecto personal de fin de semana, no enterprise. Las decisiones priorizan **velocidad de uso al abrir un sobre** sobre cualquier otra cosa: el flujo crítico es búsqueda → tap → siguiente. Cualquier feature que añada fricción a ese loop (login, sync remoto, confirmaciones modales) necesita justificación explícita.

Si una feature parece overkill para "1 usuario, 1 álbum, 1 fin de semana de dev", probablemente lo es.
