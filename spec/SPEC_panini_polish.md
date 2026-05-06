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

**Estado:** Implementado.

**Qué:** SearchPage funciona como sesión de "sobre" con tres componentes: contador de progreso bajo el input, toast de undo del último tap (5s), y mini-resumen al cerrar el sobre con undo del batch entero (10s). La sesión arranca con el primer tap, se cierra por 30s sin tap o por X manual, y se descarta al desmontar.

**Criterio de done:**
- [x] La búsqueda tiene un contador "Sobre actual · N / 7" que aparece tras el primer tap, incrementa con cada uno y se oculta cuando la sesión está idle
- [x] Después de cada tap exitoso, el input se limpia y un toast persistente muestra "+ COL7" (o "+ COL7 (rep. N)" si era repetida) con botón **Deshacer** dentro
- [x] El toast del último tap se persiste 5s antes de desaparecer; nuevo tap reinicia el countdown (key={mutation.ts} sobre la barra de animación)
- [x] Al tocar **Deshacer** se revierte la mutación al `prevCount` snapshot — count 0 si era nueva (delete row), o el valor previo si era repetida (`revertToCount(id, prev)`)
- [x] Tras 30s sin actividad o tras tocar la X del contador, aparece un resumen "Sobre cerrado · N nuevas, M repetidas" con **Deshacer todo** disponible 10s
- [x] El countdown visual usa `@keyframes at26-countdown` en `index.css`, con override de `prefers-reduced-motion: reduce` que congela la animación
- [x] Los toasts no bloquean el input — siguen siendo `pointer-events-none` excepto en el botón Deshacer
- [x] Touch target del botón Deshacer ≥44×44px (`min-h-11 min-w-11`)
- [x] Si el usuario tapea durante el resumen (10s post-cierre), arranca un sobre nuevo y el resumen anterior se descarta
- [x] La mutación es atómica: `incrementAndReturn(id)` corre `db.transaction('rw', collection, ...)` que devuelve el `prev`/`next` resultantes — evita race condition de leer count del cache reactivo entre taps rápidos
- [x] El umbral "7" es soft cap visual: el contador puede pasar de 7/7 a 8/7 si el usuario sigue tapeando. No auto-cierra

**Archivos creados/modificados (as-built):**

Nuevos:
- `src/hooks/useBatchSession.ts` — hook con state machine `idle | active | closed`, timer de inactividad (30s), TTL de summary (10s)
- `src/components/UndoToast.tsx` — toast con countdown 5s y botón Deshacer
- `src/components/BatchSummary.tsx` — banner full-width con summary text, "Deshacer todo" + "X" dismiss, countdown 10s

Modificados:
- `src/db/mutations.ts` — agregadas `revertToCount(id, prev)` (idempotente, delete si prev=0) y `incrementAndReturn(id)` (transaccional, devuelve `{prev, next}`)
- `src/pages/SearchPage.tsx` — handleTap usa `incrementAndReturn` + `batch.recordTap`; reemplaza el toast antiguo por UndoToast/BatchSummary; agrega contador en header
- `src/index.css` — `@keyframes at26-countdown` (escala horizontal 1→0) con override `prefers-reduced-motion`

**Notas de implementación (as-built):**

**Race condition resuelta**: el handleTap original leía `collection?.get(id)?.count` del cache reactivo de Dexie. Si el usuario tapeaba dos veces rápido antes del rerender, ambos taps grababan `prevCount=0` y un undo borraba ambos. La solución fue mover la lectura al lado de la mutación, en una transacción Dexie atómica (`incrementAndReturn`), y usar el valor devuelto para `recordTap`.

**State machine en `useBatchSession`**:
- `idle`: sin sobre activo. Counter oculto. Toast oculto. Summary oculto
- `active`: hay un sobre en curso. Counter visible. Toast visible. Summary oculto
- `closed`: sobre acabó (inactividad o X). Counter oculto. Toast oculto. Summary visible (10s)

