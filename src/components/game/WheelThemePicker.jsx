import { useRef, useState, useEffect, useCallback } from 'react';
import { THEMES, applyTheme } from '../../lib/themes';

const TILE_H = 76;
const VISIBLE = 5;
const CONTAINER_H = TILE_H * VISIBLE;
const SPRING_K = 260;
const SPRING_D = 28;
const OVERSHOOT_VEL = 1.8;

// Pure mechanical click — white noise burst, no tone
let _audioCtx = null;
function playClick() {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _audioCtx;
    if (ctx.state === 'suspended') ctx.resume();
    const len = Math.floor(ctx.sampleRate * 0.014);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    src.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.014);
    src.start();
  } catch (_) {}
}

// mod that always returns positive
function mod(a, n) { return ((a % n) + n) % n; }

export default function WheelThemePicker({ currentTheme, onThemeChange }) {
  const n = THEMES.length;
  const voidIdx = THEMES.findIndex(t => t.id === 'void');
  const startIdx = THEMES.findIndex(t => t.id === currentTheme);
  const initial = startIdx >= 0 ? startIdx : (voidIdx >= 0 ? voidIdx : 0);

  const [centerFloat, setCenterFloat] = useState(initial);
  const posRef = useRef(initial);
  const velRef = useRef(0);
  const rafRef = useRef(null);
  const lastTickRef = useRef(Math.round(initial));
  const phaseRef = useRef('idle');
  const dragStartRef = useRef(null);
  const lastDragYRef = useRef(null);
  const dragVelRef = useRef(0);
  const lastDragTimeRef = useRef(null);
  const containerRef = useRef(null);

  const syncState = useCallback(() => {
    setCenterFloat(posRef.current);
    const rounded = Math.round(posRef.current);
    if (rounded !== lastTickRef.current) {
      lastTickRef.current = rounded;
      playClick();
    }
  }, []);

  const cancelAnim = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };

  const startSpringPhase = useCallback(() => {
    phaseRef.current = 'spring';
    const target = Math.round(posRef.current);
    let lastTime = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const disp = posRef.current - target;
      velRef.current += (-SPRING_K * disp - SPRING_D * velRef.current) * dt;
      posRef.current += velRef.current * dt;
      if (Math.abs(posRef.current - target) < 0.0015 && Math.abs(velRef.current) < 0.01) {
        posRef.current = target;
        velRef.current = 0;
        phaseRef.current = 'idle';
        syncState();
        const theme = THEMES[mod(target, n)];
        if (theme) { applyTheme(theme.id); onThemeChange(theme.id); }
        return;
      }
      syncState();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [n, onThemeChange, syncState]);

  const startFrictionPhase = useCallback(() => {
    phaseRef.current = 'friction';
    let lastTime = performance.now();
    const FRICTION = 4.5;
    const tick = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const speed = Math.abs(velRef.current);
      if (speed < 0.08) {
        velRef.current = Math.sign(velRef.current) * OVERSHOOT_VEL;
        startSpringPhase();
        return;
      }
      velRef.current -= Math.sign(velRef.current) * Math.min(speed, FRICTION * dt);
      posRef.current += velRef.current * dt;
      syncState();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [startSpringPhase, syncState]);

  const onPointerDown = useCallback((e) => {
    cancelAnim();
    phaseRef.current = 'drag';
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = { y, pos: posRef.current };
    lastDragYRef.current = y;
    lastDragTimeRef.current = performance.now();
    dragVelRef.current = 0;
    e.preventDefault();
  }, []);

  const onPointerMove = useCallback((e) => {
    if (phaseRef.current !== 'drag') return;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    const dy = y - lastDragYRef.current;
    const now = performance.now();
    const dt = Math.max((now - lastDragTimeRef.current) / 1000, 0.001);
    dragVelRef.current = -(dy / TILE_H) / dt;
    lastDragYRef.current = y;
    lastDragTimeRef.current = now;
    posRef.current = dragStartRef.current.pos - (y - dragStartRef.current.y) / TILE_H;
    syncState();
    e.preventDefault();
  }, [syncState]);

  const onPointerUp = useCallback(() => {
    if (phaseRef.current !== 'drag') return;
    velRef.current = dragVelRef.current * 0.7;
    startFrictionPhase();
  }, [startFrictionPhase]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    cancelAnim();
    const delta = e.deltaY / TILE_H * 0.18;
    posRef.current += delta;
    velRef.current = (delta / 0.016) * 0.25;
    syncState();
    startFrictionPhase();
  }, [syncState, startFrictionPhase]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  useEffect(() => {
    const idx = THEMES.findIndex(t => t.id === currentTheme);
    if (idx >= 0) {
      // Find nearest occurrence in infinite loop
      const cur = posRef.current;
      const base = Math.round(cur);
      let best = base - base % n + idx;
      if (Math.abs(best - cur) > n / 2) best += (best < cur ? n : -n);
      if (Math.round(posRef.current) !== best) {
        cancelAnim();
        posRef.current = best;
        velRef.current = 0;
        setCenterFloat(best);
        lastTickRef.current = best;
      }
    }
  }, [currentTheme, n]);

  // Build tiles — render a window of slots around current position
  const centerInt = Math.round(centerFloat);
  const tiles = [];
  for (let slot = centerInt - 2; slot <= centerInt + 2; slot++) {
    const dist = slot - centerFloat;
    if (Math.abs(dist) > 2.6) continue;
    const themeIdx = mod(slot, n);
    const theme = THEMES[themeIdx];
    const { bg, accent1 } = theme.preview;
    const scale = Math.max(0.45, 1 - Math.abs(dist) * 0.22);
    const opacity = Math.max(0.08, 1 - Math.abs(dist) * 0.38);
    const blur = Math.abs(dist) * 1.2;
    const isCenter = slot === centerInt;
    tiles.push(
      <div
        key={`${slot}`}
        title={theme.label}
        onClick={() => {
          cancelAnim();
          posRef.current = slot;
          velRef.current = OVERSHOOT_VEL * 0.5;
          startSpringPhase();
        }}
        style={{
          position: 'absolute', top: '50%', left: '50%',
          width: '56px', height: '68px',
          transform: `translate(-50%, calc(-50% + ${dist * TILE_H}px)) scale(${scale})`,
          opacity, filter: blur > 0.5 ? `blur(${blur}px)` : 'none',
          cursor: isCenter ? 'default' : 'pointer',
          borderRadius: '10px', overflow: 'hidden', backgroundColor: bg,
          boxShadow: isCenter ? `0 0 14px ${accent1}88, 0 0 2px ${accent1}` : 'none',
          outline: isCenter ? `2px solid ${accent1}` : `1px solid ${accent1}33`,
          outlineOffset: isCenter ? '2px' : '0',
          zIndex: isCenter ? 10 : 5 - Math.floor(Math.abs(dist)),
        }}
      >
        <div style={{ position: 'absolute', inset: 0, opacity: 0.18, backgroundImage: `linear-gradient(${accent1}66 1px, transparent 1px), linear-gradient(90deg, ${accent1}66 1px, transparent 1px)`, backgroundSize: '7px 7px' }} />
        <div style={{ position: 'absolute', top: '10px', left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <div style={{ width: '30px', height: '3px', borderRadius: '2px', backgroundColor: accent1 }} />
          <div style={{ width: '18px', height: '2px', borderRadius: '2px', backgroundColor: theme.preview.accent2 }} />
        </div>
        <div style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '4px' }}>
          {[accent1, theme.preview.accent2, theme.preview.accent3].map((c, ci) => (
            <div key={ci} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c }} />
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: '3px', left: 0, right: 0, textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '7px', fontWeight: 700, color: accent1 }}>
            {theme.label.slice(0, 6)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', userSelect: 'none' }}>
      <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', color: 'hsl(var(--muted-foreground))', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        THEME
      </div>
      <div
        ref={containerRef}
        onMouseDown={onPointerDown} onMouseMove={onPointerMove}
        onMouseUp={onPointerUp} onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown} onTouchMove={onPointerMove} onTouchEnd={onPointerUp}
        style={{ position: 'relative', width: '72px', height: `${CONTAINER_H}px`, cursor: 'grab', overflow: 'hidden', touchAction: 'none' }}
      >
        <div style={{ position: 'absolute', top: '50%', left: '4px', right: '4px', height: '1px', marginTop: '-38px', background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.4), transparent)', pointerEvents: 'none', zIndex: 20 }} />
        <div style={{ position: 'absolute', top: '50%', left: '4px', right: '4px', height: '1px', marginTop: '37px', background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.4), transparent)', pointerEvents: 'none', zIndex: 20 }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(to bottom, hsl(var(--background)), transparent)', pointerEvents: 'none', zIndex: 15 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(to top, hsl(var(--background)), transparent)', pointerEvents: 'none', zIndex: 15 }} />
        {tiles}
      </div>
    </div>
  );
}