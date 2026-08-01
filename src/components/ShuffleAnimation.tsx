import React, { useEffect, useMemo } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface ShuffleAnimationProps {
  /** Optional callback fired when the shuffle animation finishes */
  onComplete?: () => void;
  /** Number of cards per deck (default: 15) */
  cardCountPerDeck?: number;
}

interface CardSpec {
  id: string;
  type: 'blue' | 'red';
  index: number; // Position within its initial deck
  finalIndex: number; // Interleaved position in the final stack
}

const BLUE_CARD = '/cards/Card_back_blue.svg';
const RED_CARD = '/cards/Card_back_red.svg';

export const ShuffleAnimation: React.FC<ShuffleAnimationProps> = ({
  onComplete,
  cardCountPerDeck = 15,
}) => {
  const controls = useAnimation();

  // Generate card specs and compute interleaved order once on mount
  const cards = useMemo<CardSpec[]>(() => {
    const list: CardSpec[] = [];
    for (let i = 0; i < cardCountPerDeck; i++) {
      list.push({
        id: `blue-${i}`,
        type: 'blue',
        index: i,
        finalIndex: i * 2,
      });
      list.push({
        id: `red-${i}`,
        type: 'red',
        index: i,
        finalIndex: i * 2 + 1,
      });
    }
    return list;
  }, [cardCountPerDeck]);

  useEffect(() => {
    let isMounted = true;

    const runSequence = async () => {
      // 1. Initial stack -> Split into left & right decks
      await controls.start((card) => {
        const isLeft = card.type === 'blue';
        const targetX = isLeft ? -130 : 130;
        const targetRotateZ = isLeft ? -8 : 8;
        return {
          x: targetX,
          y: card.index * -1.5,
          rotateZ: targetRotateZ,
          rotateY: 0,
          scale: 1,
          transition: { duration: 0.6, ease: 'easeInOut' },
        };
      });

      if (!isMounted) return;

      // 2. Arch up the decks (3D bend in preparation to weave)
      await controls.start((card) => {
        const isLeft = card.type === 'blue';
        return {
          rotateY: isLeft ? 15 : -15,
          rotateZ: isLeft ? -12 : 12,
          y: card.index * -1.5 - 10,
          transition: { duration: 0.3, ease: 'easeOut' },
        };
      });

      if (!isMounted) return;

      // 3. Riffle / Interleave: Drop individual cards rapidly to center
      await controls.start((card) => {
        // Stagger timing derived from final interleaved position
        const delay = card.finalIndex * 0.03;
        return {
          x: 0,
          y: card.finalIndex * -0.8,
          rotateZ: (card.finalIndex % 2 === 0 ? -1 : 1) * (Math.random() * 2),
          rotateY: 0,
          transition: {
            delay,
            duration: 0.25,
            ease: [0.25, 1, 0.5, 1],
          },
        };
      });

      if (!isMounted) return;

      // 4. Square up the merged deck
      await controls.start((card) => ({
        x: 0,
        y: card.finalIndex * -0.6,
        rotateZ: 0,
        rotateY: 0,
        transition: { duration: 0.3, ease: 'easeInOut' },
      }));

      if (isMounted && onComplete) {
        onComplete();
      }
    };

    runSequence();

    return () => {
      isMounted = false;
    };
  }, [controls, onComplete]);

  return (
    <div
      className="relative flex items-center justify-center w-full h-80 overflow-hidden select-none pointer-events-none"
      style={{ perspective: 1000 }}
    >
      <div className="relative w-28 h-40">
        {cards.map((card) => {
          const imgSrc = card.type === 'blue' ? BLUE_CARD : RED_CARD;
          return (
            <motion.div
              key={card.id}
              custom={card}
              animate={controls}
              initial={{ x: 0, y: 0, rotateZ: 0, rotateY: 0, scale: 1 }}
              className="absolute inset-0 rounded-lg shadow-md border border-slate-700/20 bg-white overflow-hidden"
              style={{
                zIndex: card.finalIndex,
                transformStyle: 'preserve-3d',
              }}
            >
              <img
                src={imgSrc}
                alt={`${card.type} card back`}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};