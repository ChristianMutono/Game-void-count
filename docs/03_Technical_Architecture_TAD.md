# 03 — Technical Architecture Document (TAD)

**Project:** Void Count
**Developer:** Christian Mutono (Mr Raw)

---

## 1. System Overview

Void Count is a **fully client-side Single-Page Application** built with React 18 and Vite. There is no backend. All state is local (React hooks for session state, `localStorage` for persistence). Audio is procedurally synthesised via the Web Audio API; music uses HTML5 Audio elements. Voice input runs on-device using OpenAI Whisper (`Xenova/whisper-tiny.en`) via `@xenova/transformers` — the model is fetched lazily from the Hugging Face CDN on first use and cached in the browser.

The app is deployed as static assets to Vercel, auto-deployed on every push to `master` via GitHub integration.

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser Tab                           │
│                                                              │
│   ┌──────────┐   ┌───────────┐   ┌──────────────────────┐   │
│   │   Home   │──▶│   Game    │──▶│  LossScreen (modal)  │   │
│   │  (page)  │   │  (page)   │   │                       │   │
│   └──────────┘   └───────────┘   └──────────────────────┘   │
│        │              │                     │                │
│        ▼              ▼                     ▼                │
│   [localStorage] ◀──────────────────────────────────────     │
│                                                              │
│   [Web Audio API] — SFX synthesis, music context unlock      │
│   [HTML5 Audio]   — background and difficulty music          │
│   [Whisper (transformers.js, WASM)] — on-device voice input  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
        │
        ▼ (git push)
┌──────────────────────────────────────────────────────────────┐
│          Vercel (static hosting + auto-deploy)               │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### Runtime

| Layer | Technology | Purpose |
|---|---|---|
| UI Framework | React 18 | Component model, hooks |
| Routing | react-router-dom | Client-side routing between `/` and `/game` |
| Async State | @tanstack/react-query | Query/cache utility (minimal use) |
| Styling | Tailwind CSS | Utility-first styling, custom CSS variables |
| UI Primitives | shadcn/ui (Radix) | Accessible unstyled primitives |
| Animation | CSS + requestAnimationFrame | Physics loops, keyframes |
| Audio Synthesis | Web Audio API | All game SFX |
| Audio Playback | HTML5 Audio | Music tracks |
| Voice | `@xenova/transformers` (Whisper tiny.en, WASM) | On-device speech-to-text (push-to-talk, no backend) |
| Icons | lucide-react | Iconography |

### Build & Tooling

| Layer | Technology |
|---|---|
| Build Tool | Vite 6 |
| Type Checking | TypeScript (via jsconfig.json) |
| Linting | ESLint 9 + React plugins |
| Testing | Vitest 4 |
| Hosting | Vercel (static) |
| Git Hooks | Native git pre-commit (runs tests) |

---

## 3. Project Structure

```
void-count/
├── public/
│   ├── audio/
│   │   ├── manifest.json              # Dynamic track discovery
│   │   ├── homescreen_background.mp3
│   │   ├── easy_*.mp3, normal_*.mp3, hard_*.mp3, extreme_*.mp3
│   ├── images/logo.png                # PWA icon + favicon
│   └── manifest.json                  # PWA manifest
├── src/
│   ├── components/
│   │   ├── game/                      # All game-specific components
│   │   │   ├── CRTOverlay.jsx
│   │   │   ├── FAQ.jsx
│   │   │   ├── GameHUD.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── LossScreen.jsx
│   │   │   ├── MenuWheel.jsx
│   │   │   ├── NumberInput.jsx        # Keyboard/touch/voice input
│   │   │   ├── SettingsModal.jsx
│   │   │   ├── TimerBar.jsx
│   │   │   └── WheelThemePicker.jsx
│   │   └── ui/                        # shadcn/ui primitives
│   ├── lib/
│   │   ├── gameLogic.js               # Pure game rules & CPU AI
│   │   ├── sounds.js                  # Web Audio SFX + volume/mute state
│   │   ├── themes.js                  # 10 theme configs + apply()
│   │   ├── taunts.js                  # 112 loss taunts + 28 victory taunts
│   │   ├── playerName.js              # Name persistence
│   │   ├── querry-client.js           # React Query client
│   │   └── utils.js                   # Tailwind class helpers
│   ├── pages/
│   │   ├── Home.jsx                   # Menu, music manager, glitch engine
│   │   └── Game.jsx                   # Round orchestrator
│   ├── __tests__/
│   │   ├── gameLogic.test.js          # 40 tests
│   │   └── taunts.test.js             # 3 tests
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css                      # Tailwind + CSS variables + animations
├── scripts/
│   └── update-audio-manifest.js       # Regenerates public/audio/manifest.json
├── docs/
│   ├── 01_Project_Idea_Brief_PIB.md
│   ├── 02_Product_Requirements_PRD.md
│   ├── 03_Technical_Architecture_TAD.md
│   ├── GAME_DESIGN.md                 # Legacy design doc
│   └── ARCHITECTURE.md                # Legacy architecture notes
├── .git/hooks/pre-commit              # Runs npm test before commit
├── index.html                         # PWA meta tags
├── vite.config.js                     # @ alias, React plugin
├── tailwind.config.js                 # Theme vars, fonts, animations
└── package.json
```

