import type { StateCreator } from 'zustand';
import type { AppState } from './store';

type GameState = 'INIT' | 'SHUFFLING' | 'DEALING' | 'PLAYING'| 'WIN';

export interface GameStateSlice {
  currentGameState: GameState;
  setGameState: (item: GameState) => void;
  resetGame: () => void;
  reset: () => void;
}

export const createGameStateSlice: StateCreator<AppState, [], [], GameStateSlice> = (set, get) => ({
  currentGameState: 'INIT',
  setGameState: (item: GameState) => set({ currentGameState: item }),
  resetGame: () => set({ currentGameState: 'SHUFFLING' }),
  reset: () => set({ currentGameState: 'INIT' }),
});