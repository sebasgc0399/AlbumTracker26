# SPEC — AlbumTracker26 · Fase 1.5: Polish UX

> Alcance: Convertir el MVP funcional (F1–F7) en una PWA que se sienta bien al abrir un sobre a las 11pm.
> Dependencias: Fase 0+1 completa y deployada en Firebase Hosting.
> Estimado: 1 fin de semana adicional.
> Stack relevante: Lo mismo del MVP (React 19 + TS + Vite + Tailwind v4 + Dexie + vite-plugin-pwa). Sin librerías nuevas pesadas — solo `canvas-confetti` y `lucide-react` opcionales.

---

## Objetivo

Después de F7, la app **funciona**: el usuario carga sus 992 láminas, busca por número, marca, ve progreso, navega offline. Pero todavía no **se siente bien**: cada tap es funcional pero plano, no hay feedback emocional al completar un equipo, registrar 7 láminas seguidas obliga a tap-tap-tap-tap sin protección contra error, y el modo claro deslumbra a la madrugada.

Esta fase ataca exactamente esa brecha. No introduce nuevas pantallas grandes — refina las que ya existen para que el flujo crítico (**búsqueda → tap → siguiente**) pase de "rápido" a "placentero", y el resto del producto adquiera identidad propia en vez de parecer un wireframe funcional.

---

## Principios UX

Estas seis reglas son criterio de revisión para cada feature de abajo y para todo lo que venga después. Si una propuesta de polish viola un principio, queda fuera.

1. **El flujo crítico es sagrado.** Tap → feedback visual + persistencia en menos de 100ms. Cualquier animación que retarde la confirmación de "se registró" se quita.
2. **El uso real es nocturno, de pie, una mano, ~380px.** Pulgar derecho, otro brazo sosteniendo el álbum o un sobre. Nada importante en la esquina superior izquierda.
3. **Solidez antes que delight.** Una animación que esconde un error de persistencia es peor que ninguna animación. Si dudas, quítala.
4. **Reversibilidad sobre confirmación.** Nunca preguntar "¿estás seguro?". Permitir undo dentro de los 5 segundos siguientes a cualquier mutación.
5. **Los datos del usuario son sagrados.** La tabla `collection` jamás se modifica de forma implícita (solo por tap explícito o undo). Re-seedear `stickers` no la toca. Resetear el progreso requiere doble confirmación textual escrita.
6. **Accesibilidad transversal.** Toda feature cumple: touch target ≥44×44px, contrast AA con tokens oklch en ambos modos, respeta `prefers-reduced-motion` (apaga F9/F10), y los chips/botones tienen `aria-label` descriptivo. No es feature aparte: es criterio de done en cada F.

---

## Features

### F8: Modo "abrir sobre" (batch + undo)

**Qué:** Modificar `QuickSearch` (de F6) para que el flujo de registro sea explícitamente por lote: el usuario abre la búsqueda, marca 7 láminas en sucesión rápida, y al final ve un mini resumen ("Marcaste 7 láminas: COL7, ARG3, …") con un botón **Deshacer** que revierte el batch entero. Cada tap individual también tiene undo de 5s.

**Criterio de done:**
- [ ] La búsqueda en Home tiene un contador flotante "Sobre actual: 0/7" que aumenta con cada lámina marcada
- [ ] Después de cada tap exitoso, el input se limpia y un toast efímero (1.5s) muestra "+ COL7" con botón **Deshacer** dentro
- [ ] El toast del último tap se persiste 5s antes de desaparecer
- [ ] Al tocar **Deshacer** se revierte la mutación en `collection` (vuelve al estado previo: count 0 si era nueva, count-1 si era repetida)
- [ ] Tras 7 taps o tras 30s sin actividad, aparece un resumen "Sobre cerrado: 7 nuevas, 0 repetidas" con **Deshacer todo el sobre** disponible 10s
- [ ] Los toasts no bloquean el input — el usuario puede seguir escribiendo el siguiente número con el toast aún visible
- [ ] Touch target del botón Deshacer ≥44×44px