---

## 4. State Architecture

### 4.1 Session State (React hooks)

All gameplay state lives inside React components. No external store (Redux, Zustand, etc.) is used. Game state is managed with `useState` in `Game.jsx` and mutated via pure functions in `lib/gameLogic.js`.

### 4.2 Game State Shape

```javascript
{
  mode,                    // 'single' | 'local'
  difficulty,              // 'easy' | 'normal' | 'hard' | 'extreme'
  counterNumbers,          // Set<number>
  controllerNumbers,       // Set<number>
  allNumbers,              // Set<number>
  counterHistory,          // number[]
  controllerHistory,       // number[]
  highestCounterNumber,    // number — the player's score
  currentTurn,             // 'counter' | 'controller'
  isStarted,               // boolean — true after "1" is submitted
  startTime, endTime,      // timestamps
  gameOver,                // boolean
  failureType,             // 'duplicate' | 'stolen' | 'invalid_jump' | 'timeout' | null
  lastSubmitted,           // number
  counterWon,              // boolean
}
```

### 4.3 Persistence Layer (localStorage)

| Key | Purpose |
|---|---|
| `voidcount_player_name` | Player display name |
| `voidcount_leaderboard` | Top 10 scores **per difficulty** |
| `voidcount_theme` | Active theme ID |
| `voidcount_debug` | `'on'` or `'off'` |
| `voidcount_sfx_volume` | 0.0 – 1.0 |
| `voidcount_music_volume` | 0.0 – 1.0 |

---

## 5. Game Loop

```
Home.jsx                          Game.jsx
┌──────────────┐                 ┌───────────────────────────────────┐
│ MenuWheel    │ ─ navigate ──▶ │ URL params → createGameState       │
│ Mode select  │                 │                                   │
│ Difficulty   │                 │ ┌─ Counter submits ─────────────┐ │
│ (+ fall-away │                 │ │  validateCounterMove()         │ │
│  animation)  │                 │ │  applyCounterMove()            │ │
└──────────────┘                 │ │  flash cyan                    │ │
                                 │ │  reset timer                   │ │
                                 │ └────────────┬───────────────────┘ │
                                 │              ▼                     │
                                 │ ┌─ CPU turn (single) ────────────┐ │
                                 │ │  delay 0.5–3s (difficulty)     │ │
                                 │ │  generateCPUMove()             │ │
                                 │ │  applyCPUMove()                │ │
                                 │ │  flash magenta                 │ │
                                 │ └────────────┬───────────────────┘ │
                                 │              ▼                     │
                                 │ ┌─ gameOver? ────────────────────┐ │
                                 │ │  yes → LossScreen (+ taunt)    │ │
                                 │ │  no  → back to Counter         │ │
                                 │ └────────────────────────────────┘ │
                                 └───────────────────────────────────┘
```

---

## 6. Audio Architecture

### 6.1 Synthesised SFX (Web Audio API)

A single global `AudioContext` is lazily created and shared across the app. Pre-unlocked on the first user interaction (`pointerdown`, `keydown`, `touchstart`, `wheel`, `mousemove`).

```
User gesture → getCtx() creates/resumes AudioContext
            → tone(freq, dur, type, vol) builds oscillator + gain
            → sweep(fromHz, toHz, dur) ramps frequency
            → vol scaled by _sfxVolume (getSfxVolume())
```

The home-screen glitch sound composites three layers through a master gain: filtered white noise, a low-frequency square-wave buzz, and a high-frequency crackle burst.

### 6.2 Music (HTML5 Audio)

Background music and difficulty hover tracks use native `Audio` objects. Volume is always computed as `getMusicVolume() × someRatio`:

- Home background: `× 1.0`
- Difficulty hover (over button): `× 1.0` (at 400ms fade-in)
- Home background while hovering a difficulty: `× 0.5` (gently ducked)
- In-game background: `× 0.6`

