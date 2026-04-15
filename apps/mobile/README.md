# @void-count/mobile

Void Count's iOS + Android edition, built with Expo.

## Status

Bootstrapped skeleton — navigation, difficulty selection, shared `@void-count/core` import all working. The game loop itself is yet to be ported from `apps/web`. See [`docs/mobile/03_Technical_Architecture_TAD.md`](../../docs/mobile/03_Technical_Architecture_TAD.md) for the planned architecture.

## Prerequisites

| Need to... | Install |
|---|---|
| Run the app on your phone (fastest loop) | [Expo Go](https://expo.dev/client) on iOS/Android |
| Run the iOS simulator | macOS + Xcode |
| Run the Android emulator | Android Studio + SDK Platform Tools |
| Build for production | [EAS CLI](https://docs.expo.dev/eas/) (`npm install -g eas-cli`) |

## Getting started

From the repo root (the monorepo installs every workspace in one shot):

```sh
npm install
npm run dev --workspace @void-count/mobile   # alias: cd apps/mobile && npm start
```

Then scan the QR code with Expo Go on your phone, or press `i` / `a` in the terminal for simulators.

## Monorepo integration

The Metro bundler is configured in [`metro.config.js`](metro.config.js) to watch the workspace root and resolve `@void-count/core` from the hoisted `node_modules/`. No extra setup required — adding new exports to `packages/core/src/` makes them immediately available here via `import { ... } from '@void-count/core'`.

## Voice input

Native speech recognition via [`expo-speech-recognition`](https://github.com/jamsch/expo-speech-recognition) (wraps `SFSpeechRecognizer` on iOS and Android's `SpeechRecognizer`). Two modes — **Push-to-Talk** (default) and **Continuous Listening** (opt-in toggle in Settings). Detailed behaviour lives in the mobile TAD.

## What's NOT in this scaffold yet

- Full game-loop port from `apps/web/src/pages/Game.jsx`
- HUD, Timer bar, Number input, Loss screen, Leaderboard UI
- Voice input wiring (settings, mic toggle, push/continuous modes)
- Theme system
- CRT overlay + glitch engine
- Procedural SFX (`expo-av` equivalents for Web Audio)
- Music playback + tab-switch muting (`AppState` listener)
- App icons and splash screen assets under `assets/`

These are the targets for subsequent mobile PRs. The core rules, taunt matrices, and scoring are already shared from `@void-count/core`.