**Archivos a crear/modificar:**
- `src/components/QuickSearch.tsx` — agregar estado de "batch actual" y emitir eventos al hook
- `src/components/UndoToast.tsx` — toast efímero con countdown visual y botón deshacer
- `src/hooks/useBatchSession.ts` — hook que mantiene el array de mutaciones del sobre actual y expone `undoLast()` / `undoAll()` / `commitBatch()`
- `src/db/hooks.ts` — agregar `markStickerOwned(id)` / `revertSticker(id, prevCount)` como mutations atómicas

**Notas de implementación:**
La clave es que **undo es del estado previo, no del default**. Si una lámina ya estaba en count=2 y el usuario tocó (la marcó, llevándola a count=3), undo la regresa a count=2, no a 0. Guardar en el batch session el `prevCount` snapshot antes de cada mutación.

El umbral "7" no es rígido — Panini vende sobres de varios tamaños. El número es un default visual; el batch se cierra por inactividad (30s) o por acción explícita (X en el contador), no por contar exactamente 7.

---

### F9: Feedback sensorial unificado

**Qué:** Sistema centralizado de feedback (haptic + animación + sonido opcional) que se dispara desde cualquier punto de la app con un solo helper. Garantiza que cada tap "se siente igual" en cualquier pantalla.

**Criterio de done:**
- [ ] Existe `src/lib/feedback.ts` con `feedback({ kind: 'tap' | 'newOwned' | 'duplicate' | 'milestone' | 'error' })` como API única
- [ ] `kind: 'tap'` → vibración corta (10ms) + scale del elemento de 1.0 → 0.95 → 1.0 en 120ms (CSS transition, no JS)
- [ ] `kind: 'newOwned'` → vibración media (30ms) + flash verde primario en el chip + ripple desde el centro
- [ ] `kind: 'duplicate'` → doble vibración corta (10-50-10) + el chip muestra brevemente el badge numérico nuevo con scale-up
- [ ] `kind: 'milestone'` → patrón largo (50-30-50-30-50) — usado por F10
- [ ] `kind: 'error'` → vibración larga única (80ms) + shake horizontal del elemento
- [ ] Todo `navigator.vibrate(...)` está dentro de `if ('vibrate' in navigator)` (gotcha iOS)
- [ ] Si `prefers-reduced-motion: reduce`, las animaciones se reducen a un fade simple de 60ms y no hay vibración
- [ ] Toggle "Sonido" en Ajustes (off por default) — cuando está on, suma un click corto (Web Audio API, no `<audio>`)

**Archivos a crear/modificar:**
- `src/lib/feedback.ts` — API única + lógica de detección de capabilities
- `src/lib/sounds.ts` — generación de clicks/dings con `AudioContext` (sin assets)
- `src/components/StickerChip.tsx` — invocar `feedback()` en `onClick` (en vez de lógica inline)
- `src/index.css` — keyframes globales para `tap-pulse`, `chip-flash`, `chip-ripple`, `chip-shake`, todos respetando `@media (prefers-reduced-motion: reduce)`

**Notas de implementación:**
La razón de centralizar es coherencia: si cada componente implementa su propio `vibrate()`, terminan con duraciones distintas y se siente disparejo. El helper también permite una "modo silencioso" futuro (apagar todo desde Ajustes) sin tocar componentes.

Usar Web Audio API en vez de `<audio src=...>` porque (a) no se cachea peor en SW, (b) latencia más baja en el primer tap, (c) menos peso (no hay archivos).

---

### F10: Hitos y celebraciones

**Qué:** Detectar automáticamente hitos de progreso y celebrarlos con un overlay de confetti + frase corta. Hitos duros: 10, 25, 50, 100, 250, 500, 750, 980 láminas; equipo completo (20/20); grupo completo (80/80); álbum completo (980/980 — el grande).

