import React, { useState, useEffect, useRef } from 'react';
import { QuizItem } from '../types';

interface TypingAreaProps {
  currentItem: QuizItem;
  nextItem: QuizItem | undefined;
  remainingCount: number;
  onInputSubmit: (input: string) => void;
  streak: number;
  round: number;
}

export const TypingArea: React.FC<TypingAreaProps> = ({
  currentItem,
  nextItem,
  remainingCount,
  onInputSubmit,
  streak,
  round
}) => {
  const [input, setInput] = useState('');
  const [isError, setIsError] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus management
  useEffect(() => {
    inputRef.current?.focus();
    const handleBlur = () => {
      setTimeout(() => inputRef.current?.focus(), 100);
    };
    const inputEl = inputRef.current;
    inputEl?.addEventListener('blur', handleBlur);
    return () => inputEl?.removeEventListener('blur', handleBlur);
  }, []);

  // Reset state when item changes
  useEffect(() => {
    setInput('');
    setIsError(false);
    setShowHint(false);
  }, [currentItem.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    setIsError(false);
    
    // Simple partial matching logic
    // For Chinese typing, partial matching is harder, so we mostly skip it or just check length
    if (currentItem.direction === 'zh_to_en') {
        if (!currentItem.answer.startsWith(val.toLowerCase().trim()) && val.length > 0) {
           // Optional: set partial error state visually if needed
        }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (input.trim() === '') return;
      
      // Normalize validation
      const userInput = input.trim().toLowerCase();
      const target = currentItem.answer.toLowerCase();
      
      const correct = userInput === target;
      
      if (correct) {
        onInputSubmit(input);
      } else {
        setIsError(true);
        onInputSubmit(input); // Let parent handle logic, we just show visual error
        // Visual feedback delay before clearing
        setTimeout(() => setInput(''), 400); 
      }
    }
    
    if (e.key === '?') {
       e.preventDefault();
       setShowHint(true);
    }
  };

  const isTypeChinese = currentItem.direction === 'en_to_zh';

  return (
    <div className="w-full max-w-3xl flex flex-col items-center justify-center min-h-[60vh]">
      
      {/* Stats Overlay */}
      <div className="absolute top-4 right-4 flex gap-4 text-sm font-mono text-slate-400">
        <div className="bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700 text-cyan-400">
          Round {round}
        </div>
        <div className="bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700">
          Left: <span className="text-white">{remainingCount}</span>
        </div>
        {streak > 2 && (
          <div className="bg-orange-500/20 px-3 py-1 rounded-lg border border-orange-500/50 text-orange-400 animate-pulse">
            🔥 {streak}
          </div>
        )}
      </div>

      {/* Main Card */}
      <div className="relative w-full bg-slate-800/40 backdrop-blur-sm border border-slate-700 rounded-3xl p-12 flex flex-col items-center gap-8 shadow-2xl transition-all duration-300">
        
        {/* Next Item Preview (Faint) */}
        {nextItem && (
          <div className="absolute -top-12 text-slate-600 font-bold text-xl blur-[1px] select-none pointer-events-none">
            NEXT: {nextItem.question}
          </div>
        )}

        {/* Question Display */}
        <div className="flex flex-col items-center gap-2">
            <div className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-2">
                {isTypeChinese ? "Translate to Chinese" : "Translate to English"}
            </div>
            <h2 className="text-6xl md:text-7xl font-black text-white tracking-wider drop-shadow-lg mb-2 text-center">
                {currentItem.question}
            </h2>
            {currentItem.originalPair.partOfSpeech && (
                <span className="text-slate-500 text-lg italic">({currentItem.originalPair.partOfSpeech})</span>
            )}
        </div>

        {/* Typing Input */}
        <div className={`relative w-full max-w-lg transition-transform duration-100 ${isError ? 'animate-shake' : ''}`}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={`
              w-full bg-transparent text-center text-4xl md:text-5xl font-mono outline-none border-b-4 pb-2 transition-colors duration-300
              placeholder:text-slate-700 placeholder:text-3xl
              ${isError 
                ? 'border-red-500 text-red-400' 
                : input === '' 
                  ? 'border-slate-600' 
                  : 'border-cyan-500 text-cyan-300'
              }
            `}
            placeholder={isTypeChinese ? "輸入中文..." : "Type English..."}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          
          {/* Hint / Error Display */}
          <div className="h-8 mt-4 flex justify-center items-center">
             {isError && (
                 <span className="text-red-400 font-medium tracking-wide animate-fade-in text-lg">
                     {currentItem.answer}
                 </span>
             )}
             {showHint && !isError && (
                 <span className="text-slate-500 font-mono tracking-widest animate-pulse">
                     {isTypeChinese ? currentItem.answer : currentItem.answer.split('').map((char, i) => i < 1 ? char : '_').join(' ')}
                 </span>
             )}
             {!isError && !showHint && (
                 <p className="text-slate-600 text-sm">Press '?' for hint</p>
             )}
          </div>
        </div>

      </div>

      {/* Instructional Text */}
      <div className="mt-12 text-slate-500 text-sm font-mono">
        {isTypeChinese ? (
            <span>Type the exact Chinese translation</span>
        ) : (
            <span>Type the English translation</span>
        )}
      </div>
    </div>
  );
};