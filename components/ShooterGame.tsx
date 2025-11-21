import React, { useState, useEffect, useRef } from 'react';
import { QuizItem, GameStats, Enemy, Star, Particle, GameMode } from '../types';

interface ShooterGameProps {
  queue: QuizItem[];
  stageLabel: string;
  mode: GameMode;
  streak: number;
  infinite?: boolean;
  onRoundComplete: (missedItems: QuizItem[], statsDiff: Partial<GameStats>) => void;
  onExit: () => void;
}

const STAR_COUNT = 400;
const MAX_DEPTH = 2000; 
const ENEMY_SPAWN_Z = 1800;
const SCREEN_Z = 50; 
const SPEED = 1.5; // Reduced speed significantly
const MAX_ENEMIES = 3; // Allow up to 3 concurrent enemies

export const ShooterGame: React.FC<ShooterGameProps> = ({ 
  queue, 
  stageLabel,
  mode,
  infinite = false,
  streak: initialStreak, 
  onRoundComplete,
  onExit
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposing = useRef(false); // Track IME state
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Game State Refs
  const gameState = useRef({
    stars: [] as Star[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    pendingQueue: [] as QuizItem[],
    stats: { correct: 0, incorrect: 0, streak: initialStreak },
    lastTime: 0,
    spawnTimer: 0,
    isGameOver: false,
    screenShake: 0,
    laserBeam: null as { x: number, y: number, tx: number, ty: number, life: number } | null,
    width: 0,
    height: 0,
    cx: 0,
    cy: 0
  });

  const [input, setInput] = useState('');
  const [overlayMessage, setOverlayMessage] = useState<string | null>(stageLabel);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  // We use a state for display score to force re-renders of the HUD
  const [displayScore, setDisplayScore] = useState(initialStreak);

  // --- Audio Helpers ---
  useEffect(() => {
    // Init Audio Context for SFX
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
          audioCtxRef.current = new AudioContext();
      }
    } catch (e) {
      console.warn("AudioContext not supported or blocked", e);
    }

    // Init TTS
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
      }
    };
    
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const playLaserSound = () => {
      if (!audioCtxRef.current) return;
      try {
          // Resume context if suspended (common browser policy)
          if (audioCtxRef.current.state === 'suspended') {
              audioCtxRef.current.resume();
          }

          const ctx = audioCtxRef.current;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch
          osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.15); // Drop fast

          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

          osc.start();
          osc.stop(ctx.currentTime + 0.15);
      } catch (e) {
          console.error("Audio play failed", e);
      }
  };

  const speak = (text: string, lang: 'zh-TW' | 'en-US') => {
    if (!window.speechSynthesis) return;
    
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.9; 
    u.volume = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
       const preferredVoice = voices.find(v => v.lang === lang || v.lang.replace('_', '-').includes(lang));
       if (preferredVoice) {
         u.voice = preferredVoice;
       }
    }

    window.speechSynthesis.speak(u);
  };

  // --- Initialization ---
  useEffect(() => {
    // Reset Game State for new round
    gameState.current.pendingQueue = [...queue];
    gameState.current.enemies = [];
    gameState.current.particles = [];
    gameState.current.isGameOver = false;
    gameState.current.stats.streak = initialStreak;
    setDisplayScore(initialStreak);
    setOverlayMessage(stageLabel); 

    // Hide overlay after 2s
    const timer = setTimeout(() => setOverlayMessage(null), 2000);

    // Initialize Stars
    if (gameState.current.stars.length === 0) {
        const stars: Star[] = [];
        for (let i = 0; i < STAR_COUNT; i++) {
          stars.push({
            x: (Math.random() - 0.5) * 4000,
            y: (Math.random() - 0.5) * 4000,
            z: Math.random() * MAX_DEPTH,
            size: Math.random() * 2,
            color: Math.random() > 0.8 ? '#22d3ee' : '#fff' // Cyan or White
          });
        }
        gameState.current.stars = stars;
    }

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
      
      gameState.current.width = width;
      gameState.current.height = height;
      gameState.current.cx = width / 2;
      gameState.current.cy = height / 2;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    inputRef.current?.focus();

    let animationFrameId: number;
    const loop = (time: number) => {
      update(time);
      draw();
      if (!gameState.current.isGameOver) {
        animationFrameId = requestAnimationFrame(loop);
      } else {
        onRoundComplete([], {
            correct: gameState.current.stats.correct,
            incorrect: gameState.current.stats.incorrect,
            streak: gameState.current.stats.streak
        });
      }
    };
    animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timer);
      window.speechSynthesis.cancel();
    };
  }, [queue, stageLabel, mode, infinite]); 

  // --- Game Logic ---
  const update = (time: number) => {
    const dt = time - gameState.current.lastTime;
    gameState.current.lastTime = time;
    const state = gameState.current;

    if (state.screenShake > 0) {
        state.screenShake *= 0.9;
        if (state.screenShake < 0.5) state.screenShake = 0;
    }

    state.stars.forEach(star => {
      star.z -= SPEED;
      if (star.z <= 0) {
        star.z = MAX_DEPTH;
        star.x = (Math.random() - 0.5) * 4000;
        star.y = (Math.random() - 0.5) * 4000;
      }
    });

    // Spawn logic
    if (state.pendingQueue.length > 0) {
        // Spawn if we have fewer than MAX enemies AND enough time has passed since last spawn
        const timeSinceLastSpawn = time - state.spawnTimer;
        const shouldSpawn = state.enemies.length < MAX_ENEMIES && timeSinceLastSpawn > 2000; // 2 seconds gap
        
        if (shouldSpawn) {
            const item = state.pendingQueue.shift()!;
            state.spawnTimer = time;
            
            const newEnemy: Enemy = {
                id: item.id + '-' + Date.now(),
                quizItem: item,
                x: (Math.random() - 0.5) * 2500, // Wider spread
                y: (Math.random() - 0.5) * 1200,
                z: ENEMY_SPAWN_Z,
                active: true,
                locked: false
            };
            state.enemies.push(newEnemy);
            
            // Speak Question (Chinese) AND Answer (English) sequentially
            speak(item.question, 'zh-TW');
            speak(item.answer, 'en-US');
        }
    }

    // Update Enemies
    for (let i = state.enemies.length - 1; i >= 0; i--) {
        const enemy = state.enemies[i];
        enemy.z -= SPEED; 

        if (enemy.z <= SCREEN_Z) {
            // --- MISS / CRASH ---
            state.pendingQueue.push(enemy.quizItem); // Recycle
            
            if (mode === 'quiz') {
                state.stats.incorrect++;
                state.stats.streak = 0;
                setDisplayScore(0);
            }
            
            state.enemies.splice(i, 1);
            state.screenShake = 20;
            continue;
        }
    }

    // Mark the closest one as "locked" for visual danger indication, 
    // but we allow shooting any of them.
    let closestZ = 20000;
    let closestId = '';
    state.enemies.forEach(e => {
      if (e.z < closestZ) {
        closestZ = e.z;
        closestId = e.id;
      }
    });
    state.enemies.forEach(e => e.locked = e.id === closestId);

    // Check Game Over
    // If Infinite, this likely never happens unless pendingQueue and enemies are artificially cleared
    if (state.pendingQueue.length === 0 && state.enemies.length === 0 && state.particles.length === 0) {
        state.isGameOver = true;
    }

    // Update Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        if (p.life <= 0) {
            state.particles.splice(i, 1);
        }
    }
  };

  // --- Rendering ---
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = gameState.current;

    // Clear screen
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, state.width, state.height);

    const shakeX = (Math.random() - 0.5) * state.screenShake;
    const shakeY = (Math.random() - 0.5) * state.screenShake;
    
    ctx.save();
    ctx.translate(state.cx + shakeX, state.cy + shakeY);

    // Draw Stars
    state.stars.forEach(star => {
      const scale = 800 / (star.z || 1);
      const sx = star.x * scale;
      const sy = star.y * scale;
      const r = Math.max(0.5, star.size * scale * 0.05);

      if (sx > -state.cx && sx < state.cx && sy > -state.cy && sy < state.cy) {
          ctx.beginPath();
          ctx.fillStyle = star.color;
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fill();
      }
    });

    // Draw Laser
    if (state.laserBeam) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(6, 182, 212, ${state.laserBeam.life})`; 
        ctx.lineWidth = 4;
        ctx.moveTo(0, state.cy); // Origin is bottom center relative to camera
        // Laser target position
        ctx.lineTo(state.laserBeam.tx, state.laserBeam.ty);
        ctx.stroke();
        state.laserBeam.life -= 0.1;
        if (state.laserBeam.life <= 0) state.laserBeam = null;
    }

    // Draw Enemies (Furthest first)
    const enemiesToDraw = [...state.enemies].sort((a, b) => b.z - a.z);
    
    enemiesToDraw.forEach(enemy => {
        const scale = 800 / (enemy.z || 1);
        const sx = enemy.x * scale;
        const sy = enemy.y * scale;
        
        // Don't draw if off screen
        if (enemy.z < SCREEN_Z || sx < -state.cx * 2 || sx > state.cx * 2) return;

        // Box
        // Closest one gets Red warning, others get Cyan
        const isClosest = enemy.locked;
        ctx.strokeStyle = isClosest ? '#f43f5e' : 'rgba(6, 182, 212, 0.6)'; 
        ctx.lineWidth = isClosest ? 3 : 1;
        const boxW = 280 * scale;
        const boxH = 140 * scale; 
        
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(sx - boxW/2, sy - boxH/2, boxW, boxH);
        ctx.strokeRect(sx - boxW/2, sy - boxH/2, boxW, boxH);

        // Target Lock Line only for the closest threat
        if (isClosest) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
            ctx.lineWidth = 1;
            ctx.moveTo(0, state.cy); 
            ctx.lineTo(sx, sy + boxH/2);
            ctx.stroke();
        }

        // Question Text (Chinese)
        ctx.font = `bold ${Math.max(16, 50 * scale)}px "Inter", sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemy.quizItem.question, sx, sy - (25 * scale));
        
        // Guided Mode: Answer Text
        if (mode === 'guided') {
            ctx.font = `bold ${Math.max(12, 35 * scale)}px "JetBrains Mono"`;
            ctx.fillStyle = '#4ade80';
            ctx.fillText(enemy.quizItem.answer, sx, sy + (25 * scale));
        }
    });

    // Draw Particles
    state.particles.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.arc(p.x, p.y, Math.random() * 4 + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    ctx.restore();
  };

  // --- Input Handling ---

  const handleCompositionStart = () => {
      isComposing.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
      isComposing.current = false;
      setInput(e.currentTarget.value); 
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        if (isComposing.current) return;

        const val = input.trim().toLowerCase();
        if (!val) return;

        // Check against ALL active enemies
        // We prefer the closest one if there's a duplicate answer (rare), but generally first match works
        const targetEnemy = gameState.current.enemies.find(e => e.quizItem.answer.toLowerCase() === val);

        if (targetEnemy) {
            // --- HIT ---
            const scale = 800 / (targetEnemy.z || 1);
            const ex = targetEnemy.x * scale;
            const ey = targetEnemy.y * scale;

            // Explosion
            for (let i = 0; i < 25; i++) {
                gameState.current.particles.push({
                    x: ex,
                    y: ey,
                    vx: (Math.random() - 0.5) * 20,
                    vy: (Math.random() - 0.5) * 20,
                    life: 1,
                    color: i % 2 === 0 ? '#06b6d4' : '#f43f5e'
                });
            }

            // Laser Visuals
            gameState.current.laserBeam = { x: 0, y: 0, tx: ex, ty: ey, life: 1 };
            
            // Play Sound FX
            playLaserSound();

            // Remove specific enemy
            gameState.current.enemies = gameState.current.enemies.filter(e => e.id !== targetEnemy.id);
            
            // If INFINITE, recycle the item back to the pending queue
            if (infinite) {
                gameState.current.pendingQueue.push(targetEnemy.quizItem);
            }
            
            // Update Stats
            // For Infinite mode, we just track successful hits as 'correct'
            gameState.current.stats.correct++;
            gameState.current.stats.streak++;
            setDisplayScore(gameState.current.stats.streak);
            
            setInput('');

        } else {
            // --- MISS (No match on screen) ---
            gameState.current.screenShake = 5;
            setInput(''); 
        }
    }
  };

  const handleBlur = () => {
      setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-full bg-black overflow-hidden z-0">
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {/* Effects Layers */}
      <div className="scanlines pointer-events-none"></div>
      
      {/* Header UI */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-20 pointer-events-none">
         <div className="flex flex-col gap-1">
            <div className={`text-xl font-bold bg-black/60 px-3 py-1 rounded border inline-block backdrop-blur ${infinite ? 'text-purple-400 border-purple-900/50' : 'text-cyan-400 border-cyan-900/50'}`}>
                {stageLabel}
            </div>
            {infinite ? (
                 <div className="text-xs text-slate-400 font-mono">SCORE: {gameState.current.stats.correct}</div>
            ) : (
                 <div className="text-xs text-slate-400 font-mono">TARGETS: {gameState.current.enemies.length + gameState.current.pendingQueue.length}</div>
            )}
            <div className="text-xs text-slate-400 font-mono">STREAK: {displayScore}</div>
         </div>

         <button 
            onClick={onExit}
            className="pointer-events-auto bg-red-900/30 hover:bg-red-900/60 text-red-200 border border-red-500/30 rounded px-4 py-2 font-bold text-sm transition-colors backdrop-blur"
         >
            {infinite ? "EXIT ZEN MODE" : "GIVE UP"}
         </button>
      </div>

      {/* Level Transition Overlay */}
      {overlayMessage && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm animate-fade-in pointer-events-none">
              <h1 className={`text-6xl md:text-8xl font-black text-transparent bg-clip-text tracking-tighter animate-pulse text-center px-4 ${infinite ? 'bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]' : 'bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]'}`}>
                  {overlayMessage}
              </h1>
          </div>
      )}

      {/* Input Area */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 z-30">
        <div className="relative">
            <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onBlur={handleBlur}
                className={`w-full bg-slate-900/80 border-2 text-center font-mono text-xl py-3 px-4 outline-none backdrop-blur rounded-lg placeholder:text-slate-600 transition-colors ${infinite ? 'border-purple-500 text-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.5)]' : 'border-cyan-500 text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.5)]'}`}
                placeholder={gameState.current.enemies.length > 0 ? "TYPE ANY ANSWER" : "SCANNING..."}
                autoComplete="off"
            />
            
            {/* Decorative HUD Lines */}
            <div className={`absolute top-1/2 -left-16 w-14 h-[2px] bg-gradient-to-r from-transparent ${infinite ? 'to-purple-500/50' : 'to-cyan-500/50'}`}></div>
            <div className={`absolute top-1/2 -right-16 w-14 h-[2px] bg-gradient-to-l from-transparent ${infinite ? 'to-purple-500/50' : 'to-cyan-500/50'}`}></div>
        </div>
      </div>
    </div>
  );
};