**Criterio de done:**
- [ ] Existe `useMilestoneWatcher()` que escucha cambios en `useProgress()` y dispara un evento cuando se cruza un umbral
- [ ] Un componente `<MilestoneOverlay />` montado a nivel App escucha el evento y renderiza un overlay full-screen con confetti (`canvas-confetti` ~3KB gzip) + frase
- [ ] Frases con voz cálida sin emojis cursi: "Cien láminas. Vas en serio.", "Equipo Argentina completo.", "Grupo D listo.", "ÁLBUM COMPLETO. ESTO PASÓ."
- [ ] El overlay se cierra solo a los 2.5s o con tap en cualquier lado
- [ ] No bloquea interacción detrás (pointer-events: none excepto en el botón cerrar)
- [ ] Si el usuario cruza dos hitos a la vez (ej: lámina 100 que también completa Argentina), se encolan y se muestran secuenciales
- [ ] Hitos cumplidos se persisten en `localStorage` con key `at26.milestones.reached` para no re-celebrarlos al re-abrir la app
- [ ] Si `prefers-reduced-motion`, el overlay reemplaza confetti por un flash de color primario + texto centrado
- [ ] El feedback haptic del milestone usa `kind: 'milestone'` de F9

**Archivos a crear/modificar:**
- `src/hooks/useMilestoneWatcher.ts` — observa progreso y emite eventos
- `src/components/MilestoneOverlay.tsx` — overlay con confetti + texto
- `src/lib/milestones.ts` — array de umbrales con sus mensajes, función `detectCrossings(prev, next)` pura testeable
- `src/App.tsx` — montar `<MilestoneOverlay />` global

**Notas de implementación:**
El detector de hitos debe ser **puro y testeable**: dado un estado previo y uno nuevo, devuelve los hitos cruzados. Esto evita regresiones tipo "no celebré los 500 porque salté de 499 a 502".

Para evitar el caso "primera vez que abro la app después de v1.1 y suelta 5 confettis seguidos porque no había estado tracked": al inicializar, marcar como ya alcanzados todos los hitos que el progreso actual ya cumple, sin celebrarlos. Solo celebrar cruces *en vivo*.

Frases en español: voz cercana, sin diminutivos infantiles, sin emojis a menos que sean parte del país (banderas) o el trofeo (🏆).

---

### F11: Identidad visual mundialista

**Qué:** Reemplazar el look "shadcn por defecto" actual por una identidad propia del proyecto: tipografía con carácter, paleta extendida (incluyendo el `--color-foil` que ya existe pero no se usa), y un ícono PWA real en vez del placeholder de F3.

**Criterio de done:**
- [ ] Tipografía: **Inter** para texto general, **Geist Mono** para números de lámina (los IDs como COL7, ARG3 son protagonistas — merecen mono)
- [ ] Las fuentes se cargan localmente desde `public/fonts/` con `font-display: swap` y `preload` en `index.html`. NO se cargan desde Google Fonts (hace ruteo de red en cada visit, rompe offline-first)
- [ ] Paleta extendida en `src/index.css` `@theme inline`: agregar `--color-accent-foil` con uso real (chips de tipo `badge` lo usan), `--color-accent-museum` para FWC1–FWC20, `--color-accent-cocacola` para CC1–CC12
- [ ] Cada chip de lámina tiene un treatment visual sutil según su `type`: `badge` con halo dorado (`--color-foil`), `team_photo` con borde más grueso, `player` plano default, `special` (CC) con tinte de Coca-Cola
- [ ] Ícono PWA real en `public/icon-192.png`, `icon-512.png`, `icon-maskable.png`: balón estilizado + número 26 + paleta del theme. Generado con cualquier herramienta (Figma, Excalidraw, IA), no es placeholder
- [ ] Splash screen usa `theme_color` y `background_color` coherentes con el ícono
- [ ] Header de la Home tiene un toque de identidad: subrayado o accent dorado en "AlbumTracker26"

**Archivos a crear/modificar:**
- `public/fonts/Inter-Variable.woff2`, `GeistMono-Variable.woff2` — descargados y servidos local
- `index.html` — `<link rel="preload" as="font">` para ambas
- `src/index.css` — `@font-face` declarations + tokens de tipo y paleta extendida
- `src/components/StickerChip.tsx` — variante visual por `type`
- `public/icon-*.png` — ícono real reemplazando placeholders

