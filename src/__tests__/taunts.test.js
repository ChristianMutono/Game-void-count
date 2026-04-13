import { describe, it, expect } from 'vitest';
import { getTaunt } from '../lib/taunts';

const FAILURE_TYPES = ['duplicate', 'stolen', 'invalid_jump', 'timeout'];
const SCORE_BANDS = [
  { label: 'band1 (1-30)', score: 15 },
  { label: 'band2 (31-60)', score: 45 },
  { label: 'band3 (61-100)', score: 80 },
  { label: 'band4 (100+)', score: 120 },
];

describe('Taunt system', () => {
  it('returns a string for every failure type and score band', () => {
    for (const type of FAILURE_TYPES) {
      for (const { score } of SCORE_BANDS) {
        const taunt = getTaunt(type, score);
        expect(typeof taunt).toBe('string');
        expect(taunt.length).toBeGreaterThan(0);
      }
    }
  });

  it('returns a taunt even for edge scores', () => {
    expect(typeof getTaunt('duplicate', 1)).toBe('string');
    expect(typeof getTaunt('timeout', 30)).toBe('string');
    expect(typeof getTaunt('stolen', 31)).toBe('string');
    expect(typeof getTaunt('invalid_jump', 100)).toBe('string');
    expect(typeof getTaunt('duplicate', 101)).toBe('string');
    expect(typeof getTaunt('timeout', 200)).toBe('string');
  });

  it('falls back gracefully for unknown failure type', () => {
    const taunt = getTaunt('nonexistent', 50);
    expect(typeof taunt).toBe('string');
    expect(taunt.length).toBeGreaterThan(0);
  });
});
