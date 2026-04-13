import { useState, useEffect } from 'react';
import { getLeaderboard } from '../../lib/gameLogic';
import { X, Trophy } from 'lucide-react';

const TABS = [
  { key: 'easy', label: 'EASY' },
  { key: 'normal', label: 'NORMAL' },
  { key: 'hard', label: 'HARD' },
  { key: 'extreme', label: 'EXTREME' },
];

const TAB_COLORS = {
  easy: { active: 'text-cyan border-cyan', inactive: 'text-muted-foreground border-border/40 hover:border-border' },
  normal: { active: 'text-yellow border-yellow', inactive: 'text-muted-foreground border-border/40 hover:border-border' },
  hard: { active: 'text-magenta border-magenta', inactive: 'text-muted-foreground border-border/40 hover:border-border' },
  extreme: { active: 'text-magenta border-magenta', inactive: 'text-muted-foreground border-border/40 hover:border-border' },
};

export default function Leaderboard({ onClose }) {
  const [allEntries, setAllEntries] = useState([]);
  const [tab, setTab] = useState('easy');

  useEffect(() => {
    setAllEntries(getLeaderboard());
  }, []);

  const entries = allEntries.filter(e => e.difficulty === tab).slice(0, 10);

  return (
    <div className="relative glass-panel rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Trophy className="text-yellow" size={22} />
          <h2 className="font-orbitron text-xl font-bold text-yellow neon-glow-yellow">RANKINGS</h2>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={22} />
        </button>
      </div>

      {/* Difficulty tabs */}
      <div className="flex gap-1 mb-4 flex-shrink-0">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-1.5 rounded-lg font-orbitron text-xs font-bold border transition-all
              ${tab === t.key ? TAB_COLORS[t.key].active : TAB_COLORS[t.key].inactive}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-y-auto flex-1">
        {entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-mono text-sm">
            No records yet. Enter the void.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-muted-foreground font-mono uppercase tracking-widest border-b border-border">
                <th className="pb-2 text-left">#</th>
                <th className="pb-2 text-left">Name</th>
                <th className="pb-2 text-left">Score</th>
                <th className="pb-2 text-left">Time</th>
                <th className="pb-2 text-left">Fail</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={i} className={`border-b border-border/40 ${i < 3 ? 'text-cyan' : 'text-foreground/70'}`}>
                  <td className="py-2 font-orbitron font-bold text-sm">
                    {i === 0 ? <span className="text-yellow">👑</span> : i + 1}
                  </td>
                  <td className="py-2 font-orbitron text-sm max-w-[80px] truncate">
                    {entry.playerName || 'Player 1'}
                  </td>
                  <td className="py-2 font-orbitron font-bold">{entry.score}</td>
                  <td className="py-2 font-mono text-sm">{entry.time}s</td>
                  <td className="py-2 font-mono text-xs text-magenta">
                    {entry.failureType?.replace('_', ' ').slice(0, 8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