**Notas de implementación:**
Variable fonts (Inter Variable, Geist Variable) en vez de pesos individuales: un solo archivo cubre 100–900, el peso total es ~150KB combinados, todo cacheado por el SW desde la primera carga.

`--color-foil` ya está en el index.css pero no tiene uso. Si después de F11 sigue sin usarse, se quita — los tokens fantasma confunden.

Para el ícono: lo importante es que en el home screen del celular se reconozca a 48px. Diseñar pensando en ese tamaño, no en 512px.

---

### F12: Modo oscuro (auto + toggle manual persistido)

**Qué:** Soporte completo de tema claro/oscuro con detección automática vía `prefers-color-scheme` y toggle manual persistido en `localStorage`. Los tokens oklch ya están bien preparados para invertir.

**Criterio de done:**
- [ ] Existe `src/lib/theme.ts` con `getTheme(): 'light' | 'dark'`, `setTheme(t)`, `toggleTheme()`
- [ ] El theme aplicado se controla con la clase `dark` en `<html>` (estándar Tailwind v4)
- [ ] En el primer load, se aplica el theme antes del paint para evitar flash (script inline en `index.html` que lee `localStorage` o `prefers-color-scheme`)
- [ ] Variables oklch en modo oscuro definidas en `@theme` bajo `:where(.dark)` selector — fondo casi negro, foreground casi blanco, primary verde más saturado para que se vea, foil dorado conserva
- [ ] Toggle accesible desde Ajustes (página simple `src/pages/SettingsPage.tsx` accesible por ícono en header de Home) o tap en el ícono de luna/sol del header
- [ ] El tema persiste entre sesiones via `localStorage` key `at26.theme`
- [ ] Tres opciones: `light` / `dark` / `system` (default `system`)
- [ ] Los tokens cumplen contrast AA en ambos modos (verificable con devtools)
- [ ] El `theme_color` del manifest cambia dinámicamente vía `<meta name="theme-color">` para que la barra del navegador en standalone match el modo

**Archivos a crear/modificar:**
- `src/lib/theme.ts` — getter/setter + lógica system
- `src/components/ThemeToggle.tsx` — botón sol/luna en header
- `src/pages/SettingsPage.tsx` — pantalla de ajustes (también acoge el toggle de sonido de F9)
- `src/index.css` — bloque `:where(.dark)` con tokens oklch invertidos
- `index.html` — script inline pre-paint para evitar flash

**Notas de implementación:**
**Pre-paint script crítico**: sin él, en el primer load la app aparece light por 1 frame y luego flashea a dark. Va en `<head>` antes de cualquier CSS:

```html
<script>
  const t = localStorage.getItem('at26.theme') || 'system';
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) document.documentElement.classList.add('dark');
</script>
```

oklch hace el modo oscuro casi gratis: invertir L (lightness) en background/foreground, mantener C/H (chroma/hue) en accents. La paleta se siente coherente sin re-elegir colores.

---

### F13: Microcopy y voz

**Qué:** Pasar todos los textos visibles de la app por un filtro de "voz Seba": español neutro con acento colombiano sutil, sin emojis cursi, sin diminutivos infantiles, conciso. Cubrir empty states, errores, confirmaciones, celebraciones (las de F10).

**Criterio de done:**
- [ ] Empty state de **Repetidas** (cuando no hay): "Todavía no tienes repetidas. Falta abrir más sobres." (no "¡Aún no tienes repetidas! 😊")
- [ ] Empty state de **búsqueda sin resultados**: "Ninguna lámina coincide con eso. Probá con un código tipo COL7 o ARG."
- [ ] Empty state de **álbum vacío** (primera vez): "Tu álbum está vacío. Empezá tocando una lámina o usando la búsqueda de arriba."
- [ ] Mensaje al **completar un equipo** (toast): "Equipo {nombre} listo."
- [ ] Mensajes de **error de IndexedDB** (quota, incógnito): "El navegador no me deja guardar. Probá cerrar pestañas o abrir la app fuera del modo incógnito."
- [ ] Cero copia tipo "¡Excelente trabajo!", "¡Sigue así!", "🎉🎉🎉"
- [ ] Las celebraciones de F10 usan las frases definidas allí, en la misma voz
- [ ] Los textos viven en `src/lib/copy.ts` como constantes nombradas (no hardcoded en componentes), facilita revisar la voz en un solo archivo

