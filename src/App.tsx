/**
 * HANDCONNECT
 * Real-Time AI Hand Tracking & Gesture Recognition System
 * 
 * Powered by Google MediaPipe Hands, HTML5 Canvas, and WebRTC
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { TrackingControls } from './components/TrackingControls';
import { HandCanvas, HandCanvasHandle } from './components/HandCanvas';
import { AnalyticsHUD } from './components/AnalyticsHUD';
import { GestureHistory } from './components/GestureHistory';
import { HeroGuide } from './components/HeroGuide';
import { CameraStatus, HandData, TrackingStatus, SystemStats, GestureHistoryItem, AudioSettings } from './types';
import { distance2D } from './utils/gestureMath';
import { AirCanvasEngine } from './utils/airCanvasMath';
import { cyberAudio } from './utils/cyberAudio';
import { SettingsModal } from './components/SettingsModal';
import { CyberStrikeGame } from './game/CyberStrikeGame';

export default function App() {
  const [appMode, setAppMode] = useState<'app' | 'game'>('app');
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [neonGlowEnabled, setNeonGlowEnabled] = useState<boolean>(true);
  const [rainbowBeamsEnabled, setRainbowBeamsEnabled] = useState<boolean>(true);
  const [particlesEnabled, setParticlesEnabled] = useState<boolean>(true);
  const [activeThemeId, setActiveThemeId] = useState<string>('cyberpunk');
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Air Canvas & Cyber Audio State
  const airCanvasEngineRef = useRef<AirCanvasEngine>(new AirCanvasEngine());
  const handCanvasRef = useRef<HandCanvasHandle | null>(null);
  const [airCanvasEnabled, setAirCanvasEnabled] = useState<boolean>(true);
  const [brushColor, setBrushColor] = useState<string>('#00D9FF');
  const [brushWidth, setBrushWidth] = useState<number>(6);
  const [strokeCount, setStrokeCount] = useState<number>(0);

  // Audio Feedback & Sound Pulse Settings
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    masterEnabled: false, // Starts muted by default per standard web audio policy
    gestureFeedbackEnabled: true,
    thereminEnabled: true,
    hoverSoundEnabled: true,
    volume: 35,
  });

  // Live Tracking Stats
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('OFFLINE');
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>('STANDBY');
  const [fps, setFps] = useState<number>(0);
  const [leftHand, setLeftHand] = useState<HandData | null>(null);
  const [rightHand, setRightHand] = useState<HandData | null>(null);
  const [history, setHistory] = useState<GestureHistoryItem[]>([]);

  // Check URL parameters on mount (?autostart=1 or ?simulate=1 or ?mode=game)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'game' || params.get('game') === '1') {
      setAppMode('game');
      setIsSimulated(true);
      setIsTracking(true);
    } else if (params.get('simulate') === '1') {
      setIsSimulated(true);
      setIsTracking(true);
    } else if (params.get('autostart') === '1') {
      setIsTracking(true);
    }
  }, []);

  // Listen for fullscreenchange
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Exit fullscreen failed:', err);
      });
    }
  };

  const handleToggleTracking = () => {
    setIsTracking((prev) => !prev);
  };

  const handleToggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleHandsUpdate = useCallback(
    (left: HandData | null, right: HandData | null, currentFps: number) => {
      setLeftHand(left);
      setRightHand(right);
      setFps(currentFps);
      setStrokeCount(airCanvasEngineRef.current.getStrokeCount());
    },
    []
  );

  const handleGestureDetected = useCallback(
    (hand: 'Left' | 'Right', gesture: string, confidence: number) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const newItem: GestureHistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: timeStr,
        hand,
        gesture,
        confidence,
      };
      setHistory((prev) => [newItem, ...prev.slice(0, 40)]);
    },
    []
  );

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleUndoStroke = () => {
    airCanvasEngineRef.current.undo();
    setStrokeCount(airCanvasEngineRef.current.getStrokeCount());
  };

  const handleClearCanvas = () => {
    airCanvasEngineRef.current.clear();
    setStrokeCount(0);
    handCanvasRef.current?.triggerWipeShockwave();
  };

  const handleCaptureSnapshot = () => {
    handCanvasRef.current?.captureSnapshot();
  };

  // Global interactive element hover listener for futuristic audio feedback
  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest(
        'button, [role="switch"], select, input[type="range"], a[href], [role="button"]'
      );
      if (target) {
        cyberAudio.playHoverSound();
      }
    };

    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  const handleUpdateAudioSettings = (partial: Partial<AudioSettings>) => {
    setAudioSettings((prev) => {
      const next = { ...prev, ...partial };
      if (partial.masterEnabled !== undefined) {
        cyberAudio.setEnabled(partial.masterEnabled);
      }
      if (partial.gestureFeedbackEnabled !== undefined) {
        cyberAudio.setGestureFeedbackEnabled(partial.gestureFeedbackEnabled);
      }
      if (partial.thereminEnabled !== undefined) {
        cyberAudio.setThereminEnabled(partial.thereminEnabled);
      }
      if (partial.hoverSoundEnabled !== undefined) {
        cyberAudio.setHoverSoundEnabled(partial.hoverSoundEnabled);
      }
      if (partial.volume !== undefined) {
        cyberAudio.setVolume(partial.volume / 100);
      }
      return next;
    });
  };

  const handlePreviewGestureSound = (gestureName: string) => {
    cyberAudio.playGestureSound(gestureName, true);
  };

  const handleResetDefaults = () => {
    handleUpdateAudioSettings({
      masterEnabled: true,
      gestureFeedbackEnabled: true,
      thereminEnabled: true,
      hoverSoundEnabled: true,
      volume: 35,
    });
    setNeonGlowEnabled(true);
    setRainbowBeamsEnabled(true);
    setParticlesEnabled(true);
    setActiveThemeId('cyberpunk');
  };

  const handleToggleAudio = () => {
    handleUpdateAudioSettings({ masterEnabled: !audioSettings.masterEnabled });
  };

  // Derive consolidated system stats
  const handsDetected = (leftHand ? 1 : 0) + (rightHand ? 1 : 0);
  const avgConfidence =
    handsDetected === 2
      ? ((leftHand?.confidence || 0) + (rightHand?.confidence || 0)) / 2
      : leftHand
      ? leftHand.confidence
      : rightHand
      ? rightHand.confidence
      : 0;

  const primaryGesture =
    leftHand && rightHand
      ? `${leftHand.gesture.name} + ${rightHand.gesture.name}`
      : leftHand
      ? leftHand.gesture.name
      : rightHand
      ? rightHand.gesture.name
      : 'None';

  const fingerSpreadPct =
    handsDetected === 2
      ? Math.round(((leftHand?.fingerSpread || 0) + (rightHand?.fingerSpread || 0)) / 2)
      : leftHand
      ? leftHand.fingerSpread
      : rightHand
      ? rightHand.fingerSpread
      : 0;

  // Approximate distance between wrists or palms in centimeters (assuming 60cm base frame)
  let distanceBetweenHands: number | null = null;
  if (leftHand && rightHand) {
    const normDist = distance2D(leftHand.landmarks[0], rightHand.landmarks[0]);
    distanceBetweenHands = Number((normDist * 75).toFixed(1)); // Approx cm
  }

  const systemStats: SystemStats = {
    fps,
    handsDetected,
    avgConfidence,
    primaryGesture,
    fingerSpreadPct,
    cameraStatus,
    trackingStatus,
    distanceBetweenHands,
  };

  return (
    <>
      {/* Standard Hand Vision Laboratory View (Active when appMode === 'app') */}
      <div className={appMode === 'game' ? 'hidden pointer-events-none' : 'min-h-screen bg-[#050510] text-slate-100 flex flex-col'}>
        {/* Top Navigation Bar */}
        <Navbar
          cameraStatus={cameraStatus}
          trackingStatus={trackingStatus}
          isTracking={isTracking}
          isFullscreen={isFullscreen}
          onToggleTracking={handleToggleTracking}
          onToggleFullscreen={handleToggleFullscreen}
          onEnterGame={() => setAppMode('game')}
        />

        {/* Main App Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Interactive Controls Toolbar */}
          <TrackingControls
            isTracking={isTracking}
            onToggleTracking={handleToggleTracking}
            facingMode={facingMode}
            onToggleCameraFacing={handleToggleCameraFacing}
            neonGlowEnabled={neonGlowEnabled}
            onToggleNeonGlow={() => setNeonGlowEnabled((v) => !v)}
            rainbowBeamsEnabled={rainbowBeamsEnabled}
            onToggleRainbowBeams={() => setRainbowBeamsEnabled((v) => !v)}
            particlesEnabled={particlesEnabled}
            onToggleParticles={() => setParticlesEnabled((v) => !v)}
            activeThemeId={activeThemeId}
            onSelectTheme={setActiveThemeId}
            isSimulated={isSimulated}
            onToggleSimulated={() => {
              setIsSimulated((prev) => {
                const next = !prev;
                if (next) setIsTracking(true);
                return next;
              });
            }}
            airCanvasEnabled={airCanvasEnabled}
            onToggleAirCanvas={() => setAirCanvasEnabled((v) => !v)}
            brushColor={brushColor}
            onChangeBrushColor={setBrushColor}
            brushWidth={brushWidth}
            onChangeBrushWidth={setBrushWidth}
            onUndoStroke={handleUndoStroke}
            onClearCanvas={handleClearCanvas}
            strokeCount={strokeCount}
            audioEnabled={audioSettings.masterEnabled}
            onToggleAudio={handleToggleAudio}
            onCaptureSnapshot={handleCaptureSnapshot}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onEnterGame={() => setAppMode('game')}
          />

          {/* Real-Time HTML5 Hand Tracking Canvas Stage */}
          <HandCanvas
            ref={handCanvasRef}
            isTracking={isTracking}
            facingMode={facingMode}
            neonGlowEnabled={neonGlowEnabled}
            rainbowBeamsEnabled={rainbowBeamsEnabled}
            particlesEnabled={particlesEnabled}
            activeThemeId={activeThemeId}
            isSimulated={isSimulated}
            airCanvasEnabled={airCanvasEnabled}
            brushColor={brushColor}
            brushWidth={brushWidth}
            airCanvasEngine={airCanvasEngineRef.current}
            onCameraStatusChange={setCameraStatus}
            onTrackingStatusChange={setTrackingStatus}
            onHandsUpdate={handleHandsUpdate}
            onGestureDetected={handleGestureDetected}
            onRequestStartTracking={() => setIsTracking(true)}
          />

          {/* Live Cyber Analytics HUD */}
          <AnalyticsHUD
            stats={systemStats}
            leftHand={leftHand}
            rightHand={rightHand}
          />

          {/* Split Section: Gesture History Log & Architecture Guide */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <GestureHistory
                history={history}
                onClearHistory={handleClearHistory}
              />
            </div>
            <div className="lg:col-span-2">
              <HeroGuide />
            </div>
          </div>

        </main>

        {/* Futuristic Footer */}
        <footer className="border-t border-purple-900/20 bg-[#04040d] py-6 px-4 mt-12">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-cyber font-bold text-slate-300">HANDCONNECT</span>
              <span>·</span>
              <span>Real-Time AI Hand Tracking & Gesture Recognition</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>MediaPipe Hands Kinematics</span>
              <span>·</span>
              <span>HTML5 Canvas 2D</span>
              <span>·</span>
              <span>100% Local Inference</span>
            </div>
          </div>
        </footer>

        {/* System & Audio Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          audioSettings={audioSettings}
          onUpdateAudioSettings={handleUpdateAudioSettings}
          onPreviewGestureSound={handlePreviewGestureSound}
          neonGlowEnabled={neonGlowEnabled}
          onToggleNeonGlow={() => setNeonGlowEnabled((v) => !v)}
          rainbowBeamsEnabled={rainbowBeamsEnabled}
          onToggleRainbowBeams={() => setRainbowBeamsEnabled((v) => !v)}
          particlesEnabled={particlesEnabled}
          onToggleParticles={() => setParticlesEnabled((v) => !v)}
          onResetDefaults={handleResetDefaults}
        />
      </div>

      {/* Full-Viewport Game Shell (Zero Website Navbars or Footers Rendered) */}
      {appMode === 'game' && (
        <CyberStrikeGame
          onExitGame={() => setAppMode('app')}
          leftHand={leftHand}
          rightHand={rightHand}
          isCameraActive={isTracking}
          onRequestToggleCamera={handleToggleTracking}
        />
      )}
    </>
  );
}