Tracks cross-fade via `setInterval`-driven ramps. The `detachDifficultyTrack()` pattern lets a hover track continue playing across a navigation so it fades out over 2–2.5 seconds after the new scene appears.

### 6.3 Dynamic Track Discovery

`public/audio/manifest.json` lists every music file. At runtime, `loadDifficultyTracks()` fetches the manifest and groups files by filename prefix (`easy_`, `normal_`, `hard_`, `extreme_`). Adding or removing songs requires only:

```bash
npm run update-audio
```

which regenerates the manifest from the filesystem.

---

## 7. Voice Input

Voice input runs **entirely on-device** using OpenAI Whisper (`Xenova/whisper-tiny.en`, ~40MB ONNX) via the `@xenova/transformers` WASM runtime. No server-side inference; no network roundtrip beyond the initial model fetch from the Hugging Face CDN (cached in IndexedDB via `env.useBrowserCache = true`).

### Lifecycle

Implemented as **push-to-talk** in [src/components/game/NumberInput.jsx](src/components/game/NumberInput.jsx) backed by the service in [src/lib/whisper.js](src/lib/whisper.js):

1. **Press mic** → `getUserMedia({ audio: true })` + `MediaRecorder` (preferring `audio/webm;codecs=opus`) begins capturing.
2. An `AnalyserNode` on the same `MediaStream` drives the live volume meter.
3. On first press, `loadWhisper()` lazily instantiates the `pipeline('automatic-speech-recognition', ...)` with a progress callback surfaced to the UI.
4. **Release mic** → the recorder emits a `Blob`, which is decoded via `decodeAudioData`, resampled to mono 16 kHz through an `OfflineAudioContext`, and fed to the pipeline.
5. The returned transcript is passed to `parseSpoken()` for digit extraction and submitted via `onSubmit(number)`.

### Grace-period integration

When the user presses the mic, `NumberInput` fires an `onMicActivate` callback. [src/pages/Game.jsx](src/pages/Game.jsx) uses this to pause the timer for **1.5 seconds**, covering the recording hold, model inference, and transcript submission. The `TimerBar`'s `isRunning` prop is driven by `!micGrace` during that window.

Grace is **single-shot per counter submission**: a `micGraceAvailableRef` starts `true`, flips to `false` the moment grace is granted, and only resets to `true` on a successful `applyCounterMove`. Repeated mic presses between submissions yield no further pauses.

The grace window's actual elapsed duration is accumulated onto `gameState.micGraceTimeMs` when the 1.5s timeout fires, so it can be subtracted from the displayed/stored round time (see §9).

### Score-based timer extensions

In addition to the mic grace, the per-turn timer duration itself grows with the counter's progress:
- Score **≥ 77** adds **+0.5s** to every subsequent turn's timer.
- Score **≥ 100** adds another **+0.5s** (cumulative +1.0s past 100).

The extension is computed from `gameState.highestCounterNumber` each render inside `Game.jsx` and passed as `duration` to the `<TimerBar>`, so the new value takes effect on the very next timer reset.

### Elapsed-time accounting

`getElapsedTime(state)` in [src/lib/gameLogic.js](src/lib/gameLogic.js) returns the **adjusted** round time used on the loss/win screen and in leaderboard writes:

```
elapsed = max(0, wall − 0.5 × controllerTimeMs/1000 − micGraceTimeMs/1000)
```

- `controllerTimeMs` is accumulated in `doCPUTurn` using the same random delay the CPU used to `setTimeout`. Counting only 50% of CPU time keeps difficulty tiers time-comparable without completely hiding the CPU's pacing.
- `micGraceTimeMs` is accumulated when each 1.5s grace window completes. Full grace time is subtracted so voice players aren't penalised for using the intended feature.

### Transcript parsing

`parseSpoken()` normalises the Whisper transcript (punctuation stripped, hyphens collapsed) and tries, in order:

1. Direct integer parse of the full string.
2. Regex extraction of the first 1–3 digit number found.
3. Word-based parse supporting `hundred` / tens + units compounds (e.g., `"one hundred and twelve"` → 112).
4. Fallback to any individual unit/teen/tens word match.

All candidates are clamped to 1–220 (above-`MAX_SCORE` buffer covers the highest pool max).

---

## 8. Physics Systems

Two components use identical physics patterns: `MenuWheel` and `WheelThemePicker`.

**Phases:**
1. **drag** — direct pointer tracking
2. **friction** — linear deceleration after release
3. **spring** — snap to nearest integer position via damped spring

| Parameter | MenuWheel | WheelThemePicker |
|---|---|---|
| Spring K | 280 | 260 |
| Damping D | 30 | 28 |
| Overshoot vel | 1.6 | 1.8 |
| Friction | 4.5 | 4.5 |
| Tile height | 92px | 76px |
| Visible tiles | 3 | 5 |

