import React, { useEffect, useRef } from 'react';
import { soundEngine } from '../utils/soundEngine';

interface FireworksBackdropProps {
  active: boolean;
  durationMs?: number;
  reducedMotion?: boolean;
}

interface Rocket {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetY: number;
  color: string;
  trail: Array<{ x: number; y: number }>;
  style: 'willow' | 'chrysanthemum' | 'double' | 'palm';
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  gravity: number;
  drag: number;
  trail: Array<{ x: number; y: number }>;
  twinkle: boolean;
  canCrackle: boolean;
}

interface SkyFlash {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
}

const PALETTES = [
  ['#FDE68A', '#F5C56B', '#FFFBEB'], // Diwali Champagne Gold
  ['#FB7185', '#FDA4AF', '#FDE68A'], // Crimson Rose & Gold
  ['#E879F9', '#C084FC', '#FDE68A'], // Orchid Purple & Gold
  ['#F472B6', '#FBCFE8', '#FFFFFF'], // Blossom Pink & Pearl
  ['#FBBF24', '#FB923C', '#FEF08A'], // Warm Amber Sparkler
];

const WAVE_X_PATTERNS = [
  [0.18, 0.82],
  [0.14, 0.5, 0.86],
  [0.24, 0.74, 0.38, 0.9],
  [0.16, 0.54, 0.8],
  [0.12, 0.36, 0.66, 0.88],
  [0.22, 0.78, 0.48],
  [0.15, 0.42, 0.68, 0.86],
  [0.2, 0.56, 0.82],
];