Transiciones:
- idle → active: `recordTap` con cualquier mutation
- active → closed: timer 30s desde el último tap, o `closeManually()`
- closed → active: `recordTap` (descarta el batch anterior, arranca uno nuevo)
- closed → idle: 10s de TTL, `dismissSummary()`, o `undoAll()`
- active → active: `recordTap` (append), `undoLast()` (pop, queda activo aunque mutations vacíe)

**Undo individual**: `undoLast()` saca el último entry y llama `revertToCount(id, prevCount)`. Si el usuario taping repetidamente, solo el ÚLTIMO tap tiene undo individual disponible — los anteriores quedaron tapados por el reemplazo del toast. Para recuperarlos, "Deshacer todo" en el resumen post-cierre.

**Undo del batch**: `undoAll()` itera mutations en orden inverso y aplica `revertToCount` a cada. Esto importa cuando hay múltiples taps a la misma lámina (ej. ARG3: 0→1→2→3 en 3 taps); el unwind correcto requiere reversa para que el último prev (2) se aplique antes del intermedio (1) y del primero (0), terminando en 0.

**Counter "0/7" como soft cap**: Panini vende sobres de varios tamaños. 7 es un default visual. El batch NO se cierra al llegar a 7; el contador puede mostrar "8 / 7" si el usuario sigue. Cierre solo por inactividad o X manual.

**Sesión por SearchPage instance**: el hook vive en el componente. Al desmontar (navegar fuera de /search), la sesión muere. Los taps quedan committed en IndexedDB (la mutación ya pasó), pero el undo se pierde. Aceptable: el flujo es "abrir un sobre completo en /search", no "navegar y volver".

**Decisiones de UX cerradas durante implementación:**
- El contador NO arranca antes del primer tap (visualmente intrusivo si el usuario solo está buscando algo).
- Tipear en el input NO extiende la inactividad — solo taps cuentan. Razón: si el usuario está pensando qué buscar, no debe extender el batch artificialmente.
- Cuando el toast del último tap dura los 5s sin reemplazo y luego desaparece, las mutations siguen en el batch (no son undoables individualmente, pero sí en el resumen post-cierre).
- El summary se posiciona fixed bottom-16 (encima del bottom nav) con max-w-md para mantener la lectura mobile.

**Verificación e2e con Playwright (smoke test)**:
- Counter incrementa correctamente con cada tap ✅
- UndoToast aparece con código y countdown bar ✅
- Cierre manual via X transitions a summary ✅
- BatchSummary muestra "Sobre cerrado · N repetidas/nuevas" + Deshacer todo + ✕ ✅
- "Deshacer todo" revierte mutations al prevCount original ✅
- Sin errores de consola

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

### F16: Banderas SVG por equipo

**Estado:** Implementado fuera del orden propuesto (antes de F11/F12) por bajo acoplamiento al sistema visual y para destrabar el known issue del canvas. Los detalles abajo reflejan la implementación real.

**Qué:** Reemplazo total del emoji `flag` por SVG reales servidos desde `public/flags/`, usados como elemento de identificación rápida en todas las superficies de la app que ya mostraban el emoji bandera. Los SVG vienen del paquete `flag-icons` (Lipis, MIT) instalado como devDependency y copiados al build directory por un script Node.

