import React from 'react';
import { SystemStats, HandData } from '../types';
import { Activity, Gauge, Hand, Scan, Compass, Zap, Lock } from 'lucide-react';

interface AnalyticsHUDProps {
  stats: SystemStats;
  leftHand: HandData | null;
  rightHand: HandData | null;
}

export const AnalyticsHUD: React.FC<AnalyticsHUDProps> = ({
  stats,
  leftHand,
  rightHand,
}) => {
  // Format tracking badge
  const getTrackingBadge = () => {
    switch (stats.trackingStatus) {
      case 'LOCKED_2_HANDS':
        return { label: 'Dual Hand Lock', color: 'text-[#00FF9D] border-[#00FF9D]/40 bg-[#00FF9D]/10' };
      case 'TRACKING_1_HAND':
        return { label: 'Single Hand Lock', color: 'text-[#00D9FF] border-[#00D9FF]/40 bg-[#00D9FF]/10' };
      case 'SEARCHING':
        return { label: 'Scanning Field...', color: 'text-[#FFE83A] border-[#FFE83A]/40 bg-[#FFE83A]/10 animate-pulse' };
      default:
        return { label: 'Standby / Offline', color: 'text-slate-400 border-slate-700 bg-slate-900/40' };
    }
  };

  const badge = getTrackingBadge();

  return (
    <section id="analytics-section" aria-label="System Telemetry HUD" className="w-full">
      {/* HUD Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Card 1: Hands Detected */}
        <div className="glass-panel rounded-2xl p-4 border border-purple-900/30 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span className="uppercase tracking-wider">Hands Tracked</span>
            <Hand className="w-3.5 h-3.5 text-[#9B5CFF]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-cyber font-bold tracking-tight text-white font-mono-tabular">
              {stats.handsDetected}
            </span>
            <span className="text-xs font-mono text-slate-400">/ 2 MAX</span>
          </div>
          <div className="mt-3 flex gap-1.5">
            <div className={`h-1.5 flex-1 rounded-full ${stats.handsDetected >= 1 ? 'bg-[#FF35C8] shadow-[0_0_8px_#FF35C8]' : 'bg-slate-800'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${stats.handsDetected >= 2 ? 'bg-[#FFE83A] shadow-[0_0_8px_#FFE83A]' : 'bg-slate-800'}`} />
          </div>
        </div>

        {/* Card 2: FPS Counter */}
        <div className="glass-panel rounded-2xl p-4 border border-cyan-900/30 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span className="uppercase tracking-wider">Engine FPS</span>
            <Activity className="w-3.5 h-3.5 text-[#00D9FF]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-cyber font-bold tracking-tight text-[#00D9FF] font-mono-tabular">
              {stats.fps}
            </span>
            <span className="text-xs font-mono text-slate-400">Hz</span>
          </div>
          <div className="mt-3 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Latency</span>
            <span className="text-cyan-300 font-mono-tabular">~{stats.fps > 0 ? (1000 / stats.fps).toFixed(1) : 0} ms</span>
          </div>
        </div>

        {/* Card 3: Finger Spread */}
        <div className="glass-panel rounded-2xl p-4 border border-yellow-900/30 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span className="uppercase tracking-wider">Finger Spread</span>
            <Gauge className="w-3.5 h-3.5 text-[#FFE83A]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-cyber font-bold tracking-tight text-[#FFE83A] font-mono-tabular">
              {stats.fingerSpreadPct}
            </span>
            <span className="text-xs font-mono text-slate-400">%</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-[#FFE83A] h-full rounded-full transition-all duration-150"
              style={{ width: `${stats.fingerSpreadPct}%` }}
            />
          </div>
        </div>

        {/* Card 4: Detection Confidence */}
        <div className="glass-panel rounded-2xl p-4 border border-emerald-900/30 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span className="uppercase tracking-wider">AI Confidence</span>
            <Scan className="w-3.5 h-3.5 text-[#00FF9D]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-cyber font-bold tracking-tight text-[#00FF9D] font-mono-tabular">
              {stats.avgConfidence.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">%</span>
          </div>
          <div className="mt-3 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Landmarks</span>
            <span className="text-emerald-300 font-mono-tabular">{stats.handsDetected * 21} pts</span>
          </div>
        </div>

        {/* Card 5: Inter-Hand Distance */}
        <div className="glass-panel rounded-2xl p-4 border border-purple-900/30 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span className="uppercase tracking-wider">Beam Distance</span>
            <Compass className="w-3.5 h-3.5 text-[#9B5CFF]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-cyber font-bold tracking-tight text-white font-mono-tabular">
              {stats.distanceBetweenHands !== null ? stats.distanceBetweenHands.toFixed(1) : '--'}
            </span>
            <span className="text-xs font-mono text-slate-400">{stats.distanceBetweenHands !== null ? 'cm' : 'N/A'}</span>
          </div>
          <div className="mt-3 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Rainbow Arc</span>
            <span className="text-purple-300">{stats.distanceBetweenHands !== null ? '5 Beams Active' : 'Waiting for 2nd Hand'}</span>
          </div>
        </div>

        {/* Card 6: System Status Pill */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-700/50 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span className="uppercase tracking-wider">Tracking Status</span>
            <Lock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold tracking-wider inline-block ${badge.color}`}>
              {badge.label}
            </div>
          </div>
          <div className="mt-3 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Video Device</span>
            <span className="text-slate-300 truncate max-w-[90px]">{stats.cameraStatus}</span>
          </div>
        </div>

      </div>

      {/* Hand Gesture Dual-Panel: Left Hand & Right Hand Real-time HUD */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left Hand HUD */}
        <div className="glass-panel rounded-2xl p-4 border border-[#FF35C8]/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF35C8] shadow-[0_0_10px_#FF35C8]" />
              <h3 className="font-cyber font-bold text-sm tracking-wider uppercase text-white">
                Left Hand Posture
              </h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#FF35C8]/10 text-[#FF35C8] border border-[#FF35C8]/30">
              {leftHand ? `CONF: ${leftHand.gesture.confidence}%` : 'NO TARGET'}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between bg-black/40 rounded-xl p-3 border border-white/5">
            <div>
              <div className="text-xl font-cyber font-bold text-white tracking-wide">
                {leftHand ? leftHand.gesture.name : 'Searching for hand...'}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                {leftHand ? leftHand.gesture.description : 'Position left hand within camera frame'}
              </div>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="text-slate-400">Spread: </span>
              <span className="text-[#FF35C8] font-bold font-mono-tabular">
                {leftHand ? `${leftHand.fingerSpread}%` : '0%'}
              </span>
            </div>
          </div>

          {/* 5 Finger Extension State Bars */}
          <div className="mt-3 grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono">
            {(['thumb', 'index', 'middle', 'ring', 'pinky'] as const).map((finger) => {
              const isExt = leftHand ? leftHand.gesture.extendedFingers[finger] : false;
              return (
                <div key={finger} className="p-1.5 rounded-lg bg-black/30 border border-white/5">
                  <div className="text-slate-400 uppercase text-[9px] truncate">{finger}</div>
                  <div className={`mt-1 font-bold ${isExt ? 'text-[#FF35C8]' : 'text-slate-600'}`}>
                    {isExt ? 'EXT' : 'CURL'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Hand HUD */}
        <div className="glass-panel rounded-2xl p-4 border border-[#FFE83A]/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FFE83A] shadow-[0_0_10px_#FFE83A]" />
              <h3 className="font-cyber font-bold text-sm tracking-wider uppercase text-white">
                Right Hand Posture
              </h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#FFE83A]/10 text-[#FFE83A] border border-[#FFE83A]/30">
              {rightHand ? `CONF: ${rightHand.gesture.confidence}%` : 'NO TARGET'}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between bg-black/40 rounded-xl p-3 border border-white/5">
            <div>
              <div className="text-xl font-cyber font-bold text-white tracking-wide">
                {rightHand ? rightHand.gesture.name : 'Searching for hand...'}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                {rightHand ? rightHand.gesture.description : 'Position right hand within camera frame'}
              </div>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="text-slate-400">Spread: </span>
              <span className="text-[#FFE83A] font-bold font-mono-tabular">
                {rightHand ? `${rightHand.fingerSpread}%` : '0%'}
              </span>
            </div>
          </div>

          {/* 5 Finger Extension State Bars */}
          <div className="mt-3 grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono">
            {(['thumb', 'index', 'middle', 'ring', 'pinky'] as const).map((finger) => {
              const isExt = rightHand ? rightHand.gesture.extendedFingers[finger] : false;
              return (
                <div key={finger} className="p-1.5 rounded-lg bg-black/30 border border-white/5">
                  <div className="text-slate-400 uppercase text-[9px] truncate">{finger}</div>
                  <div className={`mt-1 font-bold ${isExt ? 'text-[#FFE83A]' : 'text-slate-600'}`}>
                    {isExt ? 'EXT' : 'CURL'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
