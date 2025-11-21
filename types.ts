export interface VocabPair {
  id: string;
  chinese: string;
  english: string;
  partOfSpeech?: string;
  errorCount: number;
}

export type QuizDirection = 'zh_to_en' | 'en_to_zh';

export interface QuizItem {
  id: string;
  vocabId: string; // Reference to original vocab
  question: string; // The text shown to user
  answer: string; // The text user must type
  hint: string; // Hint text (masked answer)
  direction: QuizDirection;
  originalPair: VocabPair;
}

export type GameMode = 'guided' | 'quiz';

export interface GameStage {
  id: string;
  label: string;
  mode: GameMode;
  items: QuizItem[];
  direction: QuizDirection; // To help user prep IME
  infinite?: boolean; // If true, items are recycled on success
}

export interface GameStats {
  correct: number;
  incorrect: number;
  wpm: number;
  streak: number;
  maxStreak: number;
  startTime: number | null;
  roundsPlayed: number;
}

export type AppState = 'menu' | 'loading' | 'learning' | 'playing' | 'summary' | 'error';

export interface TopicOption {
  id: string;
  label: string;
  icon: string;
  promptContext: string;
}

// --- Shooter Game Types ---

export interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
}

export interface Enemy {
  id: string;
  quizItem: QuizItem;
  x: number;
  y: number;
  z: number; // Depth from camera
  active: boolean;
  locked: boolean; // Is this the current target?
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}