Infinite scrolling is achieved via modular arithmetic on the position index.

---

## 9. Theming

Each theme is a plain object of CSS custom property values. `applyTheme(id)` writes them to `document.documentElement.style` and persists the choice:

```javascript
theme.vars = {
  '--background': '240 20% 4%',
  '--foreground': '180 100% 95%',
  '--cyan': '#00f0ff',
  // ...
}
```

Tailwind classes reference these vars (`bg-background`, `text-cyan`, etc.), so a single-line `applyTheme()` call recolours the entire UI instantly.

---

## 10. Animations

| Animation | Technique | Duration |
|---|---|---|
| Timer bar drain | requestAnimationFrame + `pow(pct, 1.35)` | per-turn |
| Panic vibrate | CSS keyframes, speed scales with urgency | 0.12–0.5s |
| Glitch distort | CSS keyframes: skew + hue-rotate + brightness | 750ms |
| CRT scanline | CSS `translateY` loop | 8s |
| CRT flicker | CSS opacity loop | 4s |
| Modal open/close | CSS `transform + opacity` transition | 1.44s |
| Screen flash | Radial-gradient overlay via React state | 200ms |
| Chromatic pulse (text) | CSS `text-shadow` keyframes | 3s |
| Fall-away (mobile difficulty) | CSS `transform + opacity` keyframes, staggered | 1.8s |
| Fade-to-game | CSS opacity keyframe | 1.5s |

---

## 11. Testing

### Unit Tests — Vitest

- **`src/__tests__/gameLogic.test.js`** — 40 tests covering difficulty config, state creation, `getNextRequiredCounter`, `validateCounterMove`, `applyCounterMove`, `generateCPUMove`, `applyCPUMove`, scoring, elapsed time, leaderboard (including **top-10-per-difficulty cap**), and full turn sequences
- **`src/__tests__/taunts.test.js`** — 3 tests ensuring every (failure type × score band) combination returns a valid taunt string. Victory taunts (per-difficulty, score ≥ 200) are served from the same `getTaunt()` entry point

### Pre-commit Enforcement

`.git/hooks/pre-commit` runs `npm test` before every commit. Failing tests block the commit.

```sh
#!/bin/sh
echo "Running tests before commit..."
npm test || { echo "Tests failed. Commit aborted."; exit 1; }
```

---

## 12. Build & Deployment

| Command | Action |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Vitest suite once |
| `npm run test:watch` | Continuous test mode |
| `npm run update-audio` | Regenerate audio manifest |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run typecheck` | TypeScript via jsconfig |

**Deployment flow:**

```
git push → GitHub → Vercel webhook → Vite build → CDN distribution
```

Deployment is typically live within 30 seconds of a push.

---

## 13. Mobile / PWA Considerations

- **`viewport-fit=cover`** in `index.html` enables safe-area insets
- **`100dvh`** (dynamic viewport height) accounts for mobile browser chrome show/hide
- **Safe-area insets** (`env(safe-area-inset-top/bottom)`) pad the Home and Game pages
- **PWA manifest** (`public/manifest.json`) defines the install metadata; users can "Add to Home Screen" on iOS/Android to get an app-like experience with the logo icon
- **Autoplay policy workaround** — music play is attempted on mount, and fallback listeners (`pointerdown`, `keydown`, `touchstart`, `mousemove`, `wheel`) retry on the first user gesture

---

## 14. Known Constraints & Trade-offs

| Decision | Reason | Trade-off |
|---|---|---|
| No backend | Keep friction minimal, free hosting | No global leaderboards or cloud saves |
| localStorage only | Simple, privacy-friendly | Clearing browser data wipes progress |
| Whisper on-device (transformers.js) | Fully private, offline after first load, cross-browser, no server | ~40MB one-time model download on first mic use |
| Procedural SFX | Tiny bundle, consistent feel | Can't use licensed/designed sound effects |
| CRT overlay at `z-index: -1` | Avoids mobile touch-block bugs | Overlay appears behind UI, not above — subtle-feeling instead of in-your-face |
| Single mic stream feeds recorder + analyser | One `getUserMedia` call, unified lifecycle | Analyser closed with stream at end of each push-to-talk cycle |

---

## 15. Future Considerations

- Optional backend for global leaderboards (Supabase / Firebase)
- Service worker for offline play
- Accessibility: reduced-motion media query disabling glitch effects
- Telemetry (privacy-preserving, opt-in) for measuring drop-off
- Gamepad input for the carousel and number submission
