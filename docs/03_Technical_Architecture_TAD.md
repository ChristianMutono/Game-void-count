# 03 — Technical Architecture Document (TAD)

**Project:** Void Count
**Developer:** Christian Mutono (Mr Raw)

---

## 1. System Overview

Void Count is a **fully client-side Single-Page Application** built with React 18 and Vite. There is no backend. All state is local (React hooks for session state, `localStorage` for persistence). Audio is procedurally synthesised via the Web Audio API; music uses HTML5 Audio elements. Voice input uses the browser-native Web Speech API.

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
│   [Web Speech API] — voice input, number parsing             │
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
| Voice | Web Speech API | Speech recognition |
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
│   │   ├── taunts.js                  # 112-taunt matrix
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
| `voidcount_mic_default` | `'muted'` or `'unmuted'` |
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

Voice uses the browser-native Web Speech API (`window.SpeechRecognition` / `webkitSpeechRecognition`). No third-party library — major alternatives (`react-speech-recognition`, `annyang`) wrap the same API.

Key settings:

- `continuous: true` — keeps recognition running across utterances
- `interimResults: true` — fires on partial transcripts for snappier response
- `maxAlternatives: 3` — tries multiple interpretations per utterance
- `lang: 'en-US'`

The `parseSpoken()` helper accepts any transcript and tries, in order:

1. Direct integer parse
2. Exact phrase match against `WORD_MAP`
3. Any individual word matches in `WORD_MAP`
4. Any compound phrase substring match

Only `event.results[event.resultIndex]` onward is processed per event (the `.results` collection accumulates with `continuous: true`). Submissions are debounced: the same number cannot re-submit within 1.5s.

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
- **`src/__tests__/taunts.test.js`** — 3 tests ensuring every (failure type × score band) combination returns a valid taunt string

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
| Web Speech API | Zero bundle cost | Requires internet (Chrome sends audio to Google servers); inconsistent across browsers |
| Procedural SFX | Tiny bundle, consistent feel | Can't use licensed/designed sound effects |
| CRT overlay at `z-index: -1` | Avoids mobile touch-block bugs | Overlay appears behind UI, not above — subtle-feeling instead of in-your-face |
| Separate volume meter stream | Real-time mic feedback | Runs getUserMedia twice; may conflict with SpeechRecognition in some browsers |

---

## 15. Future Considerations

- Optional backend for global leaderboards (Supabase / Firebase)
- Service worker for offline play
- Accessibility: reduced-motion media query disabling glitch effects
- Telemetry (privacy-preserving, opt-in) for measuring drop-off
- Gamepad input for the carousel and number submission
