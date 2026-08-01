import React from 'react';

const App: React.FC = () => {
  const handleStart = () => {
    // Action will be wired here later
  };

  return (
    <div 
      className="relative min-h-screen w-full flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat selection:bg-emerald-500 selection:text-white"
      style={{ backgroundImage: `url('/mat.png')` }}
    >
      {/* Dark overlay for contrast and depth */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]" />

      {/* Main Container */}
      <main className="relative z-10 flex flex-col items-center max-w-xl mx-4 p-8 sm:p-12 text-center bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl space-y-6">
        
        {/* Decorative Badge */}
        <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 rounded-full shadow-inner">
          Réussite à 2 jeux
        </span>

        {/* Header Section */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight drop-shadow-md">
            Ma Réussite
          </h1>
          <p className="text-base sm:text-lg text-slate-300 font-medium max-w-md mx-auto leading-relaxed">
            Maintenant 100% plus rapide à installer (et à ranger)
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button
            onClick={handleStart}
            className="group relative inline-flex items-center justify-center px-8 py-3.5 text-lg font-bold text-slate-900 bg-emerald-400 rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-300 hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer"
          >
            <span>Commencer</span>
            {/* Hover arrow effect */}
            <svg 
              className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="absolute bottom-4 text-xs text-slate-300/60 z-10">
        Prêt pour le mélange des cartes
      </footer>
    </div>
  );
};

export default App;