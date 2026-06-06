# Project Map

## Baseline

- `new_fronted/` is the active frontend.
- `frontend/` and `adminFrontend/` are historical and out of scope for this theme package.

## Theme Surface

- Theme state lives in `new_fronted/src/app/context/ThemeContext.tsx`.
- Theme definitions live in `new_fronted/src/app/lib/themeCatalog.ts`.
- Global tokens live in `new_fronted/src/styles/theme.css`.
- Theme backdrops and textures are exposed through media fields in the theme manifest and rendered without changing layout.
- `light` is the neutral white-blue default and must not depend on photo wallpapers.
- `cyber` is the black-gold signature theme and may use image or texture layers.

## Mobile Packaging

- Capacitor config and build scripts live under `new_fronted/`.
- The packaged app should reuse the same web bundle and API base URL behavior as the browser build.
