import React from 'react';
import { TopicOption } from '../types';
import { TOPICS } from '../constants';

interface MenuProps {
  onStart: (topic: TopicOption) => void;
  isLoading: boolean;
}

export const Menu: React.FC<MenuProps> = ({ onStart, isLoading }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-6 animate-fade-in">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tight">
          LinguaFlow
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
          Master Chinese-English vocabulary through adaptive typing practice.
          <br/>
          <span className="text-sm text-slate-500">Mistakes are repeated until you master them.</span>
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-cyan-400 animate-pulse">Generating lesson with Gemini AI...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onStart(topic)}
              className="group relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700 p-6 hover:bg-slate-800 hover:border-cyan-500 transition-all duration-300 text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col h-full">
                <span className="text-4xl mb-4 block transform group-hover:scale-110 transition-transform duration-300">{topic.icon}</span>
                <h3 className="text-xl font-bold text-white mb-2">{topic.label}</h3>
                <p className="text-sm text-slate-400 group-hover:text-slate-300">{topic.promptContext}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
