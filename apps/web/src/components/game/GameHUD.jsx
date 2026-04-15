import { useEffect, useState } from 'react';
import { getNextRequiredCounter, getScore, getLeaderboard } from '@void-count/core';

export default function GameHUD({ gameState, timerPct, mode, debugMode, difficulty }) {
  const score = getScore(gameState);
  const nextRequired = getNextRequiredCounter(gameState);
  const isCounterTurn = gameState.currentTurn === 'counter';
  const topScore = (() => {
    const entries = getLeaderboard().filter(e => e.difficulty === gameState.difficulty);
    if (entries.length === 0) return 0;
    return Math.max(...entries.map(e => e.score || 0));
  })();

  const lastControllerNum = gameState.controllerHistory && gameState.controllerHistory.length > 0
    ? gameState.controllerHistory[gameState.controllerHistory.length - 1]
    : undefined;

  const isPanic = timerPct !== undefined && timerPct < 0.4;
  const panicIntensity = isPanic ? Math.pow((0.4 - timerPct) / 0.4, 1.5) : 0;
  const magentaGlowSize = 8 + panicIntensity * 30;
  const vibrateSpeed = isPanic ? Math.max(0.12, 0.5 - panicIntensity * 0.35) : null;

  const isHardOrExtreme = difficulty === 'hard' || difficulty === 'extreme';
  const scoreBoxOpacity = isHardOrExtreme
    ? 1 - 0.75 * Math.max(0, Math.min(1, (score - 25) / 75))
    : 1;

  const topGlitchEnabled = isHardOrExtreme && score > 50 && !gameState.gameOver;
  const scoreGlitchEnabled = difficulty === 'extreme' && score > 50 && !gameState.gameOver;

  const [topGlitch, setTopGlitch] = useState(false);
  const [scoreGlitch, setScoreGlitch] = useState(false);

  useEffect(() => {
    if (!topGlitchEnabled) { setTopGlitch(false); return; }
    let active = true;
    let t1, t2;
    const tick = () => {
      if (!active) return;
      const delay = Math.random() * 49000;
      t1 = setTimeout(() => {
        if (!active) return;
        setTopGlitch(true);
        t2 = setTimeout(() => {
          if (!active) return;
          setTopGlitch(false);
          tick();
        }, 750);
      }, delay);
    };
    tick();
    return () => { active = false; clearTimeout(t1); clearTimeout(t2); };
  }, [topGlitchEnabled]);

  useEffect(() => {
    if (!scoreGlitchEnabled) { setScoreGlitch(false); return; }
    let active = true;
    let t1, t2;
    const tick = () => {
      if (!active) return;
      const delay = Math.random() * 60000;
      t1 = setTimeout(() => {
        if (!active) return;
        setScoreGlitch(true);
        t2 = setTimeout(() => {
          if (!active) return;
          setScoreGlitch(false);
          tick();
        }, 750);
      }, delay);
    };
    tick();
    return () => { active = false; clearTimeout(t1); clearTimeout(t2); };
  }, [scoreGlitchEnabled]);

  const glitchStyle = { animation: 'glitch-distort 0.75s ease-in-out', display: 'inline-block' };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Score + Turn + (Next only in debug) */}
      <div className="flex items-center justify-between">
        <div
          className="glass-panel rounded-lg px-4 py-2"
          style={{ opacity: scoreBoxOpacity, transition: 'opacity 0.8s ease' }}
        >
          <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Score</div>
          <div
            className="font-orbitron text-2xl font-bold text-cyan neon-glow-cyan"
            style={scoreGlitch ? glitchStyle : undefined}
          >
            {score}
          </div>
        </div>

        <div className="glass-panel rounded-lg px-4 py-2 text-center" style={{
          borderColor: isCounterTurn ? 'rgba(0,240,255,0.4)' : 'rgba(255,0,102,0.4)'
        }}>
          <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Turn</div>
          <div className={`font-orbitron text-lg font-bold ${isCounterTurn ? 'text-cyan' : 'text-magenta'}`}>
            {isCounterTurn ? 'COUNTER' : 'CTRL'}
          </div>
        </div>

        {debugMode ? (
          <div className="glass-panel rounded-lg px-4 py-2 text-right">
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Next</div>
            <div className="font-orbitron text-2xl font-bold text-yellow neon-glow-yellow">{nextRequired}</div>
          </div>
        ) : (
          <div
            className="glass-panel rounded-lg px-4 py-2 text-right"
            style={{ opacity: scoreBoxOpacity, transition: 'opacity 0.8s ease' }}
          >
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Top</div>
            <div
              className="font-orbitron text-2xl font-bold text-yellow neon-glow-yellow"
              style={topGlitch ? glitchStyle : undefined}
            >
              {topScore}
            </div>
          </div>
        )}
      </div>

      {/* Controller's last number — BIG */}
      {lastControllerNum !== undefined && (
        <div className="glass-panel-magenta rounded-xl px-4 py-3 flex flex-col items-center gap-1">
          <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
            Controller's Last — AVOID
          </div>
          <div
            className="font-orbitron font-black leading-none"
            style={{
              fontSize: 'clamp(3rem, 12vw, 5rem)',
              color: 'var(--magenta)',
              textShadow: `0 0 ${magentaGlowSize}px var(--magenta), 0 0 ${magentaGlowSize * 2}px var(--magenta)66`,
              animation: vibrateSpeed ? `vibrate ${vibrateSpeed}s ease-in-out infinite` : undefined,
            }}
          >
            {lastControllerNum}
          </div>
        </div>
      )}

      {/* Debug panels */}
      {debugMode && (
        <div className="flex gap-2">
          <div className="glass-panel rounded-lg p-2 flex-1 min-w-0">
            <div className="text-xs text-cyan font-mono uppercase tracking-widest mb-1">Counter History</div>
            <div className="font-mono text-xs text-cyan/80 leading-relaxed break-all max-h-24 overflow-y-auto">
              {(gameState.counterHistory || []).join(', ') || '—'}
            </div>
          </div>
          <div className="glass-panel-magenta rounded-lg p-2 flex-1 min-w-0">
            <div className="text-xs text-magenta font-mono uppercase tracking-widest mb-1">Controller History</div>
            <div className="font-mono text-xs text-magenta/80 leading-relaxed break-all max-h-24 overflow-y-auto">
              {(gameState.controllerHistory || []).join(', ') || '—'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