**Archivos a crear/modificar:**
- `src/lib/copy.ts` — todos los textos largos como constantes
- Todos los componentes con texto visible — reemplazar strings inline por imports de `copy.ts`

**Notas de implementación:**
Tono de referencia: como hablarle a un amigo que sabe lo que está haciendo. Ni servil ni distante. Frases cortas, verbo al inicio cuando aplique. Nada de "haz" — el usuario es Seba, "andá" o "tocá" suena más natural en su contexto, pero sin abusar del voseo si rompe.

No es un sistema de i18n — el SPEC asume un solo idioma (es-LA). Si en el futuro se internaliza, `copy.ts` ya está estructurado para evolucionar a un objeto por locale.

---

### F14: Robustez móvil

**Qué:** Cubrir los casos borde de uso real en celular: notch del iPhone, gesture bar, scroll que se pierde al volver, IndexedDB cerca de su quota, modo incógnito que pierde datos al cerrar.

**Criterio de done:**
- [ ] El layout principal usa `padding-top: env(safe-area-inset-top)` y `padding-bottom: env(safe-area-inset-bottom)` — el header sticky no queda debajo del notch ni el bottom nav debajo de la gesture bar
- [ ] `viewport` meta incluye `viewport-fit=cover` para que las safe-areas tengan efecto
- [ ] React Router tiene scroll restoration por ruta usando `useScrollRestoration` o equivalente — al volver a Home desde un equipo, el scroll vuelve a donde estaba
- [ ] Cada tab del bottom nav (F7) recuerda su scroll independiente
- [ ] Al inicializar la app, se verifica `navigator.storage.estimate()`. Si `usage / quota > 0.85`, se muestra un banner amarillo persistente con copy: "Espacio casi lleno. Considerá liberar espacio del navegador para no perder progreso."
- [ ] Detección de modo incógnito (heurística cross-browser): si se detecta, banner discreto "Estás en modo incógnito. Tu progreso podría perderse al cerrar la app." — solo en primera apertura, dismissable
- [ ] La PWA bloquea orientación a portrait via manifest (ya está) y CSS `@media (orientation: landscape)` muestra un mensaje "Mejor en vertical"
- [ ] El `overscroll-behavior-y: contain` ya está en `index.css` — verificar que ningún scroll interno lo sobreescriba

**Archivos a crear/modificar:**
- `index.html` — `viewport-fit=cover` en meta viewport
- `src/index.css` — utilidades de safe-area, regla de orientation
- `src/lib/storage-health.ts` — `estimateStorage()` y `detectIncognito()` heurísticos
- `src/components/StorageBanner.tsx` — banner amarillo de quota/incógnito
- `src/hooks/useScrollRestoration.ts` — restaurar scroll por ruta

**Notas de implementación:**
**Modo incógnito** no tiene API limpia — la detección es heurística (intentar abrir IndexedDB con tamaño grande, ver si falla; o `navigator.storage.estimate()` que devuelve quota muy baja). Es OK que sea aproximada: el banner es informativo, no bloqueante.

**Quota threshold 85%** es agresivo a propósito. La app pesa ~200KB total y `collection` crece linealmente; en condiciones normales nunca llega ahí. Si llega, casi seguro es síntoma de otro problema (otra app llenó el storage), y el usuario debería verlo antes de que pase a 100%.

---

### F15: Update prompt PWA

**Qué:** Cuando el service worker detecta una nueva versión deployada, mostrar un banner discreto al pie de la pantalla con "Hay una versión nueva — recargar" y un botón. Sin esto, el usuario podría usar una versión vieja por días sin saberlo.

