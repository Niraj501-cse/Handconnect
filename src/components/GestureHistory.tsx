import React from 'react';
import { GestureHistoryItem } from '../types';
import { History, Trash2, Clock, CheckCircle2 } from 'lucide-react';

interface GestureHistoryProps {
  history: GestureHistoryItem[];
  onClearHistory: () => void;
}

export const GestureHistory: React.FC<GestureHistoryProps> = ({
  history,
  onClearHistory,
}) => {
  const getGestureColor = (name: string) => {
    switch (name) {
      case 'Open Hand':
        return 'text-[#00FF9D] border-[#00FF9D]/30 bg-[#00FF9D]/10';
      case 'Fist':
        return 'text-[#FF35C8] border-[#FF35C8]/30 bg-[#FF35C8]/10';
      case 'Pointing Finger':
        return 'text-[#FFE83A] border-[#FFE83A]/30 bg-[#FFE83A]/10';
      case 'Pinch':
        return 'text-[#00D9FF] border-[#00D9FF]/30 bg-[#00D9FF]/10';
      default:
        return 'text-[#9B5CFF] border-[#9B5CFF]/30 bg-[#9B5CFF]/10';
    }
  };

  return (
    <section id="gesture-history" aria-label="Gesture History Log" className="w-full glass-panel rounded-2xl p-4 sm:p-5 border border-purple-900/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#9B5CFF]" />
          <h2 className="font-cyber font-bold text-sm tracking-wider uppercase text-white">
            AI Gesture Event Telemetry Log
          </h2>
          <span className="text-xs font-mono text-slate-400">({history.length} events)</span>
        </div>
        <button
          onClick={onClearHistory}
          disabled={history.length === 0}
          className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8 rounded-xl bg-black/20 border border-white/5">
          <Clock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
          <div className="text-xs font-mono text-slate-400">No gesture transitions captured yet</div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            Perform an Open Hand, Fist, Pointing, or Pinch in front of the camera
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {history.slice(0, 15).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-black/30 border border-white/5 hover:border-purple-500/30 transition-all text-xs font-mono"
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-[11px] font-mono-tabular">
                  {item.timestamp}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    item.hand === 'Left'
                      ? 'text-[#FF35C8] bg-[#FF35C8]/10 border border-[#FF35C8]/30'
                      : 'text-[#FFE83A] bg-[#FFE83A]/10 border border-[#FFE83A]/30'
                  }`}
                >
                  {item.hand.toUpperCase()} HAND
                </span>
                <span className={`px-2 py-0.5 rounded-md border font-semibold ${getGestureColor(item.gesture)}`}>
                  {item.gesture}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="font-mono-tabular">{item.confidence}% Conf</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
