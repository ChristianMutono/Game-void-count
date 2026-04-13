# Void Count - Game Design Document

**Developer:** Christian Mutono (Mr Raw)

---

## 1. Overview

Void Count is a "Sega-Neon Fusion" counting game that pits a player's mental focus against a disruptive digital antagonist. Built with a retro-futuristic arcade aesthetic, the game uses a "Counter vs. Controller" mechanic designed to induce cognitive load and panic-state decision-making.

The player's single objective: say the lowest unused positive integer. The opponent's objective: make that as difficult as possible.

---

## 2. Core Gameplay

### 2.1 Roles

| Role | Objective |
|---|---|
| **Counter** | Must always submit the lowest unused positive integer in the sequence |
| **Controller** | Submits numbers to "claim" them, skipping values to disrupt the Counter's flow |

### 2.2 The "Starting Gun"

The match begins in static tension. No timers run until the Counter submits the number **1**. Once submitted, the session is live and the rules become enforced.

### 2.3 Loss Conditions

The Counter loses immediately upon any of the following:

| Failure Type | Description |
|---|---|
| **DUPLICATE** | Submitted a number already used by either player |
| **STOLEN** | Submitted a number already claimed by the Controller |
| **INVALID JUMP** | Skipped the current lowest available integer |
| **TIMEOUT** | Failed to submit before the timer expired |

### 2.4 Win Condition

The Counter wins by reaching a score of **200** (the highest counter number submitted).

---

## 3. Game Modes

### 3.1 Single Player (Human vs. CPU)

The CPU Controller uses weighted randomness, biased toward larger jumps to maximise confusion.

- **Jump probability by difficulty:** Easy 30%, Normal 40%, Hard 55%, Extreme 70%
- **Jump bias:** `pow(random, 0.585)` distribution — ~33% chance of a low jump, ~67% chance of a mid-to-high jump
- **CPU response time:** varies by difficulty (see below)

### 3.2 Local 2-Player (Hotseat)

Two players share the same device, alternating turns. Controller is restricted to a **+9 jump** to prevent game-breaking skips. Turn indicators pulse in neon: cyan for Counter, magenta for Controller.

---

## 4. Difficulty Settings

| Difficulty | Jump Limit | Timer | CPU Response Time |
|---|---|---|---|
| **Easy** | +5 | 7.0s | 0.5 - 3.0s |
| **Normal** | +7 | 6.0s | 0.5 - 2.5s |
| **Hard** | +9 | 5.0s | 0.5 - 2.0s |
| **Extreme** | +12 | 5.0s | 0.5 - 2.0s |

The number pool extends from 1 to `MAX_SCORE + jump_limit` (e.g. Easy: 1-205, Extreme: 1-212).

When the microphone is active, an additional 0.5s is added to the timer to account for speech processing latency.

---

## 5. Input Methods

Three concurrent input methods are supported:

| Method | Implementation |
|---|---|
| **Keyboard** | Numpad and top-row number keys. Backspace to clear, Enter to submit |
| **Touch** | Oversized hex-styled buttons (0-9) with CLR and Submit actions |
| **Voice** | Web Speech API with continuous recognition. Supports spoken numbers 0-200 including compound words ("twenty-one", "thirty-five", etc.). Includes a live volume meter |

---

## 6. The "Salt" Protocol (Loss Screen)

Upon failure, the game displays a full-screen loss overlay with:

- A 2-second glitch animation
- The final score, time elapsed, and difficulty
- A dynamically selected taunt message

### 6.1 Taunt Matrix

112 unique taunts across 4 failure types and 4 score bands:

| Score Band | Tone |
|---|---|
| **1-30** | Hostile mockery regarding basic arithmetic |
| **31-60** | Backhanded compliments on minor progress |
| **61-100** | Dismissive acknowledgement of competence |
| **100+** | Sarcastic awe at the player's dedication |

Each band contains 7 variations per failure type, randomly selected.

---

## 7. Visual Design

### 7.1 Aesthetic

Retro-futuristic "Sega-Neon Fusion" with CRT scanline overlays, chromatic aberration glitches, and neon glow effects throughout. The UI uses the Orbitron font for headings and Share Tech Mono for body text.

### 7.2 CRT Overlay

A fixed scanline sweeps vertically across the screen on an 8-second loop. A subtle horizontal line pattern with a flickering opacity simulates CRT phosphor burn.

### 7.3 Glitch Engine

The home screen periodically triggers a chromatic aberration glitch (every ~39-59 seconds). The UI distorts with skew transforms, hue rotation, and brightness shifts for 750ms, accompanied by a synthesised electrical buzz sound.

