import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { CandleFlame } from './CandleFlame';
import { RomanticParticles } from './RomanticParticles';
import { FireworksBackdrop } from './FireworksBackdrop';
import { soundEngine } from '../utils/soundEngine';

interface Stage3CelebrationProps {
  onNext: () => void;
  reducedMotion: boolean;
}

const STAGE3_UNLIT_IMAGE = '/assets/stage3_unlit.png';
const STAGE4_PRELOAD = '/assets/aistudio/file_00000000380482118e14a795dc0af564_4c8eec04.png';

// Exact pixel-calibrated candle wick coordinates (% of 1188x1324 Elegant_Lavender_No_2 frame)
const CANDLE_WICKS = [
  { id: 0, xPct: 50.08, yPct: 68.28, scale: 0.95 },
  { id: 1, xPct: 53.7, yPct: 68.81, scale: 0.92 },
  { id: 2, xPct: 55.64, yPct: 67.3, scale: 1.02 },
  { id: 3, xPct: 60.44, yPct: 67.6, scale: 1.0 },
  { id: 4, xPct: 65.15, yPct: 67.6, scale: 1.02 },
];

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  rotation: number;
  vRot: number;
  alpha: number;
  isHeart: boolean;
}

export const Stage3Celebration: React.FC<Stage3CelebrationProps> = ({
  onNext,
  reducedMotion,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [celebrating, setCelebrating] = useState(false);
  const [litCount, setLitCount] = useState(0);
  const [showFinalMessage, setShowFinalMessage] = useState(false);

  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiRef = useRef<ConfettiPiece[]>([]);
  const timersRef = useRef<number[]>([]);

  // Preload Stage 4 cake-cutting photo & clean up timers on unmount
  useEffect(() => {
    const preload = new Image();
    preload.src = STAGE4_PRELOAD;
    return () => {
      timersRef.current.forEach((id) => clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  // Confetti + Golden Sparkle Burst Canvas Loop
  useEffect(() => {
    if (!celebrating) return;
    const canvas = confettiCanvasRef.current;
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

    let rafId = 0;
    let last = performance.now();

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

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const items = confettiRef.current;
      for (let i = items.length - 1; i >= 0; i--) {
        const p = items[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.isHeart) {
          p.vy -= 14 * dt; // hearts float gently upward
          p.vx += Math.sin(now / 350 + i) * 18 * dt;
        } else {
          p.vy += 240 * dt; // confetti drifts down with air resistance
          p.vx *= 0.992;
        }
        p.rotation += p.vRot * dt;
        if (p.y > window.innerHeight + 40 || p.y < -80) {
          p.alpha -= dt * 1.4;
        } else {
          p.alpha -= dt * 0.14;
        }
        if (p.alpha <= 0) {
          items.splice(i, 1);
          continue;
        }

        if (p.isHeart) {
          drawHeart(ctx, p.x, p.y, p.w, p.color, p.alpha, p.rotation);
        } else {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }

      if (items.length > 0) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [celebrating]);

  const spawnConfettiExplosion = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const palette = ['#FDE68A', '#F5C56B', '#FB7185', '#F472B6', '#C084FC', '#FFFFFF'];
    const heartPalette = ['#F43F5E', '#EC4899', '#C084FC', '#F472B6'];

    const pieces: ConfettiPiece[] = [];
    const total = reducedMotion ? 36 : 110;

    for (let i = 0; i < total; i++) {
      const fromLeft = i % 2 === 0;
      const originX = fromLeft ? w * 0.25 : w * 0.75;
      const originY = h * 0.55;
      const angle = fromLeft
        ? -Math.PI * 0.45 + (Math.random() - 0.5) * 0.9
        : -Math.PI * 0.55 + (Math.random() - 0.5) * 0.9;
      const speed = 260 + Math.random() * 480;

      pieces.push({
        x: originX + (Math.random() - 0.5) * 80,
        y: originY + (Math.random() - 0.5) * 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: 6 + Math.random() * 7,
        h: 4 + Math.random() * 5,
        color: palette[i % palette.length],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 8,
        alpha: 1,
        isHeart: false,
      });
    }

    // Floating pink & purple hearts rising upward
    const heartTotal = reducedMotion ? 10 : 28;
    for (let i = 0; i < heartTotal; i++) {
      pieces.push({
        x: w * (0.12 + Math.random() * 0.76),
        y: h * (0.65 + Math.random() * 0.28),
        vx: (Math.random() - 0.5) * 45,
        vy: -(85 + Math.random() * 115),
        w: 14 + Math.random() * 10,
        h: 14,
        color: heartPalette[i % heartPalette.length],
        rotation: (Math.random() - 0.5) * 0.4,
        vRot: (Math.random() - 0.5) * 1.2,
        alpha: 0.95,
        isHeart: true,
      });
    }

    confettiRef.current = pieces;
  };

  const handleCelebrate = () => {
    if (celebrating) return;
    soundEngine.unlockAndStartMusic();
    soundEngine.playHappyBirthdaySong();
    setCelebrating(true);

    const stepDelay = reducedMotion ? 90 : 270;

    // Ignite all 5 candles one by one
    CANDLE_WICKS.forEach((candle, idx) => {
      const id = window.setTimeout(() => {
        setLitCount((prev) => Math.max(prev, idx + 1));
        soundEngine.playCandleIgnite(idx);
      }, idx * stepDelay);
      timersRef.current.push(id);
    });

    // Trigger confetti + hearts + celebration shimmer once candles are lit
    const burstDelay = CANDLE_WICKS.length * stepDelay + 180;
    const burstId = window.setTimeout(() => {
      soundEngine.playCelebrationFanfare();
      spawnConfettiExplosion();
    }, burstDelay);
    timersRef.current.push(burstId);

    // Display final romantic message
    const msgId = window.setTimeout(() => {
      setShowFinalMessage(true);
    }, burstDelay + 350);
    timersRef.current.push(msgId);
  };

  const allCandlesLit = litCount >= CANDLE_WICKS.length;

  return (
    <section
      aria-label="Final Birthday Celebration"
      className="relative min-h-[100dvh] w-full overflow-x-hidden bg-gradient-to-b from-[#07040F] via-[#150826] to-[#080411] px-[25px] sm:px-6 lg:px-10 pt-16 pb-10 sm:py-16 flex items-center justify-center"
    >
      {/* Diwali / Wedding-style Fireworks triggered on Celebrate Birthday (18s) */}
      <FireworksBackdrop
        active={celebrating}
        durationMs={18000}
        reducedMotion={reducedMotion}
      />

      {/* Full-viewport Confetti & Floating Hearts Overlay Canvas */}
      {celebrating && (
        <canvas
          ref={confettiCanvasRef}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 w-full h-full z-40"
        />
      )}

      {/* Ambient Backdrop Warmth (brightens warmly once celebrated) */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 transition-opacity duration-1000 ${
          allCandlesLit ? 'opacity-100' : 'opacity-45'
        } bg-[radial-gradient(circle_at_50%_35%,rgba(245,197,107,0.18),transparent_58%),radial-gradient(circle_at_30%_75%,rgba(244,63,94,0.12),transparent_55%)]`}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-12 items-center">
        {/* Photo Stage with Accurate Candle Flame Overlays */}
        <motion.div
          initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 flex flex-col items-center"
        >
          <div
            className={`relative w-full max-w-[540px] aspect-[1188/1324] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0A0514] transition-shadow duration-1000 ${
              allCandlesLit
                ? 'shadow-[0_0_90px_rgba(245,197,107,0.28),0_24px_80px_rgba(0,0,0,0.8)] ring-1 ring-amber-200/35'
                : 'shadow-[0_24px_80px_rgba(0,0,0,0.75)] ring-1 ring-purple-200/15'
            }`}
          >
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#120820]">
                <div className="w-10 h-10 rounded-full border-2 border-amber-200/30 border-t-amber-300 animate-spin" />
                <p className="mt-3 text-xs tracking-wide text-purple-200/70">
                  Loading birthday cake...
                </p>
              </div>
            )}

            {imageError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#230E3B] via-[#140724] to-[#2B0C20]">
                <Sparkles className="w-10 h-10 text-amber-300 mb-3" />
                <p className="font-display text-2xl text-amber-100">Make a Wish, My Love</p>
              </div>
            ) : (
              <>
                {/* Exact Second Birthday Photograph with Unlit Candles Initially */}
                <img
                  src={STAGE3_UNLIT_IMAGE}
                  alt="Birthday celebration portrait with lavender dress, roses, and birthday cake"
                  referrerPolicy="no-referrer"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  className={`w-full h-full object-cover object-center transition-[filter] duration-1000 ${
                    allCandlesLit ? 'brightness-[1.09] saturate-[1.08] contrast-[1.02]' : 'brightness-100'
                  }`}
                />

                {/* Warm Golden Glow around Cake & Decorations when Candles Ignite */}
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ${
                    litCount > 0 ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    background:
                      'radial-gradient(circle at 58% 72%, rgba(253, 224, 130, 0.36) 0%, rgba(251, 146, 60, 0.14) 26%, transparent 60%)',
                    mixBlendMode: 'screen',
                  }}
                />

                {/* Brighter Decoration Glow Overlay on Full Celebration */}
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ${
                    allCandlesLit ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    background:
                      'radial-gradient(circle at 38% 24%, rgba(254, 240, 138, 0.18) 0%, transparent 45%), radial-gradient(circle at 18% 72%, rgba(253, 224, 130, 0.16) 0%, transparent 40%)',
                    mixBlendMode: 'screen',
                  }}
                />

                {/* Animated SVG/CSS Candle Flames Positioned Above Each Unlit Wick */}
                {CANDLE_WICKS.map((candle, idx) => (
                  <CandleFlame
                    key={candle.id}
                    xPct={candle.xPct}
                    yPct={candle.yPct}
                    lit={idx < litCount}
                    scale={candle.scale}
                    reducedMotion={reducedMotion}
                  />
                ))}

                {/* Ambient Sparkles & Post-Celebrate Floating Hearts (kept off her face) */}
                <RomanticParticles
                  showSparkles={true}
                  showHearts={allCandlesLit}
                  sparkleCount={allCandlesLit ? 22 : 12}
                  heartCount={12}
                  reducedMotion={reducedMotion}
                  intensity={allCandlesLit ? 'bright' : 'soft'}
                  excludeZone={{ leftPct: 38, rightPct: 84, topPct: 8, bottomPct: 62 }}
                />
              </>
            )}
          </div>
        </motion.div>

        {/* Right / Bottom: Make a Wish Prompt -> Final Romantic Birthday Message */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
          <AnimatePresence mode="wait">
            {!showFinalMessage ? (
              <motion.div
                key="wish-prompt"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-xl"
              >
                <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-amber-100 leading-[1.15] [text-wrap:balance]">
                  Now, it&apos;s time to make a wish! 🎂
                </h1>

                <p className="mt-4 text-base sm:text-lg text-purple-100/85 max-w-md mx-auto lg:mx-0">
                  Close your eyes for a moment, make your sweetest birthday wish, and light the candles together.
                </p>

                <div className="mt-8 flex justify-center lg:justify-start">
                  <button
                    type="button"
                    onClick={handleCelebrate}
                    disabled={celebrating}
                    className="animate-cta-glow min-h-[54px] px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 active:scale-[0.98] disabled:opacity-75 text-white font-semibold text-base sm:text-lg tracking-wide border border-amber-200/45 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  >
                    {celebrating ? 'Lighting Your Candles... ✨' : 'Celebrate Birthday 🎉'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="final-message"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-xl"
              >
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-amber-100 leading-[1.12] [text-wrap:balance] drop-shadow-[0_4px_24px_rgba(245,197,107,0.28)]">
                  Happy Birthday, My Love! ❤️
                </h1>

                <div className="mt-5 sm:mt-6 space-y-3 text-base sm:text-lg leading-relaxed text-purple-100/95">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.65 }}
                  >
                    May your life always sparkle with happiness.
                    <br />
                    I wish I could be there beside you to celebrate this beautiful day.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55, duration: 0.65 }}
                    className="pt-2 font-display italic text-2xl sm:text-3xl text-rose-200"
                  >
                    Sending you endless love and hugs! 💗
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.95, duration: 0.6 }}
                  className="mt-8 flex justify-center lg:justify-start"
                >
                  <button
                    type="button"
                    onClick={onNext}
                    className="animate-cta-glow inline-flex items-center gap-2.5 min-h-[52px] px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 active:scale-[0.98] text-white font-semibold text-base sm:text-lg tracking-wide border border-amber-200/45 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  >
                    <span>Next ✨</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
