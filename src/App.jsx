import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/querry-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Home from './pages/Home';
import Game from './pages/Game';
import { loadWhisper } from './lib/whisper';
import { isVoiceInputEnabled } from './components/game/SettingsModal';

function App() {
  useEffect(() => {
    if (!isVoiceInputEnabled()) return;
    const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 800));
    const handle = schedule(() => {
      loadWhisper().catch((err) => console.warn('[whisper] preload failed:', err));
    });
    return () => {
      if (window.cancelIdleCallback && typeof handle === 'number') {
        try { window.cancelIdleCallback(handle); } catch (_) { /* noop */ }
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
