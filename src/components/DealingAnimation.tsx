import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useAppStore } from '../store/store';
import { getFrontImgUrl, getBackImgUrl } from '../store/deckSlice';
import type { Card } from '../store/store';

const CARD_ASPECT = 'w-14 h-20 sm:w-16 sm:h-24 md:w-18 md:h-26 lg:w-20 lg:h-28';

interface DealingAnimationProps {
  tableau: Card[][];
  onComplete: () => void;
}

interface DealingCard {
  id: string;
  card: Card;
  targetCol: number;
  targetRow: number;
  isFaceUp: boolean;
  dealOrder: number;
}

export const DealingAnimation: React.FC<DealingAnimationProps> = ({
  tableau,
  onComplete,
}) => {
  const controls = useAnimation();
  const getDeckTopImgUrl = useAppStore((state) => state.getDeckTopImgUrl);
  const foundations = useAppStore((state) => state.foundations);
  const topDeckImg = getDeckTopImgUrl();

  const stockRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [offsets, setOffsets] = useState<{ [key: string]: { x: number; y: number } }>({});

  // Flatten tableau cards into sequential dealing order
  const cardsToDeal: DealingCard[] = [];
  let orderCounter = 0;

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const card = tableau[c]?.[r];
      if (card) {
        cardsToDeal.push({
          id: `deal-card-${card.id}`,
          card,
          targetCol: c,
          targetRow: r,
          isFaceUp: card.isFaceUp,
          dealOrder: orderCounter++,
        });
      }
    }
  }

  // Calculate pixel-accurate offsets between Stock Deck and Tableau Columns
  useLayoutEffect(() => {
    if (!stockRef.current) return;
    const stockRect = stockRef.current.getBoundingClientRect();
    const calculatedOffsets: { [key: string]: { x: number; y: number } } = {};

    cardsToDeal.forEach((item) => {
      const colEl = colRefs.current[item.targetCol];
      if (colEl) {
        const colRect = colEl.getBoundingClientRect();
        // Calculate relative position from Stock to Tableau slot + stacked row offset
        calculatedOffsets[item.id] = {
          x: colRect.left - stockRect.left,
          y: colRect.top - stockRect.top + item.targetRow * 28,
        };
      }
    });

    setOffsets(calculatedOffsets);
  }, [tableau]);

  useEffect(() => {
    let isMounted = true;

    const runSequence = async () => {
      // PHASE 1: Deck glides into the real Stock position
      await controls.start('moveToStock');

      if (!isMounted) return;

      // PHASE 2: Deal cards accurately onto the tableau columns
      await controls.start((custom: DealingCard) => {
        if (!custom || !offsets[custom.id]) return {};

        const delay = custom.dealOrder * 0.035;
        const targetOffset = offsets[custom.id];

        return {
          x: targetOffset.x,
          y: targetOffset.y,
          rotateY: custom.isFaceUp ? 180 : 0,
          opacity: 1,
          transition: {
            delay,
            duration: 0.32,
            ease: [0.25, 1, 0.5, 1],
          },
        };
      });

      if (isMounted) {
        setTimeout(() => {
          if (isMounted) onComplete();
        }, 150);
      }
    };

    if (Object.keys(offsets).length > 0) {
      runSequence();
    }

    return () => {
      isMounted = false;
    };
  }, [controls, offsets, onComplete]);

  return (
    <div className="relative w-full h-screen max-w-[1400px] mx-auto p-3 flex flex-col justify-between select-none overflow-hidden">
      
      {/* MAIN PLAY AREA MATCHING GAMEBOARD */}
      <div className="flex-1 flex justify-between gap-3 min-h-0 pt-1">
        
        {/* TABLEAU TARGET SLOTS */}
        <div className="flex-1 flex justify-start items-start gap-1 sm:gap-2 overflow-x-auto min-h-0">
          {Array.from({ length: 10 }).map((_, colIdx) => (
            <div
              key={`deal-col-${colIdx}`}
              ref={(el) => (colRefs.current[colIdx] = el)}
              className={`relative flex-1 ${CARD_ASPECT} min-w-[56px] sm:min-w-[64px] h-full`}
            >
              <div className="absolute inset-x-0 top-0 h-20 sm:h-24 md:h-26 lg:h-28 rounded-md sm:rounded-lg border-2 border-dashed border-white/15 bg-black/10" />
            </div>
          ))}
        </div>

        {/* RIGHT SIDE PANEL: FOUNDATIONS + STOCK DECK */}
        <div className="flex flex-col items-center gap-4">
          
          {/* FOUNDATIONS (4 Rows x 2 Columns) */}
          <div className="grid grid-cols-2 grid-rows-4 gap-1.5 sm:gap-2 bg-black/25 p-2 rounded-xl backdrop-blur-sm border border-white/10 shadow-lg">
            {foundations.map((_, pileIdx) => (
              <div
                key={`foundation-slot-${pileIdx}`}
                className={`relative ${CARD_ASPECT} rounded-md sm:rounded-lg border-2 border-dashed border-white/20 bg-emerald-950/20 flex items-center justify-center shadow-inner`}
              >
                <span className="text-white/20 font-bold text-xs">A</span>
              </div>
            ))}
          </div>

          {/* STOCK DECK ANCHOR */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-white/50 tracking-wider uppercase">
              Pioche
            </span>
            <div ref={stockRef} className="relative">
              {/* Empty Deck Container Base */}
              <div className={`${CARD_ASPECT} rounded-md sm:rounded-lg border-2 border-dashed border-white/20 bg-black/20 flex items-center justify-center`}>
                <span className="text-white/30 text-[10px] sm:text-xs font-semibold">Empty</span>
              </div>

              {/* Deck Stack Gliding into place */}
              <motion.div
                initial={{ x: '-30vw', y: '-30vh', scale: 1.15 }}
                animate={controls}
                variants={{
                  moveToStock: {
                    x: 0,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.5, ease: 'easeInOut' },
                  },
                }}
                className={`absolute inset-0 ${CARD_ASPECT} rounded-md sm:rounded-lg shadow-xl border border-black/30 overflow-hidden bg-white z-10`}
              >
                {topDeckImg && (
                  <img
                    src={topDeckImg}
                    alt="Stock Deck"
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                )}
              </motion.div>

              {/* Dealing Cards originate directly from the Stock DOM position */}
              {cardsToDeal.map((item) => (
                <motion.div
                  key={item.id}
                  layoutId={`card-${item.card.id}`} // Shared ID with GameBoard
                  custom={item}
                  initial={{ x: '-30vw', y: '-30vh', scale: 1.15, rotateY: 0, opacity: 1 }}
                  animate={controls}
                  variants={{
                    moveToStock: {
                      x: 0,
                      y: 0,
                      scale: 1,
                      transition: { duration: 0.5, ease: 'easeInOut' },
                    },
                  }}
                  style={{ transformStyle: 'preserve-3d', zIndex: item.dealOrder + 20 }}
                  className={`absolute inset-0 ${CARD_ASPECT} rounded-md sm:rounded-lg shadow-md border border-black/20 bg-white`}
                >
                  {/* Card Back */}
                  <div
                    className="absolute inset-0 w-full h-full"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <img
                      src={getBackImgUrl(item.card)}
                      alt="Card back"
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />
                  </div>

                  {/* Card Front */}
                  <div
                    className="absolute inset-0 w-full h-full"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <img
                      src={getFrontImgUrl(item.card)}
                      alt={`${item.card.rank} of ${item.card.suit}`}
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM BAR PLACEHOLDER (For height parity) */}
      <div className="relative w-full h-12 flex items-center justify-center z-20 mt-2 opacity-0 pointer-events-none">
        <div className="px-4 py-2 bg-slate-900">Placeholder</div>
      </div>

    </div>
  );
};

export default DealingAnimation;