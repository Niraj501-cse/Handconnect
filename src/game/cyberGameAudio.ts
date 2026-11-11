/**
 * CYBER STRIKE: NEON DEFENDER - Procedural Sound Synth Engine
 * Pure browser-native Web Audio API synthesizer for punchy game audio:
 * - Blade slice swoosh
 * - Core explosion
 * - Heavy shield impact
 * - EMP shockwave sub-rumble
 * - Combo multiplier chime
 * - Core damage warning
 * - Victory fanfare & Game Over descent
 */

export class CyberGameAudio {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  public volume: number = 0.4;

  constructor() {}

  private init(): boolean {
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
      return true;
    } catch {
      return false;
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public play(event: 'slice' | 'explosion' | 'heavy_hit' | 'emp' | 'combo' | 'hurt' | 'game_over' | 'victory'): void {
    if (this.isMuted) return;
    if (!this.init() || !this.ctx) return;

    const now = this.ctx.currentTime;

    try {
      switch (event) {
        case 'slice': {
          // Sharp, fast laser cut
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1400, now);
          osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1100, now);
          filter.Q.setValueAtTime(3, now);

          gain.gain.setValueAtTime(0.18 * this.volume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.1);
          break;
        }

        case 'heavy_hit': {
          // Deep metallic shield ding
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(380, now);
          osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

          gain.gain.setValueAtTime(0.2 * this.volume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.14);
          break;
        }

        case 'explosion': {
          // Punchy crunchy explosion
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(240, now);
          osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);

          gain.gain.setValueAtTime(0.25 * this.volume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }

        case 'emp': {
          // Massive sub-bass electronic sweep
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(680, now);
          osc.frequency.exponentialRampToValueAtTime(50, now + 0.45);

          gain.gain.setValueAtTime(0.35 * this.volume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.5);
          break;
        }

        case 'combo': {
          // Sparkling ascending crystal chime
          const notes = [587.33, 739.99, 880, 1174.66];
          notes.forEach((freq, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.04);

            gain.gain.setValueAtTime(0.12 * this.volume, now + idx * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.04);
            osc.stop(now + idx * 0.04 + 0.24);
          });
          break;
        }

        case 'hurt': {
          // Alarm tone for breach
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(120, now);
          osc.frequency.setValueAtTime(80, now + 0.08);

          gain.gain.setValueAtTime(0.3 * this.volume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        }

        case 'game_over': {
          // Descending loss cadence
          const freqs = [350, 290, 220, 140];
          freqs.forEach((freq, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);

            gain.gain.setValueAtTime(0.18 * this.volume, now + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.28);
          });
          break;
        }

        case 'victory': {
          // Triumphant cyber arpeggio
          const chord = [523.25, 659.25, 783.99, 1046.5];
          chord.forEach((freq, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0.2 * this.volume, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.42);
          });
          break;
        }
      }
    } catch {}
  }
}

export const cyberGameAudio = new CyberGameAudio();
