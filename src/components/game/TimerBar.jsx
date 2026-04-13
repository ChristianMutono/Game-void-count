import { useEffect, useState, useRef } from 'react';

// Apply a power curve to make the bar drain slower at first and faster at end
// pct=1 → bar=1, pct=0.5 → bar≈0.43, pct=0.33 → bar≈0.24, pct=0 → bar=0
function visualPct(pct) {
  return Math.pow(pct, 1.35);
}

export default function TimerBar({ duration, isRunning, onTimeout, onTick }) {
  const [remaining, setRemaining] = useState(duration);
  const startRef = useRef(null);
  const rafRef = useRef(null);
  const firedRef = useRef(false);

  useEffect(() => {
    setRemaining(duration);
    startRef.current = null;
    firedRef.current = false;
  }, [duration, isRunning]);

  useEffect(() => {
    if (!isRunning) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    startRef.current = Date.now();
    firedRef.current = false;

    const tick = () => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const r = Math.max(0, duration - elapsed);
      setRemaining(r);
      if (onTick) onTick(r / duration);

      if (r <= 0) {
        if (!firedRef.current) {
          firedRef.current = true;
          onTimeout();
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning, duration, onTimeout]);

  const rawPct = remaining / duration;
  const barPct = visualPct(rawPct) * 100;
  const isPanicking = remaining <= 2 && isRunning;

  let barColor = '#00f0ff';
  if (rawPct < 0.4) barColor = '#ff0066';
  else if (rawPct < 0.65) barColor = '#ffe600';

  return (
    <div className="w-full h-3 md:h-4 rounded-full overflow-hidden bg-muted/50 relative">
      <div
        className="absolute inset-0 rounded-full opacity-30 blur-sm"
        style={{ background: barColor }}
      />
      <div
        className={`h-full rounded-full relative timer-bar ${isPanicking ? 'timer-panic' : ''}`}
        style={{
          width: `${barPct}%`,
          background: `linear-gradient(90deg, ${barColor}, ${barColor}88)`,
          boxShadow: `0 0 12px ${barColor}, 0 0 24px ${barColor}66`,
          minWidth: barPct > 0.5 ? '4px' : '0',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`font-orbitron text-xs font-bold ${isPanicking ? 'text-magenta' : 'text-foreground'}`}
          style={isPanicking ? { textShadow: '0 0 8px #ff0066' } : {}}
        >
          {remaining.toFixed(3)}s
        </span>
      </div>
    </div>
  );
}