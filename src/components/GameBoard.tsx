import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type Card } from '../store/store';
import { getFrontImgUrl, getBackImgUrl } from '../store/deckSlice';
import {
  DndContext,
  type DragStartEvent,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from '@dnd-kit/core';
import type { MoveSource, MoveTarget } from '../store/playStateSlice';
import { DraggableCard } from './DraggableCard';
import { DroppableColumn } from './DroppableColumn';
import { DroppableFoundation } from './DroppableFoundation';

const CARD_ASPECT = 'w-14 h-20 sm:w-16 sm:h-24 md:w-18 md:h-26 lg:w-20 lg:h-28';

interface FlyingCard {
  card: Card;
  targetCol: number;
  targetRow: number;
  deltaX: number;
  deltaY: number;
}

export const GameBoard: React.FC = () => {
  const tableau = useAppStore((state) => state.tableau);
  const foundations = useAppStore((state) => state.foundations);
  const deckIsEmpty = useAppStore((state) => state.deckIsEmpty);
  const deck = useAppStore((state) => state.deck);
  const deckIndex = useAppStore((state) => state.deckIndex);
  const getDeckTopImgUrl = useAppStore((state) => state.getDeckTopImgUrl);
  const drawRowFromDeck = useAppStore((state) => state.drawRowFromDeck);
  const resetGame = useAppStore((state) => state.resetGame);

  const history = useAppStore((state) => state.history);
  const undo = useAppStore((state) => state.undo);
  const canUndo = history && history.length > 0;

  const topDeckImg = getDeckTopImgUrl();
  const moveCards = useAppStore((state) => state.moveCards);
  const [activeDrag, setActiveDrag] = useState<{ source: MoveSource; cards: Card[] } | null>(null);

  // Modal State
  const [showResetModal, setShowResetModal] = useState(false);

  // Animation Refs & Local State
  const stockRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [flyingCards, setFlyingCards] = useState<FlyingCard[]>([]);
  const [isDealing, setIsDealing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleConfirmReset = () => {
    setShowResetModal(false);
    resetGame();
  };

  const handleDeckClick = () => {
    if (deckIsEmpty || isDealing || !stockRef.current) return;

    setIsDealing(true);

    const stockRect = stockRef.current.getBoundingClientRect();
    const newFlyingCards: FlyingCard[] = [];

    let currentIndex = deckIndex;
    for (let c = 0; c < 10; c++) {
      if (currentIndex >= deck.length) break;

      const cardId = deck[currentIndex];
      const card: Card = {
        id: cardId,
        suit: ['Hearts', 'Diamonds', 'Clubs', 'Spades'][Math.floor(cardId / 2) % 4] as any,
        rank: ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'][Math.floor(cardId / 8)] as any,
        deck: cardId % 2 === 0 ? 'Red' : 'Blue',
        isFaceUp: true,
      };

      const colEl = colRefs.current[c];
      if (colEl) {
        const colRect = colEl.getBoundingClientRect();
        const targetRow = tableau[c].length;

        newFlyingCards.push({
          card,
          targetCol: c,
          targetRow,
          deltaX: colRect.left - stockRect.left,
          deltaY: colRect.top - stockRect.top + targetRow * 28,
        });
      }

      currentIndex++;
    }

    setFlyingCards(newFlyingCards);

    const totalDuration = newFlyingCards.length * 50 + 350;
    setTimeout(() => {
      drawRowFromDeck();
      setFlyingCards([]);
      setIsDealing(false);
    }, totalDuration);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const currentData = active.data.current as any;
    if (currentData) {
      setActiveDrag({
        source: currentData.source,
        cards: currentData.cards || [],
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDrag(null);

    if (!over) return;

    const source = active.data.current?.source as MoveSource;
    const targetData = over.data.current as MoveTarget;

    if (source && targetData) {
      moveCards(source, targetData);
    }
  };

  const customCollisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return rectIntersection(args);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDrag(null)}
      collisionDetection={customCollisionDetection}
    >
      <div className="relative w-full h-screen max-w-[1400px] mx-auto p-3 flex flex-col justify-between select-none">
        {/* MAIN PLAY AREA */}
        <div className="flex-1 flex justify-between gap-3 min-h-0 pt-1">
          {/* TABLEAU */}
          <div className="flex-1 flex justify-start items-start gap-1 sm:gap-2 overflow-x-auto min-h-0">
            {tableau.map((col, colIdx) => (
              <div
                key={`col-anchor-${colIdx}`}
                ref={(el) => (colRefs.current[colIdx] = el)}
                className="relative flex-1 min-w-[56px] sm:min-w-[64px] h-full"
              >
                <DroppableColumn colIdx={colIdx} CARD_ASPECT={CARD_ASPECT}>
                  {col.map((card, cardIdx) => (
                    <DraggableCard
                      key={card.id}
                      card={card}
                      colIndex={colIdx}
                      cardIndex={cardIdx}
                      colCards={col}
                      CARD_ASPECT={CARD_ASPECT}
                    />
                  ))}
                </DroppableColumn>
              </div>
            ))}
          </div>

          {/* RIGHT SIDE PANEL */}
          <div className="flex flex-col items-center gap-4">
            {/* FOUNDATIONS */}
            <div className="grid grid-cols-2 grid-rows-4 gap-1.5 sm:gap-2 bg-black/25 p-2 rounded-xl backdrop-blur-sm border border-white/10 shadow-lg">
              {foundations.map((pile, pileIdx) => {
                const topCard = pile.length > 0 ? pile[pile.length - 1] : null;

                return (
                  <DroppableFoundation key={`foundation-${pileIdx}`} pileIdx={pileIdx} CARD_ASPECT={CARD_ASPECT}>
                    {!topCard && <span className="text-white/20 font-bold text-xs">AS</span>}

                    <AnimatePresence>
                      {topCard && (
                        <motion.img
                          key={topCard.id}
                          layoutId={`card-${topCard.id}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          src={getFrontImgUrl(topCard)}
                          alt={`${topCard.rank} of ${topCard.suit}`}
                          className="absolute inset-0 w-full h-full object-cover rounded-md sm:rounded-lg shadow-md border border-black/30"
                          draggable={false}
                        />
                      )}
                    </AnimatePresence>
                  </DroppableFoundation>
                );
              })}
            </div>

            {/* STOCK DECK */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] sm:text-xs font-semibold text-white/50 tracking-wider uppercase">
                Pioche
              </span>
              <div ref={stockRef} className="relative">
                <div className={`${CARD_ASPECT} rounded-md sm:rounded-lg border-2 border-dashed border-white/20 bg-black/20 flex items-center justify-center`}>
                  <span className="text-white/30 text-[10px] sm:text-xs font-semibold">Empty</span>
                </div>

                {!deckIsEmpty && topDeckImg && (
                  <motion.div
                    whileHover={{ scale: isDealing ? 1 : 1.05 }}
                    whileTap={{ scale: isDealing ? 1 : 0.95 }}
                    onClick={handleDeckClick}
                    className={`absolute inset-0 ${CARD_ASPECT} rounded-md sm:rounded-lg shadow-xl border border-black/30 overflow-hidden cursor-pointer bg-white z-10`}
                  >
                    <img
                      src={topDeckImg}
                      alt="Stock Deck"
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />
                  </motion.div>
                )}

                {/* ANIMATED CARDS FLYING OUT OF STOCK DECK */}
                {flyingCards.map((item, idx) => (
                  <motion.div
                    key={`fly-card-${item.card.id}`}
                    initial={{ x: 0, y: 0, rotateY: 0, opacity: 1 }}
                    animate={{
                      x: item.deltaX,
                      y: item.deltaY,
                      rotateY: 180,
                    }}
                    transition={{
                      delay: idx * 0.05,
                      duration: 0.35,
                      ease: [0.25, 1, 0.5, 1],
                    }}
                    style={{ transformStyle: 'preserve-3d', zIndex: 50 + idx }}
                    className={`absolute inset-0 ${CARD_ASPECT} rounded-md sm:rounded-lg shadow-lg border border-black/20 bg-white pointer-events-none`}
                  >
                    <div
                      className="absolute inset-0 w-full h-full"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <img
                        src={getBackImgUrl(item.card)}
                        alt="Card back"
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    </div>

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
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR CONTROLS */}
        <div className="relative w-full h-12 flex items-center justify-center z-20 mt-2">
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-2xl">
            <button
              onClick={() => undo?.()}
              disabled={!canUndo || isDealing}
              className="px-3 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Annuler
            </button>
            <div className="h-4 w-px bg-white/20 mx-0.5" />
            <button
              onClick={() => setShowResetModal(true)}
              className="px-3 py-1 text-xs font-semibold rounded-md bg-rose-600/80 hover:bg-rose-500 text-white transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Recommencer
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION RESET MODAL */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Modal Box matching HomeOverlay style */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-sm p-6 sm:p-8 text-center bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl space-y-5"
            >
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Recommencer ?
                </h2>
                <p className="text-sm text-slate-300 font-medium leading-relaxed">
                  Êtes-vous sûr de vouloir recommencer la partie&#160;? <br/>
                  Toute votre progression sera perdue.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-white/10 transition-all cursor-pointer active:scale-95"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmReset}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/20 transition-all cursor-pointer active:scale-95"
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DRAG OVERLAY */}
      <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeDrag && (
          <div className="flex flex-col pointer-events-none">
            {activeDrag.cards.map((card, idx) => (
              <div key={card.id} style={{ marginTop: idx > 0 ? -80 : 0 }}>
                <img
                  src={getFrontImgUrl(card)}
                  className={`${CARD_ASPECT} rounded-lg shadow-2xl border border-black/30 bg-white`}
                  alt=""
                />
              </div>
            ))}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default GameBoard;