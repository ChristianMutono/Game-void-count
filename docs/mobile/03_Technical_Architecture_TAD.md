# Void Count — Mobile Technical Architecture (TAD)

**Developer:** Christian Mutono (Mr Raw)
**Status:** Playable — full game loop, voice input (both modes), leaderboard, and settings shipped. Visual polish (CRT overlay, glitch engine, themes, menu wheel physics) and audio (SFX, music) deferred.

> This document covers the iOS and Android editions. The game rules, difficulty matrix, taunt matrices, and leaderboard contract are shared with the web edition and live in the general [`../02_Product_Requirements_PRD.md`](../02_Product_Requirements_PRD.md). Only mobile-specific architecture is captured here.

---

## 1. Runtime

| Layer | Technology | Purpose |
|---|---|---|
| App framework | React Native (Expo SDK) | Unified iOS + Android shell |
| Language | JavaScript (JSX), same syntax as web | Shared ergonomics with `apps/web` |
| Navigation | `@react-navigation/native` + stack navigator | Screen routing |
| Styling | `StyleSheet` + Tailwind-for-RN (NativeWind) | Visual parity with web |
| Animation | `react-native-reanimated` | Glitch + CRT + wheel effects |
| Audio (SFX + music) | `expo-av` | Procedurally-generated SFX + music track playback |
| Voice recognition | `@react-native-voice/voice` *(or `expo-speech-recognition`)* | Native on-device ASR, wrapping `SFSpeechRecognizer` / Android `SpeechRecognizer` |
| Persistence | `@react-native-async-storage/async-storage` | Synchronous-cache-wrapped async storage installed as `@void-count/core` backend via `setStorage()` |
| Haptics | `expo-haptics` | Tactile feedback on submit/error |
| Shared logic | `@void-count/core` (workspace) | Game rules, taunts, player name, parser |

## 2. Voice input — two modes

The web edition has the architectural constraint that voice runs in WASM (slow, clunky). The mobile edition taps native speech recognition and is fundamentally faster and more accurate. Two modes are exposed in Settings:

### Push-to-Talk (default)
- Hold mic button → `Voice.start({ mode: 'single' })`.
- Release → `Voice.stop()` → `parseSpoken(transcript)` → submit.
- Mic is released between presses. Identical UX to web.

### Continuous Listening (opt-in)
- Toggle `voidcount_voice_mode = 'continuous'` in Settings.
- The mic icon is **permanently visible** in-game but starts **off** at round start.
- Tap mic → `Voice.start({ continuous: true })` begins streaming; icon shows an active listening state.
- Each `onSpeechResults` → `parseSpoken()` → submit if valid and accepted.
- Tap mic again → `Voice.stop()`.
- Round ends → mic force-stops regardless of user state.
- Mic **never listens outside an active round** — enforced by a lifecycle guard on `gameState.isStarted` and `gameState.gameOver`.

### Hard requirements for continuous mode
- iOS `SFSpeechRecognizer` has a ~60s session limit. When `onSpeechEnd` fires mid-round in continuous mode, the handler immediately calls `Voice.start()` again — transparent to the player.
- `AppState` listener: background/inactive → `Voice.stop()`. Foreground → leave stopped (user re-taps to resume). Privacy + battery.
- Debounce: same number submitted within 400 ms is ignored regardless of source.
- First-time enablement: request microphone + speech-recognition permissions. Denial reverts toggle to push-to-talk with a one-time toast.
- First-time enablement: one-time toast about battery usage.

### Grace period decision
Continuous mode grants a 1.5 s timer grace **only when the mic is first tapped on**. Subsequent in-session recognitions do not further extend the grace — continuous mode is a convenience, not a timer-extender.

## 3. Persistence

Mobile uses the **same localStorage key names** as web. `apps/mobile/src/lib/storage.js` hydrates every key from `AsyncStorage` into a synchronous in-memory cache at app boot, then installs a shim into `@void-count/core`'s `setStorage()` that reads from the cache synchronously and writes through to `AsyncStorage` asynchronously. Result: `@void-count/core` stays fully synchronous and platform-agnostic, mobile gets durable persistence for free.

| Key | Purpose |
|---|---|
| `voidcount_player_name` | Player display name |
| `voidcount_leaderboard` | Top 10 per difficulty (JSON) |
| `voidcount_debug` | Debug Mode flag |
| `voidcount_voice_input` | Voice toggle |
| `voidcount_voice_mode` | `'push-to-talk'` / `'continuous'` |

## 4. What's shared from `@void-count/core`

Pure-JS, platform-independent. Imported by both `apps/web` and `apps/mobile`:

- `gameLogic.js` — `createGameState`, `applyCounterMove`, `generateCPUMove`, `getElapsedTime`, `saveToLeaderboard`, etc.
- `taunts.js` — `getTaunt()`, the 112 loss taunts, the 28 victory taunts.
- `playerName.js` — `getPlayerName`, `setPlayerName`, `MAX_NAME_LEN`.
- `parseSpoken.js` — transcript → number parser (supports compound words + digit sequences).

Note: `saveToLeaderboard` and `getLeaderboard` in `gameLogic.js` currently write directly to `localStorage`. These need a small adapter layer (pass a `{ getItem, setItem }` interface) before they're callable from RN. That's the one substantive extraction task the mobile port will need.

## 5. Build & deploy

- **iOS**: EAS Build → TestFlight → App Store. Requires Apple Developer account.
- **Android**: EAS Build → Play Console internal testing → production.
- **OTA updates** for non-native changes via `expo-updates`.
- Shared `@void-count/core` compiles to ES modules consumed directly by Metro bundler.

## 6. Open questions

- Whether to port the home-screen glitch engine as a React Native Skia shader or a simpler Animated sequence.
- How to replicate the CRT scanline overlay — likely a single `BlurView`/mask rather than pixel shaders.
- Whether to ship music tracks inside the app binary or over-the-air via Expo's asset system.
