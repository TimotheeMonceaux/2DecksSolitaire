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

// Check if a card is face-up and has AT LEAST ONE face-down card above it in its column
export const isBuriedCard = (colCards: Card[], cardIndex: number): boolean => {
  const card = colCards[cardIndex];
  if (!card || !card.isFaceUp) return false;

  // Search indices 0 to cardIndex - 1 for any face-down card
  return colCards.slice(cardIndex).some((c) => !c.isFaceUp);
};

// Validate exchange eligibility between source and target cards
export const isValidExchange = (sourceCard: Card, targetCard: Card): boolean => {
  if (!sourceCard || !targetCard) return false;
  if (!sourceCard.isFaceUp || !targetCard.isFaceUp) return false;

  const sameRank = sourceCard.rank === targetCard.rank;
  const sameColor = getSuitColor(sourceCard.suit) === getSuitColor(targetCard.suit);
  const differentSuit = sourceCard.suit !== targetCard.suit;

  return sameRank && sameColor && differentSuit;
};

// Updated isValidSubStack or helper for DraggableCard
export const canDragCard = (colCards: Card[], cardIndex: number): boolean => {
  const card = colCards[cardIndex];
  if (!card || !card.isFaceUp) return false;

  // Case 1: Standard Tableau Move (moving this card + all cards below it if it's a valid stack)
  const movingSubStack = colCards.slice(cardIndex);
  if (isValidSubStack(movingSubStack)) return true;

  // Case 2: Exchange Move (dragging ONLY this single buried card)
  // Must be a buried card and MUST be dragged as a single card (cardIndex must be the last card OR we handle single drag)
  if (isBuriedCard(colCards, cardIndex)) return true;

  return false;
};