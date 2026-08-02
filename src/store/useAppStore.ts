import { create } from 'zustand';
import { createGameStateSlice, type GameStateSlice } from './gameStateSlice';
import { createDeckSlice, type DeckSlice } from './deckSlice';

export type AppState = GameStateSlice & DeckSlice;

export const useAppStore = create<AppState>()((...args) => ({
  ...createGameStateSlice(...args),
  ...createDeckSlice(...args)
}));