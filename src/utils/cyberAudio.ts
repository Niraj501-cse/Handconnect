/**
 * HANDCONNECT - Cyber Sound Engine
 * Uses the Web Audio API for interactive sci-fi audio feedback:
 * - Subtle, futuristic sound pulses on successful gesture recognition
 * - Air drawing theremin hum
 * - Magnetic pinch clicks
 * - Rainbow beam harmonic resonance
 * - Energy wipe shockwaves
 */

export interface SoundProfile {
  name: string;
  description: string;
  waveform: OscillatorType;
  baseFreq: number;
  durationMs: number;
}

export const GESTURE_SOUND_PROFILES: Record<string, SoundProfile> = {
  'Open Hand': {
    name: 'Expansive Harmonic Chime',
    description: 'Soft dual-frequency crystal chime symbolizing open extension',
    waveform: 'sine',
    baseFreq: 523.25, // C5
    durationMs: 240,
  },
  'Fist': {
    name: 'Tactile Cyber Thud',
    description: 'Low-frequency resonant bass pulse denoting closed grip',
    waveform: 'sine',
    baseFreq: 150,
    durationMs: 160,
  },
  'Pointing Finger': {
    name: 'Targeting Laser Pip',
    description: 'Crisp, focused high-frequency targeting blip',
    waveform: 'triangle',
    baseFreq: 1180,
    durationMs: 90,
  },
  'Pinch': {
    name: 'Magnetic Lock Double Chirp',
    description: 'Rapid precision dual-chirp signaling digit contact',
    waveform: 'sine',
    baseFreq: 960,
    durationMs: 110,
  },
  'Partial Hand': {
    name: 'Ascending Dual Pulse',
    description: 'Rhythmic two-tone chord signaling transitional posture',
    waveform: 'triangle',
    baseFreq: 440,
    durationMs: 180,
  },
};

export class CyberAudioEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = false;
  private gestureFeedbackEnabled: boolean = true;
  private thereminEnabled: boolean = true;
  private hoverSoundEnabled: boolean = true;
  private volume: number = 0.35; // 0.0 to 1.0
  private lastHoverTime: number = 0;

  private thereminOsc: OscillatorNode | null = null;
  private thereminGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    // Lazily initialized on first user interaction
  }

  private initContext(): boolean {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (enabled) {
      this.initContext();
    } else {
      this.stopDrawingHum();
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public setGestureFeedbackEnabled(enabled: boolean): void {
    this.gestureFeedbackEnabled = enabled;
  }

  public getGestureFeedbackEnabled(): boolean {
    return this.gestureFeedbackEnabled;
  }

  public setThereminEnabled(enabled: boolean): void {
    this.thereminEnabled = enabled;
    if (!enabled) {
      this.stopDrawingHum();
    }
  }

  public getThereminEnabled(): boolean {
    return this.thereminEnabled;
  }

  public setHoverSoundEnabled(enabled: boolean): void {
    this.hoverSoundEnabled = enabled;
  }

  public getHoverSoundEnabled(): boolean {
    return this.hoverSoundEnabled;
  }

  /**
   * Subtle, futuristic micro-tone hover pulse for interactive elements.
   * Throttled by 45ms to avoid acoustic clutter during fast cursor sweeps.
   * Strictly controlled by the master audio toggle and hover sound setting.
   */
  public playHoverSound(): void {
    if (!this.isEnabled || !this.hoverSoundEnabled) return;

    const nowPerf = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (nowPerf - this.lastHoverTime < 45) return;
    this.lastHoverTime = nowPerf;

    if (!this.initContext() || !this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // High-tech subtle cyber blip with gentle frequency dip
      osc.frequency.setValueAtTime(2200, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.026);

      // Soft envelope (3ms linear attack, 25ms exponential decay) to prevent clipping
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch {}
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Play distinct, subtle futuristic sound pulse for recognized gestures
   */
  public playGestureSound(gestureName: string, forcePreview: boolean = false): void {
    // Check master enable and gesture feedback toggle
    if (!forcePreview && (!this.isEnabled || !this.gestureFeedbackEnabled)) {
      return;
    }
    if (!this.initContext() || !this.ctx || !this.masterGain) return;

    const profile = GESTURE_SOUND_PROFILES[gestureName] || GESTURE_SOUND_PROFILES['Partial Hand'];
    const now = this.ctx.currentTime;

    try {
      if (gestureName === 'Open Hand') {
        // Expansive soft harmonic dual-chime
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc2.frequency.setValueAtTime(659.25, now); // E5

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.23);
        osc2.stop(now + 0.23);

      } else if (gestureName === 'Fist') {
        // Tactile punchy sub-bass pulse
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(155, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.12);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.15);

      } else if (gestureName === 'Pointing Finger') {
        // Crisp high-tech laser targeting pip
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1240, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, now);
        filter.Q.setValueAtTime(4, now);

        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.1);

      } else if (gestureName === 'Pinch') {
        // High-tech magnetic double chirp
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(940, now);
        gain1.gain.setValueAtTime(0.18, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.start(now);
        osc1.stop(now + 0.05);

        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1480, now + 0.055);
        gain2.gain.setValueAtTime(0.2, now + 0.055);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start(now + 0.055);
        osc2.stop(now + 0.12);

      } else {
        // Partial Hand: Ascending cyber two-tone pulse
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(587.33, now + 0.07);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.19);
      }
    } catch {}
  }

  /**
   * Continuous cyber hum while air drawing (frequency modulated by fingertip Y)
   */
  public updateDrawingHum(normalizedY: number): void {
    if (!this.isEnabled || !this.thereminEnabled || !this.initContext() || !this.ctx || !this.masterGain) return;

    const targetFreq = 220 + (1 - normalizedY) * 380;

    if (!this.thereminOsc) {
      this.thereminOsc = this.ctx.createOscillator();
      this.thereminOsc.type = 'sine';
      this.thereminOsc.frequency.setValueAtTime(targetFreq, this.ctx.currentTime);

      this.thereminGain = this.ctx.createGain();
      this.thereminGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.thereminGain.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 0.08);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

      this.thereminOsc.connect(filter);
      filter.connect(this.thereminGain);
      this.thereminGain.connect(this.masterGain);

      this.thereminOsc.start();
    } else {
      this.thereminOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.04);
    }
  }

  public stopDrawingHum(): void {
    if (this.thereminOsc && this.thereminGain && this.ctx) {
      try {
        this.thereminGain.gain.setValueAtTime(this.thereminGain.gain.value, this.ctx.currentTime);
        this.thereminGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);
        const osc = this.thereminOsc;
        setTimeout(() => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        }, 90);
      } catch {}
      this.thereminOsc = null;
      this.thereminGain = null;
    }
  }

  /**
   * High-tech cyber lock chirp when Pinch gesture occurs
   */
  public playPinchChirp(): void {
    this.playGestureSound('Pinch');
  }

  /**
   * Resonant low-frequency cyber shockwave when canvas is wiped
   */
  public playWipeSound(): void {
    if (!this.isEnabled || !this.initContext() || !this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {}
  }

  /**
   * Ethereal harmonic chime when 5 rainbow beams bridge both hands
   */
  public playRainbowResonance(): void {
    if (!this.isEnabled || !this.initContext() || !this.ctx || !this.masterGain) return;

    try {
      const freqs = [330, 440, 554, 659, 880];
      const now = this.ctx.currentTime;

      freqs.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.03);

        gain.gain.setValueAtTime(0.06, now + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.03);
        osc.stop(now + 0.5);
      });
    } catch {}
  }
}

export const cyberAudio = new CyberAudioEngine();
