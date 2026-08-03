import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import type { Card } from '../store/store';
import { getFrontImgUrl, getBackImgUrl } from '../store/deckSlice';
import { isValidSubStack } from '../store/gameRules'; // 1. Import game rule

interface DraggableCardProps {
  card: Card;
  colIndex: number;
  cardIndex: number;
  colCards: Card[];
  CARD_ASPECT: string;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({
  card,
  colIndex,
  cardIndex,
  colCards,
  CARD_ASPECT,
}) => {
  const isFaceUp = card.isFaceUp;
  const imgUrl = isFaceUp ? getFrontImgUrl(card) : getBackImgUrl(card);

  // Get the stack of cards from this card to the bottom of the column
  const movingSubStack = isFaceUp ? colCards.slice(cardIndex) : [];

  // 2. Check if the sub-stack starting from this card is valid to drag
  const isValidDrag = isFaceUp && isValidSubStack(movingSubStack);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `card-${card.id}`,
    disabled: !isValidDrag, // 3. Disable drag if sub-stack sequence is invalid
    data: {
      card,
      colIndex,
      cardIndex,
      cards: movingSubStack,
      source: { type: 'tableau', colIndex, cardIndex },
    },
  });

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      layoutId={!isDragging ? `card-${card.id}` : undefined}
      animate={{ 
        opacity: isDragging ? 0.3 : 1 
      }}
      style={{
        zIndex: cardIndex,
        top: cardIndex * 28,
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`absolute inset-x-0 ${CARD_ASPECT} rounded-md sm:rounded-lg shadow-md border border-black/20 overflow-hidden bg-white ${
        isValidDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
    >
      <img
        src={imgUrl}
        alt={isFaceUp ? `${card.rank} of ${card.suit}` : 'Card back'}
        className="w-full h-full object-cover pointer-events-none select-none"
        draggable={false}
      />
    </motion.div>
  );
};