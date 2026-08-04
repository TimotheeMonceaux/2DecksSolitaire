import React from 'react';
import { useAppStore } from './store/store';
import HomeOverlay from './components/HomeOverlay';
import { ShuffleAnimation } from './components/ShuffleAnimation';
import { DealingAnimation } from './components/DealingAnimation';
import { VictoryAnimation } from './components/VictoryAnimation';
import { GameBoard } from './components/GameBoard';
import { AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const current = useAppStore((state) => state.currentGameState);
  const setGameState = useAppStore((state) => state.setGameState);
  const initialSetup = useAppStore((state) => state.initialSetup);
  const tableau = useAppStore((state) => state.tableau);

  const handleShuffleComplete = () => {
    // 1. Initialize the board state
    initialSetup();
    // 2. Switch to dealing animation
    setGameState('DEALING');
  };

  return (
    <div 
      className="relative min-h-screen w-full flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat selection:bg-emerald-500 selection:text-white overflow-hidden touch-none"
      style={{ backgroundImage: `url('${import.meta.env.BASE_URL}/mat.png')` }}
    >
      {current === 'INIT' && <HomeOverlay />}
      
      <AnimatePresence mode="wait">
        {current === 'SHUFFLING' && (
          <ShuffleAnimation onComplete={handleShuffleComplete} />
        )}
        
        {current === 'DEALING' && (
          <DealingAnimation 
            tableau={tableau} 
            onComplete={() => setGameState('PLAYING')} 
          />
        )}

        {current === 'PLAYING' && <GameBoard />}
      </AnimatePresence>

      {current === 'WIN' && (
        <VictoryAnimation onPlayAgain={() => setGameState('SHUFFLING')}/>
      )}
    </div>
  );
};

export default App;