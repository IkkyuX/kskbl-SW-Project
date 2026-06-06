# Agent Workspace Notes

- Base frontend: `new_fronted/`
- Theme system target: a single manifest-driven theme package, with only `light` and `cyber`.
- Default theme: white-blue, clean, image-free background.
- Signature theme: black-gold luxury with wallpaper, texture, and highlight layers.
- Layout rule: do not change page structure or component hierarchy, only surface styles, media layers, and theming behavior.
- Visual assets are part of the theme package, not decoration afterthoughts. The manifest now exposes wallpaper and texture sources for theme backdrops.
- Mobile packaging target: Capacitor wrapper that keeps the same web app and ships an installable Android-first package.
