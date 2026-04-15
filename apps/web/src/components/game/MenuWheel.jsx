import { useRef, useState, useEffect, useCallback } from 'react';
import { User, Users, Trophy, Settings, HelpCircle } from 'lucide-react';

const TILE_H = 92;
const VISIBLE = 3;
const CONTAINER_H = TILE_H * VISIBLE;
const SPRING_K = 280;
const SPRING_D = 30;
const OVERSHOOT_VEL = 1.6;

const MENU_ITEMS = [
  { id: 'single',   label: 'SINGLE PLAYER', sub: 'Counter vs CPU',         Icon: User,        color: 'var(--cyan)',    glow: 'var(--cyan)' },
  { id: 'local',    label: 'LOCAL 2 PLAYER',sub: 'Counter vs Controller',  Icon: Users,       color: 'var(--magenta)', glow: 'var(--magenta)' },
  { id: 'ranks',    label: 'RANKINGS',      sub: 'Leaderboard',            Icon: Trophy,      color: 'var(--yellow)',  glow: 'var(--yellow)' },
  { id: 'settings', label: 'SETTINGS',      sub: 'Preferences & Themes',   Icon: Settings,    color: 'var(--cyan)',    glow: 'var(--cyan)' },
  { id: 'faq',      label: 'FAQ',           sub: 'How to play',            Icon: HelpCircle,  color: 'var(--magenta)', glow: 'var(--magenta)' },
];
const n = MENU_ITEMS.length;

// Pure mechanical click — noise burst
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
    g.gain.setValueAtTime(0.28, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.014);
    src.start();
  } catch (_) {}
}

function mod(a, m) { return ((a % m) + m) % m; }

