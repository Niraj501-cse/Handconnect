import { ThemePreset } from '../types';

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk (Pink / Yellow)',
    leftHandColor: '#FF35C8',
    leftHandGlow: 'rgba(255, 53, 200, 0.75)',
    rightHandColor: '#FFE83A',
    rightHandGlow: 'rgba(255, 232, 58, 0.75)',
    beamGlowBoost: 1.0,
  },
  {
    id: 'matrix',
    name: 'Matrix (Green / Cyan)',
    leftHandColor: '#00FF9D',
    leftHandGlow: 'rgba(0, 255, 157, 0.8)',
    rightHandColor: '#00D9FF',
    rightHandGlow: 'rgba(0, 217, 255, 0.8)',
    beamGlowBoost: 1.2,
  },
  {
    id: 'synthwave',
    name: 'Synthwave (Violet / Coral)',
    leftHandColor: '#9B5CFF',
    leftHandGlow: 'rgba(155, 92, 255, 0.85)',
    rightHandColor: '#FF5E7E',
    rightHandGlow: 'rgba(255, 94, 126, 0.85)',
    beamGlowBoost: 1.1,
  },
  {
    id: 'solarpunk',
    name: 'Solar (Amber / Electric)',
    leftHandColor: '#FF9F1C',
    leftHandGlow: 'rgba(255, 159, 28, 0.85)',
    rightHandColor: '#2EC4B6',
    rightHandGlow: 'rgba(46, 196, 182, 0.85)',
    beamGlowBoost: 1.0,
  },
];