**Criterio de done:**
- [x] El campo `flag: string` (emoji) sale del modelo `Team` en `src/data/teams.ts`. Lo reemplaza `flagCode: string`, con el código que usa flag-icons (en general ISO2 minúscula; casos compuestos: ENG→`gb-eng`, KOR→`kr`, KSA→`sa`, IRN→`ir`, POR→`pt`, RSA→`za`, ALG→`dz`, GER→`de`, NED→`nl`, DEN→`dk`, SUI→`ch`, URU→`uy`, PAR→`py`, CRC→`cr`)
- [x] Existe `scripts/copy-flags.mjs` que lee `node_modules/flag-icons/flags/4x3/{flagCode}.svg` para los 48 equipos y los copia a `public/flags/{flagCode}.svg`. Idempotente. Borra los SVG huérfanos de `public/flags/` que ya no estén en TEAMS. Se ejecuta vía `npm run flags:sync`
- [x] `flag-icons` está en `devDependencies` (NO en `dependencies`) — no forma parte del bundle final
- [x] Existe `<FlagIcon code={flagCode} alt={...} className?={...} />` en `src/components/FlagIcon.tsx` que renderiza `<img src="/flags/{code}.svg">` con `loading="lazy"`, `decoding="async"` y aspect-ratio 4:3 enforced
- [x] Helper compartido `src/utils/flagFor.ts` con `flagInfoForTeamCode(code)` y `flagInfoForTeamName(name)` que devuelven `{ flagCode: string | null, emoji: string }`. Usado por consumidores que mezclan equipos de país con especiales (CC, FWC, Coca-Cola, Museo FIFA, Introducción)
- [x] **TeamPage** (header del equipo): bandera a w-12 (48×36px) junto al nombre. `alt=""`
- [x] **GroupPage** (cards de los 4 equipos del grupo): bandera a w-12. `alt=""`
- [x] **GroupCard** (Home, mosaico de 4 banderas por grupo): bandera a w-5 (20×15px). `alt=""`
- [x] **SearchResult** (resultado de búsqueda): bandera a w-8 si es equipo de país; emoji 🥤/🏆/⚽ si es CC/FWC/desconocido. `alt=""`
- [x] **TeamGroupHeader** (header reutilizable): API cambia de `flag: string` a `flagSlot: ReactNode` para que cada caller decida qué renderizar (FlagIcon o emoji especial)
- [x] **DuplicatesPage** y **SharedListPage**: agrupadores por equipo usan `TeamGroupHeader` con `flagSlot` armado vía helper `teamFlagSlot(teamName)` local
- [x] **MissingPage**: agrupador inline (no usa TeamGroupHeader) renderiza FlagIcon o emoji según corresponda
- [x] **renderTradeImage.ts (F4 share-imagen, canvas)**: pre-load de los SVGs requeridos vía `Image()` y `drawImage` reemplazando el `fillText` del emoji. Resuelve el known issue de "AR" como letras en desktop
- [x] El service worker precachea `/flags/*.svg` (ya cubierto por `globPatterns: '**/*.{js,css,html,json,png,svg,woff2}'` existente en `vite.config.ts`)
- [x] Si una bandera falla al cargar, `FlagIcon` cae a un placeholder neutro (cuadro `bg-muted` con el primer segmento del código en monospace) — nunca rompe el layout
- [x] `npm run build` produce bundle final sin las 250 banderas del paquete completo — solo las 48 referenciadas viven en `dist/flags/`. Bundle JS sigue en ~548KB (sin cambio respecto a pre-F16)
- [ ] **MilestoneOverlay (F10)**: diferido a la implementación de F10. `FlagIcon` queda listo; cuando F10 entre, monta la bandera grande con `alt="{nombre del equipo}"` para el milestone "equipo completo 20/20"

**Archivos creados/modificados (as-built):**

Nuevos:
- `src/components/FlagIcon.tsx` — componente con fallback
- `src/utils/flagFor.ts` — helpers `flagInfoForTeamCode` / `flagInfoForTeamName`
- `scripts/copy-flags.mjs` — script Node idempotente con prune de huérfanos
- `public/flags/*.svg` — 48 archivos copiados desde flag-icons

Modificados:
- `src/data/teams.ts` — `flag` (emoji) → `flagCode` (string)
- `package.json` — `flag-icons` en `devDependencies` + script `flags:sync`
- `src/components/TeamGroupHeader.tsx` — API: `flag: string` → `flagSlot: ReactNode`
- `src/components/GroupCard.tsx`, `src/components/SearchResult.tsx`
- `src/pages/TeamPage.tsx`, `src/pages/GroupPage.tsx`, `src/pages/DuplicatesPage.tsx`, `src/pages/MissingPage.tsx`, `src/pages/SharedListPage.tsx`
- `src/utils/renderTradeImage.ts` — preload + drawImage en lugar de fillText emoji

