import type { StateCreator } from 'zustand';
import type { AppState } from './useAppStore';

type GameState = 'INIT' | 'SHUFFLING' | 'SETUP' | 'WIN';

export interface GameStateSlice {
  currentGameState: GameState;
  setGameState: (item: GameState) => void;
  reset: () => void;
}

export const createGameStateSlice: StateCreator<AppState, [], [], GameStateSlice> = (set, get) => ({
  currentGameState: 'INIT',
  setGameState: (item: GameState) => set({ currentGameState: item }),
  reset: () => set({ currentGameState: 'INIT' }),
});