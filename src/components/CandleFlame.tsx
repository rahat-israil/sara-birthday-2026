import React from 'react';
import { motion } from 'motion/react';

interface CandleFlameProps {
  xPct: number;
  yPct: number;
  lit: boolean;
  delayMs?: number;
  reducedMotion?: boolean;
  scale?: number;
}

export const CandleFlame: React.FC<CandleFlameProps> = ({
  xPct,
  yPct,
  lit,
  reducedMotion = false,
  scale = 1,
}) => {
  if (!lit) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.2, y: 4 }}
      animate={{ opacity: 1, scale, y: 0 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        transform: 'translate(-50%, -100%)',
      }}
      className="pointer-events-none absolute z-20 origin-bottom w-[3.2%] min-w-[10px] max-w-[20px] aspect-[24/38]"
      aria-hidden="true"
    >
      {/* Warm outer golden glow halo */}
      <div
        className={`absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/4 w-[240%] h-[190%] rounded-full bg-amber-300/45 blur-md ${
          reducedMotion ? '' : 'animate-flame-halo'
        }`}
      />

      {/* Realistic layered SVG teardrop candle flame */}
      <svg
        viewBox="0 0 24 38"
        className={`relative w-full h-full drop-shadow-[0_0_8px_rgba(255,200,90,0.95)] ${
          reducedMotion ? '' : 'animate-flame-flicker'
        }`}
      >
        <defs>
          <radialGradient id="flameOuterGrad" cx="50%" cy="62%" r="55%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="45%" stopColor="#FDE047" />
            <stop offset="82%" stopColor="#FB923C" />
            <stop offset="100%" stopColor="rgba(249,115,22,0)" />
          </radialGradient>
        </defs>
        {/* Outer warm orange-gold flame */}
        <path
          d="M12 2 C15.5 10, 20 18.5, 19 26 C18.2 31.8, 15.2 35, 12 35 C8.8 35, 5.8 31.8, 5 26 C4 18.5, 8.5 10, 12 2 Z"
          fill="url(#flameOuterGrad)"
        />
        {/* Bright incandescent yellow-white core */}
        <path
          d="M12 12 C14.2 17, 16 21.5, 15.4 26.5 C14.9 30.2, 13.5 32.5, 12 32.5 C10.5 32.5, 9.1 30.2, 8.6 26.5 C8 21.5, 9.8 17, 12 12 Z"
          fill="#FFFDF0"
        />
        {/* Subtle blue base near wick */}
        <ellipse cx="12" cy="32.2" rx="2.2" ry="1.8" fill="rgba(96, 165, 250, 0.55)" />
      </svg>
    </motion.div>
  );
};
