// solitaireRules.ts
import { getRankValue, getSuitColor } from './deckSlice';
import type { Card } from './store';

// Check if moving a sequence of cards onto a Tableau column is legal
export const isValidTableauMove = (movingCards: Card[], targetColumn: Card[]): boolean => {
  if (movingCards.length === 0) return false;
  
  // Rule A: Empty columns accept any card
  if (targetColumn.length === 0) return true;

  const topTarget = targetColumn[targetColumn.length - 1];
  const bottomMoving = movingCards[0];

  // Must be face-up
  if (!topTarget.isFaceUp) return false;

  // Rule B: Descending rank (e.g., 8 on 9)
  const isDescending = getRankValue(topTarget.rank) - 1 === getRankValue(bottomMoving.rank);
  
  // Rule C: Alternating suit colors (Red on Black / Black on Red)
  const isOppositeColor = getSuitColor(topTarget.suit) !== getSuitColor(bottomMoving.suit);

  return isDescending && isOppositeColor;
};

// Check if moving a single card to a Foundation pile is legal
export const isValidFoundationMove = (card: Card, targetFoundation: Card[]): boolean => {
  if (targetFoundation.length === 0) {
    // Foundation starting card (Ace)
    return card.rank === 'Ace';
  }

  const topFoundation = targetFoundation[targetFoundation.length - 1];

  // Must match suit & be strictly ascending rank
  return (
    topFoundation.suit === card.suit &&
    getRankValue(topFoundation.rank) + 1 === getRankValue(card.rank)
  );
};

// Validates whether a stack in the tableau can be picked up together
export const isValidSubStack = (cards: Card[]): boolean => {
  for (let i = 0; i < cards.length - 1; i++) {
    const current = cards[i];
    const next = cards[i + 1];
    if (!current.isFaceUp || !next.isFaceUp) return false;
    if (getRankValue(current.rank) - 1 !== getRankValue(next.rank)) return false;
    if (getSuitColor(current.suit) === getSuitColor(next.suit)) return false;
  }
  return true;
};