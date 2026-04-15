# 01 — Project Idea Brief (PIB)

**Project:** Void Count
**Developer:** Christian Mutono (Mr Raw)
**Document Status:** Living document — reflects the original vision

---

## 1. Concept

Void Count is a "Sega-Neon Fusion" counting game that pits a player's mental focus against a disruptive digital antagonist. The game uses a **Counter vs. Controller** mechanic designed to induce cognitive load and panic-state decision-making. It's styled as a retro-futuristic arcade experience — high-energy, intentionally atmospheric, visually striking.

The pitch in one line: *you have to say the lowest unused positive integer, while something or someone else is actively trying to make you forget what that number is*.

---

## 2. Vision

A 2026 upgrade of the arcade classic — addictive, frustrating, and visually striking. Designed to be playable in short bursts, rewarding quick thinking and punishing hesitation. The player should feel the clock bearing down on them, and feel genuinely mocked when they lose.

**Guiding slogan:** *Count or be consumed.*

---

## 3. Target Experience

- **Atmospheric:** CRT scanlines, chromatic aberration glitches, neon glow — the UI feels alive and slightly unstable
- **Tactile:** physics-based carousel menus with mechanical click sounds and inertial snap-to-center
- **Hostile but fair:** the Controller (AI or human) plays within clear rules, but uses psychological warfare — close numbers, far jumps, unpredictable timing
- **Punishing with personality:** 112 loss taunts (failure type × performance band) deliver scaled hostility, plus 28 difficulty-specific victory taunts that mock anyone who caps the score at 200

---

## 4. Core Gameplay Loop

1. Player enters a mode (Single Player vs CPU, or Local 2-Player hotseat)
2. Player picks a difficulty — each has its own timer, jump limit, and mood
3. The match begins in static tension — no timers until the Counter submits **"1"** (the "starting gun")
4. Counter must submit the lowest unused positive integer
5. Controller submits any unused number — close by to trick, far away to plant traps
6. Counter loses on:
   - **DUPLICATE** — a number already played
   - **STOLEN** — a number the Controller already claimed
   - **INVALID JUMP** — skipping the lowest available
   - **TIMEOUT** — failing to respond in time
7. On loss, a Cuphead-style villain appears with a snarky taunt
8. Score saved; player returns to the menu or retries

---

## 5. Key Differentiators

- **Voice, touch, and keyboard** all work concurrently — playable hands-free
- **112 contextual loss taunts** (4 failure types × 4 performance bands × 7 variants) + **28 victory taunts** (4 difficulties × 7 variants) for players who max out at 200
- **Fully procedural SFX** via Web Audio API — no audio assets for game sounds
- **10 re-skinnable visual themes** that recolour the entire UI
- **Panic feedback:** the controller's last number vibrates and glows more intensely as the timer drains
- **No backend** — fully client-side, PWA-installable on any device, one shareable URL

---

## 6. Success Criteria

- A person can open the game on their phone, laptop, or tablet and be playing within 5 seconds
- A round lasts between 30 seconds and several minutes depending on skill
- Players want to beat their previous high score on the leaderboard
- The aesthetic feels deliberate and distinctive — not a generic react-template look
- No sign-in, no backend, no friction — it's a game you bookmark and open when bored

---

## 7. Anti-Goals

- **Not** a multiplayer online game — local hotseat is as multiplayer as it gets
- **Not** monetised — no ads, no microtransactions, no "daily streak" nagging
- **Not** a mobile app on an app store — it's a PWA that lives in the browser
- **Not** trying to teach counting — the game assumes competence and punishes lapses

---

## 8. Personality & Tone

Snide. Digital. Unforgiving but self-aware. The taunts lean into hostility as entertainment — "your brain has a memory leak", "deja count is just pathetic", "the void doesn't wait". The UI speaks like a malfunctioning arcade cabinet that resents its players.

---

## 9. Open Questions (Future Considerations)

- Global leaderboards? — currently localStorage only; would require a backend
- More difficulty curves (e.g. "nightmare" with dynamic jump limits)?
- Tournament/party mode for passing the phone around?
- Accessibility options — high contrast, larger numbers, disable glitch effects?
