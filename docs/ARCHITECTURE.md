# Void Count - Technical Architecture

**Developer:** Christian Mutono (Mr Raw)

---

## Project Structure

```
void-count/
├── public/
│   ├── audio/                    # Difficulty hover music tracks
│   │   ├── easy_*.mp3
│   │   ├── normal_*.mp3
│   │   ├── hard_*.mp3
│   │   └── extreme_*.mp3
│   ├── images/
│   │   └── logo.png              # App icon (PWA + favicon)
│   └── manifest.json             # PWA manifest
├── src/
│   ├── components/
│   │   ├── game/
│   │   │   ├── CRTOverlay.jsx    # Scanline + flicker effect layer
│   │   │   ├── FAQ.jsx           # FAQ modal with accordion
│   │   │   ├── GameHUD.jsx       # Score, turn indicator, panic glow
│   │   │   ├── Leaderboard.jsx   # Leaderboard modal with difficulty tabs
│   │   │   ├── LossScreen.jsx    # Game over screen with taunts
│   │   │   ├── MenuWheel.jsx     # Physics-based carousel menu
│   │   │   ├── MuteButton.jsx    # Global audio mute toggle
│   │   │   ├── NumberInput.jsx   # Keyboard/touch/voice input
│   │   │   ├── SettingsModal.jsx # Settings panel
│   │   │   ├── ThemePicker.jsx   # Theme grid selector
│   │   │   ├── TimerBar.jsx      # Countdown bar with panic effects
│   │   │   └── WheelThemePicker.jsx # Desktop theme scroll wheel
│   │   └── ui/                   # shadcn/ui base components
│   ├── lib/
│   │   ├── gameLogic.js          # Rules engine, CPU AI, state management
│   │   ├── playerName.js         # Player name persistence
│   │   ├── querry-client.js      # React Query client config
│   │   ├── sounds.js             # Web Audio API synthesis engine
│   │   ├── taunts.js             # 112 taunts (4 types x 4 bands x 7 each)
│   │   ├── themes.js             # 10 themes with CSS variable application
│   │   └── utils.js              # Tailwind class merge utility
│   ├── pages/
│   │   ├── Home.jsx              # Main menu, difficulty select, glitch engine
│   │   └── Game.jsx              # Gameplay orchestrator
│   ├── App.jsx                   # Router setup
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Tailwind directives, CSS variables, animations
├── index.html                    # PWA meta tags, favicon
├── vite.config.js                # Vite + React plugin, @ path alias
├── tailwind.config.js            # Theme colours, fonts, animations, safelist
├── package.json
└── docs/
    ├── GAME_DESIGN.md            # This document
    └── ARCHITECTURE.md           # Technical architecture
```

---

## Data Flow

### Game Loop

```
Home.jsx                          Game.jsx
┌─────────────┐                  ┌──────────────────────────────┐
│ Menu Wheel   │ ─── navigate ──>│ Parse URL params             │
│ Mode Select  │   /game?mode=   │ Create initial game state    │
│ Difficulty   │   &difficulty=  │                              │
└─────────────┘                  │  ┌─ Counter submits ──────┐  │
                                 │  │  validateCounterMove()  │  │
                                 │  │  applyCounterMove()     │  │
                                 │  │  Flash cyan             │  │
                                 │  │  Reset timer            │  │
                                 │  └─────────────────────────┘  │
                                 │           │                    │
                                 │           ▼                    │
                                 │  ┌─ CPU turn (single) ─────┐  │
                                 │  │  Delay 0.5-3s            │  │
                                 │  │  generateCPUMove()       │  │
                                 │  │  applyCPUMove()          │  │
                                 │  │  Flash magenta           │  │
                                 │  │  Reset timer             │  │
                                 │  └──────────┬──────────────┘  │
                                 │             │                  │
                                 │             ▼                  │
                                 │  ┌─ Game Over? ─────────────┐ │
                                 │  │  Yes → LossScreen.jsx    │ │
                                 │  │  No  → Back to Counter   │ │
                                 │  └──────────────────────────┘ │
                                 └──────────────────────────────┘
```

### State Structure