export const FireworksBackdrop: React.FC<FireworksBackdropProps> = ({
  active,
  durationMs = 10000,
  reducedMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active || reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const rockets: Rocket[] = [];
    const sparks: Spark[] = [];
    const flashes: SkyFlash[] = [];
    const timers: number[] = [];
    let lastBurstSound = 0;
    let lastLaunchSound = 0;

    const launchRocket = (xFrac?: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const startX = (xFrac ?? (0.08 + Math.random() * 0.84)) * w;
      const startY = h + 10;
      const targetY = h * (0.09 + Math.random() * 0.34);
      const riseDist = startY - targetY;
      const gravity = 390;
      const vy = -Math.sqrt(2 * gravity * riseDist) * (0.98 + Math.random() * 0.08);
      const vx = (Math.random() - 0.5) * (w < 640 ? 65 : 130);
      const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
      const styles: Array<Rocket['style']> = ['willow', 'chrysanthemum', 'double', 'palm'];

      rockets.push({
        x: startX,
        y: startY,
        vx,
        vy,
        targetY,
        color: palette[0],
        trail: [],
        style: styles[Math.floor(Math.random() * styles.length)],
      });

      const nowMs = performance.now();
      if (nowMs - lastLaunchSound > 360) {
        lastLaunchSound = nowMs;
        soundEngine.playFireworkLaunch();
      }
    };

    const burstRocket = (r: Rocket) => {
      const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
      const isMobile = window.innerWidth < 640;
      const count =
        r.style === 'double'
          ? isMobile
            ? 68
            : 96
          : r.style === 'palm'
          ? isMobile
            ? 52
            : 76
          : isMobile
          ? 58
          : 82;

      const baseSpeed = isMobile ? 215 : 320;

      flashes.push({
        x: r.x,
        y: r.y,
        radius: isMobile ? 140 : 230,
        color: palette[0],
        alpha: 0.24,
      });

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.16;
        let ringFactor = 0.72 + Math.random() * 0.55;
        if (r.style === 'double' && i % 2 === 0) {
          ringFactor = 0.45 + Math.random() * 0.18;
        } else if (r.style === 'palm') {
          ringFactor = 0.85 + Math.random() * 0.45;
        }
        const speed = baseSpeed * ringFactor;

        sparks.push({
          x: r.x,
          y: r.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: palette[i % palette.length],
          size: r.style === 'palm' ? 2.5 + Math.random() * 1.5 : 1.9 + Math.random() * 1.6,
          alpha: 1,
          decay:
            r.style === 'willow' || r.style === 'palm'
              ? 0.34 + Math.random() * 0.22
              : 0.45 + Math.random() * 0.28,
          gravity: r.style === 'willow' ? 135 : 105,
          drag: r.style === 'willow' || r.style === 'palm' ? 0.968 : 0.958,
          trail: [],
          twinkle: Math.random() < 0.55,
          canCrackle: Math.random() < 0.22,
        });
      }

      const nowMs = performance.now();
      if (nowMs - lastBurstSound > 240) {
        lastBurstSound = nowMs;
        soundEngine.playFireworkBurst();
      }
    };

    // Schedule finite waves evenly across durationMs (stops launching once durationMs ends)
    const waveStepMs = 1250;
    let waveIdx = 0;
    for (let t = 150; t <= Math.max(200, durationMs - 900); t += waveStepMs) {
      const pattern = WAVE_X_PATTERNS[waveIdx % WAVE_X_PATTERNS.length];
      waveIdx += 1;
      const id = window.setTimeout(() => {
        pattern.forEach((xf, idx) => {
          const sub = window.setTimeout(() => launchRocket(xf), idx * 145);
          timers.push(sub);
        });
      }, t);
      timers.push(id);
    }

    let rafId = 0;
    let last = performance.now();
    const startTime = last;

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.alpha -= dt * 0.9;
        if (f.alpha <= 0) {
          flashes.splice(i, 1);
          continue;
        }
        const grad = ctx.createRadialGradient(f.x, f.y, 4, f.x, f.y, f.radius);
        grad.addColorStop(0, f.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.save();
        ctx.globalAlpha = f.alpha;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 12) r.trail.shift();

        r.vy += 390 * dt;
        r.x += r.vx * dt;
        r.y += r.vy * dt;

        for (let tIdx = 0; tIdx < r.trail.length; tIdx++) {
          const pt = r.trail[tIdx];
          const frac = (tIdx + 1) / r.trail.length;
          ctx.fillStyle = `rgba(253, 230, 138, ${frac * 0.8})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, frac * 2.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.save();
        ctx.shadowColor = '#FDE68A';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#FFFBEB';
        ctx.beginPath();
        ctx.arc(r.x, r.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (r.y <= r.targetY || r.vy >= -45) {
          burstRocket(r);
          rockets.splice(i, 1);
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 9) s.trail.shift();

        const dragPow = Math.pow(s.drag, dt * 60);
        s.vx *= dragPow;
        s.vy = s.vy * dragPow + s.gravity * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.alpha -= s.decay * dt;

        if (s.canCrackle && s.alpha < 0.38 && s.alpha > 0.34 && sparks.length < 480) {
          s.canCrackle = false;
          for (let k = 0; k < 2; k++) {
            const ang = Math.random() * Math.PI * 2;
            sparks.push({
              x: s.x,
              y: s.y,
              vx: Math.cos(ang) * 45,
              vy: Math.sin(ang) * 45,
              color: '#FFFBEB',
              size: 1.4,
              alpha: 0.75,
              decay: 1.6,
              gravity: 60,
              drag: 0.94,
              trail: [],
              twinkle: true,
              canCrackle: false,
            });
          }
        }

        if (s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        const flicker = s.twinkle && Math.random() < 0.25 ? 0.35 : 1;
        const finalAlpha = Math.max(0, s.alpha * flicker);

        if (s.trail.length > 1) {
          ctx.save();
          ctx.strokeStyle = s.color;
          ctx.globalAlpha = finalAlpha * 0.52;
          ctx.lineWidth = s.size * 0.82;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(s.trail[0].x, s.trail[0].y);
          for (let j = 1; j < s.trail.length; j++) {
            ctx.lineTo(s.trail[j].x, s.trail[j].y);
          }
          ctx.lineTo(s.x, s.y);
          ctx.stroke();
          ctx.restore();
        }

        ctx.save();
        ctx.globalAlpha = finalAlpha;
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (now - startTime < durationMs + 1200 || rockets.length > 0 || sparks.length > 0 || flashes.length > 0) {
        rafId = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      timers.forEach((id) => clearTimeout(id));
      window.removeEventListener('resize', resize);
    };
  }, [active, durationMs, reducedMotion]);

  if (!active || reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 w-full h-full z-[2]"
    />
  );
};
