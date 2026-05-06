# SPEC F3 — PWA Config: Instalable + Offline

> Dependencias: ninguna (puede ir en paralelo con F1/F2)
> Bloquea: deploy a producción (sin esto, no es PWA real)

## Qué

Configurar `vite-plugin-pwa` para que la app sea instalable en Android/iOS, funcione 100% offline tras la primera carga, y tenga manifest con nombre, iconos y theme color.

## Criterio de done

- [ ] Al visitar la URL en Chrome Android, aparece el prompt "Agregar a pantalla de inicio"
- [ ] La app instalada abre en modo standalone (sin barra del navegador)
- [ ] JS, CSS, JSON y fuentes funcionan offline después de la primera carga
- [ ] Manifest: name `AlbumTracker26`, short_name `AT26`, theme_color `#16a34a`, iconos 192px y 512px
- [ ] Service worker con estrategia `cache-first` para assets estáticos
- [ ] Existe ícono maskable para Android

## Archivos a crear/modificar

- `vite.config.ts` — Agregar `VitePWA()` plugin con manifest y workbox config
- `public/icon-192.png` — Ícono 192×192 (placeholder: balón de fútbol simple)
- `public/icon-512.png` — Ícono 512×512
- `public/icon-maskable.png` — Ícono maskable 512×512 (área segura interior)

## Config esperada

```typescript
import { VitePWA } from 'vite-plugin-pwa';

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

## Notas

- `npm run dev` por default no sirve el SW. Probar offline con `npm run build && npm run preview`.
- iOS Safari no muestra el prompt automático — usuario lo hace manual desde menú compartir. Solo Android Chrome dispara el prompt nativo.
- Los iconos placeholder pueden ser un PNG simple verde con un balón blanco. Si no hay assets disponibles, generar con ImageMagick o un SVG → PNG.
- `theme_color` debe matchear con el color primario que use Tailwind (verde-600 = `#16a34a`).
