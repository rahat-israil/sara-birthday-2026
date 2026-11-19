/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { ArcheryStage } from './components/ArcheryStage';
import { Stage2Reveal } from './components/Stage2Reveal';
import { Stage3Celebration } from './components/Stage3Celebration';
import { Stage4CakeCutting } from './components/Stage4CakeCutting';
import { soundEngine } from './utils/soundEngine';

type SurpriseStage = 'archery' | 'reveal' | 'celebration' | 'cakeCutting';

export default function App() {
  const [stage, setStage] = useState<SurpriseStage>('archery');
  const [sessionKey, setSessionKey] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  // Sync OS prefers-reduced-motion changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Preload Stage 2 image immediately in background while playing Stage 1
  useEffect(() => {
    const img = new Image();
    img.src = '/assets/aistudio/Dreamy_Lavender_No_1_207947a5.png';
    return () => {
      soundEngine.stopMusicLoop();
    };
  }, []);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
  };

  const handleToggleMotion = () => {
    setReducedMotion((prev) => !prev);
  };

  const handleReplay = () => {
    soundEngine.stopHappyBirthdaySong();
    soundEngine.unlockAndStartMusic();
    setSessionKey((k) => k + 1);
    setStage('archery');
  };

  return (
    <main
      className={`relative min-h-[100dvh] w-full overflow-x-hidden bg-[#07040F] text-[#FAF5FF] ${
        reducedMotion ? 'reduced-motion' : ''
      }`}
    >
      {/* Top-Right Minimal Audio & Reduced Motion Controls */}
      <div className="fixed top-3 right-3 sm:top-5 sm:right-5 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleMotion}
          aria-pressed={reducedMotion}
          aria-label={reducedMotion ? 'Enable full animations' : 'Enable reduced motion'}
          className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-[#130824]/75 hover:bg-[#1E0E36]/90 backdrop-blur-md border border-purple-200/20 text-xs font-medium text-purple-100/90 flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">
            {reducedMotion ? 'Gentle Motion' : 'Full Motion'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleToggleMute}
          aria-pressed={isMuted}
          aria-label={isMuted ? 'Turn music and sound on' : 'Turn music and sound off'}
          className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-[#130824]/75 hover:bg-[#1E0E36]/90 backdrop-blur-md border border-purple-200/20 text-xs font-medium text-purple-100/90 flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-300 shrink-0" />
          ) : (
            <Volume2 className="w-4 h-4 text-amber-300 shrink-0" />
          )}
          <span className="whitespace-nowrap">{isMuted ? 'Music Off' : 'Music On'}</span>
        </button>
      </div>

      {/* 3-Stage Interactive Surprise Journey */}
      <AnimatePresence mode="wait">
        {stage === 'archery' && (
          <motion.div
            key={`stage1-${sessionKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.55 } }}
            transition={{ duration: 0.45 }}
          >
            <ArcheryStage
              reducedMotion={reducedMotion}
              onSuccess={() => setStage('reveal')}
            />
          </motion.div>
        )}

        {stage === 'reveal' && (
          <motion.div
            key={`stage2-${sessionKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.55 } }}
            transition={{ duration: 0.6 }}
          >
            <Stage2Reveal
              reducedMotion={reducedMotion}
              onNext={() => setStage('celebration')}
            />
          </motion.div>
        )}

        {stage === 'celebration' && (
          <motion.div
            key={`stage3-${sessionKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.45 } }}
            transition={{ duration: 0.65 }}
          >
            <Stage3Celebration
              reducedMotion={reducedMotion}
              onNext={() => setStage('cakeCutting')}
            />
          </motion.div>
        )}

        {stage === 'cakeCutting' && (
          <motion.div
            key={`stage4-${sessionKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.45 } }}
            transition={{ duration: 0.65 }}
          >
            <Stage4CakeCutting
              reducedMotion={reducedMotion}
              onReplay={handleReplay}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
