# SPEC F4 — Pantalla Home: Progreso General + Navegación por Grupo

> Dependencias: F2 (queries a la DB para el progreso)
> Bloquea: F5 (entry point a la página de equipo), F7 (navegación entre tabs)

## Qué

Pantalla principal con: progreso total del álbum (X/980) con barra visual, contador de repetidas, lista de los 12 grupos del Mundial (A–L) + secciones especiales como entry points para navegar a equipos.

## Criterio de done

- [ ] Contador "X de 980" con barra de progreso (porcentaje calculado)
- [ ] Cantidad de láminas repetidas totales (`sum(count-1)` para entries con `count > 1`)
- [ ] Lista los 12 grupos (A–L) con los 4 equipos de cada uno
- [ ] Cada grupo muestra mini progreso (ej. `32/80` — 4 equipos × 20 láminas)
- [ ] Secciones especiales (Intro, Museo FIFA, Coca-Cola) aparecen al inicio o final
- [ ] Tap en grupo → navega a `/group/:groupId`
- [ ] Diseño mobile-first (~380px de ancho)

## Archivos a crear

- `src/pages/HomePage.tsx` — Pantalla con progreso y lista de grupos
- `src/components/ProgressBar.tsx` — Barra reutilizable (porcentaje + label)
- `src/components/GroupCard.tsx` — Card de grupo con mini progreso y equipos
- `src/App.tsx` — Router setup con React Router v7

## Notas

- El total del álbum es **980 base**, no 992. Las 12 de Coca-Cola son promo y se cuentan separadas (sección propia, no suma al "X de 980").
- `useProgress()` (de F2) debería devolver el contador total. Si no, hacer query directo con `useLiveQuery`.
- Grupos del Mundial 2026: 12 grupos (A–L) de 4 equipos cada uno = 48 equipos.
- La lista de grupos puede derivarse de `teams.ts` (F1) agrupando por `group`.
- Animar el llenado de la progress bar al montar (CSS transition `width` desde 0 a `${pct}%`) — feedback visual de progreso.
