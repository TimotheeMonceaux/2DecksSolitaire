import { create } from 'zustand';
import { createGameStateSlice, type GameStateSlice } from './gameStateSlice';

export type AppState = GameStateSlice; // GameStateSlice & OtherSlice...

export const useAppStore = create<AppState>()((...args) => ({
  ...createGameStateSlice(...args),
}));