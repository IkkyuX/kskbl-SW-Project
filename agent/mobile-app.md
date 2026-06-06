# Mobile App Packaging

## Goal

Package `new_fronted` as an installable mobile app without changing the existing web layout or backend contracts.

## Route

- Use Capacitor as the wrapper layer.
- Keep the Vite web bundle as the source of truth.
- Reuse `VITE_API_BASE_URL` for backend access.

## Expected Outputs

- `cap sync`-ready native project structure.
- Android-first installable app package path.
- iOS-compatible project structure kept in sync for later builds.

## Constraints

- No rewrite to a native UI framework.
- No layout or navigation changes.
- Theme assets must keep working inside the app shell.
