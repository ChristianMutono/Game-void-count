# 04 — Monetization Strategy

**Project:** Void Count
**Developer:** Christian Mutono (Mr Raw)
**Status:** Deferred — target window: **v2.0 and beyond**

---

## Purpose

Void Count v1.0 ships free and unmonetized to prioritize player trust, leaderboard integrity, and word-of-mouth growth. This document parks three monetization routes under active consideration for v2.0+, ranked by expected profit potential. Each entry captures the mechanic, pricing intent, pros, and cons — so the decision can be revisited without re-deriving the reasoning.

Nothing here should be implemented before v1.0 has a stable install base and measurable retention cohorts to A/B against.

---

## Options at a glance

| Rank | Option | Model | Pricing | Expected revenue | Brand fit | Leaderboard risk |
|---|---|---|---|---|---|---|
| 1 | Power-ups | Consumable IAP | £/$0.50 – £/$2 bundles (~2–5p per use) | **Highest** | Medium | **High** (pay-to-win) |
| 2 | Ads + premium unlock | Ad-supported + one-time IAP | Low one-time unlock | Moderate | Low | None |
| 3 | Voice packs (Controller) | Cosmetic IAP | ~£/$0.50 per pack | Lowest | **Highest** | None |

---

## Ranked options (highest → lowest expected profit)

### 1. Power-ups (consumable IAP) — **highest expected revenue**

**Mechanic.** In-game consumables the player can trigger during a run.

| Power-up | Effect | Duration |
|---|---|---|
| Freeze | Pauses the game so the player can breathe and reset | 15–20s |
| Reminder | Freezes the game and pops the last *N* Controller-called numbers in randomized on-screen positions as a visual recall aid | 7s |

**Pricing.**

| Bundle | Price | Effective unit cost |
|---|---|---|
| Small | £/$0.50 | ~5p |
| Medium | £/$1 | ~3–4p |
| Large | £/$2 | ~2p |

**Pros / cons.**

| Pros | Cons |
|---|---|
| Consumable IAP is the proven highest-ARPU model in casual/arcade mobile; repeat purchases compound | **Pay-to-win stigma** — risks the "predatory mobile game" label that sours the project's tone |
| Directly tied to gameplay pain points (panic, memory lapse) — high perceived value in the moment | **Leaderboard integrity** — paid runs devalue skill-based rankings and dilute prestige of top scores |
| Bundle pricing encourages larger top-ups (classic anchoring) | Requires careful balance so power-ups feel helpful without trivializing difficulty curves |
| Scales with session count, not install base — engagement drives revenue | IAP adds store-compliance surface (receipts, restore purchases, refund flows) — non-trivial engineering |

*Mitigation for leaderboard risk:* segregate leaderboards into **Pure** (no power-ups) and **Assisted** tracks; or block power-ups entirely from ranked runs and only allow them in a separate "Practice" / casual mode.

---

### 2. Ads + one-time premium unlock — **moderate expected revenue**

**Mechanic.** Interstitial ads play every 2–3 rounds, with a 10–30s forced-wait timer before the close ('x') button appears. A single one-time IAP at a relatively low price point permanently removes all ads.

**Pros / cons.**

| Pros | Cons |
|---|---|
| Industry-standard dual funnel: ad revenue from the free majority, IAP conversion from the ~2–5% willing to pay | **Strong founder-level distaste** — Christian flags forced-wait interstitials as a personal uninstall trigger; shipping the exact pattern he hates risks undermining the product's voice |
| Passive revenue — scales with DAU without ongoing content work | Interstitials on a voice-driven game are especially disruptive: ads break audio focus, which is the core gameplay loop |
| Low one-time unlock price reduces friction for converts; ad-averse users self-select into paying | 10–30s forced waits are the most-hated ad format; review-score damage is likely |
| Well-supported SDK ecosystem (AdMob, AppLovin, Unity Ads) — integration is mature | Web edition gains little from this model (ad-block ubiquity; worse eCPMs than mobile) |

*Alternative worth considering before committing:* **rewarded video only** — player opts in to watch an ad in exchange for a free power-up or continue. Preserves user agency, removes the uninstall-trigger pattern, and still funnels ad-averse users toward the premium unlock.

---

### 3. Controller voice packs (cosmetic IAP) — **lowest expected revenue, highest brand fit**

**Mechanic.** Replace the **Controller's** voice with a purchasable pack. Train voice models on distinctive voices, synthesize counts 1–250 across 3 tonal variants, chop to per-number clips, and sell as in-game voice-pack IAPs at ~£/$0.50 each. The pack drives every number the Controller calls during a match, so the player hears their chosen voice counting against them for the full run.

**Pack variants.**

| Variant type | Audience | Hook |
|---|---|---|
| Celebrity / character impressions | General players | Novelty, shareability, social clips |
| Foreign-language (native speaker) | Language learners (ESL, Duolingo-adjacent) | Real listening drill: hear native numbers under time pressure |

**Production spec per pack.**

| Item | Quantity |
|---|---|
| Number coverage | 1 – 250 |
| Tonal variants | 3 |
| Total clips per pack | ~750 |

**Pros / cons.**

| Pros | Cons |
|---|---|
| **Purely cosmetic** — swapping the Controller's voice changes presentation only; jump distributions, timers, and scoring are untouched, so leaderboard integrity is preserved | **Production cost per pack is the bottleneck** — training, 3 tonal variants × 250 numbers, QA, chopping, and licensing all fall on a solo dev |
| Aligns with the project's voice-first identity; a custom Controller voice feels like a natural extension rather than a monetization bolt-on | **Celebrity likeness / voice-cloning carries real legal risk** in the UK, EU, and US (post-2024 voice-rights legislation). Safer paths: commission original voice actors with distinctive personas, or license voices explicitly |
| Language-learner angle opens a distinct audience and a defensible niche | Lower per-unit price and non-essential nature cap ARPU below consumable power-ups |
| Infinite catalogue ceiling — each new pack is additive content with no balance risk | Discovery problem — cosmetic packs need in-game storefronts and preview UX to convert |
| High word-of-mouth / social-share potential (players post clips of "X celebrity counting me out") | |

---

## Decision guidance for v2.0 planning

When the time comes to implement, prefer the ordering that protects the game's identity **before** maximizing revenue:

| Phase | Action | Guardrail |
|---|---|---|
| First | Ship voice packs (option 3) | Validates willingness-to-pay with zero leaderboard risk |
| Second | Layer in power-ups (option 1) | Only after **Pure** vs **Assisted** leaderboard split exists; never allow paid items in the ranked ladder |
| Last resort | Ads (option 2) | Prefer **rewarded video** over forced-wait interstitials to avoid the uninstall-trigger pattern |

---

## Revisit triggers

Re-open this document when any of the following is true:

| Trigger | Threshold |
|---|---|
| Install base milestone | v1.0 has ≥10k installs with a measurable D7 retention baseline |
| Platform policy shift | An iOS or Android policy change materially affects one of the options |
| Roadmap activation | A concrete v2.0 scope begins and monetization must be slotted into the roadmap |
