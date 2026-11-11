/**
 * HANDCONNECT Particle & Visual Effects Engine
 * High-performance canvas particle system for ambient cyber dust,
 * traveling energy beams, and fingertip contact sparks.
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface BeamParticle {
  progress: number; // 0 to 1
  speed: number;
  beamIndex: number;
  size: number;
  color: string;
}

export class ParticleEngine {
  private ambientParticles: Particle[] = [];
  private sparkParticles: Particle[] = [];
  private beamParticles: BeamParticle[] = [];
  private maxSparks = 180;
  private maxAmbient = 60;

  constructor() {
    this.initAmbient(1280, 720);
  }

  public initAmbient(width: number, height: number) {
    this.ambientParticles = [];
    for (let i = 0; i < this.maxAmbient; i++) {
      this.ambientParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.8,
        color: Math.random() > 0.5 ? '#9B5CFF' : '#00D9FF',
        alpha: Math.random() * 0.5 + 0.15,
        life: 1,
        maxLife: 1,
      });
    }
  }

  /**
   * Spawn spark burst when fingertips touch or pinch occurs
   */
  public emitSparks(x: number, y: number, color: string, count: number = 10) {
    for (let i = 0; i < count; i++) {
      if (this.sparkParticles.length >= this.maxSparks) {
        this.sparkParticles.shift();
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      const life = Math.random() * 25 + 15;
      this.sparkParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1.2,
        color,
        alpha: 1,
        life,
        maxLife: life,
      });
    }
  }

  /**
   * Update all particle physics
   */
  public update(width: number, height: number) {
    // 1. Ambient drift
    for (const p of this.ambientParticles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
    }

    // 2. Sparks update
    for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
      const sp = this.sparkParticles[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vx *= 0.94;
      sp.vy *= 0.94;
      sp.life -= 1;
      sp.alpha = Math.max(0, sp.life / sp.maxLife);
      if (sp.life <= 0) {
        this.sparkParticles.splice(i, 1);
      }
    }

    // 3. Beam particles update
    for (let i = this.beamParticles.length - 1; i >= 0; i--) {
      const bp = this.beamParticles[i];
      bp.progress += bp.speed;
      if (bp.progress >= 1) {
        this.beamParticles.splice(i, 1);
      }
    }

    // Spawn new beam particles occasionally
    if (this.beamParticles.length < 35 && Math.random() < 0.45) {
      const beamIndex = Math.floor(Math.random() * 5);
      this.beamParticles.push({
        progress: 0,
        speed: Math.random() * 0.025 + 0.015,
        beamIndex,
        size: Math.random() * 2.5 + 1.5,
        color: '#FFFFFF',
      });
    }
  }

  /**
   * Render ambient background particles
   */
  public drawAmbient(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const p of this.ambientParticles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Render spark bursts
   */
  public drawSparks(ctx: CanvasRenderingContext2D) {
    if (this.sparkParticles.length === 0) return;
    ctx.save();
    for (const sp of this.sparkParticles) {
      ctx.globalAlpha = sp.alpha;
      ctx.fillStyle = sp.color;
      ctx.shadowColor = sp.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Render energy nodes flowing along the 5 fingertip beams
   */
  public drawBeamParticles(
    ctx: CanvasRenderingContext2D,
    beams: Array<{
      source: { x: number; y: number };
      target: { x: number; y: number };
      color: string;
      glowColor: string;
    }>
  ) {
    if (beams.length === 0 || this.beamParticles.length === 0) return;

    ctx.save();
    for (const bp of this.beamParticles) {
      const beam = beams[bp.beamIndex];
      if (!beam) continue;

      // Calculate position along curved beam
      const t = bp.progress;
      const x = beam.source.x + (beam.target.x - beam.source.x) * t;
      // Slight electrical arc sine displacement
      const arc = Math.sin(t * Math.PI) * 12 * Math.sin(t * 10);
      const y = beam.source.y + (beam.target.y - beam.source.y) * t + arc;

      ctx.globalAlpha = Math.sin(t * Math.PI) * 0.95;
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = beam.color;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.arc(x, y, bp.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  public clear() {
    this.sparkParticles = [];
    this.beamParticles = [];
  }
}
