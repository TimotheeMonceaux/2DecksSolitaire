import { create } from 'zustand';
import { createGameStateSlice, type GameStateSlice } from './gameStateSlice';
import { createDeckSlice, type DeckSlice } from './deckSlice';
import { createPlayStateSlice, type PlayStateSlice } from './playStateSlice';


export type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
export type Rank = 'Ace' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'Jack' | 'Queen' | 'King';
export type CardDeck = 'Red' | 'Blue';

export interface Card {
  id: number;
  suit: Suit;
  rank: Rank;
  deck: CardDeck;
  isFaceUp: boolean;
}

export type AppState = GameStateSlice & DeckSlice & PlayStateSlice;

export const useAppStore = create<AppState>()((...args) => ({
  ...createGameStateSlice(...args),
  ...createDeckSlice(...args),
  ...createPlayStateSlice(...args)
}));