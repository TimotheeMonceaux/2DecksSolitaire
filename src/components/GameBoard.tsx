import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/store';
import { getFrontImgUrl, getBackImgUrl } from '../store/deckSlice';

// Scaled down responsive card sizing for laptops/tablets
const CARD_ASPECT = 'w-14 h-20 sm:w-16 sm:h-24 md:w-18 md:h-26 lg:w-20 lg:h-28';

export const GameBoard: React.FC = () => {
  // Store subscriptions
  const tableau = useAppStore((state) => state.tableau);
  const foundations = useAppStore((state) => state.foundations);
  const deckIsEmpty = useAppStore((state) => state.deckIsEmpty);
  const getDeckTopImgUrl = useAppStore((state) => state.getDeckTopImgUrl);
  const draw = useAppStore((state) => state.draw);
  const resetGame = useAppStore((state) => state.resetGame);

  // Undo / Redo accessors
  const history = useAppStore((state) => state.history);
  const undo = useAppStore((state) => (state as any).undo);
  const redo = useAppStore((state) => (state as any).redo);
  const canUndo = history && history.length > 0;
  const canRedo = false;

  const topDeckImg = getDeckTopImgUrl();

  return (
    <div className="relative w-full h-screen max-w-[1400px] mx-auto p-3 flex flex-col justify-between select-none">
      
      {/* MAIN PLAY AREA: Left Tableau + Right Panel (Foundations + Deck) */}
      <div className="flex-1 flex justify-between gap-3 min-h-0 pt-1">
        
        {/* TABLEAU (Takes up ~85% width) */}
        <div className="flex-1 flex justify-start items-start gap-1 sm:gap-2 overflow-x-auto min-h-0">
          {tableau.map((col, colIdx) => (
            <div
              key={`col-${colIdx}`}
              className={`relative flex-1 ${CARD_ASPECT} min-w-[56px] sm:min-w-[64px] h-full`}
            >
              {/* Empty Column Placeholder */}
              <div className="absolute inset-x-0 top-0 h-20 sm:h-24 md:h-26 lg:h-28 rounded-md sm:rounded-lg border-2 border-dashed border-white/15 bg-black/10" />

              {/* Stacked Cards */}
              {col.map((card, cardIdx) => {
                const imgUrl = card.isFaceUp ? getFrontImgUrl(card) : getBackImgUrl(card);
                return (
                  <motion.div
                    key={card.id}
                    layoutId={`card-${card.id}`} // Matches DealingAnimation layoutId
                    style={{
                        zIndex: cardIdx,
                        top: cardIdx * 28, // Use top instead of inline transform 'y' for stability across layout handoffs
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className={`absolute inset-x-0 ${CARD_ASPECT} rounded-md sm:rounded-lg shadow-md border border-black/20 overflow-hidden bg-white cursor-pointer`}
                    >
                    <img
                      src={imgUrl}
                      alt={card.isFaceUp ? `${card.rank} of ${card.suit}` : 'Card back'}
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>

        {/* RIGHT SIDE PANEL: Foundations (Top) + Stock Deck (Centered Below) */}
        <div className="flex flex-col items-center gap-4">
          
          {/* FOUNDATIONS (4 Rows x 2 Columns) */}
          <div className="grid grid-cols-2 grid-rows-4 gap-1.5 sm:gap-2 bg-black/25 p-2 rounded-xl backdrop-blur-sm border border-white/10 shadow-lg">
            {foundations.map((pile, pileIdx) => {
              const topCard = pile.length > 0 ? pile[pile.length - 1] : null;

              return (
                <div
                  key={`foundation-${pileIdx}`}
                  className={`relative ${CARD_ASPECT} rounded-md sm:rounded-lg border-2 border-dashed border-white/20 bg-emerald-950/20 flex items-center justify-center shadow-inner`}
                >
                  {!topCard && (
                    <span className="text-white/20 font-bold text-xs">A</span>
                  )}

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
                </div>
              );
            })}
          </div>

          {/* STOCK DECK: Centered under Foundations */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-white/50 tracking-wider uppercase">
              Deck
            </span>
            <div className="relative">
              {/* Empty Deck Placeholder */}
              <div className={`${CARD_ASPECT} rounded-md sm:rounded-lg border-2 border-dashed border-white/20 bg-black/20 flex items-center justify-center`}>
                <span className="text-white/30 text-[10px] sm:text-xs font-semibold">Empty</span>
              </div>

              {/* Active Stock Deck */}
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

      {/* BOTTOM BAR: Centered Control Panel */}
      <div className="relative w-full h-12 flex items-center justify-center z-20 mt-2">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-2xl">
          <button
            onClick={() => undo?.()}
            disabled={!canUndo}
            className="px-3 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white transition-all shadow-md active:scale-95"
          >
            Annuler
          </button>

          <button
            onClick={() => redo?.()}
            disabled={!canRedo}
            className="px-3 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-all shadow-md active:scale-95"
          >
            Refaire
          </button>

          <div className="h-4 w-px bg-white/20 mx-0.5" />

          <button
            onClick={() => resetGame()}
            className="px-3 py-1 text-xs font-semibold rounded-md bg-rose-600/80 hover:bg-rose-500 text-white transition-all shadow-md active:scale-95"
          >
            Recommencer
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;