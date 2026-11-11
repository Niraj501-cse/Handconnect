import React from 'react';
import { RAINBOW_COLORS } from '../utils/gestureMath';
import { Hand, Shield, Cpu, Sparkles, Move, Zap, Crosshair } from 'lucide-react';

export const HeroGuide: React.FC = () => {
  const gestures = [
    {
      name: 'Open Hand',
      desc: 'All 5 digits fully extended and spaced apart.',
      visual: '🖐️',
      color: 'text-[#00FF9D]',
      borderColor: 'border-[#00FF9D]/30',
      bgGlow: 'bg-[#00FF9D]/5',
    },
    {
      name: 'Fist',
      desc: 'All 4 fingers clenched down into palm, thumb locked.',
      visual: '✊',
      color: 'text-[#FF35C8]',
      borderColor: 'border-[#FF35C8]/30',
      bgGlow: 'bg-[#FF35C8]/5',
    },
    {
      name: 'Pointing Finger',
      desc: 'Index finger extended forward; middle, ring, pinky tucked.',
      visual: '👉',
      color: 'text-[#FFE83A]',
      borderColor: 'border-[#FFE83A]/30',
      bgGlow: 'bg-[#FFE83A]/5',
    },
    {
      name: 'Pinch',
      desc: 'Thumb tip and index tip in close proximity or contact.',
      visual: '👌',
      color: 'text-[#00D9FF]',
      borderColor: 'border-[#00D9FF]/30',
      bgGlow: 'bg-[#00D9FF]/5',
    },
    {
      name: 'Partial Hand',
      desc: 'Transitional postures such as Peace / Victory or Rock sign.',
      visual: '✌️',
      color: 'text-[#9B5CFF]',
      borderColor: 'border-[#9B5CFF]/30',
      bgGlow: 'bg-[#9B5CFF]/5',
    },
  ];

  return (
    <div id="gesture-guide" className="w-full space-y-6">
      
      {/* Hero Section */}
      <div className="relative glass-panel rounded-3xl p-6 sm:p-8 lg:p-10 border border-purple-500/20 overflow-hidden">
        {/* Subtle decorative radial glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#9B5CFF]/15 via-[#00D9FF]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#FF35C8]/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-mono tracking-wider mb-4">
            <Cpu className="w-3.5 h-3.5 text-[#00D9FF]" />
            <span>NEURAL VISION ARCHITECTURE</span>
          </div>

          <h1 className="font-cyber font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
            HAND<span className="text-[#00D9FF]">CONNECT</span>
          </h1>
          <p className="font-cyber text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-cyan-200 to-pink-300 mt-2 font-semibold">
            "Your Hands. Your Commands. Your Digital World."
          </p>

          <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed font-sans max-w-2xl">
            Experience next-generation computer vision right inside your browser. HandConnect uses
            Google MediaPipe Hands to isolate 21 3D landmarks per hand at up to 60 FPS, projecting
            luminous neon skeletons, multi-color rainbow fingertip beams, and real-time kinematic telemetry.
          </p>

          {/* Core Feature Badges */}
          <div className="mt-6 flex flex-wrap gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-200">
              <Zap className="w-3.5 h-3.5 text-[#FF35C8]" />
              <span>21 3D Landmarks / Hand</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-[#FFE83A]" />
              <span>5-Channel Rainbow Beams</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-cyan-500/30 text-cyan-200">
              <Crosshair className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span>Mid-Air Neon Drawing</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 AI Gestures Matrix */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-cyber font-bold text-lg text-white tracking-wider uppercase flex items-center gap-2">
              <Hand className="w-5 h-5 text-[#00D9FF]" />
              <span>5 AI Gesture Recognition Matrix</span>
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Kinematic joint angle and fingertip distance calculation without simulated results
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {gestures.map((g) => (
            <div
              key={g.name}
              className={`glass-panel rounded-2xl p-4 border ${g.borderColor} ${g.bgGlow} transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{g.visual}</span>
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${g.borderColor} ${g.color}`}>
                    Active
                  </span>
                </div>
                <h3 className={`font-cyber font-bold text-sm tracking-wide mt-3 ${g.color}`}>
                  {g.name}
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-1.5 leading-relaxed">
                  {g.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rainbow Fingertip Beam Channels Grid */}
      <div className="glass-panel rounded-2xl p-6 border border-purple-500/20">
        <h2 className="font-cyber font-bold text-base text-white tracking-wider uppercase flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FFE83A]" />
          <span>5-Channel Rainbow Fingertip Connection</span>
        </h2>
        <p className="text-xs font-mono text-slate-400 mt-1 mb-4">
          When both hands enter the camera frame, electric laser arcs bridge matching fingertips in real time:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {RAINBOW_COLORS.map((channel, i) => (
            <div
              key={channel.name}
              className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3"
            >
              <div
                className="w-4 h-4 rounded-full shrink-0 shadow-lg"
                style={{
                  backgroundColor: channel.color,
                  boxShadow: `0 0 12px ${channel.color}`,
                }}
              />
              <div>
                <div className="text-xs font-cyber font-bold text-white">
                  {channel.name} Tip
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Landmark #{[4, 8, 12, 16, 20][i]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy & Architecture Notice */}
      <div className="rounded-2xl p-4 bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3.5">
        <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-cyber font-bold text-emerald-300 uppercase tracking-wider">
            Browser-Only Security & Privacy Architecture
          </h4>
          <p className="text-xs font-mono text-emerald-200/80 mt-1 leading-relaxed">
            "Your camera feed is processed locally in your browser. Video is not uploaded to an external server."
            HandConnect operates strictly client-side using WebAssembly and WebGL shaders without transmitting media frames.
          </p>
        </div>
      </div>

    </div>
  );
};
