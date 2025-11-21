import React from 'react';
import { GameStats, VocabPair } from '../types';

interface GameResultProps {
  stats: GameStats;
  difficultWords: VocabPair[];
  onRestart: () => void;
}

export const GameResult: React.FC<GameResultProps> = ({ stats, difficultWords, onRestart }) => {
  const accuracy = stats.correct + stats.incorrect > 0 
    ? Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100) 
    : 0;

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-900/90 border border-slate-700 rounded-3xl p-8 shadow-2xl backdrop-blur-xl animate-fade-in">
      <h2 className="text-3xl font-bold text-white text-center mb-8">Session Complete</h2>
      
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
          <p className="text-slate-400 text-sm uppercase tracking-wider">WPM</p>
          <p className="text-4xl font-bold text-cyan-400">{stats.wpm}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
          <p className="text-slate-400 text-sm uppercase tracking-wider">Accuracy</p>
          <p className={`text-4xl font-bold ${accuracy >= 90 ? 'text-green-400' : 'text-yellow-400'}`}>
            {accuracy}%
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
          <p className="text-slate-400 text-sm uppercase tracking-wider">Best Streak</p>
          <p className="text-4xl font-bold text-purple-400">{stats.maxStreak}</p>
        </div>
      </div>

      {difficultWords.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            Words to Review
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {difficultWords.map((word) => (
              <div key={word.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-red-500/20">
                <span className="text-slate-200 font-medium">{word.chinese}</span>
                <span className="text-slate-400">{word.english}</span>
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                  {word.errorCount} misses
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onRestart}
        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-lg transition-all shadow-lg shadow-cyan-500/25 transform hover:scale-[1.02]"
      >
        Play Again
      </button>
    </div>
  );
};
