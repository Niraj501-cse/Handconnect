import React from 'react';
import {
  Camera,
  Sparkles,
  Wand2,
  Palette,
  Layers,
  RefreshCw,
  Eye,
  PenTool,
  Volume2,
  VolumeX,
  Undo2,
  Eraser,
  Download,
  Settings,
  Gamepad2,
} from 'lucide-react';
import { THEME_PRESETS } from '../utils/themePresets';

export const BRUSH_COLORS = [
  { name: 'Neon Pink', value: '#FF35C8' },
  { name: 'Electric Cyan', value: '#00D9FF' },
  { name: 'Glowing Yellow', value: '#FFE83A' },
  { name: 'Electric Green', value: '#00FF9D' },
  { name: 'Neon Purple', value: '#9B5CFF' },
  { name: 'Laser White', value: '#FFFFFF' },
];

export const BRUSH_SIZES = [
  { label: 'Fine', value: 3 },
  { label: 'Med', value: 6 },
  { label: 'Ribbon', value: 12 },
];

interface TrackingControlsProps {
  isTracking: boolean;
  onToggleTracking: () => void;
  facingMode: 'user' | 'environment';
  onToggleCameraFacing: () => void;
  neonGlowEnabled: boolean;
  onToggleNeonGlow: () => void;
  rainbowBeamsEnabled: boolean;
  onToggleRainbowBeams: () => void;
  particlesEnabled: boolean;
  onToggleParticles: () => void;
  activeThemeId: string;
  onSelectTheme: (themeId: string) => void;
  isSimulated: boolean;
  onToggleSimulated: () => void;
  // Air Canvas controls
  airCanvasEnabled: boolean;
  onToggleAirCanvas: () => void;
  brushColor: string;
  onChangeBrushColor: (color: string) => void;
  brushWidth: number;
  onChangeBrushWidth: (width: number) => void;
  onUndoStroke: () => void;
  onClearCanvas: () => void;
  strokeCount: number;
  // Cyber Audio FX
  audioEnabled: boolean;
  onToggleAudio: () => void;
  // Snapshot export
  onCaptureSnapshot: () => void;
  // Settings modal
  onOpenSettings: () => void;
  // Cyber Strike Arcade
  onEnterGame?: () => void;
}

