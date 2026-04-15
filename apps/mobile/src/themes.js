import { getItem, setItem } from '@void-count/core';

// Ten named themes matching the web edition. Each theme defines the four
// colour anchors the UI keys off of. Consumers read the active theme via
// useTheme() and re-render when it changes.

export const THEMES = [
  { id: 'void',     label: 'VOID',     bg: '#05060b', bgAlt: '#0a0b14', cyan: '#00f0ff', magenta: '#ff0066', yellow: '#ffe600' },
  { id: 'inferno',  label: 'INFERNO',  bg: '#0b0603', bgAlt: '#180905', cyan: '#ff9a2a', magenta: '#ff2a00', yellow: '#ffe600' },
  { id: 'matrix',   label: 'MATRIX',   bg: '#030a03', bgAlt: '#071607', cyan: '#39ff14', magenta: '#ff3ee0', yellow: '#c6ff00' },
  { id: 'deepsea',  label: 'DEEP SEA', bg: '#020812', bgAlt: '#041024', cyan: '#00c9ff', magenta: '#f800d9', yellow: '#b7ffff' },
  { id: 'neonpink', label: 'NEON PINK',bg: '#0b030a', bgAlt: '#16061c', cyan: '#ff44cc', magenta: '#ff0066', yellow: '#ffd700' },
  { id: 'synth',    label: 'SYNTH',    bg: '#090318', bgAlt: '#15072e', cyan: '#6efcff', magenta: '#fa52ff', yellow: '#ffec3b' },
  { id: 'amber',    label: 'AMBER',    bg: '#0c0700', bgAlt: '#170f00', cyan: '#ffb000', magenta: '#ff5a00', yellow: '#ffe086' },
  { id: 'mono',     label: 'MONO',     bg: '#080808', bgAlt: '#121212', cyan: '#e6e6e6', magenta: '#a0a0a0', yellow: '#ffffff' },
  { id: 'blood',    label: 'BLOOD',    bg: '#0a0000', bgAlt: '#160000', cyan: '#ff3030', magenta: '#ff80a0', yellow: '#ff6060' },
  { id: 'arctic',   label: 'ARCTIC',   bg: '#05080a', bgAlt: '#0c1418', cyan: '#c0f0ff', magenta: '#7070a0', yellow: '#e0ffff' },
];

const KEY = 'voidcount_theme';

export function getActiveThemeId() {
  const id = getItem(KEY);
  return THEMES.some(t => t.id === id) ? id : 'void';
}

export function setActiveThemeId(id) {
  if (THEMES.some(t => t.id === id)) setItem(KEY, id);
}

export function getActiveTheme() {
  const id = getActiveThemeId();
  return THEMES.find(t => t.id === id) || THEMES[0];
}

// React-side observer so theme changes re-render UI that subscribes.
const listeners = new Set();
export function subscribeTheme(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function notifyThemeChanged() {
  for (const fn of listeners) fn();
}

export function applyTheme(id) {
  setActiveThemeId(id);
  notifyThemeChanged();
}
