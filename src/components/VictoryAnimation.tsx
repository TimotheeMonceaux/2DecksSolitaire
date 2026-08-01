import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

interface VictoryAnimationProps {
  /** Number of bouncing cards to create (default: 16) */
  cardCount?: number;
}

interface BouncingCard {
  id: string;
  type: 'blue' | 'red';
  // Random start positions (% of screen)
  startX: number;
  startY: number;
  // Keyframe offsets relative to start position
  xOffsets: number[];
  yOffsets: number[];
  rotations: number[];
  duration: number;
}

const BLUE_CARD = '/cards/Card_back_blue.svg';
const RED_CARD = '/cards/Card_back_red.svg';

export const VictoryAnimation: React.FC<VictoryAnimationProps> = ({
  cardCount = 16,
}) => {
  // Fire periodic firework rockets and bursts
  useEffect(() => {
    // 1. Continuous side cannons
    const cannonInterval = setInterval(() => {
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
      });
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
      });
    }, 1500);

    // 2. High sky bursts (center fireworks)
    const fireworkInterval = setInterval(() => {
      confetti({
        particleCount: 80,
        spread: 100,
        startVelocity: 45,
        origin: {
          x: 0.2 + Math.random() * 0.6,
          y: 0.1 + Math.random() * 0.3,
        },
      });
    }, 2000);

    // Initial big burst on mount
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
    });

    return () => {
      clearInterval(cannonInterval);
      clearInterval(fireworkInterval);
    };
  }, []);

  // Generate continuous bouncing paths for each card
  const cards = useMemo<BouncingCard[]>(() => {
    return Array.from({ length: cardCount }).map((_, i) => {
      const isBlue = i % 2 === 0;

      // 4 distinct keyframe bounce points to simulate edge collisions
      const xOffsets = [
        0,
        (Math.random() - 0.5) * 600,
        (Math.random() - 0.5) * 600,
        (Math.random() - 0.5) * 600,
        0,
      ];
      const yOffsets = [
        0,
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 500,
        0,
      ];
      const rotations = [
        0,
        (Math.random() - 0.5) * 720,
        (Math.random() - 0.5) * 720,
        (Math.random() - 0.5) * 720,
        360,
      ];

      return {
        id: `win-card-${i}`,
        type: isBlue ? 'blue' : 'red',
        startX: 10 + Math.random() * 80, // % viewport
        startY: 10 + Math.random() * 80, // % viewport
        xOffsets,
        yOffsets,
        rotations,
        duration: 4 + Math.random() * 4, // 4s to 8s loop times
      };
    });
  }, [cardCount]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm overflow-hidden select-none pointer-events-none">
      {/* 1. Bouncing Cards layer */}
      <div className="absolute inset-0 overflow-hidden">
        {cards.map((card) => {
          const imgSrc = card.type === 'blue' ? BLUE_CARD : RED_CARD;
          return (
            <motion.div
              key={card.id}
              className="absolute w-24 h-36 rounded-lg shadow-2xl border border-white/20 bg-white overflow-hidden"
              style={{
                left: `${card.startX}%`,
                top: `${card.startY}%`,
              }}
              animate={{
                x: card.xOffsets,
                y: card.yOffsets,
                rotate: card.rotations,
                scale: [1, 1.15, 0.9, 1.1, 1],
              }}
              transition={{
                duration: card.duration,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
            >
              <img
                src={imgSrc}
                alt="Bouncing card back"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </motion.div>
          );
        })}
      </div>

      {/* 2. Winning Banner Text */}
      <motion.div
        initial={{ scale: 0, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          damping: 12,
          stiffness: 100,
        }}
        className="relative z-10 text-center px-6"
      >
        <motion.h1
          animate={{
            scale: [1, 1.06, 1],
            textShadow: [
              '0 0 20px rgba(234,179,8,0.5)',
              '0 0 40px rgba(234,179,8,0.9)',
              '0 0 20px rgba(234,179,8,0.5)',
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="text-5xl md:text-7xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-600 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] uppercase"
        >
          FÉLICITATIONS !!
        </motion.h1>
      </motion.div>
    </div>
  );
};