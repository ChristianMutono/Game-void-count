# 02 — Product Requirements Document (PRD)

**Project:** Void Count
**Developer:** Christian Mutono (Mr Raw)

---

## 1. Scope

This document defines the functional and non-functional requirements for Void Count **across all editions** (web PWA, iOS, Android). Game rules, difficulty matrices, taunt matrices, and leaderboard contracts apply to every edition.

Where platform-specific behaviour diverges, the text is tagged `[web]`, `[mobile]`, `[ios]`, or `[android]`. Architectural realisation — how each edition actually implements these requirements — lives in the per-platform TAD (`docs/web/03_...` and `docs/mobile/03_...`).

---

## 2. User Roles

| Role | Description |
|---|---|
| **Player** | A human using the game on any device. No authentication. |
| **Counter (in-game)** | The human player in single mode; one of two humans in local mode |
| **Controller (in-game)** | The CPU opponent in single mode; the other human in local mode |

---

## 3. Functional Requirements

### 3.1 Navigation

- **FR-N-1** The home screen SHALL present a physics-based carousel menu with 5 options: Single Player, Local 2P, Rankings, Settings, FAQ
- **FR-N-2** The carousel SHALL use inertial scrolling with spring-based snap-to-center
- **FR-N-3** Each snap SHALL play a mechanical click sound (procedural white noise burst)
- **FR-N-4** Selecting Single Player or Local 2P SHALL reveal a difficulty picker (Easy, Normal, Hard, Extreme)
- **FR-N-5** The difficulty picker SHALL show visual severity cues: Hard has one skull (magenta), Extreme has three pulsing red skulls
- **FR-N-6** Selecting a difficulty SHALL trigger a multi-second fall-away transition with the difficulty's signature music before navigating to the game screen
  - Mobile: 8s total (5.5s animation + 2.5s music tail)
  - Desktop: 6s total (4s animation + 2s music tail)
- **FR-N-7** An Exit button SHALL be available at all times during gameplay to return to the main menu

### 3.2 Core Gameplay

- **FR-G-1** A match SHALL consist of turns alternating between Counter and Controller
- **FR-G-2** The game SHALL NOT start the timer until the Counter submits the number **1** ("starting gun")
- **FR-G-3** The Counter MUST submit the lowest unused positive integer on each turn
- **FR-G-4** The Controller MAY submit any unused positive integer within their jump limit
- **FR-G-5** The Counter SHALL lose immediately on any of:
  - Submitting a number already submitted by either player (**DUPLICATE**)
  - Submitting a number claimed by the Controller (**STOLEN**)
  - Submitting a number that is not the lowest available (**INVALID JUMP**)
  - Failing to submit before the timer expires (**TIMEOUT**)
- **FR-G-6** The Counter SHALL win upon reaching **MAX_SCORE (200)**

### 3.3 Difficulty Configuration

| Difficulty | Jump Limit | Timer | CPU Response Time (base) | CPU Jump Probability |
|---|---|---|---|---|
| Easy | +5 | 7.0s | 0.5 – 3.0s | 40% |
| Normal | +7 | 6.0s | 0.5 – 3.0s | 58% |
| Hard | +10 | 5.0s | 0.5 – 3.0s | 68% |
| Extreme | +13 | 5.0s | 0.5 – 3.0s | 76% |

The "base" response range is the starting window; it tightens as the score climbs per FR-D-5 below.

- **FR-D-1** The pool of available numbers SHALL extend from 1 to `MAX_SCORE + jump_limit`
- **FR-D-2** CPU jump amounts SHALL follow a **mixture distribution**:
  - With probability `p_max` (a small per-difficulty boost — `easy: 8%`, `normal: 5%`, `hard: 6%`, `extreme: 5%`), the jump size SHALL be the maximum allowed for that difficulty (a "signature dunk").
  - Otherwise, the jump size SHALL be drawn from the base distribution `round(Math.random()^0.585 × (maxJump − 1)) + 1`, clamped to `[1, maxJump]`. The power exponent `0.585 < 1` biases the draw toward larger jumps.
  - Formally: `P(k) = p_max · 𝟙{k = maxJump} + (1 − p_max) · P_base(k)`.
  - On `easy` the tuning makes the **maximum jump the 2nd most likely** jump size. On `normal`, `hard`, and `extreme` it sits at the **3rd** rank.

**Conditional jump-size distribution (given a jump is taken):**

