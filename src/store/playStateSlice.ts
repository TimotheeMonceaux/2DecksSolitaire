// playStateSlice.ts
import type { StateCreator } from 'zustand';
import type { AppState, Card } from './store';
import { isValidFoundationMove, isValidTableauMove, isValidExchange, isBuriedCard, checkWinCondition, isValidSubStackStartingFromKing } from './gameRules';
import { getRankValue } from './deckSlice';

export interface MoveSource {
  type: 'tableau' | 'waste' | 'foundation';
  colIndex?: number;
  cardIndex?: number;
}

export interface MoveTarget {
  type: 'tableau' | 'foundation';
  index: number;
}

export interface PlayStateSlice {
  foundations: Card[][];
  tableau: Card[][];
  history: { tableau: Card[][]; foundations: Card[][]; deckIndex: number }[];
  moveCards: (source: MoveSource, target: MoveTarget) => boolean;
  drawRowFromDeck: () => void;
  undo: () => void;
  autoSendToFoundations: () => void;
  initialSetup: () => void;
}

export const createPlayStateSlice: StateCreator<AppState, [], [], PlayStateSlice> = (set, get) => ({
  foundations: Array.from({ length: 8 }, () => []),
  tableau: Array.from({ length: 10 }, () => []),
  history: [],

  moveCards: (source, target) => {
    const state = get();
    if (source.type !== 'tableau' || source.colIndex === undefined || source.cardIndex === undefined) {
      return false;
    }

    const sourceCol = state.tableau[source.colIndex];
    const sourceCard = sourceCol[source.cardIndex];
    if (!sourceCard) return false;

    // --- 1. CHECK FOR EXCHANGE MOVE ---
    if (target.type === 'tableau') {
      const targetCol = state.tableau[target.index];
      const targetTopIndex = targetCol.length - 1;

      // Make sure we aren't trying to exchange a card with ITSELF (when dragging top card to its own column top)
      const isSamePosition = source.colIndex === target.index && source.cardIndex === targetTopIndex;

      if (!isSamePosition) {
        const targetTopCard = targetCol[targetTopIndex];
        const isSourceBuried = isBuriedCard(sourceCol, source.cardIndex);

        if (isSourceBuried && targetTopCard && isValidExchange(sourceCard, targetTopCard)) {
          // Save history snapshot for Undo
          const historySnapshot = {
            tableau: JSON.parse(JSON.stringify(state.tableau)),
            foundations: JSON.parse(JSON.stringify(state.foundations)),
            deckIndex: state.deckIndex
          };

          const newTableau = state.tableau.map((col) => [...col]);

          // Swap cards in-place (works for both intra-column and inter-column)
          newTableau[source.colIndex][source.cardIndex] = targetTopCard;
          newTableau[target.index][targetTopIndex] = sourceCard;

          set({
            tableau: newTableau,
            history: [...state.history, historySnapshot],
          });

          return true;
        }
      }
    }

    // --- 2. STANDARD MOVE LOGIC ---
    const movingCards = sourceCol.slice(source.cardIndex);
    if (movingCards.length === 0) return false;

    let isValid = false;
    if (target.type === 'tableau') {
      isValid = isValidTableauMove(movingCards, state.tableau[target.index]);
    } else if (target.type === 'foundation' && movingCards.length === 1) {
      isValid = isValidFoundationMove(movingCards[0], state.foundations[target.index]);
    }

    if (!isValid) return false;

    // Save Deep Snapshot for Undo
    const historySnapshot = {
      tableau: JSON.parse(JSON.stringify(state.tableau)),
      foundations: JSON.parse(JSON.stringify(state.foundations)),
      deckIndex: state.deckIndex
    };

    const newTableau = state.tableau.map((col) => [...col]);
    const newFoundations = state.foundations.map((pile) => [...pile]);

    // Remove cards from origin column
    newTableau[source.colIndex] = newTableau[source.colIndex].slice(0, source.cardIndex);

    // Auto-flip newly exposed top card if face down
    const originCol = newTableau[source.colIndex];
    if (originCol.length > 0 && !originCol[originCol.length - 1].isFaceUp) {
      originCol[originCol.length - 1].isFaceUp = true;
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

    // --- 3. CHECK FOR WIN CONDITION ---
    if (target.type === 'foundation') {
      const isWin = checkWinCondition(movingCards[0], newTableau, state.deckIsEmpty);
      if (isWin) {
        state.setGameState('WIN');
      }
    }

    return true;
  },

  autoSendToFoundations: () => {
    const state = get();

    // Check rule: Foundation must have at least one ace (or card) present
    const hasAceInFoundations = state.foundations.some((pile) => pile.length > 0);
    if (!hasAceInFoundations) return;

    const isValidNextFoundationCard = (tCard: Card, fCard: Card): boolean => 
      tCard.suit === fCard.suit && getRankValue(tCard.rank) === getRankValue(fCard.rank) + 1;

    // Save Deep Snapshot for Undo
    const historySnapshot = {
      tableau: JSON.parse(JSON.stringify(state.tableau)),
      foundations: JSON.parse(JSON.stringify(state.foundations)),
      deckIndex: state.deckIndex,
    };

    const newTableau = state.tableau.map((col) => [...col]);
    const newFoundations = state.foundations.map((pile) => [...pile]);

    let movedAny = false;
    let lastMovedCard: Card | null = null;

    // Loop to find and move eligible top tableau cards to foundations
    let madeMove = true;
    while (madeMove) {
      madeMove = false;

      for (let c = 0; c < newTableau.length; c++) {
        const col = newTableau[c];
        if (col.length === 0) continue;

        const topCard = col[col.length - 1];

        // Find a matching foundation pile
        for (let f = 0; f < newFoundations.length; f++) {
          const pile = newFoundations[f];
          
          // If pile is empty, can we place an Ace? (Usually foundations start with Ace)
          const canPlace = pile.length === 0 
            ? topCard.rank === 'Ace' 
            : isValidNextFoundationCard(topCard, pile[pile.length - 1]);

          if (canPlace) {
            // Remove from tableau
            col.pop();

            // Auto-flip newly exposed top card if face down
            if (col.length > 0 && !col[col.length - 1].isFaceUp) {
              col[col.length - 1].isFaceUp = true;
            }

            // Add to foundation
            pile.push(topCard);
            lastMovedCard = topCard;
            movedAny = true;
            madeMove = true;
            break; // Break foundation loop, re-evaluate tableau from start
          }
        }
        if (madeMove) break; // Restart outer scan to prioritize correctly
      }
    }

    if (!movedAny) return;

    set({
      tableau: newTableau,
      foundations: newFoundations,
      history: [...state.history, historySnapshot],
    });

    // Check Win Condition
    if (lastMovedCard) {
      const isWin = checkWinCondition(lastMovedCard, newTableau, state.deckIsEmpty);
      if (isWin) {
        state.setGameState('WIN');
      }
    }
  },

  drawRowFromDeck: () => {
    const state = get();
    if (state.deckIsEmpty) return;

    // Save history snapshot before drawing
    const historySnapshot = {
      tableau: JSON.parse(JSON.stringify(state.tableau)),
      foundations: JSON.parse(JSON.stringify(state.foundations)),
      deckIndex: state.deckIndex
    };

    const newTableau = state.tableau.map((col) => [...col]);

    for (let c = 0; c < 10; c++) {
      if (get().deckIsEmpty) break;
      // If a column is a valid sub-stack of 2+ starting from a king, we do not cover it
      if (isValidSubStackStartingFromKing(newTableau[c])) continue;
      const card = get().draw(true); // Draw 1 face-up card
      if (card) {
        newTableau[c].push(card);
      }
    }

    set({
      tableau: newTableau,
      history: [...state.history, historySnapshot],
    });
  },

  undo: () => {
    const { history } = get();
    if (history.length === 0) return;

    const previousState = history[history.length - 1];
    set({
      tableau: previousState.tableau,
      foundations: previousState.foundations,
      deckIndex: previousState.deckIndex,
      history: history.slice(0, -1),
    });
  },

  initialSetup: () => {
    get().resetAndShuffleDeck();
    const newTableau: Card[][] = Array.from({ length: 10 }, () => []);

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10 - r; c++) {
        const isFaceUp = (r + c) % 2 === 1;
        const drawnCard = get().draw(isFaceUp);
        if (drawnCard) {
          newTableau[c].push(drawnCard);
        }
      }
    }

    set({
      tableau: newTableau,
      foundations: Array.from({ length: 8 }, () => []),
      history: [],
    });
  },
});