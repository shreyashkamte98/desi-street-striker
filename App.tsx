import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import OverlayUI from './components/OverlayUI';
import { GameState, GameStats } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: parseInt(localStorage.getItem('dss_highscore') || '0'),
    combo: 0,
    stylePoints: 0
  });

  const startGame = () => {
    setGameState(GameState.PLAYING);
    setStats(prev => ({ ...prev, score: 0, combo: 0, stylePoints: 0 }));
  };

  const handleGameOver = (finalStats: GameStats) => {
    setGameState(GameState.GAME_OVER);
    
    // Update High Score
    if (finalStats.score > stats.highScore) {
      localStorage.setItem('dss_highscore', finalStats.score.toString());
      setStats({ ...finalStats, highScore: finalStats.score });
    } else {
      setStats(finalStats);
    }
  };

  const handleScoreUpdate = (score: number, combo: number, style: number) => {
    setStats(prev => ({
        ...prev,
        score,
        combo,
        stylePoints: style
    }));
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none">
      <GameCanvas 
        isPlaying={gameState === GameState.PLAYING}
        onGameOver={handleGameOver}
        onScoreUpdate={handleScoreUpdate}
      />
      
      <OverlayUI 
        gameState={gameState}
        stats={stats}
        onStart={startGame}
        onRestart={startGame}
      />
    </div>
  );
};

export default App;
