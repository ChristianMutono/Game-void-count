import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

const FAQS = [
  {
    q: "Wait, what exactly is the point of this game?",
    a: "You're the Counter. Your one job — your entire reason for existing in this moment — is to say the lowest unused positive integer. That's it. The Controller's job is to make you forget what that number is by jumping ahead and leaving traps. Succeed and you climb. Fail and the void judges you."
  },
  {
    q: "What counts as a legal Controller move?",
    a: "The Controller can say literally any positive integer that hasn't been said yet. They can sit right next to you (1, 2, 3 — lulling you into a false sense of safety) or leap ahead by 12 and leave a psychic minefield. The only rule: no repeats. Everything else is psychological warfare."
  },
  {
    q: "How do I actually lose?",
    a: "Four delightful ways: (1) DUPLICATE — you said a number that's already been said. By anyone. Including you. Especially you. (2) STOLEN — you tried to say the Controller's number. It was right there, claimed, marked. (3) INVALID JUMP — you skipped the lowest available number. The sequence doesn't care about your ambitions. (4) TIMEOUT — you took too long. The void doesn't wait."
  },
  {
    q: "Why does the timer turn red and start panicking at me?",
    a: "Because you should be panicking. That's a feature, not a bug. The timer is basically your anxiety given visual form. When it shakes, that's the universe telling you to go faster. Listen to it."
  },
  {
    q: "The Controller just jumped to 47 out of nowhere. Is that legal?",
    a: "Completely, disgustingly legal. In fact, that's the whole point. The Controller exists to place numbers where you least expect them, forcing you to track what's truly the 'next' number versus what just *feels* next. Your enemy isn't the Controller. It's your own pattern-matching brain."
  },
  {
    q: "Why is EXTREME difficulty so... extreme?",
    a: "On EXTREME, the Controller jumps further, responds faster, and has absolutely zero mercy. It was designed by someone who wanted to see people suffer elegantly. If you score above 50 on EXTREME, please log off and touch some grass. You've clearly been here too long."
  },
  {
    q: "Does the game get harder the longer I survive?",
    a: "Not mechanically — but cognitively, absolutely yes. After a certain point, your brain is tracking dozens of 'forbidden' numbers while simultaneously computing the lowest available integer. It's basically mental yoga. Painful, occasionally humiliating mental yoga."
  },
  {
    q: "Why does the Controller sometimes answer instantly and sometimes take ages?",
    a: "When the Controller is slow, it's planning. When it's fast, it already planned. Neither is good news for you. Treat both with suspicion. The Controller is not your friend."
  },
];

export default function FAQ({ onClose }) {
  const [openIdx, setOpenIdx] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 1440);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ transition: 'opacity 1.44s cubic-bezier(0.4,0,0.2,1)', opacity: visible ? 1 : 0 }}
    >
      <div
        className="absolute inset-0 bg-obsidian/90"
        onClick={handleClose}
        style={{ transition: 'opacity 1.44s cubic-bezier(0.4,0,0.2,1)', opacity: visible ? 1 : 0 }}
      />
      <div
        className="relative glass-panel rounded-2xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col"
        style={{
          transition: 'transform 1.44s cubic-bezier(0.22,1,0.36,1), opacity 1.44s cubic-bezier(0.4,0,0.2,1)',
          transform: visible ? 'scale(1)' : 'scale(0.7)',
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div>
            <h2 className="font-orbitron text-xl font-bold text-cyan neon-glow-cyan">FAQ</h2>
            <p className="font-mono text-xs text-muted-foreground mt-0.5">Answers. Probably.</p>
            <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">Developed by Christian Mutono</p>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Questions */}
        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {FAQS.map((faq, i) => (
            <div key={i} className={`rounded-xl border transition-all duration-200 overflow-hidden
              ${openIdx === i ? 'border-cyan/30 bg-cyan/5' : 'border-border/50 hover:border-border'}`}>
              <button
                className="w-full text-left px-4 py-3 flex items-start gap-3"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <span className="font-orbitron text-xs text-cyan/50 mt-0.5 flex-shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-orbitron text-sm font-bold text-foreground/90 flex-1 text-left">
                  {faq.q}
                </span>
                <span className={`text-muted-foreground text-lg leading-none flex-shrink-0 transition-transform duration-200
                  ${openIdx === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {openIdx === i && (
                <div className="px-4 pb-4 pl-11">
                  <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}