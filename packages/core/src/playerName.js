import { getItem, setItem } from './storage.js';

const KEY = 'voidcount_player_name';
const DEFAULT = 'Player 1';
export const MAX_NAME_LEN = 10;

export function getPlayerName() {
  return getItem(KEY) || DEFAULT;
}

export function setPlayerName(name) {
  const trimmed = name.trim().slice(0, MAX_NAME_LEN) || DEFAULT;
  setItem(KEY, trimmed);
  return trimmed;
}
