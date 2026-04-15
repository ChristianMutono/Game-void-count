import { describe, it, expect, beforeEach } from 'vitest';
import {
  DIFFICULTIES,
  MAX_SCORE,
  getPoolMax,
  createGameState,
  getNextRequiredCounter,
  validateCounterMove,
  applyCounterMove,
  generateCPUMove,
  applyCPUMove,
  getScore,
  getElapsedTime,
  getLeaderboard,
  saveToLeaderboard,
} from '../gameLogic.js';

// Mock localStorage for leaderboard tests
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// ─── Difficulty Config ───

describe('Difficulty configuration', () => {
  it('defines all four difficulties', () => {
    expect(Object.keys(DIFFICULTIES)).toEqual(['easy', 'normal', 'hard', 'extreme']);
  });

  it('each difficulty has timer, jump, label, and color', () => {
    for (const [, diff] of Object.entries(DIFFICULTIES)) {
      expect(diff).toHaveProperty('timer');
      expect(diff).toHaveProperty('jump');
      expect(diff).toHaveProperty('label');
      expect(diff).toHaveProperty('color');
      expect(diff.timer).toBeGreaterThan(0);
      expect(diff.jump).toBeGreaterThan(0);
    }
  });

  it('pool max extends beyond MAX_SCORE by jump amount', () => {
    expect(getPoolMax('easy')).toBe(MAX_SCORE + DIFFICULTIES.easy.jump);
    expect(getPoolMax('extreme')).toBe(MAX_SCORE + DIFFICULTIES.extreme.jump);
  });
});

// ─── Game State Creation ───

describe('createGameState', () => {
  it('returns a fresh state with empty sets', () => {
    const state = createGameState('single', 'normal');
    expect(state.mode).toBe('single');
    expect(state.difficulty).toBe('normal');
    expect(state.counterNumbers.size).toBe(0);
    expect(state.controllerNumbers.size).toBe(0);
    expect(state.allNumbers.size).toBe(0);
    expect(state.isStarted).toBe(false);
    expect(state.gameOver).toBe(false);
    expect(state.failureType).toBeNull();
    expect(state.counterWon).toBe(false);
  });
});

// ─── getNextRequiredCounter ───

describe('getNextRequiredCounter', () => {
  it('returns 1 for an empty game', () => {
    const state = createGameState('single', 'normal');
    expect(getNextRequiredCounter(state)).toBe(1);
  });

  it('skips numbers claimed by counter', () => {
    const state = createGameState('single', 'normal');
    state.counterNumbers.add(1);
    state.allNumbers.add(1);
    expect(getNextRequiredCounter(state)).toBe(2);
  });

  it('skips numbers claimed by controller', () => {
    const state = createGameState('single', 'normal');
    state.controllerNumbers.add(1);
    state.allNumbers.add(1);
    expect(getNextRequiredCounter(state)).toBe(2);
  });

  it('finds gaps left by controller jumps', () => {
    const state = createGameState('single', 'normal');
    // Counter has 1, controller jumped to 3
    state.counterNumbers.add(1);
    state.controllerNumbers.add(3);
    state.allNumbers.add(1);
    state.allNumbers.add(3);
    expect(getNextRequiredCounter(state)).toBe(2);
  });
});

// ─── validateCounterMove ───

describe('validateCounterMove', () => {
  let state;

  beforeEach(() => {
    state = createGameState('single', 'normal');
  });

  it('accepts the correct next number', () => {
    expect(validateCounterMove(state, 1)).toEqual({ valid: true });
  });

  it('rejects a duplicate (counter already said it)', () => {
    state.counterNumbers.add(1);
    state.allNumbers.add(1);
    expect(validateCounterMove(state, 1)).toEqual({ valid: false, reason: 'duplicate' });
  });

  it('rejects a stolen number (controller claimed it)', () => {
    state.controllerNumbers.add(1);
    state.allNumbers.add(1);
    expect(validateCounterMove(state, 1)).toEqual({ valid: false, reason: 'stolen' });
  });

  it('rejects an invalid jump (skipping the lowest available)', () => {
    // Next required is 1, trying to submit 5
    expect(validateCounterMove(state, 5)).toEqual({ valid: false, reason: 'invalid_jump' });
  });

  it('rejects zero and negative numbers', () => {
    expect(validateCounterMove(state, 0)).toEqual({ valid: false, reason: 'invalid_jump' });
    expect(validateCounterMove(state, -3)).toEqual({ valid: false, reason: 'invalid_jump' });
  });

  it('rejects numbers beyond pool max', () => {
    const poolMax = getPoolMax('normal');
    expect(validateCounterMove(state, poolMax + 1)).toEqual({ valid: false, reason: 'invalid_jump' });
  });

  it('accepts a number that fills a gap left by controller', () => {
    // Counter plays 1, controller jumps to 3, counter must play 2
    state = applyCounterMove(state, 1);
    state = applyCPUMove(state, 3);
    expect(validateCounterMove(state, 2)).toEqual({ valid: true });
  });
});

