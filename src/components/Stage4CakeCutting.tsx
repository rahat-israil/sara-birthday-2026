import React, { useState } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { RomanticParticles } from './RomanticParticles';
import { FireworksBackdrop } from './FireworksBackdrop';

interface Stage4CakeCuttingProps {
  onReplay: () => void;
  reducedMotion: boolean;
}

const STAGE4_CAKE_IMAGE = '/assets/aistudio/file_00000000380482118e14a795dc0af564_4c8eec04.png';

export const Stage4CakeCutting: React.FC<Stage4CakeCuttingProps> = ({
  onReplay,
  reducedMotion,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <section
      aria-label="Cake Cutting Moment Together"
      className="relative min-h-[100dvh] w-full overflow-x-hidden bg-gradient-to-b from-[#07040F] via-[#170929] to-[#080411] px-[25px] sm:px-6 lg:px-10 pt-16 pb-10 sm:py-16 flex items-center justify-center"
    >
      {/* Background Diwali / Wedding-style Fireworks (10s) */}
      <FireworksBackdrop
        active={true}
        durationMs={10000}
        reducedMotion={reducedMotion}
      />

      {/* Soft romantic ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_48%_32%,rgba(245,197,107,0.16),transparent_58%),radial-gradient(circle_at_70%_75%,rgba(244,63,94,0.12),transparent_55%)]"
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
        {/* Left / Top: Cake Cutting Couple Photo */}
        <motion.div
          initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 flex flex-col items-center"
        >
          <div className="relative w-full max-w-[540px] aspect-[1199/1312] rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-[#230E3E] via-[#341354] to-[#1A092B] shadow-[0_0_80px_rgba(245,197,107,0.22),0_24px_80px_rgba(0,0,0,0.75)] ring-1 ring-amber-200/30">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#230E3E] via-[#1B0A30] to-[#2F104A]">
                <div className="w-10 h-10 rounded-full border-2 border-amber-200/30 border-t-amber-300 animate-spin" />
                <p className="mt-3 text-xs tracking-wide text-purple-100/80">
                  Loading our sweetest moment...
                </p>
              </div>
            )}

            {imageError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#230E3B] via-[#140724] to-[#2B0C20]">
                <Sparkles className="w-10 h-10 text-amber-300 mb-3" />
                <p className="font-display text-2xl text-amber-100">
                  Together Forever, My Love
                </p>
              </div>
            ) : (
              <>
                <img
                  src={STAGE4_CAKE_IMAGE}
                  alt="Couple cutting the lavender birthday cake together surrounded by roses and fairy lights"
                  referrerPolicy="no-referrer"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover object-center"
                />

                {/* Soft romantic vignette */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 bg-gradient-to-t from-[#07040F]/35 via-transparent to-transparent"
                />

                {/* Face-safe golden sparkles & floating hearts framing the scene */}
                <RomanticParticles
                  showSparkles={true}
                  showHearts={true}
                  sparkleCount={20}
                  heartCount={10}
                  reducedMotion={reducedMotion}
                  intensity="bright"
                  excludeZone={{ leftPct: 24, rightPct: 80, topPct: 6, bottomPct: 58 }}
                />
              </>
            )}
          </div>
        </motion.div>

        {/* Right / Bottom: Romantic Cake-Cutting Message & Replay CTA */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left"
        >
          <div className="w-full max-w-xl">
            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-amber-100 leading-[1.12] [text-wrap:balance] drop-shadow-[0_4px_24px_rgba(245,197,107,0.26)]">
              Together Forever, My Love! 🎂❤️
            </h1>

            <div className="mt-5 sm:mt-6 space-y-3 text-base sm:text-lg leading-relaxed text-purple-100/95">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.65 }}
              >
                Every moment with you feels like magic.
                <br />
                Cutting this birthday cake together makes today even sweeter and unforgettable.
                <br />
                May every year ahead bring us endless smiles, love, and beautiful memories side by side.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.65 }}
                className="pt-2 font-display italic text-2xl sm:text-3xl text-rose-200"
              >
                Forever yours, always. 💕
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
                onClick={onReplay}
                className="inline-flex items-center gap-2.5 min-h-[50px] px-7 py-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] active:scale-[0.98] backdrop-blur-md border border-purple-200/25 text-sm sm:text-base font-medium text-amber-100 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Replay Your Little Surprise ↻</span>
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