Sin cambios:
- `vite.config.ts` — `workbox.globPatterns` ya incluía `svg`

**Notas de implementación (as-built):**

`flag-icons` como devDep + script de copia evita que Vite embeba 250 banderas en el bundle. El script extrae los 48 códigos vía regex sobre `teams.ts` (single source of truth) y copia desde `node_modules/flag-icons/flags/4x3/`. Eliminar un equipo del array y volver a correr `npm run flags:sync` borra el SVG huérfano automáticamente.

`<img src="/flags/{code}.svg">` con `loading="lazy"` permite que el navegador las cachee por separado y el SW las precachee desde el primer install. En Home (GroupCard mosaico de 4 banderas × 12 grupos = 48 banderas en first paint), `loading="lazy"` evita que las banderas fuera del viewport se descarguen antes de tiempo. Total de los 48 SVGs en `dist/flags/`: ~482KB sin compresión, ~150KB tras gzip del SW.

`alt=""` cuando la bandera está al lado del nombre del país es la regla A11Y correcta: si screen reader anuncia "imagen Argentina, Argentina" es ruido. Cuando la bandera vaya sola (futuro MilestoneOverlay), `alt` informativo será obligatorio.

Casos compuestos (`gb-eng` para Inglaterra): por eso el campo se llama `flagCode` y no `iso2`. Si mañana entra Escocia/Gales como equipos invitados, el modelo no rompe.

**Decisión revertida durante la implementación**: la versión inicial del SPEC excluía Home (GroupCard) por miedo a 240KB en first paint. Al mapear el código real se descubrió que GroupCard YA mostraba 48 emoji-banderas en first paint, así que migrar a SVG es continuidad, no scope creep. `loading="lazy"` mitiga el costo y el SW precachea para visitas siguientes.

**Especiales sin SVG**: las "team codes" CC (Coca-Cola) y FWC (FIFA museum/intro) no son países y no tienen bandera. Mantienen los emoji 🥤 / 🏆 como fallback en `flagInfoFor*`. El `<span>` que los renderiza tiene `aria-hidden="true"` consistente con el resto de iconos decorativos. Si en el futuro se quieren reemplazar por SVG personalizados (logo Coca-Cola, trofeo FIFA), basta agregar dos archivos a `public/flags/` y cambiar el helper para devolver el `flagCode` correspondiente.

**Markers de UI no migrados**: los emojis 🟢 🔴 (CAMBIO/BUSCO) en `renderTradeImage.ts` se mantienen como texto. No son banderas — son colored markers tipográficos universales. Mantenerlos preserva el peso del SVG layer en mínimo y son claramente distintos visualmente del concepto "bandera".

---

## Orden de implementación