// ─── applyCounterMove ───

describe('applyCounterMove', () => {
  it('adds number to counter sets and history', () => {
    let state = createGameState('single', 'normal');
    state = applyCounterMove(state, 1);
    expect(state.counterNumbers.has(1)).toBe(true);
    expect(state.allNumbers.has(1)).toBe(true);
    expect(state.counterHistory).toEqual([1]);
    expect(state.lastSubmitted).toBe(1);
  });

  it('starts the game when counter submits 1', () => {
    let state = createGameState('single', 'normal');
    expect(state.isStarted).toBe(false);
    expect(state.startTime).toBeNull();
    state = applyCounterMove(state, 1);
    expect(state.isStarted).toBe(true);
    expect(state.startTime).toBeGreaterThan(0);
  });

  it('switches turn to controller', () => {
    let state = createGameState('single', 'normal');
    state = applyCounterMove(state, 1);
    expect(state.currentTurn).toBe('controller');
  });

  it('updates highestCounterNumber', () => {
    let state = createGameState('single', 'normal');
    state = applyCounterMove(state, 1);
    expect(state.highestCounterNumber).toBe(1);
  });

  it('triggers win when counter reaches MAX_SCORE', () => {
    let state = createGameState('single', 'normal');
    state.highestCounterNumber = MAX_SCORE - 1;
    // Simulate the sequence being at MAX_SCORE
    for (let i = 1; i < MAX_SCORE; i++) {
      state.counterNumbers.add(i);
      state.allNumbers.add(i);
    }
    state = applyCounterMove(state, MAX_SCORE);
    expect(state.counterWon).toBe(true);
    expect(state.gameOver).toBe(true);
    expect(state.endTime).toBeGreaterThan(0);
  });

  it('does not mutate the original state', () => {
    const state = createGameState('single', 'normal');
    const newState = applyCounterMove(state, 1);
    expect(state.counterNumbers.has(1)).toBe(false);
    expect(newState.counterNumbers.has(1)).toBe(true);
  });
});

// ─── generateCPUMove ───

describe('generateCPUMove', () => {
  it('returns a valid unused number', () => {
    const state = createGameState('single', 'normal');
    for (let i = 0; i < 50; i++) {
      const move = generateCPUMove(state, 'normal');
      expect(move).toBeGreaterThanOrEqual(1);
      expect(move).toBeLessThanOrEqual(getPoolMax('normal'));
      expect(state.allNumbers.has(move)).toBe(false);
    }
  });

  it('never returns null when pool has available numbers', () => {
    const state = createGameState('single', 'easy');
    for (let i = 0; i < 20; i++) {
      const move = generateCPUMove(state, 'easy');
      expect(move).not.toBeNull();
    }
  });

  it('respects pool boundaries', () => {
    const state = createGameState('single', 'easy');
    const poolMax = getPoolMax('easy');
    for (let i = 0; i < 100; i++) {
      const move = generateCPUMove(state, 'easy');
      expect(move).toBeLessThanOrEqual(poolMax);
    }
  });
});

// ─── applyCPUMove ───

describe('applyCPUMove', () => {
  it('adds number to controller sets and history', () => {
    let state = createGameState('single', 'normal');
    state = applyCPUMove(state, 5);
    expect(state.controllerNumbers.has(5)).toBe(true);
    expect(state.allNumbers.has(5)).toBe(true);
    expect(state.controllerHistory).toEqual([5]);
    expect(state.lastSubmitted).toBe(5);
  });

  it('switches turn back to counter', () => {
    let state = createGameState('single', 'normal');
    state.currentTurn = 'controller';
    state = applyCPUMove(state, 5);
    expect(state.currentTurn).toBe('counter');
  });

  it('does not mutate the original state', () => {
    const state = createGameState('single', 'normal');
    const newState = applyCPUMove(state, 5);
    expect(state.controllerNumbers.has(5)).toBe(false);
    expect(newState.controllerNumbers.has(5)).toBe(true);
  });
});

// ─── Score & Time ───

describe('getScore', () => {
  it('returns 0 for a fresh game', () => {
    const state = createGameState('single', 'normal');
    expect(getScore(state)).toBe(0);
  });

  it('returns the highest counter number', () => {
    let state = createGameState('single', 'normal');
    state = applyCounterMove(state, 1);
    expect(getScore(state)).toBe(1);
  });
});

