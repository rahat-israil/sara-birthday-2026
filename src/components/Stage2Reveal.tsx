import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { RomanticParticles } from './RomanticParticles';
import { FireworksBackdrop } from './FireworksBackdrop';
import { soundEngine } from '../utils/soundEngine';

interface Stage2RevealProps {
  onNext: () => void;
  reducedMotion: boolean;
}

const STAGE2_IMAGE = '/assets/aistudio/Dreamy_Lavender_No_1_207947a5.png';
const STAGE3_PRELOAD = '/assets/stage3_unlit.png';

export const Stage2Reveal: React.FC<Stage2RevealProps> = ({ onNext, reducedMotion }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reveal choreography steps:
  // 0: Dark screen
  // 1: Background floral backdrop, neon sign, fairy lights & balloons
  // 2: Decorated birthday table from bottom to top
  // 3: Girl in purple dress smooth mask + gentle scale reveal
  // 4: Romantic Birthday Message & "There's One More Surprise" CTA
  const [revealStep, setRevealStep] = useState<number>(0);

  // Preload Stage 3 unlit image silently for instant transition
  useEffect(() => {
    const preload = new Image();
    preload.src = STAGE3_PRELOAD;
  }, []);

  // Run progressive reveal sequence once Stage 2 image is ready
  useEffect(() => {
    if (!imageLoaded && !imageError) return;

    if (reducedMotion) {
      setRevealStep(4);
      return;
    }

    const t1 = window.setTimeout(() => setRevealStep(1), 280);
    const t2 = window.setTimeout(() => setRevealStep(2), 2350);
    const t3 = window.setTimeout(() => setRevealStep(3), 4350);
    const t4 = window.setTimeout(() => setRevealStep(4), 6350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [imageLoaded, imageError, reducedMotion]);

  const handleNext = () => {
    soundEngine.unlockAndStartMusic();
    onNext();
  };

  return (
    <section
      aria-label="First Birthday Surprise Reveal"
      className="relative min-h-[100dvh] w-full overflow-x-hidden bg-gradient-to-b from-[#07040F] via-[#130824] to-[#080411] px-[25px] sm:px-6 lg:px-10 pt-16 pb-10 sm:py-16 flex items-center justify-center"
    >
      {/* Soft ambient background aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(192,132,252,0.14),transparent_62%),radial-gradient(circle_at_70%_75%,rgba(244,63,94,0.1),transparent_55%)]"
      />

      {/* Diwali / Wedding-style Fireworks in Background Sky (10s) */}
      <FireworksBackdrop
        active={true}
        durationMs={10000}
        reducedMotion={reducedMotion}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-12 items-center">
        {/* Left / Top: Progressive Photo Reveal Stage */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="relative w-full max-w-[540px] aspect-[1214/1296] rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-[#230E3E] via-[#341354] to-[#1A092B] shadow-[0_24px_80px_rgba(0,0,0,0.65)] ring-1 ring-amber-200/20">
            {/* Loading Shimmer */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#230E3E] via-[#1B0A30] to-[#2F104A]">
                <div className="w-10 h-10 rounded-full border-2 border-amber-200/30 border-t-amber-300 animate-spin" />
                <p className="mt-3 text-xs tracking-wide text-purple-100/80">
                  Preparing your surprise...
                </p>
              </div>
            )}

            {/* Broken Image Fallback */}
            {imageError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#230E3B] via-[#140724] to-[#2B0C20]">
                <Sparkles className="w-10 h-10 text-amber-300 mb-3" />
                <p className="font-display text-2xl text-amber-100">Happy Birthday, My Queen!</p>
              </div>
            ) : (
              <>
                {/* Soft Dreamy Lavender-Gold Velvet Bokeh Veil (replaces harsh pitch-black void) */}
                <motion.div
                  initial={{ opacity: 0.72, scale: 1.06 }}
                  animate={{
                    opacity: revealStep >= 3 ? 0 : revealStep >= 1 ? 0.38 : 0.72,
                    scale: revealStep >= 1 ? 1.02 : 1.06,
                  }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none"
                >
                  <img
                    src={STAGE2_IMAGE}
                    alt=""
                    referrerPolicy="no-referrer"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover object-center blur-2xl saturate-125 brightness-75"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1D0B36]/80 via-[#2E114D]/45 to-[#160828]/65" />
                </motion.div>

                {/* PART 1 — BACKGROUND REVEAL: Floral arch, neon sign, balloons & fairy lights */}
                <motion.div
                  initial={{ opacity: 0, filter: 'blur(12px) brightness(0.85)' }}
                  animate={
                    revealStep >= 1
                      ? { opacity: 1, filter: 'blur(0px) brightness(1)' }
                      : { opacity: 0, filter: 'blur(12px) brightness(0.85)' }
                  }
                  transition={{ duration: reducedMotion ? 0.2 : 1.75, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                  style={{
                    // Softly feathers out the center figure & lower table while illuminating arch, neon, fairy lights & balloons
                    WebkitMaskImage:
                      'radial-gradient(ellipse 25% 32% at 56% 42%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 54%, rgba(0,0,0,0.96) 96%), linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 52%, rgba(0,0,0,0.08) 72%)',
                    WebkitMaskComposite: 'source-in',
                    maskImage:
                      'radial-gradient(ellipse 25% 32% at 56% 42%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 54%, rgba(0,0,0,0.96) 96%), linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 52%, rgba(0,0,0,0.08) 72%)',
                    maskComposite: 'intersect',
                  }}
                >
                  <img
                    src={STAGE2_IMAGE}
                    alt=""
                    aria-hidden="true"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center"
                  />
                </motion.div>

                {/* PART 2 — TABLE REVEAL: Smooth bottom-to-top curtain with warm champagne shimmer */}
                <motion.div
                  initial={{ opacity: 0, clipPath: 'inset(100% 0% 0% 0%)', filter: 'blur(8px)' }}
                  animate={
                    revealStep >= 2
                      ? { opacity: 1, clipPath: 'inset(54% 0% 0% 0%)', filter: 'blur(0px)' }
                      : { opacity: 0, clipPath: 'inset(100% 0% 0% 0%)', filter: 'blur(8px)' }
                  }
                  transition={{ duration: reducedMotion ? 0.2 : 1.65, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                  style={{
                    WebkitMaskImage:
                      'linear-gradient(to bottom, transparent 52%, rgba(0,0,0,0.85) 63%, black 72%)',
                    maskImage:
                      'linear-gradient(to bottom, transparent 52%, rgba(0,0,0,0.85) 63%, black 72%)',
                  }}
                >
                  <img
                    src={STAGE2_IMAGE}
                    alt=""
                    aria-hidden="true"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center"
                  />
                </motion.div>

                {/* Table Champagne-Gold Light Ribbon during Part 2 */}
                <AnimatePresence>
                  {revealStep === 2 && !reducedMotion && (
                    <motion.div
                      initial={{ opacity: 0, y: '100%' }}
                      animate={{ opacity: [0, 0.85, 0], y: ['95%', '54%'] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.55, ease: 'easeOut' }}
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-amber-200/35 via-rose-300/25 to-transparent blur-md"
                    />
                  )}
                </AnimatePresence>

                {/* PART 3 — GIRL PHOTO REVEAL: Silky luminous radial bloom + gentle scale settle */}
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: reducedMotion ? 1 : 0.97,
                    filter: 'blur(10px) brightness(1.06)',
                    clipPath: 'circle(0% at 56% 40%)',
                  }}
                  animate={
                    revealStep >= 3
                      ? {
                          opacity: 1,
                          scale: 1,
                          filter: 'blur(0px) brightness(1)',
                          clipPath: 'circle(96% at 56% 40%)',
                        }
                      : {
                          opacity: 0,
                          scale: reducedMotion ? 1 : 0.97,
                          filter: 'blur(10px) brightness(1.06)',
                          clipPath: 'circle(0% at 56% 40%)',
                        }
                  }
                  transition={{ duration: reducedMotion ? 0.25 : 1.85, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  <img
                    src={STAGE2_IMAGE}
                    alt="Birthday girl in a lavender floral princess dress behind her birthday cake"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center"
                  />
                </motion.div>

                {/* Subtle romantic vignette framing */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 bg-gradient-to-t from-[#07040F]/45 via-transparent to-transparent"
                />

                {/* Golden particles during Part 1+ and floating hearts during Part 3+ (kept off her face) */}
                {revealStep >= 1 && (
                  <RomanticParticles
                    showSparkles={true}
                    showHearts={revealStep >= 3}
                    sparkleCount={revealStep >= 2 ? 18 : 12}
                    heartCount={9}
                    reducedMotion={reducedMotion}
                    intensity={revealStep >= 3 ? 'bright' : 'soft'}
                    excludeZone={{ leftPct: 38, rightPct: 76, topPct: 12, bottomPct: 58 }}
                  />
                )}
              </>
            )}
          </div>

          {/* Quiet progress cue while progressive reveal plays */}
          <AnimatePresence>
            {revealStep > 0 && revealStep < 4 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-xs tracking-wide text-purple-200/75 text-center"
              >
                {revealStep === 1 && 'Illuminating your celebration...'}
                {revealStep === 2 && 'Setting the birthday table...'}
                {revealStep === 3 && 'Presenting the star of tonight...'}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Right / Bottom: Elegant Animated Birthday Message */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
          <AnimatePresence>
            {revealStep >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-xl"
              >
                <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-amber-100 leading-[1.12] [text-wrap:balance] drop-shadow-[0_4px_24px_rgba(245,197,107,0.22)]">
                  Happy Birthday, My Queen! ❤️
                </h1>

                <div className="mt-5 sm:mt-6 space-y-3 text-base sm:text-lg leading-relaxed text-purple-100/90 font-normal">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    Today is all about you.
                    <br />
                    May your smile always shine brighter than the stars.
                    <br />
                    May every dream in your heart come true.
                    <br />
                    You deserve all the happiness, love, and beautiful moments in this world.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55, duration: 0.6 }}
                    className="pt-2 font-display italic text-2xl sm:text-3xl text-rose-200"
                  >
                    Keep smiling, my love. ❤️
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                  className="mt-8 flex justify-center lg:justify-start"
                >
                  <button
                    type="button"
                    onClick={handleNext}
                    className="animate-cta-glow min-h-[52px] px-7 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 active:scale-[0.98] text-white font-semibold text-base sm:text-lg tracking-wide border border-amber-200/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  >
                    There&apos;s One More Surprise ✨
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