| Size | Easy (M=5) | Normal (M=7) | Hard (M=10) | Extreme (M=13) |
|---|---|---|---|---|
| +1 | 2.6% | 1.4% | 0.7% | 0.4% |
| +2 | 14.6% | 7.5% | 3.7% | 2.3% |
| +3 | 24.0% | 12.4% | 6.1% | 3.8% |
| +4 | **32.0%** | 16.5% | 8.2% | 5.1% |
| +5 | **26.8%** (max) | **20.3%** | 10.1% | 6.2% |
| +6 | — | **23.8%** | 11.7% | 7.3% |
| +7 | — | **18.1%** (max) | 13.4% | 8.3% |
| +8 | — | — | **14.9%** | 9.2% |
| +9 | — | — | **16.4%** | 10.2% |
| +10 | — | — | **14.8%** (max) | 11.0% |
| +11 | — | — | — | **11.9%** |
| +12 | — | — | — | **12.7%** |
| +13 | — | — | — | **11.7%** (max) |

Bolded cells indicate the top-3 most likely jump sizes per difficulty.

**Unconditional per-turn probabilities** (combining the stage-1 jump/no-jump gate with the stage-2 mixture):

| Outcome | Easy | Normal | Hard | Extreme |
|---|---|---|---|---|
| Plays sequential (no jump) | 60.0% | 42.0% | 32.0% | 24.0% |
| Any jump — max jump specifically | 10.7% | 10.5% | 10.0% | 8.9% |
- **FR-D-3** The timer SHALL pause while the microphone is held for voice input, and SHALL remain paused for a **1.5-second grace period** from the moment the mic is activated before resuming, to cover model inference and transcript submission latency
  - The mic grace SHALL be granted **at most once per counter submission** — i.e., the grace credit refreshes only after a valid counter move is accepted. Pressing the mic a second time before submitting a number grants no additional grace
- **FR-D-4** The per-turn timer duration SHALL increase by **+0.5 seconds** once the counter's highest submitted number reaches **77**, and by an additional **+0.5 seconds** once it reaches **100**. The +0.5s at 100 accounts for the extra digit to input; the +0.5s at 77 accounts for increased cognitive load from a filling board.
  - **Exception:** the +0.5s grace at score 77 SHALL NOT be granted on `hard` or `extreme` difficulties. These tiers only receive the +0.5s grace at 100 onward (accounting for three-digit input). Easy and Normal receive both graces.
- **FR-D-5** The CPU response-time window SHALL tighten in score-based tiers as the round progresses, independently per difficulty. For each difficulty, the range below applies until the counter's highest submitted number exceeds the listed threshold:

| Score Tier | Easy | Normal | Hard | Extreme |
|---|---|---|---|---|
| ≤ 10 | 0.5 – 3.0s | 0.5 – 3.0s | 0.5 – 3.0s | 0.5 – 3.0s |
| > 10 | 0.5 – 3.0s | 0.5 – 2.5s | 0.5 – 2.0s | 0.5 – 2.0s |
| > 30 | 0.5 – 2.5s | 0.5 – 2.5s | 0.5 – 2.0s | 0.5 – 2.0s |
| > 50 | 0.5 – 2.5s | 0.5 – 2.0s | 0.5 – 1.5s | 0.25 – 1.5s |
| > 70 | 0.5 – 2.0s | 0.5 – 2.0s | 0.5 – 1.5s | 0.25 – 1.5s |
| > 120 | 0.25 – 1.0s | 0.5 – 1.5s | 0.25 – 1.0s | 0.25 – 1.0s |

The minimum floor drops from 0.5s to 0.25s at the deepest tiers of `easy`/`hard`/`extreme`, meaning the CPU can counter-move in as little as a quarter of a second against the most advanced players.

### 3.4 Input Methods

