// Ordered by visual brightness (darkest → lightest background)
export const THEMES = [
  {
    id: 'void',
    label: 'VOID',
    vars: {
      '--background': '240 20% 4%',
      '--foreground': '180 100% 95%',
      '--card': '240 15% 8%',
      '--primary': '185 100% 50%',
      '--secondary': '330 100% 50%',
      '--accent': '54 100% 50%',
      '--muted': '240 10% 15%',
      '--muted-foreground': '240 5% 55%',
      '--border': '240 10% 20%',
      '--cyan': '#00f0ff',
      '--magenta': '#ff0066',
      '--yellow': '#ffe600',
      '--obsidian': '#0a0a0f',
      '--obsidian-light': '#12121f',
    },
    preview: { bg: '#0a0a0f', accent1: '#00f0ff', accent2: '#ff0066', accent3: '#ffe600' }
  },
  {
    id: 'phosphor',
    label: 'PHOS',
    vars: {
      '--background': '120 30% 3%',
      '--foreground': '120 80% 88%',
      '--card': '120 20% 7%',
      '--primary': '120 100% 50%',
      '--secondary': '80 100% 50%',
      '--accent': '160 100% 50%',
      '--muted': '120 15% 12%',
      '--muted-foreground': '120 10% 55%',
      '--border': '120 15% 16%',
      '--cyan': '#00ff66',
      '--magenta': '#aaff00',
      '--yellow': '#00ffcc',
      '--obsidian': '#020d02',
      '--obsidian-light': '#071207',
    },
    preview: { bg: '#020d02', accent1: '#00ff66', accent2: '#aaff00', accent3: '#00ffcc' }
  },
  {
    id: 'ultraviolet',
    label: 'UV',
    vars: {
      '--background': '260 30% 6%',
      '--foreground': '280 80% 95%',
      '--card': '260 25% 10%',
      '--primary': '280 100% 65%',
      '--secondary': '200 100% 55%',
      '--accent': '320 100% 65%',
      '--muted': '260 15% 15%',
      '--muted-foreground': '260 8% 55%',
      '--border': '260 15% 20%',
      '--cyan': '#cc44ff',
      '--magenta': '#ff44cc',
      '--yellow': '#44ccff',
      '--obsidian': '#0a060f',
      '--obsidian-light': '#140d1f',
    },
    preview: { bg: '#0a060f', accent1: '#cc44ff', accent2: '#ff44cc', accent3: '#44ccff' }
  },
  {
    id: 'dusk',
    label: 'DUSK',
    vars: {
      '--background': '230 25% 14%',
      '--foreground': '220 60% 92%',
      '--card': '230 22% 20%',
      '--primary': '210 90% 65%',
      '--secondary': '340 80% 65%',
      '--accent': '50 90% 60%',
      '--muted': '230 18% 26%',
      '--muted-foreground': '220 15% 65%',
      '--border': '230 18% 30%',
      '--cyan': '#5599ff',
      '--magenta': '#ff5599',
      '--yellow': '#ffdd44',
      '--obsidian': '#0e1220',
      '--obsidian-light': '#182030',
    },
    preview: { bg: '#0e1220', accent1: '#5599ff', accent2: '#ff5599', accent3: '#ffdd44' }
  },
  {
    id: 'clay',
    label: 'CLAY',
    vars: {
      '--background': '18 42% 28%',
      '--foreground': '35 70% 90%',
      '--card': '18 38% 34%',
      '--primary': '28 100% 60%',
      '--secondary': '10 85% 60%',
      '--accent': '45 95% 55%',
      '--muted': '18 30% 38%',
      '--muted-foreground': '30 30% 72%',
      '--border': '18 28% 44%',
      '--cyan': '#ff7733',
      '--magenta': '#cc3300',
      '--yellow': '#ffcc44',
      '--obsidian': '#2a1508',
      '--obsidian-light': '#3d1f0e',
    },
    preview: { bg: '#2a1508', accent1: '#ff7733', accent2: '#cc3300', accent3: '#ffcc44' }
  },
  {
    id: 'grass',
    label: 'GRASS',
    vars: {
      '--background': '130 76% 20%',
      '--foreground': '80 80% 92%',
      '--card': '130 60% 26%',
      '--primary': '90 100% 60%',
      '--secondary': '50 100% 58%',
      '--accent': '160 80% 58%',
      '--muted': '130 45% 30%',
      '--muted-foreground': '100 30% 72%',
      '--border': '130 40% 36%',
      '--cyan': '#88ff44',
      '--magenta': '#ffee22',
      '--yellow': '#44ffaa',
      '--obsidian': '#0c5815',
      '--obsidian-light': '#16771e',
    },
    preview: { bg: '#0c5815', accent1: '#88ff44', accent2: '#ffee22', accent3: '#44ffaa' }
  },
  {
    id: 'basketball',
    label: 'BBALL',
    vars: {
      '--background': '30 35% 46%',
      '--foreground': '25 60% 10%',
      '--card': '30 30% 40%',
      '--primary': '20 100% 25%',
      '--secondary': '35 80% 20%',
      '--accent': '45 90% 25%',
      '--muted': '30 25% 36%',
      '--muted-foreground': '0 0% 95%',
      '--border': '30 22% 32%',
      '--cyan': '#ff8844',
      '--magenta': '#ff4422',
      '--yellow': '#ffcc44',
      '--obsidian': '#c07040',
      '--obsidian-light': '#b06030',
    },
    preview: { bg: '#c07040', accent1: '#ff8844', accent2: '#ff4422', accent3: '#ffcc44' }
  },
  {
    id: 'storm',
    label: 'STORM',
    vars: {
      '--background': '215 20% 46%',
      '--foreground': '215 30% 96%',
      '--card': '215 22% 40%',
      '--primary': '205 70% 75%',
      '--secondary': '340 65% 75%',
      '--accent': '45 80% 70%',
      '--muted': '215 18% 36%',
      '--muted-foreground': '215 12% 82%',
      '--border': '215 18% 52%',
      '--cyan': '#6aaddf',
      '--magenta': '#df6aaa',
      '--yellow': '#dfc86a',
      '--obsidian': '#3a4d62',
      '--obsidian-light': '#455870',
    },
    preview: { bg: '#3a4d62', accent1: '#6aaddf', accent2: '#df6aaa', accent3: '#dfc86a' }
  },
  {
    id: 'arctic',
    label: 'ARCTIC',
    vars: {
      '--background': '200 30% 82%',
      '--foreground': '210 50% 8%',
      '--card': '200 28% 76%',
      '--primary': '205 80% 28%',
      '--secondary': '340 70% 32%',
      '--accent': '38 90% 34%',
      '--muted': '200 22% 68%',
      '--muted-foreground': '0 0% 95%',
      '--border': '200 22% 55%',
      '--cyan': '#1a7abf',
      '--magenta': '#c01858',
      '--yellow': '#c07a00',
      '--obsidian': '#ccdde8',
      '--obsidian-light': '#b8ccd8',
    },
    preview: { bg: '#ccdde8', accent1: '#1a7abf', accent2: '#c01858', accent3: '#c07a00' }
  },
  {
    id: 'solar',
    label: 'ICE HOCKEY',
    vars: {
      '--background': '220 20% 96%',
      '--foreground': '220 40% 6%',
      '--card': '220 15% 91%',
      '--primary': '210 90% 28%',
      '--secondary': '0 85% 35%',
      '--accent': '35 100% 30%',
      '--muted': '220 15% 85%',
      '--muted-foreground': '0 0% 95%',
      '--border': '220 15% 70%',
      '--cyan': '#0066cc',
      '--magenta': '#cc1111',
      '--yellow': '#cc7700',
      '--obsidian': '#e8ecf4',
      '--obsidian-light': '#d8e0ec',
    },
    preview: { bg: '#e8ecf4', accent1: '#0066cc', accent2: '#cc1111', accent3: '#cc7700' }
  },
];

export function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });
  localStorage.setItem('voidcount_theme', themeId);
}

export function loadSavedTheme() {
  const saved = localStorage.getItem('voidcount_theme');
  if (saved) applyTheme(saved);
  return saved || 'void';
}