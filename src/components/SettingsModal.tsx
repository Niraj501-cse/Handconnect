import React from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Wand2,
  Layers,
  X,
  Play,
  Sliders,
  RotateCcw,
  Check,
} from 'lucide-react';
import { AudioSettings } from '../types';
import { GESTURE_SOUND_PROFILES } from '../utils/cyberAudio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioSettings: AudioSettings;
  onUpdateAudioSettings: (settings: Partial<AudioSettings>) => void;
  onPreviewGestureSound: (gestureName: string) => void;
  neonGlowEnabled: boolean;
  onToggleNeonGlow: () => void;
  rainbowBeamsEnabled: boolean;
  onToggleRainbowBeams: () => void;
  particlesEnabled: boolean;
  onToggleParticles: () => void;
  onResetDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  audioSettings,
  onUpdateAudioSettings,
  onPreviewGestureSound,
  neonGlowEnabled,
  onToggleNeonGlow,
  rainbowBeamsEnabled,
  onToggleRainbowBeams,
  particlesEnabled,
  onToggleParticles,
  onResetDefaults,
}) => {
  if (!isOpen) return null;

  const gestures = [
    { name: 'Open Hand', icon: '🖐️', tag: 'Neon Green' },
    { name: 'Fist', icon: '✊', tag: 'Neon Pink' },
    { name: 'Pointing Finger', icon: '👉', tag: 'Neon Yellow' },
    { name: 'Pinch', icon: '👌', tag: 'Electric Blue' },
    { name: 'Partial Hand', icon: '✌️', tag: 'Neon Violet' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-2xl bg-[#070718] border border-purple-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-purple-950/60 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-[#00D9FF]" />
            </div>
            <div>
              <h2 id="settings-dialog-title" className="font-cyber font-bold text-base text-white tracking-wider uppercase">
                System & Audio Configuration
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Calibrate gesture sound pulses, synthesizer volume, and visual shaders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="py-5 space-y-6">
          
          {/* SECTION 1: GESTURE AUDIO FEEDBACK SYSTEM */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-cyber font-bold text-sm text-white tracking-wider uppercase flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#00FF9D]" />
                  <span>Gesture Audio Feedback System</span>
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Distinct, futuristic audio cues emitted instantly when an AI gesture locks
                </p>
              </div>

              {/* Toggle Gesture Audio */}
              <button
                onClick={() =>
                  onUpdateAudioSettings({
                    gestureFeedbackEnabled: !audioSettings.gestureFeedbackEnabled,
                  })
                }
                role="switch"
                aria-checked={audioSettings.gestureFeedbackEnabled}
                aria-label="Toggle Gesture Audio Feedback"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer border ${
                  audioSettings.gestureFeedbackEnabled
                    ? 'bg-[#00FF9D]/30 border-[#00FF9D]'
                    : 'bg-slate-900 border-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                    audioSettings.gestureFeedbackEnabled
                      ? 'translate-x-6 bg-[#00FF9D]'
                      : 'translate-x-1 bg-slate-500'
                  }`}
                />
              </button>
            </div>

            {/* Gesture Sound Pulse Matrix & Preview Buttons */}
            <div className="space-y-2 rounded-2xl p-3 bg-black/40 border border-white/5">
              {gestures.map((g) => {
                const profile = GESTURE_SOUND_PROFILES[g.name];
                return (
                  <div
                    key={g.name}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-white/5 hover:border-purple-500/30 transition-all text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl shrink-0">{g.icon}</span>
                      <div>
                        <div className="font-cyber font-bold text-slate-200">
                          {g.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {profile?.name} · <span className="text-slate-500">{profile?.description}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onPreviewGestureSound(g.name)}
                      title={`Preview ${g.name} sound`}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-purple-500/30 hover:border-cyan-400 text-cyan-300 hover:text-white transition-all text-[11px] flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Preview</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: AUDIO ENGINE CONTROLS */}
          <div className="space-y-3 pt-3 border-t border-purple-500/10">
            <h3 className="font-cyber font-bold text-sm text-white tracking-wider uppercase flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#00D9FF]" />
              <span>Audio Synthesis Parameters</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              {/* Master Audio Toggle */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">Master Sound</div>
                  <div className="text-[11px] text-slate-400">Global mute switch</div>
                </div>
                <button
                  onClick={() =>
                    onUpdateAudioSettings({
                      masterEnabled: !audioSettings.masterEnabled,
                    })
                  }
                  className={`px-2.5 py-1 rounded-lg border font-mono text-xs transition-colors cursor-pointer ${
                    audioSettings.masterEnabled
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  {audioSettings.masterEnabled ? 'ACTIVE' : 'MUTED'}
                </button>
              </div>

              {/* Interactive UI Hover Sound Toggle */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">UI Hover Tones</div>
                  <div className="text-[11px] text-slate-400">Micro-pulses on hover</div>
                </div>
                <button
                  onClick={() =>
                    onUpdateAudioSettings({
                      hoverSoundEnabled: !audioSettings.hoverSoundEnabled,
                    })
                  }
                  role="switch"
                  aria-checked={audioSettings.hoverSoundEnabled}
                  aria-label="Toggle Interactive UI Hover Sounds"
                  className={`px-2.5 py-1 rounded-lg border font-mono text-xs transition-colors cursor-pointer ${
                    audioSettings.hoverSoundEnabled
                      ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  {audioSettings.hoverSoundEnabled ? 'ENABLED' : 'OFF'}
                </button>
              </div>

              {/* Air Canvas Theremin Hum Toggle */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">Air Theremin</div>
                  <div className="text-[11px] text-slate-400">Y-axis modulation</div>
                </div>
                <button
                  onClick={() =>
                    onUpdateAudioSettings({
                      thereminEnabled: !audioSettings.thereminEnabled,
                    })
                  }
                  className={`px-2.5 py-1 rounded-lg border font-mono text-xs transition-colors cursor-pointer ${
                    audioSettings.thereminEnabled
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  {audioSettings.thereminEnabled ? 'ENABLED' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Master Volume Slider */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold">Master Audio Volume</span>
                <span className="text-cyan-300 font-mono-tabular font-bold">
                  {audioSettings.volume}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={audioSettings.volume}
                onChange={(e) =>
                  onUpdateAudioSettings({ volume: parseInt(e.target.value, 10) })
                }
                className="w-full accent-[#00D9FF] cursor-pointer"
              />
            </div>
          </div>

          {/* SECTION 3: VISUAL ENGINE SHADERS */}
          <div className="space-y-3 pt-3 border-t border-purple-500/10">
            <h3 className="font-cyber font-bold text-sm text-white tracking-wider uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FFE83A]" />
              <span>Visual Shaders & Kinematic FX</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <button
                onClick={onToggleNeonGlow}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  neonGlowEnabled
                    ? 'bg-purple-950/40 border-purple-400 text-purple-200 shadow-sm shadow-purple-500/20'
                    : 'bg-black/40 border-white/5 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">Neon Glow</span>
                  {neonGlowEnabled && <Check className="w-3.5 h-3.5 text-[#FF35C8]" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Multi-pass shadow blur</div>
              </button>

              <button
                onClick={onToggleRainbowBeams}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  rainbowBeamsEnabled
                    ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/20'
                    : 'bg-black/40 border-white/5 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">Rainbow Beams</span>
                  {rainbowBeamsEnabled && <Check className="w-3.5 h-3.5 text-[#00D9FF]" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">5-channel fingertip laser arcs</div>
              </button>

              <button
                onClick={onToggleParticles}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  particlesEnabled
                    ? 'bg-yellow-950/40 border-yellow-400 text-yellow-200 shadow-sm shadow-yellow-500/20'
                    : 'bg-black/40 border-white/5 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">Particle Sparks</span>
                  {particlesEnabled && <Check className="w-3.5 h-3.5 text-[#FFE83A]" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Contact sparks & drift nodes</div>
              </button>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
          <button
            onClick={onResetDefaults}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-white transition-colors text-xs font-mono flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#00D9FF] text-[#050510] font-cyber font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-cyan-500/25"
          >
            Apply & Close
          </button>
        </div>

      </div>
    </div>
  );
};