### 7.4 Panic Feedback

When the Counter has less than 40% of their timer remaining:
- The Controller's last number begins to vibrate
- Magenta glow intensity scales with urgency (up to 30px spread)
- Vibration animation speed increases from 0.5s to 0.12s per cycle
- The timer bar's visual depletion accelerates via a power curve (`pow(pct, 1.35)`)

### 7.5 Timer Display

A top-screen bar showing time to three decimal places (e.g. "2.341s"). The visual drain is non-linear: slower early, faster in the final seconds. Colour transitions from cyan (safe) through yellow (caution) to red (danger).

### 7.6 Themes

10 visual themes, each re-colouring the entire UI:

| Theme | Palette |
|---|---|
| Void (Default) | Deep obsidian with cyan/magenta/yellow accents |
| Phosphor | Green-on-black terminal aesthetic |
| Ultraviolet | Purple/violet neon |
| Dusk | Warm sunset gradients |
| Clay | Earth-tone warmth |
| Grass | Natural green palette |
| Basketball | Orange/brown court tones |
| Storm | Dark blue-grey |
| Arctic | Icy light blues |
| Ice Hockey | Cool whites and blues |

Themes are selectable via a physics-based vertical scroll wheel (desktop) or a grid in the settings modal. Selection persists in localStorage.

---

## 8. Audio Design

### 8.1 Sound Effects

All game sounds are procedurally synthesised using the Web Audio API. No audio files are loaded for SFX.

| Sound | Trigger | Description |
|---|---|---|
| **submit** | Counter submits valid number | Two ascending square-wave tones (660Hz + 990Hz) |
| **cpuMove** | CPU plays a number | Two sawtooth tones (330Hz + 220Hz) |
| **gameStart** | Counter submits "1" | Rising C-E-G-C chord (262-523Hz) |
| **error** | Game loss | Descending power-down sweep (440Hz down to 40Hz) |
| **timeout** | Timer expires | Two parallel descending sweeps |
| **badInput** | Invalid controller input | Low-frequency double beep (150Hz + 120Hz) |
| **menuClick** | Carousel wheel snaps | White noise burst (14ms) |
| **glitch** | Home screen glitch event | Layered white noise + bandpass filter + square-wave buzz |

### 8.2 Difficulty Music

Each difficulty has associated music tracks that play on hover over the difficulty selection buttons:

| Difficulty | Tracks |
|---|---|
| Easy | Baby Shark, Daisy Bell |
| Normal | Sonic Green Hill Zone, Super Mario Bros. |
| Hard | Jaws, MEGALOVANIA |
| Extreme | Carmina Burana (O Fortuna) |

Tracks alternate on each hover and fade in over 400ms. Audio stops immediately on mouse leave.

### 8.3 Audio Unlock

Browser autoplay policy requires user interaction before audio can play. The global AudioContext is pre-created and resumed on the first pointer, keyboard, touch, or scroll event.

---

## 9. Leaderboard

- **Primary metric:** Highest number reached by the Counter
- **Tiebreaker:** Total elapsed time (faster wins)
- **Storage:** Top 100 entries in browser localStorage
- **Display:** Filterable by difficulty, showing top 10 per tab with rank, player name, score, time, and failure type

---

## 10. Navigation

### 10.1 Carousel Wheel

Game modes and options are selected via a vertically scrolling carousel with:
- Spring physics (K=280, D=30) for natural momentum and snapping
- Friction deceleration phase before spring snap
- Pointer drag, touch, and mouse wheel support
- Mechanical click sound on each tile snap
- 5 options: Single Player, Local 2P, Rankings, Settings, FAQ

### 10.2 Settings

Accessible from the carousel or a mobile cog icon. Contains:
- Player name (max 8 characters)
- Microphone default state
- Theme picker grid
- Debug mode toggle (shows move histories and next required number)
- Clear rankings with confirmation

---

## 11. Technical Specifications

| Aspect | Detail |
|---|---|
| **Framework** | React 18 with Vite |
| **Styling** | Tailwind CSS with shadcn/ui components |
| **State** | React hooks (no external state library) |
| **Animation** | requestAnimationFrame for physics, CSS transitions/keyframes for UI |
| **Audio** | Web Audio API (synthesis), HTML5 Audio (music tracks) |
| **Voice Input** | Web Speech API |
| **Persistence** | localStorage (themes, scores, settings, player name) |
| **Backend** | None - fully client-side |
| **Hosting** | Static deployment (Vercel) |
