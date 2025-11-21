import React, { useState, useCallback } from 'react';
import { TopicOption, AppState, VocabPair, GameStats, QuizItem, GameStage } from './types';
import { generateVocabulary } from './services/geminiService';
import { Menu } from './components/Menu';
import { ShooterGame } from './components/ShooterGame';
import { GameResult } from './components/GameResult';
import { LearningView } from './components/LearningView';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('menu');
  
  // Data States
  const [vocabList, setVocabList] = useState<VocabPair[]>([]);
  const [stages, setStages] = useState<GameStage[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  
  // Stats
  const [stats, setStats] = useState<GameStats>({
    correct: 0,
    incorrect: 0,
    wpm: 0,
    streak: 0,
    maxStreak: 0,
    startTime: null,
    roundsPlayed: 1
  });

  const handleTopicSelect = async (topic: TopicOption) => {
    setAppState('loading');
    try {
      const vocab = await generateVocabulary(topic.promptContext);
      setVocabList(vocab);
      setAppState('learning');
    } catch (e) {
      console.error("Failed to start game", e);
      setAppState('menu');
      alert("Failed to generate content. Please check your API key or internet connection.");
    }
  };

  const shuffle = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  // Build the playlist of stages
  const handleStartGame = (mode: 'guided' | 'survival' | 'infinite') => {
    const newStages: GameStage[] = [];
    
    // Only create Chinese -> English Items (User sees Chinese, types English)
    const enItems: QuizItem[] = vocabList.map(v => ({
        id: `${v.id}-zh2en`,
        vocabId: v.id,
        question: v.chinese, // Show Chinese
        answer: v.english,   // Type English
        hint: v.english,
        direction: 'zh_to_en',
        originalPair: v
    }));

    if (mode === 'infinite') {
         newStages.push({
            id: 'infinite-practice',
            label: 'ZEN TRAINING',
            mode: 'guided',
            direction: 'zh_to_en',
            infinite: true,
            items: shuffle([...enItems])
        });
    } else {
        // Stage 1: Optional Guided Practice
        if (mode === 'guided') {
            newStages.push({
                id: 'practice-en',
                label: 'PRACTICE MODE',
                mode: 'guided',
                direction: 'zh_to_en',
                items: shuffle([...enItems])
            });
        }
        // Stage 2: Main Quiz
        newStages.push({
            id: 'quiz-en',
            label: 'SURVIVAL MODE',
            mode: 'quiz',
            direction: 'zh_to_en',
            items: shuffle([...enItems])
        });
    }

    setStages(newStages);
    setCurrentStageIndex(0);
    
    // Reset Stats
    setStats({
      correct: 0,
      incorrect: 0,
      wpm: 0,
      streak: 0,
      maxStreak: 0,
      startTime: Date.now(),
      roundsPlayed: 1
    });
    
    setAppState('playing');
  };

  const handleRestart = () => {
    setAppState('menu');
  };

  const handleRoundComplete = useCallback((_missedItems: QuizItem[], sessionStats: Partial<GameStats>) => {
     // Update stats
     setStats(prev => ({
         ...prev,
         correct: sessionStats.correct || prev.correct,
         incorrect: sessionStats.incorrect || prev.incorrect,
         streak: sessionStats.streak || 0,
         maxStreak: Math.max(prev.maxStreak, sessionStats.streak || 0)
     }));

     // Move to next stage or finish
     if (currentStageIndex + 1 < stages.length) {
         setCurrentStageIndex(prev => prev + 1);
     } else {
         // End of Game
         setAppState('summary');
     }
  }, [stages, currentStageIndex]);

  const difficultWords = vocabList.filter(w => w.errorCount > 0).sort((a, b) => b.errorCount - a.errorCount);

  const currentStage = stages[currentStageIndex];

  return (
    <div className="min-h-screen bg-black text-slate-200 relative selection:bg-cyan-500/30 selection:text-cyan-100">
        <main className="w-full h-full">
          {appState === 'menu' && (
            <div className="pt-20">
                <Menu onStart={handleTopicSelect} isLoading={false} />
            </div>
          )}
          
          {appState === 'loading' && (
             <div className="pt-20">
                <Menu onStart={() => {}} isLoading={true} />
             </div>
          )}

          {appState === 'learning' && (
              <div className="pt-20">
                <LearningView vocabList={vocabList} onStartGame={handleStartGame} />
              </div>
          )}

          {appState === 'playing' && currentStage && (
            <ShooterGame 
              key={currentStage.id} // Key ensures component resets on stage change
              queue={currentStage.items}
              stageLabel={currentStage.label}
              mode={currentStage.mode}
              infinite={currentStage.infinite}
              streak={stats.streak}
              onRoundComplete={handleRoundComplete}
              onExit={handleRestart}
            />
          )}

          {appState === 'summary' && (
            <div className="pt-20 px-4">
                <GameResult 
                stats={stats} 
                difficultWords={difficultWords}
                onRestart={handleRestart}
                />
            </div>
          )}
        </main>
    </div>
  );
};

export default App;