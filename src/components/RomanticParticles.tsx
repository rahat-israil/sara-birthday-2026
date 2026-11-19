import React, { useMemo } from 'react';

interface ExcludeZone {
  leftPct: number;
  rightPct: number;
  topPct: number;
  bottomPct: number;
}

interface RomanticParticlesProps {
  showSparkles?: boolean;
  showHearts?: boolean;
  sparkleCount?: number;
  heartCount?: number;
  reducedMotion?: boolean;
  intensity?: 'soft' | 'bright';
  excludeZone?: ExcludeZone;
}

const DEFAULT_FACE_SAFE_ZONE: ExcludeZone = {
  leftPct: 35,
  rightPct: 80,
  topPct: 8,
  bottomPct: 60,
};

function isInsideZone(x: number, y: number, zone: ExcludeZone): boolean {
  return x >= zone.leftPct && x <= zone.rightPct && y >= zone.topPct && y <= zone.bottomPct;
}

export const RomanticParticles: React.FC<RomanticParticlesProps> = ({
  showSparkles = true,
  showHearts = false,
  sparkleCount = 22,
  heartCount = 12,
  reducedMotion = false,
  intensity = 'soft',
  excludeZone = DEFAULT_FACE_SAFE_ZONE,
}) => {
  const sparkles = useMemo(() => {
    const list: Array<{
      id: number;
      left: string;
      top: string;
      size: number;
      delay: string;
      duration: string;
      isGold: boolean;
    }> = [];
    let seed = 0;
    while (list.length < sparkleCount && seed < sparkleCount * 8) {
      const x = ((seed * 37 + 11) % 92) + 4;
      const y = ((seed * 53 + 7) % 88) + 5;
      seed += 1;
      if (isInsideZone(x, y, excludeZone)) continue;
      list.push({
        id: list.length,
        left: `${x}%`,
        top: `${y}%`,
        size: 6 + (seed % 4) * 3,
        delay: `${((seed * 0.37) % 3.2).toFixed(2)}s`,
        duration: `${(2.1 + (seed % 5) * 0.45).toFixed(2)}s`,
        isGold: seed % 3 !== 0,
      });
    }
    return list;
  }, [sparkleCount, excludeZone]);

  const hearts = useMemo(() => {
    const list: Array<{
      id: number;
      left: string;
      top: string;
      size: number;
      delay: string;
      duration: string;
      color: string;
    }> = [];
    let seed = 0;
    while (list.length < heartCount && seed < heartCount * 8) {
      const x = ((seed * 29 + 8) % 88) + 6;
      // Keep hearts along side edges and lower table border, never floating across her face
      const y = ((seed * 41 + 18) % 72) + 16;
      seed += 1;
      if (isInsideZone(x, y, excludeZone)) continue;
      list.push({
        id: list.length,
        left: `${x}%`,
        top: `${y}%`,
        size: 12 + (seed % 4) * 4,
        delay: `${((seed * 0.45) % 4.0).toFixed(2)}s`,
        duration: `${(3.8 + (seed % 4) * 0.7).toFixed(2)}s`,
        color: seed % 3 === 0 ? '#F472B6' : seed % 3 === 1 ? '#FB7185' : '#C084FC',
      });
    }
    return list;
  }, [heartCount, excludeZone]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10" aria-hidden="true">
      {showSparkles &&
        sparkles.map((sp) => (
          <svg
            key={`sp-${sp.id}`}
            viewBox="0 0 24 24"
            style={{
              left: sp.left,
              top: sp.top,
              width: sp.size,
              height: sp.size,
              animationDelay: sp.delay,
              animationDuration: sp.duration,
              opacity: reducedMotion ? 0.55 : undefined,
            }}
            className={`absolute ${reducedMotion ? '' : 'animate-sparkle-twinkle'} ${
              intensity === 'bright' ? 'drop-shadow-[0_0_8px_rgba(253,230,138,0.9)]' : ''
            }`}
          >
            <path
              d="M12 0C12 7.5 16.5 12 24 12C16.5 12 12 16.5 12 24C12 16.5 7.5 12 0 12C7.5 12 12 7.5 12 0Z"
              fill={sp.isGold ? '#FDE68A' : '#FBCFE8'}
            />
          </svg>
        ))}

      {showHearts &&
        hearts.map((h) => (
          <svg
            key={`ht-${h.id}`}
            viewBox="0 0 24 24"
            style={{
              left: h.left,
              top: h.top,
              width: h.size,
              height: h.size,
              animationDelay: h.delay,
              animationDuration: h.duration,
              opacity: reducedMotion ? 0.55 : undefined,
            }}
            className={`absolute ${reducedMotion ? '' : 'animate-float-heart'} drop-shadow-[0_2px_6px_rgba(244,63,94,0.45)]`}
          >
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill={h.color}
            />
          </svg>
        ))}
    </div>
  );
};