export default function MenuWheel({ onActivate }) {
  const [centerFloat, setCenterFloat] = useState(0);
  const posRef = useRef(0);
  const velRef = useRef(0);
  const rafRef = useRef(null);
  const lastTickRef = useRef(0);
  const phaseRef = useRef('idle');
  const dragStartRef = useRef(null);
  const lastDragYRef = useRef(null);
  const lastDragTimeRef = useRef(null);
  const dragVelRef = useRef(0);
  const dragMovedRef = useRef(false);
  const tapSlotRef = useRef(null);
  const containerRef = useRef(null);
  const onActivateRef = useRef(onActivate);
  onActivateRef.current = onActivate;

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
      velRef.current += (-SPRING_K * (posRef.current - target) - SPRING_D * velRef.current) * dt;
      posRef.current += velRef.current * dt;
      if (Math.abs(posRef.current - target) < 0.0015 && Math.abs(velRef.current) < 0.01) {
        posRef.current = target;
        velRef.current = 0;
        phaseRef.current = 'idle';
        syncState();
        return;
      }
      syncState();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [syncState]);

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
    dragMovedRef.current = false;
    tapSlotRef.current = null;
  }, []);

  const onPointerMove = useCallback((e) => {
    if (phaseRef.current !== 'drag') return;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    const totalMoved = Math.abs(y - dragStartRef.current.y);
    if (totalMoved > 4) dragMovedRef.current = true;
    const now = performance.now();
    const dt = Math.max((now - lastDragTimeRef.current) / 1000, 0.001);
    dragVelRef.current = -((y - lastDragYRef.current) / TILE_H) / dt;
    lastDragYRef.current = y;
    lastDragTimeRef.current = now;
    posRef.current = dragStartRef.current.pos - (y - dragStartRef.current.y) / TILE_H;
    syncState();
    e.preventDefault();
  }, [syncState]);

  const onPointerUp = useCallback(() => {
    if (phaseRef.current !== 'drag') return;
    if (!dragMovedRef.current) {
      // It's a tap — snap to idle and let click events fire
      phaseRef.current = 'idle';
      return;
    }
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

  const handleCenterActivate = () => {
    const itemId = MENU_ITEMS[mod(Math.round(posRef.current), n)].id;
    onActivateRef.current(itemId);
  };

  // Build tiles
  const centerInt = Math.round(centerFloat);
  const tiles = [];
  for (let slot = centerInt - 2; slot <= centerInt + 2; slot++) {
    const dist = slot - centerFloat;
    if (Math.abs(dist) > 1.8) continue;
    const item = MENU_ITEMS[mod(slot, n)];
    const isCenter = slot === centerInt;
    const scale = Math.max(0.86, 1 - Math.abs(dist) * 0.08);
    const opacity = Math.max(0.55, 1 - Math.abs(dist) * 0.28);
    const blur = Math.abs(dist) * 0.5;

    tiles.push(
      <div
        key={slot}
        onClick={isCenter ? handleCenterActivate : () => {
          cancelAnim();
          posRef.current = slot;
          velRef.current = OVERSHOOT_VEL * 0.5;
          startSpringPhase();
        }}
        style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 'calc(100% - 16px)',
          height: `${TILE_H - 8}px`,
          transform: `translate(-50%, calc(-50% + ${dist * TILE_H}px)) scale(${scale})`,
          opacity,
          filter: blur > 0.5 ? `blur(${blur}px)` : 'none',
          cursor: 'pointer',
          borderRadius: '14px',
          background: isCenter
            ? `linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35))`
            : `rgba(0,0,0,0.25)`,
          backdropFilter: 'blur(12px)',
          border: isCenter
            ? `1px solid ${item.color}55`
            : '1px solid rgba(255,255,255,0.06)',
          boxShadow: isCenter ? `0 0 20px ${item.glow}33, inset 0 1px 0 rgba(255,255,255,0.08)` : 'none',
          display: 'flex', alignItems: 'center', gap: '16px', padding: '0 20px',
          zIndex: isCenter ? 10 : 5 - Math.floor(Math.abs(dist)),
          transition: 'none',
        }}
      >
        {/* Icon */}
        <div style={{
          flexShrink: 0, width: '36px', height: '36px', borderRadius: '10px',
          background: isCenter ? `${item.color}18` : 'transparent',
          border: isCenter ? `1px solid ${item.color}44` : '1px solid transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <item.Icon
            size={20}
            style={{ color: isCenter ? item.color : 'rgba(255,255,255,0.35)',
              filter: isCenter ? `drop-shadow(0 0 6px ${item.glow})` : 'none' }}
          />
        </div>
        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-orbitron)', fontSize: '13px', fontWeight: 700,
            color: isCenter ? item.color : 'rgba(255,255,255,0.4)',
            letterSpacing: '0.05em',
            textShadow: isCenter ? `0 0 12px ${item.glow}88` : 'none',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {item.label}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '11px',
            color: isCenter ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)',
            marginTop: '2px',
          }}>
            {item.sub}
          </div>
        </div>
        {/* Arrow only on center */}
        {isCenter && (
          <div style={{
            fontFamily: 'var(--font-orbitron)', fontSize: '18px', fontWeight: 700,
            color: item.color, opacity: 0.7,
            filter: `drop-shadow(0 0 4px ${item.glow})`,
          }}>›</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', userSelect: 'none', position: 'relative' }}>
      {/* Center slot highlight */}
      <div style={{
        position: 'absolute', top: '50%', left: 0, right: 0,
        height: `${TILE_H - 8}px`, transform: 'translateY(-50%)',
        pointerEvents: 'none', zIndex: 0,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }} />

      <div
        ref={containerRef}
        onMouseDown={onPointerDown} onMouseMove={onPointerMove}
        onMouseUp={onPointerUp} onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown} onTouchMove={onPointerMove} onTouchEnd={onPointerUp}
        style={{
          position: 'relative', width: '100%', height: `${CONTAINER_H}px`,
          cursor: 'grab', overflow: 'hidden', touchAction: 'none',
        }}
      >
        {/* Top/bottom fade */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${TILE_H - 4}px`, background: 'linear-gradient(to bottom, hsl(var(--background)), transparent)', pointerEvents: 'none', zIndex: 15 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${TILE_H - 4}px`, background: 'linear-gradient(to top, hsl(var(--background)), transparent)', pointerEvents: 'none', zIndex: 15 }} />
        {tiles}
      </div>
    </div>
  );
}