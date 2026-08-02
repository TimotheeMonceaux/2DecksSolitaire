import type { StateCreator } from 'zustand';
import type { AppState, Card } from './store';
import { isValidFoundationMove, isValidTableauMove } from './gameRules';

export interface MoveSource {
  type: 'tableau' | 'waste' | 'foundation';
  colIndex?: number;
  cardIndex?: number;
}

export interface MoveTarget {
  type: 'tableau' | 'foundation';
  index: number; // Column or Foundation pile index
}

export interface PlayStateSlice {
  foundations: Card[][];
  tableau: Card[][];
  history: { tableau: Card[][]; foundations: Card[][] }[];
  moveCards: (source: MoveSource, target: MoveTarget) => boolean;
  //autoRevealTopCards: () => void;
  undo: () => void;
  initialSetup: () => void;
}

export const createPlayStateSlice: StateCreator<AppState, [], [], PlayStateSlice> = (set, get) => ({
  foundations: Array.from({ length: 8 }, () => []),
  tableau: Array.from({ length: 10 }, () => []),
  history: [],
  moveCards: (source, target) => {
    const state = get();
    // 1. Extract moving card stack
    let movingCards: Card[] = [];
    if (source.type === 'tableau' && source.colIndex !== undefined && source.cardIndex !== undefined) {
      movingCards = state.tableau[source.colIndex].slice(source.cardIndex);
    }

    if (movingCards.length === 0) return false;

    // 2. Validate move target
    let isValid = false;
    if (target.type === 'tableau') {
      isValid = isValidTableauMove(movingCards, state.tableau[target.index]);
    } else if (target.type === 'foundation' && movingCards.length === 1) {
      isValid = isValidFoundationMove(movingCards[0], state.foundations[target.index]);
    }

    if (!isValid) return false;

    // 3. Save Deep Snapshot for Undo
    const historySnapshot = {
      tableau: JSON.parse(JSON.stringify(state.tableau)),
      foundations: JSON.parse(JSON.stringify(state.foundations)),
    };

    // 4. Apply Move
    const newTableau = state.tableau.map(col => [...col]);
    const newFoundations = state.foundations.map(pile => [...pile]);

    if (source.type === 'tableau' && source.colIndex !== undefined) {
      // Remove cards from origin column
      newTableau[source.colIndex] = newTableau[source.colIndex].slice(0, source.cardIndex);
      
      // Auto-flip the new exposed top card if it's face down
      const originCol = newTableau[source.colIndex];
      if (originCol.length > 0 && !originCol[originCol.length - 1].isFaceUp) {
        originCol[originCol.length - 1].isFaceUp = true;
      }
    }

    if (target.type === 'tableau') {
      newTableau[target.index].push(...movingCards);
    } else if (target.type === 'foundation') {
      newFoundations[target.index].push(...movingCards);
    }

    set({
      tableau: newTableau,
      foundations: newFoundations,
      history: [...state.history, historySnapshot],
    });

    return true;
  },

  undo: () => {
    const { history } = get();
    if (history.length === 0) return;

    const previousState = history[history.length - 1];
    set({
      tableau: previousState.tableau,
      foundations: previousState.foundations,
      history: history.slice(0, -1),
    });
  },
  initialSetup: () => 
  {
    // 1. Reset deck back to initial shuffled state
    get().resetAndShuffleDeck();

    // 2. Prepare 10 empty columns for tableau
    const newTableau: Card[][] = Array.from({ length: 10 }, () => []);

    // 3. Build pyramid row by row
    // Row 0 has 10 cards (cols 0..9), Row 1 has 9 cards (cols 0..8), ..., Row 9 has 1 card (col 0)
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10 - r; c++) {
        // (r + c) parity handles alternating orientation:
        // Row 0 (r=0): c=0 (Even -> Face Down), c=1 (Odd -> Face Up), ...
        // Row 1 (r=1): c=0 (Odd -> Face Up),   c=1 (Even -> Face Down), ...
        const isFaceUp = (r + c) % 2 === 1;

        const drawnCard = get().draw(isFaceUp);
        if (drawnCard) {
          newTableau[c].push(drawnCard);
        }
      }
    }

    // 4. Update the state (reset foundations & history as well)
    set({
      tableau: newTableau,
      foundations: Array.from({ length: 8 }, () => []),
      history: []
    });
  }
});