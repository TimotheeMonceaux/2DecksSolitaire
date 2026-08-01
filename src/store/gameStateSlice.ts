import type { StateCreator } from 'zustand';
import type { AppState } from './useAppStore';

type GameState = 'INIT' | 'SHUFFLING' | 'SETUP' | 'WIN';

export interface GameStateSlice {
  current: GameState;
  setGameState: (item: GameState) => void;
  reset: () => void;
}


export const createGameStateSlice: StateCreator<AppState, [], [], GameStateSlice> = (set, get) => ({
  current: 'INIT',
  setGameState: (item: GameState) => set(({current: item })),
  reset: () => set({ current: 'INIT' }),
});