import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface ArcheryStageProps {
  onSuccess: () => void;
  reducedMotion: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
  kind: 'sparkle' | 'heart' | 'glitter';
  rotation: number;
  vRot: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

interface Star {
  xFrac: number;
  yFrac: number;
  r: number;
  phase: number;
  speed: number;
}

type ArrowPhase = 'ready' | 'dragging' | 'flying' | 'stuck_miss' | 'stuck_win';

export const ArcheryStage: React.FC<ArcheryStageProps> = ({ onSuccess, reducedMotion }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [winBannerVisible, setWinBannerVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const lockedWinRef = useRef(false);
  const resetTimerRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  // Mutable simulation state inside ref for 60fps canvas loop without React re-renders
  const simRef = useRef({
    width: 0,
    height: 0,
    isPortrait: false,
    bowX: 0,
    bowY: 0,
    targetX: 0,
    targetY: 0,
    targetR: 70,
    maxPull: 110,
    gravity: 520,
    maxSpeed: 1050,

    phase: 'ready' as ArrowPhase,
    pointerId: null as number | null,
    pullX: 0, // current arrow nock position while dragging
    pullY: 0,
    aimAngle: -0.3,

    // Flying / stuck arrow center & kinematics
    arrowX: 0,
    arrowY: 0,
    arrowVx: 0,
    arrowVy: 0,
    arrowAngle: -0.3,
    arrowLen: 88,
    prevTargetDist: Infinity,
    wasInsideTarget: false,

    // Visual oscillations
    bowVibration: 0,
    bowVibTime: 0,
    targetWobble: 0,
    targetWobbleTime: 0,

    particles: [] as Particle[],
    shockwaves: [] as Shockwave[],
    stars: Array.from({ length: 58 }, () => ({
      xFrac: Math.random(),
      yFrac: Math.random(),
      r: 0.7 + Math.random() * 1.7,
      phase: Math.random() * Math.PI * 2,
      speed: 0.7 + Math.random() * 1.4,
    })) as Star[],
  });

  const computeLayout = useCallback((w: number, h: number) => {
    const s = simRef.current;
    s.width = w;
    s.height = h;
    s.isPortrait = w < h * 0.92;

    if (s.isPortrait) {
      s.bowX = Math.max(88, w * 0.3);
      s.bowY = h * 0.71;
      s.targetX = w * 0.74;
      // Keep target well below the top instruction text even on short 640-667px mobile screens
      s.targetY = Math.max(195, h * 0.34);
      s.targetR = Math.max(46, Math.min(w * 0.165, h * 0.105, 76));
      s.maxPull = Math.min(w * 0.24, 96);
      s.arrowLen = Math.min(76, w * 0.19);
    } else {
      s.bowX = w * 0.2;
      s.bowY = h * 0.56;
      s.targetX = w * 0.8;
      s.targetY = h * 0.44;
      s.targetR = Math.max(58, Math.min(w * 0.095, h * 0.17, 114));
      s.maxPull = Math.min(w * 0.13, 132);
      s.arrowLen = 96;
    }

    const dist = Math.hypot(s.targetX - s.bowX, s.targetY - s.bowY);
    s.gravity = s.isPortrait ? 470 : 540;
    // Calibrated so ~72%-82% pull arcs naturally right into the red bullseye
    s.maxSpeed = Math.sqrt(dist * s.gravity) * 1.46;

    if (s.phase === 'ready') {
      const restAngle = Math.atan2(s.targetY - s.bowY, s.targetX - s.bowX);
      s.aimAngle = restAngle;
      s.arrowAngle = restAngle;
      s.pullX = s.bowX;
      s.pullY = s.bowY;
    }
  }, []);

  const showMissMessage = useCallback(() => {
    setFeedbackMsg('Almost there! Try again, my love. 💗');
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedbackMsg(null);
    }, 2200);
  }, []);

  const resetArrowToBow = useCallback(() => {
    if (lockedWinRef.current) return;
    const s = simRef.current;
    s.phase = 'ready';
    s.pointerId = null;
    const restAngle = Math.atan2(s.targetY - s.bowY, s.targetX - s.bowX);
    s.aimAngle = restAngle;
    s.arrowAngle = restAngle;
    s.pullX = s.bowX;
    s.pullY = s.bowY;
    s.arrowVx = 0;
    s.arrowVy = 0;
    s.prevTargetDist = Infinity;
    s.wasInsideTarget = false;
  }, []);

  const spawnBullseyeCelebration = useCallback((hx: number, hy: number) => {
    const s = simRef.current;
    s.shockwaves.push(
      {
        x: hx,
        y: hy,
        radius: 6,
        maxRadius: s.targetR * 3.1,
        alpha: 0.95,
        color: '#F5C56B',
      },
      {
        x: hx,
        y: hy,
        radius: 2,
        maxRadius: s.targetR * 2.1,
        alpha: 0.85,
        color: '#FB7185',
      }
    );

    const goldPalette = ['#FDE68A', '#F5C56B', '#FFFBEB', '#FBBF24'];
    const heartPalette = ['#FB7185', '#F43F5E', '#E879F9', '#F472B6'];

    for (let i = 0; i < 64; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 340;
      s.particles.push({
        x: hx,
        y: hy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        size: 2.5 + Math.random() * 4.5,
        alpha: 1,
        decay: 0.45 + Math.random() * 0.55,
        color: goldPalette[i % goldPalette.length],
        kind: i % 3 === 0 ? 'sparkle' : 'glitter',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 6,
      });
    }

    for (let i = 0; i < 20; i++) {
      const angle = -Math.PI * 0.9 + Math.random() * Math.PI * 0.8;
      const speed = 65 + Math.random() * 210;
      s.particles.push({
        x: hx + (Math.random() - 0.5) * 18,
        y: hy + (Math.random() - 0.5) * 18,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 45,
        size: 8 + Math.random() * 8,
        alpha: 1,
        decay: 0.35 + Math.random() * 0.35,
        color: heartPalette[i % heartPalette.length],
        kind: 'heart',
        rotation: (Math.random() - 0.5) * 0.5,
        vRot: (Math.random() - 0.5) * 1.5,
      });
    }
  }, []);

  // Main Canvas Resize + 60fps Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      computeLayout(rect.width, rect.height);
    };

    resize();
    window.addEventListener('resize', resize);

    let rafId = 0;
    let lastTime = performance.now();

    const drawHeart = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      color: string,
      alpha: number,
      rot: number
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = color;
      ctx.beginPath();
      const s = size * 0.5;
      ctx.moveTo(0, s * 0.35);
      ctx.bezierCurveTo(-s, -s * 0.45, -s * 1.15, s * 0.75, 0, s * 1.35);
      ctx.bezierCurveTo(s * 1.15, s * 0.75, s, -s * 0.45, 0, s * 0.35);
      ctx.fill();
      ctx.restore();
    };

    const drawArrow = (
      ctx: CanvasRenderingContext2D,
      nockX: number,
      nockY: number,
      angle: number,
      len: number,
      glowAlpha = 1
    ) => {
      ctx.save();
      ctx.translate(nockX, nockY);
      ctx.rotate(angle);

      // Soft golden aura around arrow
      ctx.shadowColor = 'rgba(253, 224, 130, 0.85)';
      ctx.shadowBlur = 14 * glowAlpha;

      // Feather fletching at nock (x = 0..16)
      ctx.fillStyle = '#FDE68A';
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(14, -7);
      ctx.lineTo(20, -5);
      ctx.lineTo(12, 0);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(14, 7);
      ctx.lineTo(20, 5);
      ctx.lineTo(12, 0);
      ctx.closePath();
      ctx.fill();

      // Secondary rose-gold accent feather
      ctx.fillStyle = '#FDA4AF';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(19, -5.5);
      ctx.lineTo(24, -4);
      ctx.lineTo(17, 0);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(19, 5.5);
      ctx.lineTo(24, 4);
      ctx.lineTo(17, 0);
      ctx.closePath();
      ctx.fill();

      // Glowing golden-white shaft
      const shaftGrad = ctx.createLinearGradient(0, 0, len, 0);
      shaftGrad.addColorStop(0, '#F5C56B');
      shaftGrad.addColorStop(0.55, '#FEF9C3');
      shaftGrad.addColorStop(1, '#FFFFFF');
      ctx.strokeStyle = shaftGrad;
      ctx.lineWidth = 3.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len - 10, 0);
      ctx.stroke();

      // Realistic sharp crystalline-gold arrowhead
      const tipGrad = ctx.createLinearGradient(len - 14, 0, len + 4, 0);
      tipGrad.addColorStop(0, '#F5C56B');
      tipGrad.addColorStop(0.6, '#FFFFFF');
      tipGrad.addColorStop(1, '#FFE4E6');
      ctx.fillStyle = tipGrad;
      ctx.beginPath();
      ctx.moveTo(len + 4, 0);
      ctx.lineTo(len - 13, -5.8);
      ctx.lineTo(len - 9.5, 0);
      ctx.lineTo(len - 13, 5.8);
      ctx.closePath();
      ctx.fill();

      // Nock notch glint
      ctx.fillStyle = '#FFFBEB';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;
      const t = now / 1000;

      const s = simRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx || s.width === 0) {
        rafId = requestAnimationFrame(frame);
        return;
      }

      // 1. Update physics
      if (s.bowVibration > 0) {
        s.bowVibTime += dt;
        s.bowVibration = Math.max(0, s.bowVibration - dt * 2.2);
      }
      if (s.targetWobble > 0) {
        s.targetWobbleTime += dt;
        s.targetWobble = Math.max(0, s.targetWobble - dt * 1.9);
      }

      if (s.phase === 'flying') {
        const steps = 8;
        const subDt = dt / steps;
        let hitHandled = false;
        const bullseyeR = s.targetR * 0.28;

        for (let i = 0; i < steps; i++) {
          const prevTipX = s.arrowX + Math.cos(s.arrowAngle) * s.arrowLen;
          const prevTipY = s.arrowY + Math.sin(s.arrowAngle) * s.arrowLen;

          s.arrowVy += s.gravity * subDt;
          s.arrowX += s.arrowVx * subDt;
          s.arrowY += s.arrowVy * subDt;
          s.arrowAngle = Math.atan2(s.arrowVy, s.arrowVx);

          const tipX = s.arrowX + Math.cos(s.arrowAngle) * s.arrowLen;
          const tipY = s.arrowY + Math.sin(s.arrowAngle) * s.arrowLen;
          const distToTarget = Math.hypot(tipX - s.targetX, tipY - s.targetY);

          // 1. Direct bullseye center hit: let arrow travel well inside the red bullseye before sticking
          if (distToTarget <= bullseyeR * 0.52) {
            hitHandled = true;
            s.arrowX = tipX - Math.cos(s.arrowAngle) * (s.arrowLen - 7);
            s.arrowY = tipY - Math.sin(s.arrowAngle) * (s.arrowLen - 7);
            if (!lockedWinRef.current) {
              lockedWinRef.current = true;
              s.phase = 'stuck_win';
              s.targetWobble = 0.85;
              s.targetWobbleTime = 0;
              soundEngine.playBullseyeHit();
              spawnBullseyeCelebration(tipX, tipY);
              setFeedbackMsg(null);
              setWinBannerVisible(true);
              transitionTimerRef.current = window.setTimeout(() => {
                onSuccess();
              }, 1450);
            }
            break;
          }

          // 2. While inside target board, wait until closest point of approach to target center
          //    so arrows aimed at the center aren't prematurely blocked by outer black/white rings!
          if (distToTarget <= s.targetR) {
            if (s.wasInsideTarget && distToTarget > s.prevTargetDist) {
              hitHandled = true;
              s.arrowX = prevTipX - Math.cos(s.arrowAngle) * (s.arrowLen - 7);
              s.arrowY = prevTipY - Math.sin(s.arrowAngle) * (s.arrowLen - 7);

              if (s.prevTargetDist <= bullseyeR && !lockedWinRef.current) {
                lockedWinRef.current = true;
                s.phase = 'stuck_win';
                s.targetWobble = 0.85;
                s.targetWobbleTime = 0;
                soundEngine.playBullseyeHit();
                spawnBullseyeCelebration(prevTipX, prevTipY);
                setFeedbackMsg(null);
                setWinBannerVisible(true);
                transitionTimerRef.current = window.setTimeout(() => {
                  onSuccess();
                }, 1450);
              } else if (!lockedWinRef.current) {
                s.phase = 'stuck_miss';
                s.targetWobble = 1;
                s.targetWobbleTime = 0;
                soundEngine.playTargetMiss();
                showMissMessage();
                if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
                resetTimerRef.current = window.setTimeout(() => {
                  resetArrowToBow();
                }, 1150);
              }
              break;
            }
            s.wasInsideTarget = true;
            s.prevTargetDist = Math.min(s.prevTargetDist, distToTarget);
          } else if (s.wasInsideTarget && !lockedWinRef.current) {
            // Arrow exited target circle right after glancing the outer rim
            hitHandled = true;
            s.arrowX = prevTipX - Math.cos(s.arrowAngle) * (s.arrowLen - 7);
            s.arrowY = prevTipY - Math.sin(s.arrowAngle) * (s.arrowLen - 7);
            s.phase = 'stuck_miss';
            s.targetWobble = 1;
            s.targetWobbleTime = 0;
            soundEngine.playTargetMiss();
            showMissMessage();
            if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
            resetTimerRef.current = window.setTimeout(() => {
              resetArrowToBow();
            }, 1150);
            break;
          }
        }

        // Flying sparkle trail
        if (!hitHandled && !reducedMotion && Math.random() < 0.78) {
          s.particles.push({
            x: s.arrowX + Math.cos(s.arrowAngle) * 12,
            y: s.arrowY + Math.sin(s.arrowAngle) * 12,
            vx: (Math.random() - 0.5) * 32,
            vy: (Math.random() - 0.5) * 32,
            size: 1.8 + Math.random() * 2.4,
            alpha: 0.9,
            decay: 1.5,
            color: Math.random() > 0.35 ? '#FDE68A' : '#FFFFFF',
            kind: 'glitter',
            rotation: 0,
            vRot: 0,
          });
        }

        // Out-of-bounds miss check
        if (
          !hitHandled &&
          (s.arrowX > s.width + 110 || s.arrowY > s.height + 110 || s.arrowX < -120)
        ) {
          s.phase = 'stuck_miss';
          showMissMessage();
          if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
          resetTimerRef.current = window.setTimeout(() => {
            resetArrowToBow();
          }, 700);
        }
      }

      // Update particles & shockwaves
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind !== 'heart') {
          p.vy += 120 * dt;
        } else {
          p.vy -= 18 * dt;
        }
        p.rotation += p.vRot * dt;
        p.alpha -= p.decay * dt;
        if (p.alpha <= 0) {
          s.particles.splice(i, 1);
        }
      }

      for (let i = s.shockwaves.length - 1; i >= 0; i--) {
        const sw = s.shockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * Math.min(1, dt * 6.5);
        sw.alpha -= dt * 1.25;
        if (sw.alpha <= 0) {
          s.shockwaves.splice(i, 1);
        }
      }

      // 2. Render Midnight Purple Arena Background
      const bgGrad = ctx.createRadialGradient(
        s.width * 0.5,
        s.height * 0.38,
        20,
        s.width * 0.5,
        s.height * 0.5,
        Math.max(s.width, s.height) * 0.85
      );
      bgGrad.addColorStop(0, '#220E3B');
      bgGrad.addColorStop(0.48, '#120722');
      bgGrad.addColorStop(1, '#05020A');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, s.width, s.height);

      // Ambient cinematic lighting halos behind target and bow
      const targetGlow = ctx.createRadialGradient(
        s.targetX,
        s.targetY,
        s.targetR * 0.2,
        s.targetX,
        s.targetY,
        s.targetR * 2.8
      );
      targetGlow.addColorStop(0, 'rgba(225, 29, 72, 0.22)');
      targetGlow.addColorStop(0.5, 'rgba(168, 85, 247, 0.08)');
      targetGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = targetGlow;
      ctx.fillRect(0, 0, s.width, s.height);

      const bowGlow = ctx.createRadialGradient(
        s.bowX,
        s.bowY,
        10,
        s.bowX,
        s.bowY,
        s.maxPull * 1.9
      );
      bowGlow.addColorStop(0, 'rgba(245, 197, 107, 0.14)');
      bowGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bowGlow;
      ctx.fillRect(0, 0, s.width, s.height);

      // Twinkling background stars
      for (const st of s.stars) {
        const tw = reducedMotion
          ? 0.55
          : 0.28 + 0.65 * (0.5 + 0.5 * Math.sin(t * st.speed + st.phase));
        ctx.fillStyle = `rgba(254, 243, 199, ${tw})`;
        ctx.beginPath();
        ctx.arc(st.xFrac * s.width, st.yFrac * s.height, st.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Draw Target Board with Professional Concentric Black & White Rings + Red Bullseye
      const wobbleOffset =
        s.targetWobble > 0 && !reducedMotion
          ? Math.sin(s.targetWobbleTime * 36) * s.targetWobble * 4.5
          : 0;
      const tx = s.targetX + wobbleOffset;
      const ty = s.targetY;

      ctx.save();
      // Target stand post
      ctx.strokeStyle = 'rgba(245, 197, 107, 0.25)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(tx, ty + s.targetR * 0.92);
      ctx.lineTo(tx, ty + s.targetR * 1.48);
      ctx.stroke();

      // Subtle outer drop glow around target board
      ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(tx, ty, s.targetR + 5, 0, Math.PI * 2);
      ctx.fillStyle = '#2B1B3D';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Gold championship outer bevel
      ctx.strokeStyle = 'rgba(245, 197, 107, 0.65)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Alternating black and white concentric rings (5 rings + 28% red bullseye)
      const rings: Array<{ frac: number; color: string }> = [
        { frac: 1.0, color: '#110C18' }, // Outer Black
        { frac: 0.82, color: '#FAF8FF' }, // White
        { frac: 0.64, color: '#140E1D' }, // Black
        { frac: 0.46, color: '#FAF8FF' }, // Inner White
      ];
      for (const ring of rings) {
        ctx.beginPath();
        ctx.arc(tx, ty, s.targetR * ring.frac, 0, Math.PI * 2);
        ctx.fillStyle = ring.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(15, 10, 24, 0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Red Bullseye (28% of target diameter) with luminous red aura
      const bullR = s.targetR * 0.28;
      const redAura = ctx.createRadialGradient(tx, ty, bullR * 0.4, tx, ty, bullR * 2.1);
      redAura.addColorStop(0, 'rgba(244, 63, 94, 0.45)');
      redAura.addColorStop(1, 'rgba(244, 63, 94, 0)');
      ctx.fillStyle = redAura;
      ctx.beginPath();
      ctx.arc(tx, ty, bullR * 2.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.shadowColor = 'rgba(225, 29, 72, 0.9)';
      ctx.shadowBlur = 16;
      const bullGrad = ctx.createRadialGradient(
        tx - bullR * 0.22,
        ty - bullR * 0.22,
        2,
        tx,
        ty,
        bullR
      );
      bullGrad.addColorStop(0, '#FB7185');
      bullGrad.addColorStop(0.55, '#E11D48');
      bullGrad.addColorStop(1, '#9F1239');
      ctx.fillStyle = bullGrad;
      ctx.beginPath();
      ctx.arc(tx, ty, bullR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Subtle inner heart mark inside bullseye
      drawHeart(ctx, tx, ty - bullR * 0.28, bullR * 0.62, 'rgba(255, 241, 242, 0.92)', 0.9, 0);
      ctx.restore();

      // 4. Draw Aiming Trajectory Preview while Dragging
      if (s.phase === 'dragging') {
        const pullDx = s.bowX - s.pullX;
        const pullDy = s.bowY - s.pullY;
        const pullDist = Math.hypot(pullDx, pullDy);

        if (pullDist >= 18) {
          const aimAngle = Math.atan2(pullDy, pullDx);
          const speed = (pullDist / s.maxPull) * s.maxSpeed;
          const vx = Math.cos(aimAngle) * speed;
          const vy = Math.sin(aimAngle) * speed;
          const startTipX = s.pullX + Math.cos(aimAngle) * s.arrowLen;
          const startTipY = s.pullY + Math.sin(aimAngle) * s.arrowLen;

          for (let i = 1; i <= 26; i++) {
            const simT = i * 0.036;
            const px = startTipX + vx * simT;
            const py = startTipY + vy * simT + 0.5 * s.gravity * simT * simT;
            if (px > s.width || py > s.height || px < 0) break;

            const alpha = Math.max(0.08, 0.9 - i * 0.032);
            const dotR = Math.max(1.8, 4.2 - i * 0.09);
            ctx.fillStyle = `rgba(253, 230, 138, ${alpha})`;
            ctx.beginPath();
            ctx.arc(px, py, dotR, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 5. Draw Fixed Bow & Dynamic Bowstring
      const restAngle = Math.atan2(s.targetY - s.bowY, s.targetX - s.bowX);
      const activeBowAngle = s.phase === 'dragging' ? s.aimAngle : restAngle;
      const bowRadius = s.isPortrait ? 52 : 64;
      const pullRatio =
        s.phase === 'dragging'
          ? Math.min(1, Math.hypot(s.bowX - s.pullX, s.bowY - s.pullY) / s.maxPull)
          : 0;
      const limbFlex = pullRatio * 7;

      // Upper and lower bow limb tips in world coordinates
      const perpAngle = activeBowAngle + Math.PI / 2;
      const tipBackOffset = 12 + limbFlex;
      const upperTipX =
        s.bowX + Math.cos(perpAngle) * bowRadius - Math.cos(activeBowAngle) * tipBackOffset;
      const upperTipY =
        s.bowY + Math.sin(perpAngle) * bowRadius - Math.sin(activeBowAngle) * tipBackOffset;
      const lowerTipX =
        s.bowX - Math.cos(perpAngle) * bowRadius - Math.cos(activeBowAngle) * tipBackOffset;
      const lowerTipY =
        s.bowY - Math.sin(perpAngle) * bowRadius - Math.sin(activeBowAngle) * tipBackOffset;

      // String anchor point (pulled nock if dragging, oscillating midpoint on release, or rest center)
      let stringMidX = (upperTipX + lowerTipX) / 2;
      let stringMidY = (upperTipY + lowerTipY) / 2;

      if (s.phase === 'dragging') {
        stringMidX = s.pullX;
        stringMidY = s.pullY;
      } else if (s.phase === 'ready') {
        stringMidX = s.bowX;
        stringMidY = s.bowY;
      } else if (s.bowVibration > 0 && !reducedMotion) {
        const osc = Math.sin(s.bowVibTime * 48) * s.bowVibration * 14;
        stringMidX += Math.cos(activeBowAngle) * osc;
        stringMidY += Math.sin(activeBowAngle) * osc;
      }

      // Draw stretched / vibrating bowstring
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 251, 235, 0.88)';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(253, 224, 130, 0.5)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(upperTipX, upperTipY);
      ctx.lineTo(stringMidX, stringMidY);
      ctx.lineTo(lowerTipX, lowerTipY);
      ctx.stroke();
      ctx.restore();

      // Draw ornate recurve bow body (remains fixed at bowX, bowY)
      ctx.save();
      ctx.translate(s.bowX, s.bowY);
      const bowOsc =
        s.bowVibration > 0 && !reducedMotion
          ? Math.sin(s.bowVibTime * 38) * s.bowVibration * 0.045
          : 0;
      ctx.rotate(activeBowAngle + bowOsc);

      ctx.shadowColor = 'rgba(245, 197, 107, 0.55)';
      ctx.shadowBlur = 14;

      const bowGrad = ctx.createLinearGradient(0, -bowRadius, 0, bowRadius);
      bowGrad.addColorStop(0, '#FDE68A');
      bowGrad.addColorStop(0.35, '#D97706');
      bowGrad.addColorStop(0.5, '#F5C56B');
      bowGrad.addColorStop(0.65, '#D97706');
      bowGrad.addColorStop(1, '#FDE68A');

      ctx.strokeStyle = bowGrad;
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-tipBackOffset, -bowRadius);
      ctx.bezierCurveTo(18, -bowRadius * 0.65, 22, -16, 15, 0);
      ctx.bezierCurveTo(22, 16, 18, bowRadius * 0.65, -tipBackOffset, bowRadius);
      ctx.stroke();

      // Ornate lavender-crimson grip wrap at bow center
      ctx.strokeStyle = '#9D174D';
      ctx.lineWidth = 7.5;
      ctx.beginPath();
      ctx.moveTo(15, -10);
      ctx.lineTo(15, 10);
      ctx.stroke();

      // Gold accents at grip ends
      ctx.fillStyle = '#FDE68A';
      ctx.beginPath();
      ctx.arc(-tipBackOffset, -bowRadius, 3.2, 0, Math.PI * 2);
      ctx.arc(-tipBackOffset, bowRadius, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 6. Draw Arrow in current state
      if (s.phase === 'ready') {
        const pulse = reducedMotion ? 0 : Math.sin(t * 3.2) * 2.5;
        drawArrow(
          ctx,
          s.bowX - Math.cos(restAngle) * pulse,
          s.bowY - Math.sin(restAngle) * pulse,
          restAngle,
          s.arrowLen,
          1
        );

        // Subtle "Pull me" halo around nock before first interaction
        if (!hasInteracted) {
          const haloR = 18 + Math.sin(t * 3) * 4;
          ctx.strokeStyle = 'rgba(253, 224, 130, 0.48)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(s.bowX, s.bowY, haloR, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (s.phase === 'dragging') {
        drawArrow(ctx, s.pullX, s.pullY, s.aimAngle, s.arrowLen, 1.15);
      } else if (s.phase === 'flying' || s.phase === 'stuck_miss' || s.phase === 'stuck_win') {
        drawArrow(
          ctx,
          s.arrowX + (s.phase !== 'flying' ? wobbleOffset : 0),
          s.arrowY,
          s.arrowAngle,
          s.arrowLen,
          s.phase === 'flying' ? 1.15 : 0.75
        );
      }

      // 7. Draw Shockwaves & Particles
      for (const sw of s.shockwaves) {
        ctx.save();
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      for (const p of s.particles) {
        if (p.kind === 'heart') {
          drawHeart(ctx, p.x, p.y, p.size, p.color, p.alpha, p.rotation);
        } else if (p.kind === 'sparkle') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          const r = p.size * 1.4;
          ctx.moveTo(0, -r);
          ctx.quadraticCurveTo(0, 0, r, 0);
          ctx.quadraticCurveTo(0, 0, 0, r);
          ctx.quadraticCurveTo(0, 0, -r, 0);
          ctx.quadraticCurveTo(0, 0, 0, -r);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, [
    computeLayout,
    hasInteracted,
    onSuccess,
    reducedMotion,
    resetArrowToBow,
    showMissMessage,
    spawnBullseyeCelebration,
  ]);

  const getLocalCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    soundEngine.unlockAndStartMusic();
    setHasInteracted(true);

    const s = simRef.current;
    if (s.phase !== 'ready' || lockedWinRef.current) return;

    const { x, y } = getLocalCoords(e);
    const distFromBow = Math.hypot(x - s.bowX, y - s.bowY);

    // Generous touch/mouse grab zone around bow & arrow nock
    const grabRadius = s.isPortrait ? 135 : 155;
    if (distFromBow <= grabRadius) {
      e.currentTarget.setPointerCapture(e.pointerId);
      s.phase = 'dragging';
      s.pointerId = e.pointerId;
      updateDragPosition(x, y);
    }
  };

  const updateDragPosition = (px: number, py: number) => {
    const s = simRef.current;
    let dx = px - s.bowX;
    let dy = py - s.bowY;
    const dist = Math.hypot(dx, dy);

    if (dist > s.maxPull) {
      const scale = s.maxPull / dist;
      dx *= scale;
      dy *= scale;
    }

    s.pullX = s.bowX + dx;
    s.pullY = s.bowY + dy;

    if (dist > 8) {
      // Aim opposite to pull vector (slingshot)
      s.aimAngle = Math.atan2(-dy, -dx);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = simRef.current;
    if (s.phase !== 'dragging' || s.pointerId !== e.pointerId) return;
    const { x, y } = getLocalCoords(e);
    updateDragPosition(x, y);
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = simRef.current;
    if (s.phase !== 'dragging' || s.pointerId !== e.pointerId) return;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const pullDx = s.bowX - s.pullX;
    const pullDy = s.bowY - s.pullY;
    const pullDist = Math.hypot(pullDx, pullDy);

    if (pullDist < 18) {
      resetArrowToBow();
      return;
    }

    const launchAngle = Math.atan2(pullDy, pullDx);
    const speed = (pullDist / s.maxPull) * s.maxSpeed;

    s.arrowX = s.pullX;
    s.arrowY = s.pullY;
    s.arrowVx = Math.cos(launchAngle) * speed;
    s.arrowVy = Math.sin(launchAngle) * speed;
    s.arrowAngle = launchAngle;
    s.prevTargetDist = Infinity;
    s.wasInsideTarget = false;
    s.phase = 'flying';
    s.pointerId = null;

    s.bowVibration = 1;
    s.bowVibTime = 0;

    soundEngine.playArrowRelease();
  };

  return (
    <section
      ref={containerRef}
      aria-label="Interactive Archery Challenge"
      className="relative w-full h-[100dvh] overflow-hidden select-none bg-[#07040F]"
    >
      {/* Interactive Archery Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        className="block w-full h-full touch-none cursor-crosshair"
      />

      {/* Top Centered Instruction Banner (non-blocking pointer-events-none) */}
      <div className="pointer-events-none absolute top-14 sm:top-8 inset-x-0 flex flex-col items-center px-4 text-center z-10">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-display text-xl sm:text-3xl md:text-4xl font-semibold tracking-wide text-amber-100 leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] [text-wrap:balance]"
        >
          Hit the Heart to Unlock Your Surprise
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-1 text-xs sm:text-base text-purple-100/90 max-w-md drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
        >
          Pull back, aim at the red heart, and release!
        </motion.p>
      </div>

      {/* Miss / Win Feedback Toast */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            key="miss-feedback"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-none absolute bottom-24 sm:bottom-20 inset-x-0 flex justify-center px-4 z-20"
          >
            <div className="rounded-2xl bg-[#1A0B2E]/90 backdrop-blur-md border border-rose-400/35 px-5 py-3 shadow-xl shadow-black/50">
              <p className="text-sm sm:text-base font-medium text-rose-100 text-center">
                {feedbackMsg}
              </p>
            </div>
          </motion.div>
        )}

        {winBannerVisible && (
          <motion.div
            key="win-feedback"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none absolute inset-x-0 bottom-24 sm:bottom-24 flex justify-center px-4 z-20"
          >
            <div className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-purple-950/90 to-amber-950/90 backdrop-blur-md border border-amber-300/45 px-6 py-3.5 shadow-2xl">
              <Heart className="w-5 h-5 text-rose-400 fill-rose-400 shrink-0" />
              <p className="font-display text-xl sm:text-2xl font-semibold text-amber-100">
                Perfect Shot, My Love!
              </p>
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