**Criterio de done:**
- [ ] `vite-plugin-pwa` configurado con `registerType: 'autoUpdate'` y exposición de eventos `onNeedRefresh`
- [ ] Al recibir `onNeedRefresh`, se monta un banner inferior (sobre el bottom nav) con "Versión nueva disponible" + botón "Recargar"
- [ ] El botón llama a `updateSW(true)` que aplica el nuevo SW y recarga la página
- [ ] El banner es **dismissable** (X a la derecha) — si el usuario lo cierra, no vuelve a aparecer en esa sesión, pero sí en la siguiente
- [ ] El banner respeta safe-areas (no queda detrás del bottom nav ni de la gesture bar)
- [ ] El estilo del banner es discreto: no distrae del flujo principal pero es visible — usa `--color-primary` con opacidad suave

**Archivos a crear/modificar:**
- `src/lib/pwa-update.ts` — wrapper alrededor de `useRegisterSW` de `virtual:pwa-register/react`
- `src/components/UpdateBanner.tsx` — banner UI con countdown opcional
- `src/App.tsx` — montar `<UpdateBanner />` global
- `vite.config.ts` — verificar que el plugin exponga el hook (ya está en `autoUpdate`)

**Notas de implementación:**
`virtual:pwa-register/react` expone `useRegisterSW()` que devuelve `[needRefresh, setNeedRefresh]` y `updateServiceWorker()`. Es el camino canónico — no inventar una solución manual con `navigator.serviceWorker`.

Importante: el SW se actualiza en background incluso sin interacción. El banner solo informa que hay cambios listos, no es bloqueante. Si el usuario ignora el banner indefinidamente, no pasa nada — eventualmente cierra y reabre la app y el SW nuevo entra solo.

---

## Orden de implementación

1. **F8 (Modo abrir-sobre)** → Es la mejora con mayor impacto en el flujo crítico. Es el primero porque toca la API de mutations en `db/hooks.ts` que las features F9, F10 también consumen.
2. **F9 (Feedback sensorial)** → Depende de F8 (las mutations dispatchean feedback). Centralizado primero para no parchar componentes después.
3. **F12 (Modo oscuro)** → Antes de F11 porque define la paleta dual. Implementar identidad visual encima de un dark mode inexistente obliga a re-trabajar tokens.
4. **F11 (Identidad visual)** → Encima de F12 ya con paleta light+dark estable.
5. **F10 (Hitos)** → Depende de F9 (haptic kind: 'milestone'). Encima de F11 para que el overlay use la tipografía y paleta nuevas.
6. **F13 (Microcopy)** → Pase de revisión cross-app. Último porque depende de tener todas las superficies de texto definidas.
7. **F14 (Robustez móvil)** → Independiente, en paralelo con F13.
8. **F15 (Update prompt PWA)** → Último porque solo aporta valor cuando hay deploys frecuentes. Hasta este punto, recargas manuales bastan.

---

## Estructura de archivos esperada (delta sobre el MVP)

```
src/
├── lib/                          # NUEVO — utilidades transversales
│   ├── feedback.ts               # F9
│   ├── sounds.ts                 # F9
│   ├── milestones.ts             # F10
│   ├── theme.ts                  # F12
│   ├── copy.ts                   # F13
│   ├── storage-health.ts         # F14
│   └── pwa-update.ts             # F15
├── hooks/                        # NUEVO — hooks de UI (los de db quedan en db/hooks.ts)
│   ├── useBatchSession.ts        # F8
│   ├── useMilestoneWatcher.ts    # F10
│   └── useScrollRestoration.ts   # F14
├── components/
│   ├── UndoToast.tsx             # F8
│   ├── MilestoneOverlay.tsx      # F10
│   ├── ThemeToggle.tsx           # F12
│   ├── StorageBanner.tsx         # F14
│   └── UpdateBanner.tsx          # F15
├── pages/
│   └── SettingsPage.tsx          # F12 (dark + sound toggles + futuro)
└── index.css                     # extiende con :where(.dark), keyframes, safe-areas
public/
├── fonts/                        # F11 — Inter + Geist Mono variable
├── icon-192.png                  # F11 — reemplaza placeholders de F3
├── icon-512.png
└── icon-maskable.png
```