```javascript
gameState = {
  mode,                    // 'single' | 'local'
  difficulty,              // 'easy' | 'normal' | 'hard' | 'extreme'
  counterNumbers,          // Set<number> — numbers claimed by Counter
  controllerNumbers,       // Set<number> — numbers claimed by Controller
  allNumbers,              // Set<number> — union of both
  counterHistory,          // number[] — ordered sequence of Counter moves
  controllerHistory,       // number[] — ordered sequence of Controller moves
  highestCounterNumber,    // number — current score
  currentTurn,             // 'counter' | 'controller'
  isStarted,               // boolean — true after "1" is submitted
  startTime,               // timestamp | null
  endTime,                 // timestamp | null
  gameOver,                // boolean
  failureType,             // 'duplicate' | 'stolen' | 'invalid_jump' | 'timeout' | null
  lastSubmitted,           // number | null — most recent number by either player
  counterWon,              // boolean
}
```

---

## Persistence (localStorage)

| Key | Type | Purpose |
|---|---|---|
| `voidcount_player_name` | string | Player display name |
| `voidcount_leaderboard` | JSON array | Top 100 scores |
| `voidcount_theme` | string | Active theme ID |
| `voidcount_mic_default` | `'muted'` or `'unmuted'` | Microphone startup state |
| `voidcount_debug` | `'on'` or `'off'` | Debug mode toggle |

---

## Audio Architecture

### Synthesised SFX (Web Audio API)

All game sound effects are generated in real-time using oscillators and gain nodes. A single global `AudioContext` is shared across the app, pre-unlocked on the first user interaction event.

```
User interaction → getCtx() creates/resumes AudioContext
                 → tone(freq, dur, type, vol) creates oscillator + gain
                 → sweep(freqStart, freqEnd, dur) creates frequency ramp
```

The glitch sound on the home screen routes through a master gain node for volume control, compositing three layers: filtered white noise, low-frequency square-wave buzz, and a high-frequency crackle burst.

### Music Tracks (HTML5 Audio)

Difficulty hover music uses standard `Audio` objects with fade-in via `setInterval`. Tracks alternate per-button on each hover interaction. A module-level index per difficulty tracks the current rotation.

---

## Physics Systems

Two components use spring-based physics for scroll interaction:

### MenuWheel (Main Menu)

| Parameter | Value |
|---|---|
| Spring K | 280 |
| Damping D | 30 |
| Overshoot velocity | 1.6 |
| Friction | 4.5 |
| Tile height | 92px |
| Visible tiles | 3 |

### WheelThemePicker (Desktop Theme Selector)

| Parameter | Value |
|---|---|
| Spring K | 260 |
| Damping D | 28 |
| Overshoot velocity | 1.8 |
| Tile height | 76px |
| Visible tiles | 5 |

Both follow the same phases: **drag** (direct tracking) → **friction** (deceleration) → **spring** (snap to nearest integer position). Infinite scrolling is achieved via modular arithmetic.

---

## Animation Systems

| Animation | Technique | Duration |
|---|---|---|
| Timer bar drain | requestAnimationFrame + power curve | Per-turn |
| Panic vibrate | CSS keyframes, speed varies | 0.12s - 0.5s |
| Glitch distort | CSS keyframes (skew, hue-rotate, brightness) | 750ms |
| CRT scanline | CSS translateY animation | 8s loop |
| CRT flicker | CSS opacity animation | 4s loop |
| Modal open/close | CSS transform + opacity transition | 1.44s |
| Screen flash | React state + radial gradient overlay | 200ms |
| Chromatic pulse | CSS text-shadow animation | 3s loop |
| Neon pulse | CSS opacity + brightness | 0.5s loop |

---

## Build & Deployment

| Command | Action |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint check |
| `git push` | Auto-deploys via Vercel |

The app is a fully static client-side SPA with no backend dependencies. The `dist/` output can be served from any static host.

---

## Dependencies

### Runtime

| Package | Purpose |
|---|---|
| react, react-dom | UI framework |
| react-router-dom | Client-side routing |
| @tanstack/react-query | Async state management |
| tailwind-merge, clsx, class-variance-authority | Tailwind utility composition |
| tailwindcss-animate | Animation utilities |
| lucide-react | Icon library |
| framer-motion | Animation library |
| @radix-ui/* | Headless UI primitives (shadcn/ui) |
| three | 3D rendering (available, not currently used in core gameplay) |
| recharts | Charting library |
| sonner, react-hot-toast | Toast notifications |
| canvas-confetti | Confetti effects |
| zod | Schema validation |
| react-hook-form | Form management |

### Dev

| Package | Purpose |
|---|---|
| vite | Build tool and dev server |
| @vitejs/plugin-react | React Fast Refresh |
| tailwindcss, postcss, autoprefixer | CSS toolchain |
| eslint + plugins | Code linting |
| typescript | Type checking (via jsconfig.json) |
