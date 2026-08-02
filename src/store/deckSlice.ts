
import type { StateCreator } from 'zustand';
import type { AppState } from './useAppStore';

type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
type Rank = 'Ace' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'Jack' | 'Queen' | 'King';
type CardDeck = 'Red' | 'Blue';

export interface Card {
  id: number;
  suit: Suit;
  rank: Rank;
  deck: CardDeck;
  isFaceUp: boolean;
}

export interface DeckSlice {
  deckIndex: number;
  deck: number[];
  deckIsEmpty: boolean;
  draw: (faceUp: boolean) => Card | null;
}

const getSuitFromId: (id: number) => Suit = (id) => {
  let res = Math.floor(id / 2) % 4;
  switch (res) {
    case 0: return 'Hearts';
    case 1: return 'Diamonds';
    case 2: return 'Clubs';
    default: return 'Spades';
  }
}

const getRankFromId: (id: number) => Rank = (id) => {
  let res = Math.floor(id / 8);
  switch (res) {
    case 0: return 'Ace';
    case 1: return '2';
    case 2: return '3';
    case 3: return '4';
    case 4: return '5';
    case 5: return '6';
    case 6: return '7';
    case 7: return '8';
    case 8: return '9';
    case 9: return '10';
    case 10: return 'Jack';
    case 11: return 'Queen';
    default: return 'King';
  }
}

const getCardDeckFromId: (id: number) => CardDeck = (id) => (id % 2 === 0 ? 'Red' : 'Blue');

export const getFrontImgUrl: (card: Card) => string = (card) => `public/cards/${card.rank}_of_${card.suit}.svg`;
export const getBackImgUrl: (card: Card) => string = (card) => `public/cards/Card_back_${card.deck}.svg`;

const getCardFromId: (id: number, faceUp: boolean) => Card | null = (id, faceUp) => {
  if (!Number.isInteger(id) || id < 0 || id >= 104) return null;
  return {
    id: id,
    suit: getSuitFromId(id),
    rank: getRankFromId(id),
    deck: getCardDeckFromId(id),
    isFaceUp: faceUp
  }
};

const createAndShuffleDeck: () => number[] = () => Array.from({ length: 104 }, (_, i) => i).sort((a, b) => 0.5 - Math.random())

export const createDeckSlice: StateCreator<AppState, [], [], DeckSlice> = (set, get) => ({
  deckIndex: 0,
  deck: createAndShuffleDeck(),
  deckIsEmpty: false,
  draw: (faceUp = true) => {
    if (get().deckIsEmpty) return null;
    let ix = get().deckIndex;
    let card = getCardFromId(get().deck[ix++], faceUp);
    set({deckIndex: ix, deckIsEmpty: ix >= 104});
    return card;
  }
});
