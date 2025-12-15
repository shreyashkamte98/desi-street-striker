import React, { useEffect, useState } from 'react';
import { GameState, GameStats } from '../types';
import { Play, RotateCcw, Trophy, Zap, Wind } from 'lucide-react';
import { generateCommentary } from '../services/geminiService';

interface OverlayProps {
  gameState: GameState;
  stats: GameStats;
  onStart: () => void;
  onRestart: () => void;
}

const OverlayUI: React.FC<OverlayProps> = ({ gameState, stats, onStart, onRestart }) => {
  const [commentary, setCommentary] = useState<string>("");
  const [loadingCommentary, setLoadingCommentary] = useState(false);

  useEffect(() => {
    if (gameState === GameState.GAME_OVER) {
        setLoadingCommentary(true);
        generateCommentary(stats.score, stats.stylePoints)
            .then(text => {
                setCommentary(text);
                setLoadingCommentary(false);
            });
    }
  }, [gameState, stats]);

  if (gameState === GameState.PLAYING) {
    return (
      <div className="absolute top-0 left-0 w-full p-4 pointer-events-none flex justify-between items-start">
        <div className="flex flex-col gap-2">
            <div className="bg-black/50 backdrop-blur-md rounded-lg p-3 text-white border border-white/10">
                <div className="text-4xl font-bold font-[Teko] text-orange-400">{stats.score}</div>
                <div className="text-xs uppercase tracking-wider text-gray-300">GOALS</div>
            </div>
            {stats.combo > 1 && (
                 <div className="bg-yellow-500/80 rounded px-2 py-1 text-black font-bold animate-pulse">
                    {stats.combo}x COMBO!
                 </div>
            )}
        </div>
        
        <div className="flex flex-col items-end gap-2">
             <div className="bg-black/50 backdrop-blur-md rounded-lg p-2 flex items-center gap-2 text-cyan-300 border border-white/10">
                <Zap size={16} />
                <span className="font-bold">{stats.stylePoints}</span>
             </div>
             {/* Mock Wind Indicator */}
             <div className="bg-black/50 rounded-full p-2 text-gray-400">
                <Wind size={20} className={stats.score > 3 ? "animate-pulse text-red-400" : ""} />
             </div>
        </div>
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
    return (
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-50 p-6 text-center">
        <h2 className="text-6xl font-[Teko] text-red-500 mb-2 drop-shadow-lg">GAME OVER</h2>
        
        <div className="bg-gray-800/80 p-6 rounded-2xl border border-gray-700 w-full max-w-sm mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                    <p className="text-gray-400 text-sm">SCORE</p>
                    <p className="text-3xl font-bold">{stats.score}</p>
                </div>
                <div className="text-center">
                    <p className="text-gray-400 text-sm">STYLE</p>
                    <p className="text-3xl font-bold text-yellow-400">{stats.stylePoints}</p>
                </div>
            </div>
            
            <div className="border-t border-gray-700 pt-4 min-h-[60px]">
                {loadingCommentary ? (
                    <p className="text-xs animate-pulse text-gray-500">Asking the third umpire...</p>
                ) : (
                    <p className="text-lg italic text-green-300">"{commentary}"</p>
                )}
            </div>
        </div>

        <button 
            onClick={onRestart}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-full text-xl font-bold transition-transform active:scale-95 shadow-lg shadow-orange-900/50"
        >
          <RotateCcw size={24} /> RETRY
        </button>
      </div>
    );
  }

  // MAIN MENU
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-orange-900 to-black text-white z-50">
      <div className="text-center mb-10">
          <h1 className="text-7xl font-[Teko] text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            DESI STREET
          </h1>
          <h2 className="text-5xl font-[Teko] text-white tracking-widest -mt-4">STRIKER</h2>
      </div>

      <div className="space-y-4 w-64">
        <button 
            onClick={onStart}
            className="w-full flex justify-center items-center gap-3 bg-white text-orange-900 px-6 py-4 rounded-xl text-2xl font-bold hover:bg-gray-100 transition-all shadow-xl active:scale-95"
        >
           <Play fill="currentColor" /> PLAY
        </button>
        
        <div className="bg-white/10 rounded-xl p-4 text-center">
            <h3 className="text-orange-300 font-bold mb-2 flex items-center justify-center gap-2"><Trophy size={16}/> HOW TO PLAY</h3>
            <ul className="text-sm text-gray-300 text-left space-y-1 list-disc pl-4">
                <li>Tap to <strong>LIFT</strong></li>
                <li>Hold & Release to <strong>SHOOT</strong></li>
                <li>Swipe L/R to <strong>CURVE</strong></li>
                <li>Swipe Down to <strong>DIP</strong></li>
            </ul>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-xs text-gray-500">
        High Score: {localStorage.getItem('dss_highscore') || 0}
      </div>
    </div>
  );
};

export default OverlayUI;
