import type { StateCreator } from 'zustand';
import type { AppState, Card } from './store';

export interface PlayStateSlice {
  foundations: Card[][];
  tableau: Card[][];
  history: PlayStateSlice[];
  initialSetup: () => void;
}

export const createPlayStateSlice: StateCreator<AppState, [], [], PlayStateSlice> = (set, get) => ({
  foundations: Array.from({ length: 8 }, () => []),
  tableau: Array.from({ length: 10 }, () => []),
  history: [],
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