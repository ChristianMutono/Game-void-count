import { THEMES, applyTheme } from '....libthemes';

export default function ThemePicker({ currentTheme, onThemeChange }) {
  return (
    div className=flex flex-col gap-2 max-h-[calc(100vh-48px)] overflow-y-auto py-2 scrollbar-thin
      div className=font-orbitron text-[9px] text-muted-foreground tracking-widest uppercase text-center flex-shrink-0
        Theme
      div
      div className=flex flex-col gap-1.5
        {THEMES.map(theme = (
          ThemeTile
            key={theme.id}
            theme={theme}
            active={currentTheme === theme.id}
            onClick={() = {
              applyTheme(theme.id);
              onThemeChange(theme.id);
            }}
          
        ))}
      div
    div
  );
}

function ThemeTile({ theme, active, onClick }) {
  const { bg, accent1, accent2, accent3 } = theme.preview;

  return (
    button
      onClick={onClick}
      title={theme.label}
      className={`relative rounded-lg overflow-hidden transition-all duration-200 w-14 h-16 flex-shrink-0
                  ${active  'scale-105'  'opacity-60 hoveropacity-90'}`}
      style={{
        backgroundColor bg,
        boxShadow active  `0 0 10px ${accent1}66`  'none',
        outline active  `2px solid ${accent1}`  'none',
        outlineOffset active  '2px'  '0',
      }}
    
      { Mini grid }
      div className=absolute inset-0 opacity-20
           style={{
             backgroundImage `linear-gradient(${accent1}55 1px, transparent 1px),
                               linear-gradient(90deg, ${accent1}55 1px, transparent 1px)`,
             backgroundSize '7px 7px',
           }} 
      { Color bars }
      div className=absolute top-2 left-0 right-0 flex flex-col items-center gap-0.5
        div className=w-7 h-1 rounded-full style={{ backgroundColor accent1 }} 
        div className=w-4 h-0.5 rounded-full style={{ backgroundColor accent2 }} 
      div
      { Dots }
      div className=absolute bottom-3.5 left-0 right-0 flex justify-center gap-1
        div className=w-1.5 h-1.5 rounded-full style={{ backgroundColor accent1 }} 
        div className=w-1.5 h-1.5 rounded-full style={{ backgroundColor accent2 }} 
        div className=w-1.5 h-1.5 rounded-full style={{ backgroundColor accent3 }} 
      div
      { Label }
      div className=absolute bottom-0.5 left-0 right-0 text-center
        span className=font-orbitron font-bold style={{ fontSize '7px', color accent1 }}
          {theme.label.slice(0, 5)}
        span
      div
    button
  );
}