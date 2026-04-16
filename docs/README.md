# Void Count — Documentation Structure

This monorepo documents the game at two levels:

## General (this folder)

Documents shared across the web, iOS, and Android editions. Game rules, mechanics, difficulty balance, taunt matrices, leaderboard contract, and UX intent are platform-neutral and live here. Where a detail differs between editions, it's called out inline with a platform tag (`[web]`, `[mobile]`, `[ios]`, `[android]`).

- [`01_Project_Idea_Brief_PIB.md`](01_Project_Idea_Brief_PIB.md) — the concept, audience, and tone.
- [`02_Product_Requirements_PRD.md`](02_Product_Requirements_PRD.md) — functional requirements, all cross-platform rules, and the difficulty matrices.
- [`04_Monetization_Strategy.md`](04_Monetization_Strategy.md) — **Deferred to v2.0+.** Three candidate monetization routes (power-ups, ads + premium, voice packs), ranked by expected profit with pros/cons.

## Per-platform technical docs

Each edition has its own Technical Architecture Document because the stack, build tool, audio engine, speech recognition approach, and persistence layer all differ substantially.

- [`web/03_Technical_Architecture_TAD.md`](web/03_Technical_Architecture_TAD.md) — React 18 + Vite + Tailwind PWA. On-device Whisper (`@xenova/transformers`) + TF.js speech-commands for voice input.
- [`mobile/03_Technical_Architecture_TAD.md`](mobile/03_Technical_Architecture_TAD.md) — *Planned.* React Native (Expo) using native speech-recognition APIs (`SFSpeechRecognizer` on iOS, Android `SpeechRecognizer`).

## Editing conventions

- Game logic changes → update the PRD (general). Core tests in `packages/core/src/__tests__/` must pass.
- Stack or pipeline changes → update the relevant per-platform TAD.
- When behaviour diverges intentionally between platforms, document the divergence in the PRD with a platform tag and in both TADs with cross-links.