- **FR-I-1** The game SHALL support keyboard `[web]`, touch `[web|mobile]`, and voice `[web|mobile]` as concurrent input methods
- **FR-I-2** Keyboard `[web]` — digits append to input, Backspace clears last, Enter submits
- **FR-I-3** Touch `[web|mobile]` — oversized hex-styled buttons for digits 0–9, plus CLR and Submit
- **FR-I-4** Voice — on-device speech recognition that parses spoken numbers 1–200 (including compound words such as "twenty-one" or "one hundred and twelve") and submits them to the counter pipeline.
  - `[web]` Implemented via `@xenova/transformers` (Whisper base.en, distil-whisper, or digit-spelling via TF.js speech-commands). Push-to-talk only. Held recording is transcribed on release. Model loads lazily from the Hugging Face CDN and caches in IndexedDB. Full details in `docs/web/03_Technical_Architecture_TAD.md`. **Known limitation:** WASM encoder latency of ~3–7 s per utterance; voice input is shipped as an opt-in Beta.
  - `[mobile]` Implemented via native speech recognition (`SFSpeechRecognizer` on iOS, Android `SpeechRecognizer`) through `@react-native-voice/voice` or `expo-speech-recognition`. Two modes selectable in Settings:
    - **Push-to-Talk** (default) — press-and-hold mic button, release to submit.
    - **Continuous Listening** — opt-in toggle; mic icon is permanently visible in-game but starts off at round start. Tapping the mic toggles streaming recognition on/off. Each recognised utterance is parsed and submitted. The mic SHALL NOT listen outside an active round regardless of mode.
  - `[mobile]` Mobile voice inherits the 1.5-second timer grace from `FR-D-3` on activation only. Continuous mode does not extend grace per recognised utterance.
  - `[mobile]` Backgrounding the app SHALL stop any active recognition session immediately.

### 3.5 Visual Design

- **FR-V-1** A CRT scanline SHALL sweep vertically across the screen on an 8-second loop
- **FR-V-2** A subtle horizontal flicker pattern SHALL simulate CRT phosphor burn
- **FR-V-3** The home screen SHALL trigger a chromatic-aberration glitch effect every 39–59 seconds (750ms duration) with accompanying synthesised buzz
- **FR-V-4** The timer bar SHALL drain non-linearly (`pow(pct, 1.35)`) to accelerate visual urgency late
- **FR-V-5** Timer colour SHALL transition: Cyan (>65%) → Yellow (>40%) → Red (<40%)
- **FR-V-6** When the Counter has <40% time remaining, the Controller's last number SHALL vibrate and its magenta glow SHALL intensify
- **FR-V-7** The game SHALL provide 10 visual themes that recolour the entire UI via CSS custom properties
- **FR-V-8** Theme selection SHALL persist in `localStorage`
- **FR-V-9** Modals (Settings, FAQ, Leaderboard) SHALL animate with a grow-from-centre transform while the home content shrinks and fades

### 3.6 Audio

- **FR-A-1** All game SFX SHALL be procedurally synthesised via the Web Audio API (no audio files for SFX)
- **FR-A-2** Each difficulty SHALL have one or more associated music tracks that play on hover
- **FR-A-3** A homescreen background track SHALL loop on the home screen
- **FR-A-4** Background music SHALL attenuate during difficulty hover and restore to ~50% on hover end
- **FR-A-5** In-game background music SHALL play at 50% of the set music volume
- **FR-A-6** The home screen SHALL include a music mute toggle (top-left mobile/tablet, top-right desktop)
- **FR-A-7** The game screen SHALL include a music-only mute toggle in the top-right header
- **FR-A-8** Settings SHALL include independent SFX and Music volume sliders, both persisted in `localStorage`
- **FR-A-9** Default volumes SHALL be 85% on first launch
- **FR-A-10** Difficulty tracks SHALL be discovered via `public/audio/manifest.json` using filename prefixes (`easy_`, `normal_`, `hard_`, `extreme_`)

### 3.7 Loss Screen & Taunts

- **FR-L-1** Upon loss, a full-screen overlay SHALL display the failure type, final score, elapsed time, and difficulty
- **FR-L-2** A 2-second glitch animation SHALL play on entry
- **FR-L-3** A contextual taunt SHALL be selected from a matrix of **4 failure types × 4 score bands × 7 variants = 112 loss taunts**
  - Band 1 (1–30): hostile mockery
  - Band 2 (31–60): backhanded compliments
  - Band 3 (61–100): dismissive acknowledgement
  - Band 4 (100+): sarcastic awe
- **FR-L-4** The player SHALL be able to: Retry, view Rankings, or Exit. The Rankings action SHALL leave the round entirely — it dismisses the loss screen and shows the Rankings view as a full-screen overlay; closing Rankings returns the player to the Home screen (not back to the loss screen)
- **FR-L-5** Player name SHALL be editable on the loss screen (max 10 characters) and saved with the leaderboard entry
- **FR-L-6** The counter's score SHALL be capped at **MAX_SCORE (200)**; any submission that would carry `highestCounterNumber` above 200 is clamped to 200 for scoring and leaderboard purposes
- **FR-L-7** Upon reaching MAX_SCORE, a **victory taunt** SHALL be selected instead of a loss taunt, from a matrix of **4 difficulties × 7 variants = 28 victory taunts**
  - `easy`, `normal`, `hard`: mocking congratulations that pressure the player onto the next difficulty tier
  - `extreme`: begrudging, speechless acknowledgement that the player has beaten the void itself

