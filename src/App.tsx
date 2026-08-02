import React from 'react';
import { useAppStore } from './store/useAppStore';
import HomeOverlay from './components/HomeOverlay';
import { ShuffleAnimation } from './components/ShuffleAnimation';
import { VictoryAnimation } from './components/VictoryAnimation';

const App: React.FC = () => {
  const current = useAppStore((state) => state.currentGameState);
  const setGameState = useAppStore((state) => state.setGameState);

  return (
    <div 
      className="relative min-h-screen w-full flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat selection:bg-emerald-500 selection:text-white"
      style={{ backgroundImage: `url('/mat.png')` }}
    >
      {current === 'INIT' && <HomeOverlay />}
      {current === 'SHUFFLING' && <ShuffleAnimation onComplete={() => setGameState('WIN')} />}
      {current === 'WIN' && <VictoryAnimation onPlayAgain={() => setGameState('SHUFFLING')}/>}
    </div>
  );
};

export default App;