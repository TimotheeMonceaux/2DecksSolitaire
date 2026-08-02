import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableColumnProps {
  colIdx: number;
  children: React.ReactNode;
  CARD_ASPECT: string;
}

export const DroppableColumn: React.FC<DroppableColumnProps> = ({ colIdx, children, CARD_ASPECT }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `tableau-${colIdx}`,
    data: { type: 'tableau', index: colIdx },
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative flex-1 ${CARD_ASPECT} min-w-[56px] sm:min-w-[64px] h-full transition-colors rounded-md sm:rounded-lg ${
        isOver ? 'ring-2 ring-emerald-400/80 bg-emerald-500/10' : ''
      }`}
    >
      {/* Empty Column Placeholder */}
      <div className="absolute inset-x-0 top-0 h-20 sm:h-24 md:h-26 lg:h-28 rounded-md sm:rounded-lg border-2 border-dashed border-white/15 bg-black/10" />
      {children}
    </div>
  );
};