import { Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { setMuted, isMuted } from '../../lib/sounds';

export default function MuteButton() {
  const [muted, setMutedState] = useState(isMuted());

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  return (
    <button
      onClick={toggle}
      title={muted ? 'Unmute' : 'Mute'}
      className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full glass-panel border border-border/50
                 flex items-center justify-center text-muted-foreground hover:text-cyan hover:border-cyan/50 transition-all"
    >
      {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
    </button>
  );
}