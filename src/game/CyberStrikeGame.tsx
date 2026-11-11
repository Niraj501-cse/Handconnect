/**
 * CYBER STRIKE: NEON DEFENDER
 * Full-Viewport Cyberpunk Arcade Defense Game Shell
 * 
 * Complies with Core Game Craft Guidelines:
 * - Full-viewport Game Shell (Title Screen -> Playing -> Pause / Victory / Game Over)
 * - Zero website navbars or footers
 * - Low-occlusion UI (>=85% unobstructed playfield, no backdrop-filter over active canvas)
 * - Isolated 60fps simulation loop with clamped dt
 * - Dual-input: WebRTC MediaPipe AI Hand Tracking or Mouse & Keyboard
 * - Procedural Web Audio synth & screen shake juice
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CyberGameEngine } from './cyberGameEngine';
import { cyberGameAudio } from './cyberGameAudio';
import { HandData } from '../types';
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  LogOut,
  Sparkles,
  Zap,
  Hand,
  MousePointer,
  Pause,
  Trophy,
  Shield,
  Radio,
} from 'lucide-react';

interface CyberStrikeGameProps {
  onExitGame: () => void;
  leftHand: HandData | null;
  rightHand: HandData | null;
  isCameraActive: boolean;
  onRequestToggleCamera?: () => void;
}

export const CyberStrikeGame: React.FC<CyberStrikeGameProps> = ({
  onExitGame,
  leftHand,
  rightHand,
  isCameraActive,
  onRequestToggleCamera,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CyberGameEngine | null>(null);

  // High-level reactive state for HUD only (does not drive 60fps canvas loop)
  const [screenState, setScreenState] = useState<'TITLE_SCREEN' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY'>('TITLE_SCREEN');
  const [hudStats, setHudStats] = useState({
    health: 100,
    maxHealth: 100,
    score: 0,
    highScore: 0,
    multiplier: 1,
    streak: 0,
    empCharge: 100,
    waveNumber: 1,
    totalWaves: 5,
    enemiesRemaining: 12,
  });

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [controlMode, setControlMode] = useState<'hand' | 'mouse'>('hand');

  // Input tracking
  const heldKeysRef = useRef<Set<string>>(new Set());
  const justPressedKeysRef = useRef<Set<string>>(new Set());
  const mousePosRef = useRef<{ x: number; y: number; isDown: boolean }>({ x: 0, y: 0, isDown: false });

  // Initialize engine once
  useEffect(() => {
    const engine = new CyberGameEngine({
      width: window.innerWidth,
      height: window.innerHeight,
      onAudioEvent: (event) => cyberGameAudio.play(event),
    });
    engineRef.current = engine;

    const handleResize = () => {
      if (!canvasRef.current || !engineRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvasRef.current.width = w;
      canvasRef.current.height = h;
      engineRef.current.setSize(w, h);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update sound mute state
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      cyberGameAudio.setMuted(next);
      return next;
    });
  }, []);

  // Input event listeners (WASD, Space, Esc, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      heldKeysRef.current.add(e.code);
      justPressedKeysRef.current.add(e.code);

      // Global hotkeys
      if (e.code === 'Escape') {
        const engine = engineRef.current;
        if (!engine) return;
        if (engine.screenState === 'PLAYING') {
          engine.pauseGame();
          setScreenState('PAUSED');
        } else if (engine.screenState === 'PAUSED') {
          engine.pauseGame();
          setScreenState('PLAYING');
        }
      } else if (e.code === 'KeyM') {
        handleToggleMute();
      } else if (e.code === 'Space') {
        // Space triggers EMP in game or starts on Title Screen
        const engine = engineRef.current;
        if (!engine) return;
        if (engine.screenState === 'TITLE_SCREEN') {
          engine.startGame();
          setScreenState('PLAYING');
        } else if (engine.screenState === 'PLAYING') {
          engine.triggerEmpShockwave();
        }
      } else if (e.code === 'Enter') {
        const engine = engineRef.current;
        if (!engine) return;
        if (engine.screenState === 'TITLE_SCREEN') {
          engine.startGame();
          setScreenState('PLAYING');
        } else if (engine.screenState === 'GAME_OVER' || engine.screenState === 'VICTORY') {
          engine.restartGame();
          setScreenState('PLAYING');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      heldKeysRef.current.delete(e.code);
    };

    const handleBlur = () => {
      // Clear held keys on blur to prevent stuck inputs
      heldKeysRef.current.clear();
      justPressedKeysRef.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [handleToggleMute]);

  // Mouse & Touch slicing handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mousePosRef.current = { x, y, isDown: true };

    if (e.button === 2) {
      // Right click triggers EMP
      engineRef.current?.triggerEmpShockwave();
    } else {
      engineRef.current?.addBladePoint('right', x, y);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mousePosRef.current = { x, y, isDown: mousePosRef.current.isDown };

    // Continuous slicing line on move
    engineRef.current?.addBladePoint('right', x, y);
  };

  const handlePointerUp = () => {
    mousePosRef.current.isDown = false;
  };

  // Main 60 FPS Canvas Render & Simulation Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let hudUpdateCounter = 0;

    const loop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;

      const engine = engineRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (engine && canvas && ctx) {
        // 1. Process AI Hand Landmarks into Blade Slices
        if (engine.screenState === 'PLAYING') {
          // Left Hand Index Tip (Landmark #8)
          if (leftHand && leftHand.landmarks[8]) {
            const lx = leftHand.landmarks[8].x * canvas.width;
            const ly = leftHand.landmarks[8].y * canvas.height;
            engine.addBladePoint('left', lx, ly);

            // Clenched fist triggers EMP
            if (leftHand.gesture.name === 'Fist' && engine.empCharge >= 50) {
              engine.triggerEmpShockwave();
            }
          }

          // Right Hand Index Tip (Landmark #8)
          if (rightHand && rightHand.landmarks[8]) {
            const rx = rightHand.landmarks[8].x * canvas.width;
            const ry = rightHand.landmarks[8].y * canvas.height;
            engine.addBladePoint('right', rx, ry);

            // Clenched fist triggers EMP
            if (rightHand.gesture.name === 'Fist' && engine.empCharge >= 50) {
              engine.triggerEmpShockwave();
            }
          }

          // Keyboard Movement fallback (WASD/Arrows generate defensive blade cut)
          const held = heldKeysRef.current;
          if (held.has('KeyA') || held.has('ArrowLeft')) {
            engine.addBladePoint('left', canvas.width * 0.35, canvas.height * 0.75);
          }
          if (held.has('KeyD') || held.has('ArrowRight')) {
            engine.addBladePoint('right', canvas.width * 0.65, canvas.height * 0.75);
          }
          if (held.has('KeyW') || held.has('ArrowUp')) {
            engine.addBladePoint('right', canvas.width * 0.5, canvas.height * 0.55);
          }
          if (held.has('KeyS') || held.has('ArrowDown')) {
            engine.addBladePoint('left', canvas.width * 0.5, canvas.height * 0.85);
          }
        }

        // 2. Engine Simulation Step
        engine.update(rawDt);

        // 3. Clear Canvas & Render High-Impact Visuals
        renderGame(ctx, engine, canvas.width, canvas.height);

        // Sync React HUD state at 15Hz to avoid re-rendering layout 60 times/sec
        hudUpdateCounter += 1;
        if (hudUpdateCounter % 4 === 0) {
          if (screenState !== engine.screenState) {
            setScreenState(engine.screenState);
          }
          const wave = engine.currentWaveIndex < 5 ? engine.currentWaveIndex + 1 : 5;
          setHudStats({
            health: Math.round(engine.health),
            maxHealth: engine.maxHealth,
            score: engine.score,
            highScore: engine.highScore,
            multiplier: engine.multiplier,
            streak: engine.streak,
            empCharge: Math.round(engine.empCharge),
            waveNumber: wave,
            totalWaves: 5,
            enemiesRemaining: engine.targets.length,
          });
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [leftHand, rightHand, screenState]);

  // Render function isolated from React DOM updates
  const renderGame = (
    ctx: CanvasRenderingContext2D,
    engine: CyberGameEngine,
    w: number,
    h: number
  ) => {
    ctx.save();

    // Screen Shake Trauma Transform
    if (engine.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * engine.screenShake * 1.5;
      const shakeY = (Math.random() - 0.5) * engine.screenShake * 1.5;
      ctx.translate(shakeX, shakeY);
    }

    // Background: Deep Cyber Abyss & Grid Lines
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, w, h);

    // Subtle Perspective Neon Grid
    ctx.strokeStyle = 'rgba(155, 92, 255, 0.08)';
    ctx.lineWidth = 1;
    const gridSpacing = 48;
    for (let x = 0; x < w; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Player Core Defense Threshold Line at 90% Y
    const bottomLine = h * 0.90;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 217, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, bottomLine);
    ctx.lineTo(w, bottomLine);
    ctx.stroke();

    // Glowing Core Nodes at bottom line
    const coreGlow = ctx.createLinearGradient(0, bottomLine - 10, 0, h);
    coreGlow.addColorStop(0, 'rgba(0, 217, 255, 0.15)');
    coreGlow.addColorStop(1, 'rgba(5, 5, 16, 0.95)');
    ctx.fillStyle = coreGlow;
    ctx.fillRect(0, bottomLine, w, h - bottomLine);
    ctx.restore();

    // Render Targets
    for (const t of engine.targets) {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);

      // Glow & Body
      ctx.shadowColor = t.glowColor;
      ctx.shadowBlur = 16;

      if (t.type === 'BIT') {
        // Cyan diamond with rotating inner core
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.moveTo(0, -t.radius);
        ctx.lineTo(t.radius, 0);
        ctx.lineTo(0, t.radius);
        ctx.lineTo(-t.radius, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-4, -4, 8, 8);
      } else if (t.type === 'SEEKER') {
        // Neon Pink triangle with pulse ring
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.moveTo(0, -t.radius * 1.2);
        ctx.lineTo(t.radius, t.radius);
        ctx.lineTo(-t.radius, t.radius);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (t.type === 'ARMORED') {
        // Amber Hexagon with outer shield barrier
        ctx.fillStyle = t.color;
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const rad = (a * Math.PI) / 3;
          const px = Math.cos(rad) * t.radius;
          const py = Math.sin(rad) * t.radius;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Armored Shield Ring
        ctx.strokeStyle = t.health === 2 ? '#FFE83A' : '#FF3535';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#050510';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${t.health}`, 0, 0);
      } else if (t.type === 'QUANTUM_BOSS') {
        // Giant Boss Core with rotating dual rings
        ctx.fillStyle = '#9B5CFF';
        ctx.beginPath();
        ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#00D9FF';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, t.radius + 8, 0, Math.PI * 2);
        ctx.stroke();

        // Boss Health text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px "Chakra Petch", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`BOSS ${t.health}/${t.maxHealth}`, 0, 0);
      }

      ctx.restore();
    }

    // Render Shockwaves
    for (const sw of engine.shockwaves) {
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = sw.alpha;
      ctx.lineWidth = sw.lineWidth;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Render Particles
    for (const p of engine.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Blade Ribbon Trails (Left Hand Pink, Right Hand Cyan)
    const drawBlade = (blade: { points: { x: number; y: number }[]; color: string }) => {
      if (blade.points.length < 2) return;
      ctx.save();
      ctx.strokeStyle = blade.color;
      ctx.shadowColor = blade.color;
      ctx.shadowBlur = 18;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < blade.points.length; i++) {
        const p1 = blade.points[i - 1];
        const p2 = blade.points[i];
        const alpha = i / blade.points.length;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 4 + alpha * 6;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Blade Tip Glow Orb
      const tip = blade.points[blade.points.length - 1];
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    drawBlade(engine.leftBlade);
    drawBlade(engine.rightBlade);

    // Render Floating Score Texts
    for (const ft of engine.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.font = 'bold 15px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // Screen Flash (on EMP or Core Damage)
    if (engine.flashAlpha > 0 && engine.flashColor) {
      ctx.save();
      ctx.globalAlpha = engine.flashAlpha;
      ctx.fillStyle = engine.flashColor;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // Wave Banner Display during Wave Start
    if (engine.screenState === 'PLAYING' && engine.waveBannerTimer > 0) {
      ctx.save();
      const wave = engine.currentWaveIndex < 5 ? engine.currentWaveIndex + 1 : 5;
      const alpha = Math.min(1, engine.waveBannerTimer);
      ctx.globalAlpha = alpha;

      ctx.fillStyle = 'rgba(5, 5, 16, 0.85)';
      ctx.fillRect(0, h * 0.42, w, 80);

      ctx.font = 'bold 24px "Chakra Petch", sans-serif';
      ctx.fillStyle = '#FFE83A';
      ctx.textAlign = 'center';
      ctx.fillText(`SECTOR 0${wave} INITIALIZED`, w / 2, h * 0.46);

      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00D9FF';
      ctx.fillText(`DESTROY ALL INCOMING ROGUE DATA CORES`, w / 2, h * 0.50);

      ctx.restore();
    }

    ctx.restore();
  };

  const handleStartGame = () => {
    engineRef.current?.startGame();
    setScreenState('PLAYING');
  };

  const handleRestartGame = () => {
    engineRef.current?.restartGame();
    setScreenState('PLAYING');
  };

  const handleResumeGame = () => {
    engineRef.current?.pauseGame();
    setScreenState('PLAYING');
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 w-screen h-screen bg-[#050510] text-white overflow-hidden select-none"
    >
      {/* 60 FPS Canvas Viewport */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full block cursor-crosshair select-none"
      />

      {/* =========================================================================
          LOW-OCCLUSION HEADS-UP DISPLAY (HUD)
          >=85% unobstructed playfield; pointer-events-none on wrappers
          ========================================================================= */}
      {screenState === 'PLAYING' && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
          
          {/* Top Perimeter HUD Cluster */}
          <div className="flex items-start justify-between w-full">
            
            {/* Top-Left: Core Integrity & EMP Recharge Gauge */}
            <div className="flex flex-col gap-2 bg-black/60 border border-purple-500/20 rounded-2xl p-3 backdrop-blur-none">
              <div className="flex items-center gap-2 text-xs font-mono">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300 font-bold uppercase">Core Integrity</span>
                <span className="text-cyan-300 font-bold tabular-nums ml-2">
                  {hudStats.health} / {hudStats.maxHealth} HP
                </span>
              </div>

              {/* Core Health Bar */}
              <div className="w-44 sm:w-56 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                <div
                  className={`h-full transition-all duration-150 ${
                    hudStats.health > 50
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                      : hudStats.health > 25
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      : 'bg-gradient-to-r from-rose-600 to-red-500 animate-pulse'
                  }`}
                  style={{ width: `${(hudStats.health / hudStats.maxHealth) * 100}%` }}
                />
              </div>

              {/* EMP Shockwave Bar */}
              <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                <span className="text-yellow-300 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span>EMP BURST</span>
                </span>
                <span className={`font-bold tabular-nums ${hudStats.empCharge >= 50 ? 'text-[#00FF9D]' : 'text-slate-400'}`}>
                  {hudStats.empCharge >= 50 ? 'READY (FIST / SPACE)' : `${hudStats.empCharge}%`}
                </span>
              </div>
            </div>

            {/* Top-Center: Sector Wave Counter */}
            <div className="hidden sm:flex flex-col items-center bg-black/60 border border-purple-500/20 rounded-2xl px-5 py-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-purple-300">
                Sector Wave
              </span>
              <span className="font-cyber font-extrabold text-xl text-yellow-300 tracking-wider tabular-nums">
                0{hudStats.waveNumber} <span className="text-slate-500 text-sm">/ 0{hudStats.totalWaves}</span>
              </span>
            </div>

            {/* Top-Right: Score, Streak Multiplier & High Score */}
            <div className="flex flex-col items-end gap-1.5 bg-black/60 border border-purple-500/20 rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase text-slate-400">Score</span>
                <span className="font-cyber font-extrabold text-2xl text-cyan-300 tracking-wider tabular-nums">
                  {hudStats.score.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                {hudStats.streak > 1 && (
                  <span className="px-2 py-0.5 rounded bg-pink-500/20 border border-pink-500/50 text-pink-300 font-bold tracking-wider animate-pulse">
                    {hudStats.streak} STREAK · {hudStats.multiplier}x MULTIPLIER
                  </span>
                )}
                <span className="text-slate-400 text-[11px] tabular-nums">
                  HIGH: {hudStats.highScore.toLocaleString()}
                </span>
              </div>
            </div>

          </div>

          {/* Bottom Perimeter HUD Cluster */}
          <div className="flex items-end justify-between w-full">
            
            {/* Bottom-Left: Active Input Sensor & Hand Feed */}
            <div className="flex items-center gap-2.5 bg-black/60 border border-purple-500/20 rounded-2xl p-2.5 text-xs font-mono">
              {leftHand || rightHand ? (
                <div className="flex items-center gap-2 text-cyan-300">
                  <Hand className="w-4 h-4 text-[#FF35C8] animate-pulse" />
                  <span className="font-bold">AI HAND TRACKING ACTIVE</span>
                  <span className="text-slate-400 hidden sm:inline">· INDEX FINGERS SLICE TARGETS</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-300">
                  <MousePointer className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold">MOUSE / TOUCH SLICER ACTIVE</span>
                  <span className="text-slate-400 hidden sm:inline">· CLICK / DRAG TO CUT</span>
                </div>
              )}
            </div>

            {/* Bottom-Right: Sound, Pause, and Exit Action Buttons (pointer-events-auto) */}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onClick={handleToggleMute}
                title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                className="p-2.5 rounded-xl bg-black/80 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>

              <button
                onClick={() => {
                  engineRef.current?.pauseGame();
                  setScreenState('PAUSED');
                }}
                title="Pause Game (Esc)"
                aria-label="Pause Game"
                className="p-2.5 rounded-xl bg-black/80 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
              >
                <Pause className="w-4 h-4" />
              </button>

              <button
                onClick={onExitGame}
                title="Exit to Hand Vision Lab"
                aria-label="Exit to Hand Vision Lab"
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-rose-400 text-rose-300 hover:text-white transition-colors text-xs font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit Arcade</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          TITLE SCREEN (ATMOSPHERIC LIVE CENTERPIECE + BESPOKE SVG TITLE LOCKUP)
          ========================================================================= */}
      {screenState === 'TITLE_SCREEN' && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center z-20">
          
          {/* Bespoke Inline SVG Title Lockup with 35% negative space */}
          <div className="max-w-2xl w-full flex flex-col items-center space-y-4">
            
            <svg
              className="w-full max-w-lg h-28"
              viewBox="0 0 540 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="cyberTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF35C8" />
                  <stop offset="50%" stopColor="#00D9FF" />
                  <stop offset="100%" stopColor="#FFE83A" />
                </linearGradient>
                <filter id="neonTitleGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <text
                x="270"
                y="52"
                textAnchor="middle"
                fontFamily="'Chakra Petch', sans-serif"
                fontWeight="900"
                fontSize="42"
                letterSpacing="4"
                fill="url(#cyberTitleGrad)"
                filter="url(#neonTitleGlow)"
              >
                CYBER STRIKE
              </text>
              <text
                x="270"
                y="84"
                textAnchor="middle"
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="700"
                fontSize="16"
                letterSpacing="8"
                fill="#00D9FF"
              >
                NEON DEFENDER ARCADE
              </text>
            </svg>

            <p className="font-mono text-sm text-slate-300 max-w-md leading-relaxed">
              Slice descending rogue cyber cores with your index fingertips or mouse laser. Clench your fist to unleash a devastating EMP burst.
            </p>

            {/* Input Selection Toggle */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setControlMode('hand')}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-2 border cursor-pointer transition-all ${
                  controlMode === 'hand'
                    ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-md shadow-purple-500/20'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                <Hand className="w-3.5 h-3.5 text-[#FF35C8]" />
                <span>AI Hand Tracking</span>
              </button>

              <button
                onClick={() => setControlMode('mouse')}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-2 border cursor-pointer transition-all ${
                  controlMode === 'mouse'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                <MousePointer className="w-3.5 h-3.5 text-[#00D9FF]" />
                <span>Mouse / Touch Slicer</span>
              </button>
            </div>

            {/* Primary Start CTA Button */}
            <div className="pt-4 flex flex-col items-center gap-3">
              <button
                onClick={handleStartGame}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF35C8] via-[#00D9FF] to-[#FFE83A] text-[#050510] font-cyber font-extrabold text-base uppercase tracking-wider hover:brightness-115 transition-all shadow-xl shadow-cyan-500/30 flex items-center gap-2.5 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Initiate Defense · Enter</span>
              </button>

              {/* Single Flat Control-Hint Line */}
              <p className="text-xs font-mono text-slate-400">
                Index Finger / Mouse Slice · Fist / Space EMP · Esc Pause
              </p>
            </div>

            {/* High Score & Exit */}
            <div className="pt-6 flex items-center gap-6 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-yellow-300">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>ARCADE RECORD: {hudStats.highScore.toLocaleString()} PTS</span>
              </span>
              <span>·</span>
              <button
                onClick={onExitGame}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Return to Vision Lab</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          PAUSE MODAL DIALOG
          ========================================================================= */}
      {screenState === 'PAUSED' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-30">
          <div className="w-full max-w-sm bg-[#070718] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <h3 className="font-cyber font-bold text-xl text-white tracking-wider uppercase">
              DEFENSE PAUSED
            </h3>
            <p className="text-xs font-mono text-slate-400">
              System kinematics frozen. Press Esc to resume.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleResumeGame}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-slate-950 font-cyber font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer"
              >
                Resume Defense
              </button>
              <button
                onClick={handleRestartGame}
                className="w-full py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
              >
                Restart Wave 1
              </button>
              <button
                onClick={onExitGame}
                className="w-full py-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/40 text-xs font-mono transition-colors cursor-pointer"
              >
                Exit to Vision Lab
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          GAME OVER MODAL DIALOG
          ========================================================================= */}
      {screenState === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-30 animate-fade-in">
          <div className="w-full max-w-md bg-[#0a0614] border border-rose-500/40 rounded-3xl p-7 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-2">
              <Shield className="w-7 h-7 text-rose-400" />
            </div>

            <h2 className="font-cyber font-extrabold text-2xl text-white tracking-wider uppercase">
              CORE BREACH DETECTED
            </h2>
            <p className="text-xs font-mono text-slate-400">
              Network integrity collapsed under rogue data core cascade.
            </p>

            {/* Score Breakdown */}
            <div className="py-3 px-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Final Defense Score</span>
                <span className="text-cyan-300 font-bold tabular-nums text-sm">
                  {hudStats.score.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sector Reached</span>
                <span className="text-yellow-300 font-bold">
                  Sector 0{hudStats.waveNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Arcade High Score</span>
                <span className="text-slate-200 font-bold tabular-nums">
                  {hudStats.highScore.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleRestartGame}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 via-purple-600 to-cyan-500 text-white font-cyber font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-rose-900/30 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again (Enter)</span>
              </button>

              <button
                onClick={onExitGame}
                className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VICTORY MODAL DIALOG
          ========================================================================= */}
      {screenState === 'VICTORY' && (
        <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-30 animate-fade-in">
          <div className="w-full max-w-md bg-[#051114] border border-[#00FF9D]/40 rounded-3xl p-7 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#00FF9D]/10 border border-[#00FF9D]/30 flex items-center justify-center mx-auto mb-2 animate-bounce">
              <Trophy className="w-7 h-7 text-[#00FF9D]" />
            </div>

            <h2 className="font-cyber font-extrabold text-2xl text-white tracking-wider uppercase">
              NETWORK DEFENSE COMPLETE
            </h2>
            <p className="text-xs font-mono text-slate-300">
              The Quantum Leviathan was dismantled. All 5 sectors are secured.
            </p>

            {/* Score Breakdown */}
            <div className="py-3 px-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Victory Score</span>
                <span className="text-[#00FF9D] font-bold tabular-nums text-base">
                  {hudStats.score.toLocaleString()} PTS
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Core Health Remaining</span>
                <span className="text-cyan-300 font-bold tabular-nums">
                  {hudStats.health} / 100 HP
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Max Slicing Streak</span>
                <span className="text-yellow-300 font-bold tabular-nums">
                  {hudStats.streak}x MULTIPLIER
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleRestartGame}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#00FF9D] via-[#00D9FF] to-[#FFE83A] text-slate-950 font-cyber font-extrabold text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again (Enter)</span>
              </button>

              <button
                onClick={onExitGame}
                className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
