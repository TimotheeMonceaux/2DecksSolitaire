import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type Card } from '../store/store';
import { getFrontImgUrl } from '../store/deckSlice';
import { DndContext, type DragStartEvent, type DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors,
    pointerWithin, rectIntersection, getFirstCollision, type CollisionDetection  } from '@dnd-kit/core';
import type { MoveSource, MoveTarget } from '../store/playStateSlice';
import { DraggableCard } from './DraggableCard';
import { DroppableColumn } from './DroppableColumn';
import { DroppableFoundation } from './DroppableFoundation';

const CARD_ASPECT = 'w-14 h-20 sm:w-16 sm:h-24 md:w-18 md:h-26 lg:w-20 lg:h-28';

export const GameBoard: React.FC = () => {
  const tableau = useAppStore((state) => state.tableau);
  const foundations = useAppStore((state) => state.foundations);
  const deckIsEmpty = useAppStore((state) => state.deckIsEmpty);
  const getDeckTopImgUrl = useAppStore((state) => state.getDeckTopImgUrl);
  const draw = useAppStore((state) => state.draw);
  const resetGame = useAppStore((state) => state.resetGame);

  const history = useAppStore((state) => state.history);
  const undo = useAppStore((state) => (state as any).undo);
  const redo = useAppStore((state) => (state as any).redo);
  const canUndo = history && history.length > 0;
  const canRedo = false;

  const topDeckImg = getDeckTopImgUrl();

  const moveCards = useAppStore((state) => state.moveCards);
  const [activeDrag, setActiveDrag] = useState<{ source: MoveSource; cards: Card[] } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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
    // First check if pointer is directly within a droppable target
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    // Fall back to rectangle intersection if pointer detection finds nothing
    return rectIntersection(args);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={customCollisionDetection}>
      <div className="relative w-full h-screen max-w-[1400px] mx-auto p-3 flex flex-col justify-between select-none">
        
        {/* MAIN PLAY AREA */}
        <div className="flex-1 flex justify-between gap-3 min-h-0 pt-1">
          
          {/* TABLEAU */}
          <div className="flex-1 flex justify-start items-start gap-1 sm:gap-2 overflow-x-auto min-h-0">
            {tableau.map((col, colIdx) => (
              <DroppableColumn key={`col-${colIdx}`} colIdx={colIdx} CARD_ASPECT={CARD_ASPECT}>
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
                    {!topCard && <span className="text-white/20 font-bold text-xs">A</span>}

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
                Deck
              </span>
              <div className="relative">
                <div className={`${CARD_ASPECT} rounded-md sm:rounded-lg border-2 border-dashed border-white/20 bg-black/20 flex items-center justify-center`}>
                  <span className="text-white/30 text-[10px] sm:text-xs font-semibold">Empty</span>
                </div>

                {!deckIsEmpty && topDeckImg && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => draw(true)}
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
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM BAR CONTROLS */}
        <div className="relative w-full h-12 flex items-center justify-center z-20 mt-2">
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-2xl">
            <button onClick={() => undo?.()} disabled={!canUndo} className="px-3 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-all shadow-md active:scale-95">
              Annuler
            </button>
            <button onClick={() => redo?.()} disabled={!canRedo} className="px-3 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-all shadow-md active:scale-95">
              Refaire
            </button>
            <div className="h-4 w-px bg-white/20 mx-0.5" />
            <button onClick={() => resetGame()} className="px-3 py-1 text-xs font-semibold rounded-md bg-rose-600/80 hover:bg-rose-500 text-white transition-all shadow-md active:scale-95">
              Recommencer
            </button>
          </div>
        </div>
      </div>

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