export const TrackingControls: React.FC<TrackingControlsProps> = ({
  isTracking,
  onToggleTracking,
  facingMode,
  onToggleCameraFacing,
  neonGlowEnabled,
  onToggleNeonGlow,
  rainbowBeamsEnabled,
  onToggleRainbowBeams,
  particlesEnabled,
  onToggleParticles,
  activeThemeId,
  onSelectTheme,
  isSimulated,
  onToggleSimulated,
  airCanvasEnabled,
  onToggleAirCanvas,
  brushColor,
  onChangeBrushColor,
  brushWidth,
  onChangeBrushWidth,
  onUndoStroke,
  onClearCanvas,
  strokeCount,
  audioEnabled,
  onToggleAudio,
  onCaptureSnapshot,
  onOpenSettings,
  onEnterGame,
}) => {
  return (
    <div className="w-full glass-panel rounded-2xl p-4 border border-purple-500/20 shadow-xl space-y-3">
      {/* Primary Row: Camera, FX, Audio, Themes, Snapshots */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Main Execution Action & Camera Flip */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleTracking}
            className={`px-4 py-2 rounded-xl font-cyber font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-md ${
              isTracking
                ? 'bg-rose-500/20 border border-rose-500 text-rose-300 hover:bg-rose-500/30 shadow-rose-900/40'
                : 'bg-[#9B5CFF] hover:bg-[#8640ff] text-white shadow-purple-600/30'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{isTracking ? 'Halt Video Feed' : 'Initialize Tracking'}</span>
          </button>

          <button
            onClick={onToggleCameraFacing}
            title={`Switch to ${facingMode === 'user' ? 'Rear' : 'Front'} Camera`}
            className="px-2.5 py-2 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-[#00D9FF]/60 text-slate-300 hover:text-white transition-colors text-xs font-mono flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#00D9FF]" />
            <span className="hidden sm:inline">Cam:</span>
            <span className="font-semibold text-[#00D9FF]">{facingMode === 'user' ? 'Front' : 'Rear'}</span>
          </button>
        </div>

        {/* Center: Interactive Mode Toggles (Air Canvas, Neon, Beams, Sparks) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AIR CANVAS BUTTON */}
          <button
            onClick={onToggleAirCanvas}
            aria-pressed={airCanvasEnabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer border ${
              airCanvasEnabled
                ? 'bg-gradient-to-r from-[#9B5CFF]/30 to-[#00D9FF]/30 border-[#00D9FF] text-cyan-200 shadow-md shadow-cyan-500/25'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-[#00D9FF]" />
            <span className="font-semibold">Air Canvas</span>
            {airCanvasEnabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] animate-ping" />
            )}
          </button>

          {/* Neon Glow Toggle */}
          <button
            onClick={onToggleNeonGlow}
            aria-pressed={neonGlowEnabled}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer border ${
              neonGlowEnabled
                ? 'bg-[#9B5CFF]/20 border-[#9B5CFF] text-purple-200'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FF35C8]" />
            <span className="hidden md:inline">Neon Glow</span>
          </button>

          {/* Rainbow Beams Toggle */}
          <button
            onClick={onToggleRainbowBeams}
            aria-pressed={rainbowBeamsEnabled}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer border ${
              rainbowBeamsEnabled
                ? 'bg-[#00D9FF]/20 border-[#00D9FF] text-cyan-200'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-[#00D9FF]" />
            <span className="hidden md:inline">Rainbow Beams</span>
          </button>

          {/* Particles Toggle */}
          <button
            onClick={onToggleParticles}
            aria-pressed={particlesEnabled}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer border ${
              particlesEnabled
                ? 'bg-[#FFE83A]/20 border-[#FFE83A] text-yellow-200'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#FFE83A]" />
            <span className="hidden md:inline">Sparks FX</span>
          </button>

          {/* Cyber Audio FX Toggle */}
          <button
            onClick={onToggleAudio}
            aria-pressed={audioEnabled}
            title={audioEnabled ? "Cyber Audio FX: Active" : "Cyber Audio FX: Muted"}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer border ${
              audioEnabled
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-sm shadow-emerald-500/30'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {audioEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="hidden sm:inline">Audio FX</span>
          </button>
        </div>

        {/* Right: Theme Selector, Snapshot & Simulation Mode */}
        <div className="flex items-center gap-2">
          {/* Theme Preset Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl px-2 py-1.5">
            <Palette className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <select
              aria-label="Hand Skeleton Color Theme"
              value={activeThemeId}
              onChange={(e) => onSelectTheme(e.target.value)}
              className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer max-w-[125px] truncate"
            >
              {THEME_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id} className="bg-[#0b0c1e] text-slate-200">
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

          {/* Snapshot Export Button */}
          <button
            onClick={onCaptureSnapshot}
            title="Export High-Resolution Cyber Snapshot (PNG)"
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-cyan-400 text-cyan-300 hover:text-white transition-colors text-xs font-mono flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Snapshot</span>
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            title="System & Audio Pulse Settings"
            aria-label="Open System and Audio Settings"
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-purple-400 text-purple-300 hover:text-white transition-colors text-xs font-mono flex items-center gap-1 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Arcade Game Button */}
          {onEnterGame && (
            <button
              onClick={onEnterGame}
              title="Launch Cyber Strike Arcade Game"
              aria-label="Launch Cyber Strike Arcade Game"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-cyan-500/20 border border-cyan-400/60 hover:border-cyan-300 text-cyan-200 hover:text-white transition-all text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/15"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span className="font-bold">Arcade</span>
            </button>
          )}

          {/* Interactive Simulation Mode Switch */}
          <button
            onClick={onToggleSimulated}
            title={isSimulated ? "Switch back to Live Webcam" : "Activate Interactive Test Hands"}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer border ${
              isSimulated
                ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm shadow-amber-500/30'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Sim:</span>
            <span className="font-semibold">{isSimulated ? 'ON' : 'OFF'}</span>
          </button>
        </div>

      </div>

      {/* Sub-Row: Air Canvas Palette & Stroke Tools (Displayed when Air Canvas is active) */}
      {airCanvasEnabled && (
        <div className="pt-2 border-t border-purple-500/20 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          
          {/* Air Drawing Instruction Badge */}
          <div className="flex items-center gap-2 text-cyan-300">
            <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 font-cyber font-bold text-[11px]">
              👉 POINTING FINGER TO DRAW
            </span>
            <span className="text-slate-400 hidden lg:inline">
              (Fist = Hover | Open Hand = Wipe)
            </span>
          </div>

          {/* Brush Colors */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 mr-1 text-[11px]">Color:</span>
            {BRUSH_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => onChangeBrushColor(c.value)}
                title={c.name}
                aria-label={`Brush Color: ${c.name}`}
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer border ${
                  brushColor === c.value
                    ? 'scale-125 border-white ring-2 ring-cyan-400/60'
                    : 'border-black/50 hover:scale-110'
                }`}
                style={{
                  backgroundColor: c.value,
                  boxShadow: brushColor === c.value ? `0 0 8px ${c.value}` : 'none',
                }}
              />
            ))}
          </div>

          {/* Brush Sizes */}
          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-700 rounded-lg p-0.5">
            {BRUSH_SIZES.map((s) => (
              <button
                key={s.value}
                onClick={() => onChangeBrushWidth(s.value)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                  brushWidth === s.value
                    ? 'bg-cyan-500/30 text-cyan-200 font-bold border border-cyan-400/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Stroke Operations: Undo & Clear */}
          <div className="flex items-center gap-2">
            <button
              onClick={onUndoStroke}
              disabled={strokeCount === 0}
              title="Undo last stroke"
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Undo2 className="w-3 h-3" />
              <span>Undo</span>
            </button>

            <button
              onClick={onClearCanvas}
              disabled={strokeCount === 0}
              title="Clear all strokes"
              className="px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/50 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Eraser className="w-3 h-3" />
              <span>Clear ({strokeCount})</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