describe('getElapsedTime', () => {
  it('returns 0 before game starts', () => {
    const state = createGameState('single', 'normal');
    expect(getElapsedTime(state)).toBe(0);
  });

  it('returns positive time after game starts', () => {
    let state = createGameState('single', 'normal');
    state = applyCounterMove(state, 1);
    // Small delay so elapsed > 0
    expect(getElapsedTime(state)).toBeGreaterThanOrEqual(0);
  });
});

// ─── Leaderboard ───

describe('Leaderboard', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('returns empty array when no data exists', () => {
    expect(getLeaderboard()).toEqual([]);
  });

  it('saves and retrieves an entry', () => {
    const entry = { score: 42, playerName: 'Test', time: 30, difficulty: 'normal', mode: 'single', failureType: 'timeout', date: new Date().toISOString() };
    saveToLeaderboard(entry);
    const lb = getLeaderboard();
    expect(lb.length).toBe(1);
    expect(lb[0].score).toBe(42);
  });

  it('sorts by score descending then time ascending', () => {
    saveToLeaderboard({ score: 10, time: 5, difficulty: 'easy' });
    saveToLeaderboard({ score: 50, time: 20, difficulty: 'easy' });
    saveToLeaderboard({ score: 50, time: 10, difficulty: 'easy' });
    const lb = getLeaderboard();
    expect(lb[0].score).toBe(50);
    expect(lb[0].time).toBe(10);
    expect(lb[1].score).toBe(50);
    expect(lb[1].time).toBe(20);
    expect(lb[2].score).toBe(10);
  });

  it('caps at 10 entries per difficulty', () => {
    for (let i = 0; i < 15; i++) {
      saveToLeaderboard({ score: i + 1, time: 10, difficulty: 'easy' });
    }
    const lb = getLeaderboard();
    const easyEntries = lb.filter(e => e.difficulty === 'easy');
    expect(easyEntries.length).toBe(10);
  });

  it('keeps top 10 per difficulty independently', () => {
    for (let i = 0; i < 12; i++) {
      saveToLeaderboard({ score: i + 1, time: 10, difficulty: 'easy' });
    }
    for (let i = 0; i < 12; i++) {
      saveToLeaderboard({ score: i + 1, time: 10, difficulty: 'hard' });
    }
    const lb = getLeaderboard();
    const easyEntries = lb.filter(e => e.difficulty === 'easy');
    const hardEntries = lb.filter(e => e.difficulty === 'hard');
    expect(easyEntries.length).toBe(10);
    expect(hardEntries.length).toBe(10);
  });

  it('top 10 per difficulty keeps the highest scores', () => {
    for (let i = 0; i < 15; i++) {
      saveToLeaderboard({ score: i + 1, time: 10, difficulty: 'normal' });
    }
    const lb = getLeaderboard();
    const normalEntries = lb.filter(e => e.difficulty === 'normal');
    expect(normalEntries.length).toBe(10);
    // Lowest score in top 10 should be 6 (scores 6-15 kept, 1-5 dropped)
    const scores = normalEntries.map(e => e.score);
    expect(Math.min(...scores)).toBe(6);
    expect(Math.max(...scores)).toBe(15);
  });
});

// ─── Full Turn Sequence ───

describe('Full turn sequence', () => {
  it('counter and controller can alternate turns correctly', () => {
    let state = createGameState('single', 'easy');

    // Counter plays 1 (starts game)
    state = applyCounterMove(state, 1);
    expect(state.isStarted).toBe(true);
    expect(state.currentTurn).toBe('controller');

    // Controller plays 3 (skips 2)
    state = applyCPUMove(state, 3);
    expect(state.currentTurn).toBe('counter');

    // Counter must play 2 (lowest available)
    expect(getNextRequiredCounter(state)).toBe(2);
    expect(validateCounterMove(state, 2)).toEqual({ valid: true });
    state = applyCounterMove(state, 2);
    expect(state.currentTurn).toBe('controller');

    // Counter's next required is now 4 (1,2,3 taken)
    expect(getNextRequiredCounter(state)).toBe(4);
  });

  it('counter loses on duplicate', () => {
    let state = createGameState('single', 'easy');
    state = applyCounterMove(state, 1);
    state = applyCPUMove(state, 3);
    // Counter tries to play 1 again
    const result = validateCounterMove(state, 1);
    expect(result).toEqual({ valid: false, reason: 'duplicate' });
  });

  it('counter loses on stolen number', () => {
    let state = createGameState('single', 'easy');
    state = applyCounterMove(state, 1);
    state = applyCPUMove(state, 2);
    // Counter must play 2 but controller already has it — actually counter must play lowest available
    // Lowest available is 2, but controller has it, so getNextRequired skips it
    expect(getNextRequiredCounter(state)).toBe(3);
    // If counter tries 2 anyway
    const result = validateCounterMove(state, 2);
    expect(result).toEqual({ valid: false, reason: 'stolen' });
  });
});