### 3.8 Leaderboard

- **FR-LB-1** Scores SHALL be saved to `localStorage` upon game over
- **FR-LB-2** The leaderboard SHALL be capped at **10 entries per difficulty** (not 10 total)
- **FR-LB-3** Primary sort: highest score descending
- **FR-LB-4** Tiebreaker: elapsed time ascending (faster wins). The stored/displayed elapsed time SHALL be the adjusted total: `wall_clock − 0.5 × total_controller_think_time − total_mic_grace_time`, clamped at 0. This neutralises difficulty-skewed CPU pacing and rewards fair use of the voice grace without punishing it
- **FR-LB-5** The Rankings modal SHALL provide difficulty tabs showing the top 10 per tab
- **FR-LB-6** Settings SHALL offer a "Clear Rankings" action with confirmation feedback
- **FR-LB-7** The in-game HUD SHALL display the current top score for the active difficulty

### 3.9 Settings

- **FR-S-1** Player Name — editable, max 10 characters, persisted
- **FR-S-2** SFX Volume slider (0–100%), persisted
- **FR-S-3** Music Volume slider (0–100%), persisted
- **FR-S-4** Theme grid — 10 themes, persisted
- **FR-S-5** Debug Mode toggle — shows next-required number and both player histories during play
- **FR-S-6** Clear Rankings button with 2-second "cleared" confirmation

> Note: the voice input is push-to-talk on demand; no "mic default" setting is required. The mic is never listening unless the user is actively holding the mic button.

---

## 4. Non-Functional Requirements

### 4.1 Platform & Distribution

- **NFR-P-1** The game SHALL run in any modern browser (Chrome, Firefox, Safari, Edge) on desktop, tablet, and phone
- **NFR-P-2** No user authentication or backend services SHALL be required
- **NFR-P-3** The game SHALL be installable as a PWA with the provided logo as the home-screen icon
- **NFR-P-4** Mobile layouts SHALL use `100dvh` and safe-area insets to account for browser chrome (URL bar, notches)

### 4.2 Performance

- **NFR-P-5** Initial load SHALL complete in under 3 seconds on a 4G connection
- **NFR-P-6** Physics animations SHALL run at 60fps on mid-range devices
- **NFR-P-7** The production bundle SHALL be served as static assets (no SSR needed)

### 4.3 Accessibility

- **NFR-A-1** All interactive elements SHALL be keyboard-navigable
- **NFR-A-2** Voice input SHALL be offered as an alternative to touch/keyboard for hands-free play
- **NFR-A-3** Theme choice SHALL allow for high-contrast alternatives (e.g. Phosphor, Arctic)

### 4.4 Privacy

- **NFR-PR-1** No data SHALL leave the device — all state is local
- **NFR-PR-2** Audio recorded during push-to-talk SHALL be processed entirely in-browser via on-device Whisper inference; no audio SHALL be transmitted to any server. The only network request related to voice is the one-time Whisper model fetch from the Hugging Face CDN, which contains no user audio

### 4.5 Quality

- **NFR-Q-1** Core game logic (rules, validation, CPU AI, leaderboard) SHALL have ≥ 40 unit tests
- **NFR-Q-2** A pre-commit hook SHALL run all tests and block commits that fail
- **NFR-Q-3** CI/CD SHALL auto-deploy on every push to `master` via Vercel

---

## 5. Out of Scope

- Online multiplayer / matchmaking
- Global leaderboards
- Social features (chat, friends, sharing)
- In-app monetisation
- Native mobile apps (iOS App Store / Google Play)
- Automated gameplay telemetry or analytics

---

## 6. Metrics of Success

- **Install friction:** a first-time user can reach gameplay within 2 taps from the shared URL
- **Retention proxy:** the user's high score improves between sessions (indirectly measurable via localStorage if opt-in telemetry is ever added)
- **Aesthetic fidelity:** the CRT / neon / glitch effects feel intentional and cohesive across themes
- **Cross-platform parity:** keyboard, touch, and voice all work on a single device without reload