---

## Checklist de completado

Al terminar esta fase, TODAS estas condiciones deben ser verdaderas:

- [ ] Registrar 7 láminas seguidas vía búsqueda toma menos de 30s sin equivocarme
- [ ] Cada tap en una lámina tiene feedback haptic (Android) y visual coherente en toda la app
- [ ] Completar un equipo (20/20) dispara un overlay de celebración con texto y confetti
- [ ] La app se ve correctamente en modo oscuro y el toggle persiste entre sesiones
- [ ] El primer load no flashea light → dark
- [ ] El header no queda debajo del notch en iPhone, ni el bottom nav debajo de la gesture bar
- [ ] Volver atrás desde un equipo restaura el scroll de Home
- [ ] Si hay una nueva versión deployada, aparece un banner "Recargar" que funciona
- [ ] Toda mutación tiene undo dentro de 5s mínimo
- [ ] La voz de la app es coherente — ningún texto rompe el tono definido en F13
- [ ] Touch targets ≥44px en todos los botones, contrast AA en ambos modos
- [ ] `prefers-reduced-motion: reduce` apaga las animaciones decorativas

---

## Métricas blandas (autoevaluación, no instrumentadas)

Ninguna métrica de analytics — la app es para un solo usuario. Validar con preguntas honestas a uno mismo:

- ¿Puedo registrar un sobre completo de noche con una mano sin pausarme a pensar?
- ¿Si toqué la lámina equivocada, recuperar el estado anterior es obvio y rápido?
- ¿Cuando completo un equipo, siento que pasó algo o sigo el scroll sin notar?
- ¿La app se ve "mía" o se ve como un wireframe genérico?
- ¿Lo abro a la madrugada y no me deslumbra ni la pantalla principal ni la búsqueda?
- ¿Confío en que cerrar la app y volver al día siguiente no perdió nada?

---

## Decisiones técnicas

### Sin librería de UI nueva
Toda la identidad visual (F11) y el modo oscuro (F12) se hacen con Tailwind v4 + tokens propios, sin shadcn/ui ni Radix. **Razón:** el sticker chip y el progress bar ya son custom; agregar shadcn solo para el toggle de tema o el modal de detalle inflaría el bundle. El proyecto es pequeño y la consistencia visual la dan los tokens, no los componentes.

### `canvas-confetti` opcional con import dinámico
Para F10, importar `canvas-confetti` con `await import('canvas-confetti')` solo cuando se dispara el primer milestone. Esto saca ~3KB del bundle inicial. **Razón:** la mayoría de loads no van a celebrar nada; pagar el peso al inicio es desperdicio.

### Feedback API centralizada
F9 fuerza que toda animación + haptic + sonido pase por `feedback({ kind })`. **Razón:** evita drift entre componentes. Si después se quiere apagar haptic global ("modo silencioso"), un solo flag.

### `lib/` vs `hooks/`
- `lib/` para módulos puros sin React (feedback, theme, copy, storage)
- `hooks/` para hooks de UI con React (batch session, milestone watcher, scroll restoration)
- `db/hooks.ts` mantiene los hooks de Dexie (`useStickers`, `useCollection`, `useProgress`, `markStickerOwned`) — no se mueven, son los que ya conoce el equipo del MVP

### El SPEC del MVP no se modifica
F1–F7 ya están definidos y en parte commiteados. Esta fase agrega F8+ pero no toca el SPEC anterior. Cuando F1–F7 estén 100% cerradas, ese SPEC se archiva con el skill `archive-spec` y queda como registro histórico.

---

## Siguiente fase

**Fase 2: Social + Backup** — generador de lista "ofrezco/busco" con formato WhatsApp, Web Share API, export/import JSON, scraping de nombres reales de jugadores. Sigue siendo válida tal como la describe el [SPEC del MVP](SPEC_panini_tracker.md). Esta fase de polish es independiente y se intercala antes o después según prioridad personal.
