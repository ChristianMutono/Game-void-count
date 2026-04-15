export const DIFFICULTIES = {
  easy:    { label: 'EASY',    timer: 7, jump: 5,  color: 'cyan' },
  normal:  { label: 'NORMAL',  timer: 6, jump: 7,  color: 'yellow' },
  hard:    { label: 'HARD',    timer: 5, jump: 10, color: 'magenta' },
  extreme: { label: 'EXTREME', timer: 5, jump: 13, color: 'magenta' },
};

export const MAX_SCORE = 200;

// The total pool of available numbers: 1 to (MAX_SCORE + maxJump)
export function getPoolMax(difficulty) {
  const diff = DIFFICULTIES[difficulty] || DIFFICULTIES.normal;
  return MAX_SCORE + diff.jump;
}

export function createGameState(mode, difficulty) {
  return {
    mode,
    difficulty,
    counterNumbers: new Set(),
    controllerNumbers: new Set(),
    allNumbers: new Set(),
    counterHistory: [],
    controllerHistory: [],
    highestCounterNumber: 0,
    currentTurn: 'counter',
    isStarted: false,
    startTime: null,
    endTime: null,
    gameOver: false,
    failureType: null,
    lastSubmitted: null,
    counterWon: false,
    controllerTimeMs: 0,
    micGraceTimeMs: 0,
  };
}

export function getNextRequiredCounter(state) {
  let n = 1;
  while (state.counterNumbers.has(n) || state.controllerNumbers.has(n)) {
    n++;
  }
  return n;
}

export function validateCounterMove(state, number) {
  const poolMax = getPoolMax(state.difficulty);
  if (!Number.isInteger(number) || number < 1) {
    return { valid: false, reason: 'invalid_jump' };
  }
  if (number > poolMax) {
    return { valid: false, reason: 'invalid_jump' };
  }
  if (state.counterNumbers.has(number)) {
    return { valid: false, reason: 'duplicate' };
  }
  if (state.controllerNumbers.has(number)) {
    return { valid: false, reason: 'stolen' };
  }
  const required = getNextRequiredCounter(state);
  if (number !== required) {
    return { valid: false, reason: 'invalid_jump' };
  }
  return { valid: true };
}

export function applyCounterMove(state, number) {
  const newState = { ...state };
  newState.counterNumbers = new Set(state.counterNumbers);
  newState.controllerNumbers = new Set(state.controllerNumbers);
  newState.allNumbers = new Set(state.allNumbers);
  newState.counterHistory = [...state.counterHistory, number];

  newState.counterNumbers.add(number);
  newState.allNumbers.add(number);
  newState.highestCounterNumber = Math.min(
    Math.max(newState.highestCounterNumber || 0, number),
    MAX_SCORE
  );
  newState.lastSubmitted = number;
  newState.currentTurn = 'controller';

  if (!newState.isStarted && number === 1) {
    newState.isStarted = true;
    newState.startTime = Date.now();
  }

  if (newState.highestCounterNumber >= MAX_SCORE) {
    newState.counterWon = true;
    newState.gameOver = true;
    newState.endTime = Date.now();
  }

  return newState;
}

export function generateCPUMove(state, difficulty) {
  const diff = DIFFICULTIES[difficulty];
  const maxJump = diff.jump;
  const poolMax = getPoolMax(difficulty);

  // Find the next sequential available number
  let nextSequential = 1;
  while (state.allNumbers.has(nextSequential)) {
    nextSequential++;
  }

  if (nextSequential > poolMax) return null; // pool exhausted

  const jumpChance = { easy: 0.4, normal: 0.58, hard: 0.68, extreme: 0.76 }[difficulty];
  // Tuned so the max jump lands at its target rank on the jump-size
  // leaderboard: 2nd on easy, 3rd on normal/hard/extreme (see PRD §3.3).
  const maxBoost = { easy: 0.08, normal: 0.05, hard: 0.06, extreme: 0.05 }[difficulty] || 0;

  if (Math.random() < jumpChance && maxJump > 1) {
    let jumpAmount;
    if (maxBoost > 0 && Math.random() < maxBoost) {
      jumpAmount = maxJump;
    } else {
      const r = Math.random();
      const biased = Math.pow(r, 0.585);
      jumpAmount = Math.max(1, Math.round(biased * (maxJump - 1)) + 1);
    }
    let target = nextSequential + jumpAmount;

    // Find next available number at or near target, within pool
    while (state.allNumbers.has(target) && target <= poolMax) target++;
    if (target <= poolMax) return target;
  }

  return nextSequential;
}

export function applyCPUMove(state, number) {
  const newState = { ...state };
  newState.counterNumbers = new Set(state.counterNumbers);
  newState.controllerNumbers = new Set(state.controllerNumbers);
  newState.allNumbers = new Set(state.allNumbers);
  newState.controllerHistory = [...state.controllerHistory, number];

  newState.controllerNumbers.add(number);
  newState.allNumbers.add(number);
  newState.lastSubmitted = number;
  newState.currentTurn = 'counter';

  return newState;
}

// Score = highest number the counter has submitted
export function getScore(state) {
  return state.highestCounterNumber || 0;
}

export function getElapsedTime(state) {
  if (!state.startTime) return 0;
  const end = state.endTime || Date.now();
  const wallSeconds = (end - state.startTime) / 1000;
  const cpuAdjustment = 0.5 * ((state.controllerTimeMs || 0) / 1000);
  const micGraceAdjustment = (state.micGraceTimeMs || 0) / 1000;
  return Math.max(0, wallSeconds - cpuAdjustment - micGraceAdjustment);
}

import { getItem, setItem } from './storage.js';

export function getLeaderboard() {
  const raw = getItem('voidcount_leaderboard');
  return raw ? JSON.parse(raw) : [];
}

export function saveToLeaderboard(entry) {
  const lb = getLeaderboard();
  lb.push(entry);
  lb.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.time - b.time;
  });
  // Keep top 10 per difficulty
  const counts = {};
  const trimmed = lb.filter(e => {
    const d = e.difficulty || 'normal';
    counts[d] = (counts[d] || 0) + 1;
    return counts[d] <= 10;
  });
  setItem('voidcount_leaderboard', JSON.stringify(trimmed));
  return trimmed;
}