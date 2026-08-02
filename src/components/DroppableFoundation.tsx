import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableFoundationProps {
  pileIdx: number;
  children: React.ReactNode;
  CARD_ASPECT: string;
}

export const DroppableFoundation: React.FC<DroppableFoundationProps> = ({ pileIdx, children, CARD_ASPECT }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `foundation-${pileIdx}`,
    data: { type: 'foundation', index: pileIdx },
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative ${CARD_ASPECT} rounded-md sm:rounded-lg border-2 border-dashed border-white/20 bg-emerald-950/20 flex items-center justify-center shadow-inner transition-colors ${
        isOver ? 'border-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-400/50' : ''
      }`}
    >
      {children}
    </div>
  );
};