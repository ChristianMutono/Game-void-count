import { useEffect, useState } from 'react';
import { getActiveTheme, subscribeTheme } from '../themes';
import { FONTS } from '../theme';

export default function useTheme() {
  const [theme, setTheme] = useState(getActiveTheme());
  useEffect(() => subscribeTheme(() => setTheme(getActiveTheme())), []);

  const t = theme;
  return {
    ...t,
    panel: 'rgba(10,11,20,0.85)',
    border: 'rgba(255,255,255,0.08)',
    cyanDim: `${t.cyan}4D`,   // ~30% alpha
    cyanGlow: `${t.cyan}8C`,
    magentaDim: `${t.magenta}4D`,
    magentaAlt: `${t.magenta}CC`,
    yellowDim: `${t.yellow}4D`,
    fg: '#e0e8f0',
    mute: '#8898a8',
    muteDim: '#556070',
    fonts: FONTS,
  };
}
