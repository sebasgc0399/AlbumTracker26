# SPEC F7 — Navegación Bottom Tab

> Dependencias: F4 (Home), F5 (Team Page como destino desde Home)
> Bloquea: F6 (la búsqueda vive en una tab)

## Qué

Barra de navegación inferior fija con 3 tabs: Home (progreso + grupos), Buscar (búsqueda rápida enfocada), Repetidas (vista de láminas con `count > 1`).

## Criterio de done

- [ ] Bottom tab bar fija en todas las pantallas principales
- [ ] 3 tabs: 🏠 Inicio, 🔍 Buscar, 🔄 Repetidas
- [ ] Tab activo con indicador visual (color, underline, o ícono filled)
- [ ] Navegación no causa re-render del contenido de otras tabs (lazy rendering)
- [ ] Scroll de cada tab se mantiene independiente al volver
- [ ] Existe pantalla `DuplicatesPage` que lista todas las láminas con `count > 1` agrupadas por equipo

## Archivos a crear

- `src/components/BottomNav.tsx` — Barra inferior con 3 tabs
- `src/pages/DuplicatesPage.tsx` — Vista de repetidas (agrupadas por equipo, mostrando `id` + `count - 1`)
- `src/App.tsx` — Actualizar router con las 3 rutas (`/`, `/search`, `/duplicates`)

## Notas

- La bottom nav debe ser `fixed bottom-0` con safe-area-inset para iPhones con notch (`pb-safe` o `pb-[env(safe-area-inset-bottom)]`).
- En PWA standalone Android, ocupar toda la altura útil — la bottom nav no compite con la barra de gestos del sistema porque el OS reserva ese espacio automáticamente.
- `DuplicatesPage` es base para la futura Fase 2 (compartir lista de cambios formato WhatsApp). Por ahora solo muestra: lámina + cantidad de repetidas, agrupadas por equipo.
- Tab activa: usar `NavLink` de React Router con `className` dinámico según `isActive`.
- El scroll independiente entre tabs requiere mantener el componente montado al cambiar de tab. React Router por default desmonta — alternativas: usar tabs como rutas anidadas con `<Outlet />` y un layout, o mantener mediante `<Suspense>` + lazy con persistencia manual de scroll en sessionStorage si el remount no se puede evitar.
