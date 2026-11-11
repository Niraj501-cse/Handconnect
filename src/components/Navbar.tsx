import React from 'react';
import { CameraStatus, TrackingStatus } from '../types';
import { Radio, Maximize2, Minimize2, ShieldCheck, Zap, Gamepad2 } from 'lucide-react';

interface NavbarProps {
  cameraStatus: CameraStatus;
  trackingStatus: TrackingStatus;
  isTracking: boolean;
  isFullscreen: boolean;
  onToggleTracking: () => void;
  onToggleFullscreen: () => void;
  onEnterGame?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cameraStatus,
  trackingStatus,
  isTracking,
  isFullscreen,
  onToggleTracking,
  onToggleFullscreen,
  onEnterGame,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-900/30 bg-[#050510]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#9B5CFF] via-[#00D9FF] to-[#FF35C8] p-[1px] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-[#070718] rounded-[7px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#00D9FF]" />
            </div>
          </div>
          <div>
            <a href="#" className="font-cyber font-bold text-lg tracking-wider text-white hover:text-[#00D9FF] transition-colors whitespace-nowrap">
              HAND<span className="text-[#00D9FF]">CONNECT</span>
            </a>
            <div className="text-[10px] font-mono tracking-widest text-purple-300/60 uppercase">
              AI Hand Vision System
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-mono uppercase tracking-wider text-slate-300">
          <a href="#canvas-viewport" className="hover:text-[#00D9FF] transition-colors whitespace-nowrap">
            Live Viewport
          </a>
          <a href="#analytics-section" className="hover:text-[#FFE83A] transition-colors whitespace-nowrap">
            Telemetry HUD
          </a>
          <a href="#gesture-guide" className="hover:text-[#FF35C8] transition-colors whitespace-nowrap">
            Gesture Matrix
          </a>
          <a href="#gesture-history" className="hover:text-[#00FF9D] transition-colors whitespace-nowrap">
            History Log
          </a>
          <div className="flex items-center gap-1.5 text-purple-300/70 text-[11px] font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="whitespace-nowrap">Local Processing</span>
          </div>
        </nav>

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Cyber Strike Arcade Mode Entry */}
          {onEnterGame && (
            <button
              onClick={onEnterGame}
              aria-label="Launch Cyber Strike Arcade Game"
              title="Launch Cyber Strike Arcade Game"
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#FF35C8]/20 to-[#00D9FF]/20 border border-[#00D9FF]/60 hover:border-[#00D9FF] text-cyan-200 hover:text-white transition-all text-xs font-cyber font-bold tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/15 whitespace-nowrap"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span className="hidden sm:inline">Cyber Strike Arcade</span>
              <span className="sm:hidden">Arcade</span>
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white hover:border-[#00D9FF]/50 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Primary Start / Stop Tracking Button */}
          <button
            onClick={onToggleTracking}
            aria-label={isTracking ? "Stop Hand Tracking" : "Start Hand Tracking"}
            className={`px-4 py-2 text-xs font-cyber font-bold tracking-wider uppercase rounded-lg transition-all duration-200 whitespace-nowrap flex items-center gap-2 cursor-pointer shadow-lg ${
              isTracking
                ? 'bg-rose-950/80 border border-rose-500/70 text-rose-200 hover:bg-rose-900 shadow-rose-900/30'
                : 'bg-gradient-to-r from-[#9B5CFF] via-[#00D9FF] to-[#FF35C8] text-[#050510] font-extrabold hover:brightness-110 shadow-cyan-500/25'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isTracking ? 'animate-pulse text-rose-400' : 'text-slate-950'}`} />
            <span>{isTracking ? 'Stop Tracking' : 'Start Tracking'}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
