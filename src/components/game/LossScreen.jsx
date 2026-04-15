import { useState, useEffect } from 'react';
import { getTaunt } from '../../lib/taunts';
import { getScore, getElapsedTime, saveToLeaderboard } from '../../lib/gameLogic';
import { getPlayerName, setPlayerName, MAX_NAME_LEN } from '../../lib/playerName';
import { isDebugMode } from './SettingsModal';
import { RotateCcw, Home, Trophy } from 'lucide-react';

export default function LossScreen({ gameState, onRestart, onHome, onShowLeaderboard }) {
  const [visible, setVisible] = useState(false);
  const [glitching, setGlitching] = useState(true);
  const [taunt] = useState(() => getTaunt(gameState.failureType, getScore(gameState), gameState.difficulty));
  const [playerName, setPlayerNameState] = useState(getPlayerName());

  const score = getScore(gameState);
  const elapsed = getElapsedTime(gameState).toFixed(1);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 100);
    const t2 = setTimeout(() => setGlitching(false), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleNameChange = (e) => {
    const val = e.target.value.slice(0, 8);
    setPlayerNameState(val);
  };

  const MR_RAW_NAMES = ['Mr Raw', 'Mr. Raw'];

  const handleExit = (callback) => {
    const saved = setPlayerName(playerName);
    if (!isDebugMode() || MR_RAW_NAMES.includes(saved)) {
      saveToLeaderboard({
        score,
        playerName: saved,
        time: parseFloat(elapsed),
        difficulty: gameState.difficulty,
        mode: gameState.mode,
        failureType: gameState.failureType,
        date: new Date().toISOString(),
      });
    }
    callback();
  };

  const failureLabels = {
    duplicate: 'DUPLICATE DETECTED',
    stolen: 'NUMBER STOLEN',
    invalid_jump: 'INVALID SEQUENCE',
    timeout: 'TIME EXPIRED',
  };

  return (
    <div className={`fixed inset-0 z-40 flex items-center justify-center transition-opacity duration-500
                     ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Heavy background to fully obscure game */}
      <div className="absolute inset-0 bg-black/98" />

      {/* Glitch layers */}
      {glitching && (
        <>
          <div className="absolute inset-0 bg-magenta/8"
               style={{ animation: 'glitch-1 0.3s infinite' }} />
          <div className="absolute inset-0 bg-cyan/8"
               style={{ animation: 'glitch-2 0.4s infinite' }} />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-lg w-full">
        {/* System failure header */}
        <div className={`mb-6 ${glitching ? 'shake' : ''}`}>
          <h1 className="font-orbitron text-4xl md:text-6xl font-black text-magenta glitch-text mb-2">
            SYSTEM FAILURE
          </h1>
          <div className="font-mono text-yellow text-sm tracking-widest uppercase">
            {failureLabels[gameState.failureType]}
          </div>
        </div>

        {/* Score display */}
        <div className="glass-panel-magenta rounded-2xl p-6 mb-5">
          <div className="font-mono text-muted-foreground text-xs uppercase tracking-widest mb-2">
            Final Count
          </div>
          <div className="font-orbitron text-6xl md:text-8xl font-black text-cyan neon-glow-cyan mb-3">
            {score}
          </div>
          <div className="flex justify-center gap-6 text-sm font-mono mb-4">
            <div>
              <span className="text-muted-foreground">Time: </span>
              <span className="text-yellow">{elapsed}s</span>
            </div>
            <div>
              <span className="text-muted-foreground">Diff: </span>
              <span className="text-cyan uppercase">{gameState.difficulty}</span>
            </div>
          </div>

          {/* Player name */}
          <div>
            <label className="font-orbitron text-xs text-muted-foreground uppercase tracking-widest block mb-1">
              Your Name
            </label>
            <input
              type="text"
              maxLength={MAX_NAME_LEN}
              value={playerName}
              onChange={handleNameChange}
              className="w-full glass-panel rounded-lg px-3 py-2 font-orbitron text-sm text-cyan text-center
                         border border-cyan/30 focus:border-cyan focus:outline-none bg-transparent"
              placeholder="Player 1"
            />
          </div>
        </div>

        {/* Snarky taunt */}
        <div className="glass-panel rounded-xl p-4 mb-6">
          <p className="font-mono text-foreground/90 text-sm md:text-base leading-relaxed italic">
            "{taunt}"
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => handleExit(onRestart)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                       bg-cyan/10 border-2 border-cyan text-cyan font-orbitron font-bold
                       hover:bg-cyan/20 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all
                       active:scale-95"
          >
            <RotateCcw size={18} /> RETRY
          </button>
          <button
            onClick={() => handleExit(onShowLeaderboard)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                       bg-yellow/10 border-2 border-yellow text-yellow font-orbitron font-bold
                       hover:bg-yellow/20 hover:shadow-[0_0_20px_rgba(255,230,0,0.3)] transition-all
                       active:scale-95"
          >
            <Trophy size={18} /> RANKS
          </button>
          <button
            onClick={() => handleExit(onHome)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                       bg-muted/50 border border-muted-foreground/30 text-muted-foreground font-orbitron font-bold
                       hover:bg-muted hover:text-foreground transition-all active:scale-95"
          >
            <Home size={18} /> EXIT
          </button>
        </div>
      </div>
    </div>
  );
}