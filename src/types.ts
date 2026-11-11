/**
 * HANDCONNECT - System Types & State Interfaces
 */

import { GestureDetectionResult, Landmark } from './utils/gestureMath';

export type CameraStatus = 'OFFLINE' | 'REQUESTING' | 'ACTIVE' | 'ERROR' | 'UNAVAILABLE';
export type TrackingStatus = 'STANDBY' | 'SEARCHING' | 'TRACKING_1_HAND' | 'LOCKED_2_HANDS';

export interface ThemePreset {
  id: string;
  name: string;
  leftHandColor: string;
  leftHandGlow: string;
  rightHandColor: string;
  rightHandGlow: string;
  beamGlowBoost: number;
}

export interface HandData {
  landmarks: Landmark[];
  handedness: 'Left' | 'Right';
  gesture: GestureDetectionResult;
  fingerSpread: number;
  confidence: number;
}

export interface GestureHistoryItem {
  id: string;
  timestamp: string;
  hand: 'Left' | 'Right';
  gesture: string;
  confidence: number;
}

export interface AirCanvasSettings {
  enabled: boolean;
  brushColor: string;
  brushWidth: number;
  strokeCount: number;
}

export interface AudioSettings {
  masterEnabled: boolean;
  gestureFeedbackEnabled: boolean;
  thereminEnabled: boolean;
  hoverSoundEnabled: boolean;
  volume: number; // 0 to 100
}

export interface SystemStats {
  fps: number;
  handsDetected: number;
  avgConfidence: number;
  primaryGesture: string;
  fingerSpreadPct: number;
  cameraStatus: CameraStatus;
  trackingStatus: TrackingStatus;
  distanceBetweenHands: number | null; // in cm or normalized
}
