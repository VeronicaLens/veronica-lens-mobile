This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Architecture: Feature-Sliced Design

Always prioritize Feature-Sliced Design (FSD) when adding or moving code:

- Layers, from top to bottom: `src/app` (Expo Router routes and `_layout.tsx` only) → `src/core` (FSD "app" layer: providers, global styles, store) → `src/screens` (FSD "pages") → `src/features` → `src/shared`. A layer imports only from layers below it.
- Expo Router turns every `.ts`/`.tsx` file in `src/app/` into a route. Never put providers, stores, styles or helpers there; use `src/core/`. Do not change the router root directory.
- Route files in `src/app/` stay thin and only re-export a screen, e.g. `export { HomeScreen as default } from '@/screens/home';`.
- Each slice exposes a public API in `index.ts`. Outside the slice, import only from it (`@/features/auth`, `@/shared/ui`), never from internal paths.
- Segments inside a slice: `ui/` (components), `model/` (types, hooks, state), `api/` (HTTP calls), `lib/` (pure helpers without React), `config/`.
- Put reusable code without business rules in `src/shared/` (base components in `src/shared/ui`).
- Style with NativeWind 4 (`className`, Tailwind CSS 3). Use theme colors from `tailwind.config.js` instead of hard-coded values and avoid `StyleSheet.create` in new code.
- Never log, render or persist authentication tokens.

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