1. **F8 (Modo abrir-sobre)** → Es la mejora con mayor impacto en el flujo crítico. Es el primero porque toca la API de mutations en `db/hooks.ts` que las features F9, F10 también consumen.
2. **F9 (Feedback sensorial)** → Depende de F8 (las mutations dispatchean feedback). Centralizado primero para no parchar componentes después.
3. **F12 (Modo oscuro)** → Antes de F11 porque define la paleta dual. Implementar identidad visual encima de un dark mode inexistente obliga a re-trabajar tokens.
4. **F11 (Identidad visual)** → Encima de F12 ya con paleta light+dark estable.
5. **F16 (Banderas SVG)** → Después de F11 (paleta/tipografía estables) y antes de F10 para que el overlay de "equipo completo" salga con bandera desde su primera versión.
6. **F10 (Hitos)** → Depende de F9 (haptic kind: 'milestone') y F16 (bandera en overlay de team-complete). Encima de F11 para que el overlay use la tipografía y paleta nuevas.
7. **F13 (Microcopy)** → Pase de revisión cross-app. Último porque depende de tener todas las superficies de texto definidas.
8. **F14 (Robustez móvil)** → Independiente, en paralelo con F13.
9. **F15 (Update prompt PWA)** → Último porque solo aporta valor cuando hay deploys frecuentes. Hasta este punto, recargas manuales bastan.

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
├── hooks/                        # hooks de UI (los de db quedan en db/hooks.ts)
│   ├── useBatchSession.ts        # F8 ✓
│   ├── useMilestoneWatcher.ts    # F10
│   └── useScrollRestoration.ts   # F14
├── components/
│   ├── UndoToast.tsx             # F8 ✓
│   ├── BatchSummary.tsx          # F8 ✓
│   ├── MilestoneOverlay.tsx      # F10
│   ├── ThemeToggle.tsx           # F12
│   ├── FlagIcon.tsx              # F16 ✓
│   ├── StorageBanner.tsx         # F14
│   └── UpdateBanner.tsx          # F15
├── utils/
│   └── flagFor.ts                # F16 ✓ — helpers flagInfoForTeam{Code,Name}
├── pages/
│   └── SettingsPage.tsx          # F12 (dark + sound toggles + futuro)
└── index.css                     # extiende con :where(.dark), keyframes, safe-areas
public/
├── fonts/                        # F11 — Inter + Geist Mono variable
├── flags/                        # F16 ✓ — 48 SVGs copiados desde flag-icons
├── icon-192.png                  # F11 — reemplaza placeholders de F3
├── icon-512.png
└── icon-maskable.png
scripts/                          # NUEVO — directorio raíz
└── copy-flags.mjs                # F16 ✓ — copia los 48 SVGs desde node_modules a public/flags/
```

---

## Checklist de completado

Al terminar esta fase, TODAS estas condiciones deben ser verdaderas:

- [x] Registrar 7 láminas seguidas vía búsqueda toma menos de 30s sin equivocarme (F8 implementado: contador + undo individual + undo batch)
- [ ] Cada tap en una lámina tiene feedback haptic (Android) y visual coherente en toda la app
- [ ] Completar un equipo (20/20) dispara un overlay de celebración con texto y confetti
- [ ] La app se ve correctamente en modo oscuro y el toggle persiste entre sesiones
- [ ] El primer load no flashea light → dark
- [ ] El header no queda debajo del notch en iPhone, ni el bottom nav debajo de la gesture bar
- [ ] Volver atrás desde un equipo restaura el scroll de Home
- [ ] Si hay una nueva versión deployada, aparece un banner "Recargar" que funciona
- [x] Toda mutación tiene undo dentro de 5s mínimo (F8: undo individual 5s + undo batch 10s post-cierre)
- [ ] La voz de la app es coherente — ningún texto rompe el tono definido en F13
- [ ] Touch targets ≥44px en todos los botones, contrast AA en ambos modos
- [ ] `prefers-reduced-motion: reduce` apaga las animaciones decorativas
- [x] Las pantallas TeamPage, GroupPage, Home (GroupCard), Search, Repetidas, Faltantes y Lista compartida muestran la bandera del país como SVG sin emojis (la celebración de equipo completo queda pendiente hasta que entre F10)
- [x] El bundle final no contiene el paquete completo de flag-icons — solo los 48 SVG necesarios viven en `public/flags/`

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

### `flag-icons` como devDependency
F16 instala `flag-icons` como devDep y copia los 48 SVG necesarios a `public/flags/` con un script Node. Como dependency runtime, Vite no puede tree-shakear los SVG no referenciados y el bundle se infla con 200+ banderas que nunca se usan. El script mantiene el control explícito.

---

## Siguiente fase

**Fase 2: Social + Backup** — generador de lista "ofrezco/busco" con formato WhatsApp, Web Share API, export/import JSON, scraping de nombres reales de jugadores. Sigue siendo válida tal como la describe el [SPEC del MVP](SPEC_panini_tracker.md). Esta fase de polish es independiente y se intercala antes o después según prioridad personal.
