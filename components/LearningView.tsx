import React from 'react';
import { VocabPair } from '../types';

interface LearningViewProps {
  vocabList: VocabPair[];
  onStartGame: (mode: 'guided' | 'survival' | 'infinite') => void;
}

export const LearningView: React.FC<LearningViewProps> = ({ vocabList, onStartGame }) => {
  return (
    <div className="w-full max-w-5xl mx-auto p-6 animate-fade-in pb-40">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Study Phase</h2>
        <p className="text-slate-400">Review the vocabulary below. Choose a mode to begin your training.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {vocabList.map((vocab) => (
          <div key={vocab.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all">
            <div className="flex justify-between items-start mb-2">
              <span className="text-3xl font-bold text-white">{vocab.chinese}</span>
              {vocab.partOfSpeech && (
                <span className="text-xs font-mono bg-slate-700 text-slate-300 px-2 py-1 rounded">
                  {vocab.partOfSpeech}
                </span>
              )}
            </div>
            <div className="text-xl text-cyan-400 font-medium">{vocab.english}</div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-black via-black/95 to-transparent flex flex-col md:flex-row justify-center items-center gap-3 z-20">
        <button
          onClick={() => onStartGame('guided')}
          className="w-full md:w-64 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg px-6 py-3 rounded-xl shadow-lg shadow-cyan-500/25 transition-all transform hover:scale-105 flex items-center justify-center gap-3"
        >
          <span className="text-2xl">🛡️</span>
          <div className="text-left">
            <div className="leading-none font-bold">Guided Mode</div>
            <div className="text-[10px] text-cyan-200 font-normal mt-0.5 uppercase tracking-wide">Show Answers First</div>
          </div>
        </button>

        <button
          onClick={() => onStartGame('infinite')}
          className="w-full md:w-64 bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg px-6 py-3 rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:scale-105 flex items-center justify-center gap-3"
        >
          <span className="text-2xl">♾️</span>
          <div className="text-left">
            <div className="leading-none font-bold">Zen Mode</div>
            <div className="text-[10px] text-purple-200 font-normal mt-0.5 uppercase tracking-wide">Infinite Practice</div>
          </div>
        </button>

        <button
          onClick={() => onStartGame('survival')}
          className="w-full md:w-64 bg-red-600 hover:bg-red-500 text-white font-bold text-lg px-6 py-3 rounded-xl shadow-lg shadow-red-500/25 transition-all transform hover:scale-105 flex items-center justify-center gap-3"
        >
          <span className="text-2xl">⚔️</span>
          <div className="text-left">
            <div className="leading-none font-bold">Survival Mode</div>
            <div className="text-[10px] text-red-200 font-normal mt-0.5 uppercase tracking-wide">Quiz Only</div>
          </div>
        </button>
      </div>
    </div>
  );
};