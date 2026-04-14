import { getNextRequiredCounter, getScore, getLeaderboard } from '../../lib/gameLogic';

export default function GameHUD({ gameState, timerPct, mode, debugMode }) {
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

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Score + Turn + (Next only in debug) */}
      <div className="flex items-center justify-between">
        <div className="glass-panel rounded-lg px-4 py-2">
          <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Score</div>
          <div className="font-orbitron text-2xl font-bold text-cyan neon-glow-cyan">{score}</div>
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
          <div className="glass-panel rounded-lg px-4 py-2 text-right">
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Top</div>
            <div className="font-orbitron text-2xl font-bold text-yellow neon-glow-yellow">{topScore}</div>
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