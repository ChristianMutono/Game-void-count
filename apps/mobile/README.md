# @void-count/mobile

Void Count's iOS + Android edition, built with Expo SDK 51.

## Status

**Playable.** The full game loop is ported — difficulty picker, mode selection, game loop with HUD + TimerBar, number input (touch + voice), loss screen with taunts, leaderboard, settings. Shares `@void-count/core` with the web app for all game rules and taunt text.

## Prerequisites

| Need to... | Install |
|---|---|
| Run the app on your phone (fastest loop) | [Expo Go](https://expo.dev/client) on iOS/Android |
| Run voice input | A **Development Build** — Expo Go doesn't include `expo-speech-recognition` native module |
| Run the iOS simulator | macOS + Xcode |
| Run the Android emulator | Android Studio + SDK Platform Tools |
| Build for production | [EAS CLI](https://docs.expo.dev/eas/) (`npm install -g eas-cli`) |

## Getting started — Expo Go (no voice)

From the repo root:

```sh
npm install
cd apps/mobile
npm start
```

Scan the QR code in Expo Go. The app launches on the difficulty picker. **Everything works except the mic** — touch and keyboard-free typing via the numpad both work fine; voice input will silently fail-open because the native recognition module isn't present in Expo Go.

## Running with voice — Development Build on Android

```sh
npm install -g eas-cli
eas login
cd apps/mobile
eas build --profile development --platform android
```

EAS builds the APK in the cloud (no local Android Studio needed) and gives you a download link. Install on your phone, then from the repo:

```sh
cd apps/mobile
npm start --dev-client
```

Scan the QR code with the newly-installed dev build (not Expo Go). Voice input will now work.

## Monorepo integration

`metro.config.js` watches the workspace root and resolves hoisted packages. `@void-count/core` is shared by both apps — adding exports there makes them immediately available here via `import { ... } from '@void-count/core'`.

Persistence: `apps/mobile/src/lib/storage.js` wraps `AsyncStorage` and installs it as the synchronous backend for `@void-count/core`'s storage API. Player name, leaderboard, and settings all persist across launches.

## Voice input

- **Push-to-Talk** (default) — hold the mic button; release to submit.
- **Continuous** (opt-in in Settings) — tap to start listening, tap to stop. Mic never listens outside an active round; backgrounding the app force-stops the recogniser.
- Both modes share a 400 ms debounce to reject accidental duplicate submissions.
- First-time use triggers a permission prompt.
- Numbers 1–200 are parsed from natural speech via `parseSpoken()` in `@void-count/core`.

## What's shipped

- Difficulty + mode picker
- Full game loop using `@void-count/core`: `createGameState`, `validateCounterMove`, `applyCounterMove`, `generateCPUMove`, `applyCPUMove`, `getElapsedTime`, `saveToLeaderboard`
- Score-tiered CPU response windows (same math as web — see PRD FR-D-5)
- Timer grace at score ≥ 77 (easy+normal only) and ≥ 100 (all tiers)
- CPU "thinking" shuffle on extreme (score > 30) and hard (score > 100)
- HUD score-box opacity fade on hard/extreme
- Leaderboard with per-difficulty tabs (cap 10 per difficulty)
- Loss screen with taunt selection (112 loss + 28 victory)
- Mr Raw debug-mode leaderboard exception
- Push-to-talk and continuous voice modes
- Haptic feedback on submit, error, and game-start (via `expo-haptics`)
- AppState-based mic suspension on background

## Punted / TODO

Visual polish (not blocking playability):
- CRT scanline + phosphor flicker overlay
- Home-screen chromatic-aberration glitch engine (needs Skia or Reanimated keyframes)
- HUD score/top-score glitch on hard/extreme
- 10-theme system (themes are web-only for now; mobile uses the fixed cyan/magenta palette from `src/theme.js`)
- Menu wheel physics (currently a plain list)

Audio:
- Procedural SFX (Web Audio API has no RN equivalent — either port with `expo-av` pre-rendered clips or use a native bridge)
- Music tracks (assets aren't yet bundled; copy `apps/web/public/audio/*.mp3` to `apps/mobile/assets/audio/` and wire through `expo-av`)

UX:
- FAQ modal
- Explicit 2P local controls (2P mode currently lets both players submit from the same numpad but has no on-screen turn indicator polish)

All of these are follow-up work; none block the game being played to completion.
