/**
 * CYBER STRIKE: NEON DEFENDER
 * 60 FPS Decoupled Game Simulation Engine
 * 
 * Manages game state, waves, targets, blade collision slicing,
 * EMP shockwaves, particle bursts, screen shake, and hitstop.
 */

export type GameScreenState = 'TITLE_SCREEN' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';

export type TargetType = 'BIT' | 'SEEKER' | 'ARMORED' | 'QUANTUM_BOSS';

export interface BladePoint {
  x: number;
  y: number;
  time: number;
}

export interface BladeTrail {
  points: BladePoint[];
  color: string;
}

export interface GameTarget {
  id: string;
  type: TargetType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  health: number;
  maxHealth: number;
  color: string;
  glowColor: string;
  points: number;
  angle: number;
  rotationSpeed: number;
  sineOffset?: number;
  sineSpeed?: number;
  telegraphTimer: number; // For charging attacks
  isTelegraphing: boolean;
  spawnTime: number;
}

export interface GameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  life: number;
  maxLife: number;
}

export interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
}

export interface WaveConfig {
  waveNumber: number;
  name: string;
  subtitle: string;
  totalEnemies: number;
  spawnInterval: number; // seconds
  types: TargetType[];
  bossHp?: number;
}

export const WAVE_CONFIGS: WaveConfig[] = [
  {
    waveNumber: 1,
    name: 'Sector 01: Perimeter Breach',
    subtitle: 'Rogue Data Bits Inbound',
    totalEnemies: 12,
    spawnInterval: 1.2,
    types: ['BIT'],
  },
  {
    waveNumber: 2,
    name: 'Sector 02: Glitch Infiltration',
    subtitle: 'Erratic Glitch Seekers Detected',
    totalEnemies: 18,
    spawnInterval: 0.95,
    types: ['BIT', 'SEEKER'],
  },
  {
    waveNumber: 3,
    name: 'Sector 03: Heavy Null-Cores',
    subtitle: 'Armored Targets Charging Plasma',
    totalEnemies: 24,
    spawnInterval: 0.85,
    types: ['BIT', 'SEEKER', 'ARMORED'],
  },
  {
    waveNumber: 4,
    name: 'Sector 04: Overload Swarm',
    subtitle: 'High Velocity Network Cascade',
    totalEnemies: 32,
    spawnInterval: 0.65,
    types: ['BIT', 'SEEKER', 'ARMORED'],
  },
  {
    waveNumber: 5,
    name: 'Sector 05: The Quantum Leviathan',
    subtitle: 'Master Node Core Boss Fight',
    totalEnemies: 30,
    spawnInterval: 0.8,
    types: ['BIT', 'SEEKER', 'ARMORED', 'QUANTUM_BOSS'],
    bossHp: 24,
  },
];

export interface GameEngineOptions {
  width: number;
  height: number;
  onAudioEvent?: (event: 'slice' | 'explosion' | 'heavy_hit' | 'emp' | 'combo' | 'hurt' | 'game_over' | 'victory') => void;
}

export class CyberGameEngine {
  public screenState: GameScreenState = 'TITLE_SCREEN';
  public width: number;
  public height: number;

  // Player Stats
  public health: number = 100;
  public maxHealth: number = 100;
  public score: number = 0;
  public highScore: number = 0;
  public streak: number = 0;
  public maxStreak: number = 0;
  public multiplier: number = 1;
  public empCharge: number = 100; // 0 to 100
  public maxEmpCharge: number = 100;

  // Wave Management
  public currentWaveIndex: number = 0;
  public enemiesSpawnedInWave: number = 0;
  public enemiesDestroyedInWave: number = 0;
  public waveSpawnTimer: number = 0;
  public waveBannerTimer: number = 0;
  public isWaveTransitioning: boolean = false;

  // Entities
  public targets: GameTarget[] = [];
  public particles: GameParticle[] = [];
  public shockwaves: ShockwaveRing[] = [];
  public floatingTexts: FloatingText[] = [];

  // Dual Blade Trails (e.g. Left Hand & Right Hand or Mouse Blade)
  public leftBlade: BladeTrail = { points: [], color: '#FF35C8' };
  public rightBlade: BladeTrail = { points: [], color: '#00D9FF' };

  // Game Feel Juiciness
  public screenShake: number = 0; // Decaying trauma
  public hitstopTimer: number = 0; // in seconds
  public flashColor: string | null = null;
  public flashAlpha: number = 0;

  // Stats
  public totalSlices: number = 0;
  public totalKills: number = 0;

  // Callbacks
  private onAudioEvent?: (event: 'slice' | 'explosion' | 'heavy_hit' | 'emp' | 'combo' | 'hurt' | 'game_over' | 'victory') => void;

  constructor(options: GameEngineOptions) {
    this.width = options.width || 1280;
    this.height = options.height || 720;
    this.onAudioEvent = options.onAudioEvent;

    // Load High Score from localStorage safely
    try {
      const saved = localStorage.getItem('HANDCONNECT_HIGH_SCORE');
      if (saved) this.highScore = parseInt(saved, 10) || 0;
    } catch {}
  }

  public setSize(w: number, h: number): void {
    this.width = Math.max(320, w);
    this.height = Math.max(240, h);
  }

  public startGame(): void {
    this.screenState = 'PLAYING';
    this.health = 100;
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.multiplier = 1;
    this.empCharge = 100;
    this.currentWaveIndex = 0;
    this.enemiesSpawnedInWave = 0;
    this.enemiesDestroyedInWave = 0;
    this.waveSpawnTimer = 0;
    this.waveBannerTimer = 3.0; // Show wave 1 banner for 3s
    this.targets = [];
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.leftBlade.points = [];
    this.rightBlade.points = [];
    this.screenShake = 0;
    this.hitstopTimer = 0;
    this.flashAlpha = 0;
  }

  public pauseGame(): void {
    if (this.screenState === 'PLAYING') {
      this.screenState = 'PAUSED';
    } else if (this.screenState === 'PAUSED') {
      this.screenState = 'PLAYING';
    }
  }

  public restartGame(): void {
    this.startGame();
  }

  public exitToTitle(): void {
    this.screenState = 'TITLE_SCREEN';
    this.targets = [];
    this.particles = [];
  }

  /**
   * Register a blade cut point from hand tracking or mouse input
   */
  public addBladePoint(hand: 'left' | 'right', x: number, y: number): void {
    if (this.screenState !== 'PLAYING') return;

    const blade = hand === 'left' ? this.leftBlade : this.rightBlade;
    const now = performance.now();

    // Check line segment against all targets
    if (blade.points.length > 0) {
      const prev = blade.points[blade.points.length - 1];
      this.checkBladeSlice(prev.x, prev.y, x, y, blade.color);
    }

    blade.points.push({ x, y, time: now });

    // Keep points within recent 140ms
    blade.points = blade.points.filter((p) => now - p.time < 140);
  }

  /**
   * Check if a line segment cuts through any targets
   */
  public checkBladeSlice(x1: number, y1: number, x2: number, y2: number, bladeColor: string): void {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    for (let i = this.targets.length - 1; i >= 0; i--) {
      const target = this.targets[i];

      // Quick bounding box check
      if (
        target.x + target.radius < minX ||
        target.x - target.radius > maxX ||
        target.y + target.radius < minY ||
        target.y - target.radius > maxY
      ) {
        // Distance check from line segment
        const dist = distToSegment(target.x, target.y, x1, y1, x2, y2);
        if (dist <= target.radius) {
          this.hitTarget(target, i, bladeColor);
        }
      } else {
        const dist = distToSegment(target.x, target.y, x1, y1, x2, y2);
        if (dist <= target.radius) {
          this.hitTarget(target, i, bladeColor);
        }
      }
    }
  }

  /**
   * Apply damage and visual impact to a target
   */
  public hitTarget(target: GameTarget, index: number, bladeColor: string): void {
    target.health -= 1;
    this.totalSlices += 1;

    // Small hit spark burst
    this.createSparkBurst(target.x, target.y, bladeColor, 8);

    if (target.health <= 0) {
      // Target destroyed
      this.destroyTarget(target, index, true);
    } else {
      // Armored core hitstop & heavy feedback
      this.hitstopTimer = 0.04;
      this.screenShake = Math.max(this.screenShake, 4);
      this.onAudioEvent?.('heavy_hit');
      this.addFloatingText(target.x, target.y - 20, 'SHIELD BREAK!', '#FFE83A');
    }
  }

  /**
   * Destroy target and award score, streak, and EMP recharge
   */
  public destroyTarget(target: GameTarget, index: number, byPlayer: boolean): void {
    this.targets.splice(index, 1);

    if (byPlayer) {
      this.totalKills += 1;
      this.enemiesDestroyedInWave += 1;
      this.streak += 1;
      this.maxStreak = Math.max(this.maxStreak, this.streak);

      // Multiplier steps: every 5 streak increases multiplier up to 8x
      this.multiplier = Math.min(8, 1 + Math.floor(this.streak / 5));

      const pointsEarned = target.points * this.multiplier;
      this.score += pointsEarned;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        try {
          localStorage.setItem('HANDCONNECT_HIGH_SCORE', this.highScore.toString());
        } catch {}
      }

      // Re-charge EMP bar
      this.empCharge = Math.min(this.maxEmpCharge, this.empCharge + 6);

      // Big destruction particle explosion
      this.createSparkBurst(target.x, target.y, target.color, 24);
      this.createShockwave(target.x, target.y, target.radius * 2.2, target.glowColor);

      // Audio feedback
      if (target.type === 'QUANTUM_BOSS') {
        this.hitstopTimer = 0.08;
        this.screenShake = 12;
        this.onAudioEvent?.('explosion');
        this.addFloatingText(target.x, target.y, `BOSS DESTROYED! +${pointsEarned}`, '#FFE83A');
      } else {
        this.screenShake = Math.max(this.screenShake, 3.5);
        this.onAudioEvent?.('slice');
        this.addFloatingText(target.x, target.y, `+${pointsEarned}`, target.color);
      }

      if (this.streak > 0 && this.streak % 10 === 0) {
        this.onAudioEvent?.('combo');
        this.addFloatingText(this.width / 2, this.height * 0.25, `${this.streak}x ULTRA STREAK!`, '#00FF9D');
      }
    }
  }

  /**
   * Activate EMP Shockwave (triggered by Clenching Fist or Spacebar)
   */
  public triggerEmpShockwave(): boolean {
    if (this.screenState !== 'PLAYING') return false;
    if (this.empCharge < 50) return false;

    this.empCharge = 0;
    this.hitstopTimer = 0.06;
    this.screenShake = 14;
    this.flashColor = '#00D9FF';
    this.flashAlpha = 0.55;

    this.onAudioEvent?.('emp');

    // Expand giant shockwave from center core
    const cx = this.width / 2;
    const cy = this.height * 0.88;
    this.createShockwave(cx, cy, Math.hypot(this.width, this.height), '#00D9FF');

    // Wipe or heavily damage all active targets on screen
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      if (t.type === 'QUANTUM_BOSS') {
        t.health -= 6;
        if (t.health <= 0) {
          this.destroyTarget(t, i, true);
        } else {
          this.createSparkBurst(t.x, t.y, '#00D9FF', 16);
        }
      } else {
        this.destroyTarget(t, i, true);
      }
    }

    this.addFloatingText(cx, cy - 80, 'EMP BURST DISCHARGED!', '#00D9FF');
    return true;
  }

  /**
   * Main 60 FPS update cycle with clamped delta time
   */
  public update(rawDt: number): void {
    if (this.screenState !== 'PLAYING') return;

    // Hitstop freeze (clamps simulation execution on impactful hits)
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= rawDt;
      return;
    }

    // Clamp delta time to avoid physics explosions during tab switching
    const dt = Math.min(rawDt, 0.05);

    // Decay screen shake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 18);
    }

    // Fade flash
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 3.5);
    }

    // Decay blade trails
    const now = performance.now();
    this.leftBlade.points = this.leftBlade.points.filter((p) => now - p.time < 120);
    this.rightBlade.points = this.rightBlade.points.filter((p) => now - p.time < 120);

    // Wave progression logic
    this.updateWaveSpawning(dt);

    // Update targets
    this.updateTargets(dt);

    // Update particles
    this.updateParticles(dt);

    // Update shockwaves
    this.updateShockwaves(dt);

    // Update floating texts
    this.updateFloatingTexts(dt);
  }

  private updateWaveSpawning(dt: number): void {
    const wave = WAVE_CONFIGS[this.currentWaveIndex];
    if (!wave) return;

    if (this.waveBannerTimer > 0) {
      this.waveBannerTimer -= dt;
    }

    // Check if wave is completed
    if (
      this.enemiesSpawnedInWave >= wave.totalEnemies &&
      this.targets.length === 0 &&
      !this.isWaveTransitioning
    ) {
      // Advance wave or Victory!
      if (this.currentWaveIndex >= WAVE_CONFIGS.length - 1) {
        this.screenState = 'VICTORY';
        this.onAudioEvent?.('victory');
        return;
      }

      this.isWaveTransitioning = true;
      setTimeout(() => {
        if (this.screenState !== 'PLAYING') return;
        this.currentWaveIndex += 1;
        this.enemiesSpawnedInWave = 0;
        this.enemiesDestroyedInWave = 0;
        this.waveBannerTimer = 3.0;
        this.isWaveTransitioning = false;
        this.health = Math.min(this.maxHealth, this.health + 25); // Repair core +25 HP between sectors
        this.addFloatingText(this.width / 2, this.height * 0.4, 'SECTOR CLEARED! CORE REPAIRED +25 HP', '#00FF9D');
      }, 1200);
      return;
    }

    // Spawn enemies
    if (this.enemiesSpawnedInWave < wave.totalEnemies && !this.isWaveTransitioning) {
      this.waveSpawnTimer += dt;
      if (this.waveSpawnTimer >= wave.spawnInterval) {
        this.waveSpawnTimer = 0;
        this.spawnEnemy(wave);
      }
    }
  }

  private spawnEnemy(wave: WaveConfig): void {
    const availableTypes = wave.types;
    let chosenType: TargetType = 'BIT';

    // Boss check for wave 5
    if (wave.bossHp && this.enemiesSpawnedInWave === wave.totalEnemies - 1) {
      chosenType = 'QUANTUM_BOSS';
    } else {
      chosenType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }

    const margin = 60;
    const spawnX = margin + Math.random() * (this.width - margin * 2);
    const spawnY = -40;

    let target: GameTarget;

    if (chosenType === 'BIT') {
      target = {
        id: `target-${Date.now()}-${Math.random()}`,
        type: 'BIT',
        x: spawnX,
        y: spawnY,
        vx: (Math.random() - 0.5) * 30,
        vy: 110 + Math.random() * 50 + this.currentWaveIndex * 15,
        radius: 20,
        health: 1,
        maxHealth: 1,
        color: '#00D9FF',
        glowColor: '#00D9FF',
        points: 100,
        angle: 0,
        rotationSpeed: (Math.random() - 0.5) * 3,
        telegraphTimer: 0,
        isTelegraphing: false,
        spawnTime: performance.now(),
      };
    } else if (chosenType === 'SEEKER') {
      target = {
        id: `target-${Date.now()}-${Math.random()}`,
        type: 'SEEKER',
        x: spawnX,
        y: spawnY,
        vx: 0,
        vy: 130 + Math.random() * 40 + this.currentWaveIndex * 12,
        radius: 22,
        health: 1,
        maxHealth: 1,
        color: '#FF35C8',
        glowColor: '#FF35C8',
        points: 180,
        angle: 0,
        rotationSpeed: 4,
        sineOffset: Math.random() * Math.PI * 2,
        sineSpeed: 4.5,
        telegraphTimer: 0,
        isTelegraphing: false,
        spawnTime: performance.now(),
      };
    } else if (chosenType === 'ARMORED') {
      target = {
        id: `target-${Date.now()}-${Math.random()}`,
        type: 'ARMORED',
        x: spawnX,
        y: spawnY,
        vx: (Math.random() - 0.5) * 20,
        vy: 75 + Math.random() * 25 + this.currentWaveIndex * 10,
        radius: 30,
        health: 2,
        maxHealth: 2,
        color: '#FFE83A',
        glowColor: '#FFE83A',
        points: 300,
        angle: 0,
        rotationSpeed: 1.5,
        telegraphTimer: 0,
        isTelegraphing: false,
        spawnTime: performance.now(),
      };
    } else {
      // QUANTUM_BOSS
      target = {
        id: `boss-${Date.now()}`,
        type: 'QUANTUM_BOSS',
        x: this.width / 2,
        y: spawnY,
        vx: 0,
        vy: 45,
        radius: 54,
        health: wave.bossHp || 24,
        maxHealth: wave.bossHp || 24,
        color: '#9B5CFF',
        glowColor: '#9B5CFF',
        points: 2500,
        angle: 0,
        rotationSpeed: 1.0,
        sineOffset: 0,
        sineSpeed: 1.8,
        telegraphTimer: 0,
        isTelegraphing: false,
        spawnTime: performance.now(),
      };
    }

    this.targets.push(target);
    this.enemiesSpawnedInWave += 1;
  }

  private updateTargets(dt: number): void {
    const bottomLine = this.height * 0.90;

    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];

      // Movement & Trajectory
      if (t.type === 'SEEKER' && t.sineOffset !== undefined && t.sineSpeed !== undefined) {
        t.sineOffset += dt * t.sineSpeed;
        t.x += Math.sin(t.sineOffset) * 160 * dt;
        t.y += t.vy * dt;
      } else if (t.type === 'QUANTUM_BOSS') {
        if (t.y < this.height * 0.28) {
          t.y += t.vy * dt;
        } else {
          // Orbit horizontally back and forth
          t.sineOffset = (t.sineOffset || 0) + dt * 1.5;
          t.x = this.width / 2 + Math.sin(t.sineOffset) * (this.width * 0.35);
        }
      } else {
        t.x += t.vx * dt;
        t.y += t.vy * dt;
      }

      t.angle += t.rotationSpeed * dt;

      // Check if target breaches player core defense threshold
      if (t.y >= bottomLine) {
        // Player Core takes damage
        const dmg = t.type === 'QUANTUM_BOSS' ? 40 : t.type === 'ARMORED' ? 20 : 12;
        this.health = Math.max(0, this.health - dmg);

        // Reset streak
        this.streak = 0;
        this.multiplier = 1;

        // Big warning impact
        this.hitstopTimer = 0.05;
        this.screenShake = 12;
        this.flashColor = '#FF3535';
        this.flashAlpha = 0.45;
        this.onAudioEvent?.('hurt');

        this.createSparkBurst(t.x, bottomLine, '#FF3535', 20);
        this.addFloatingText(t.x, bottomLine - 30, `CORE BREACH -${dmg} HP`, '#FF3535');

        // Remove breached target
        this.targets.splice(i, 1);

        if (this.health <= 0) {
          this.screenState = 'GAME_OVER';
          this.onAudioEvent?.('game_over');
          return;
        }
      }
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateShockwaves(dt: number): void {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * dt * 9;
      sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

      if (sw.radius >= sw.maxRadius * 0.95 || sw.alpha <= 0.02) {
        this.shockwaves.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 1.2;

      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public createSparkBurst(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 2.5,
        color,
        alpha: 1.0,
        decay: 1.8,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.35,
      });
    }
  }

  public createShockwave(x: number, y: number, maxRadius: number, color: string): void {
    this.shockwaves.push({
      x,
      y,
      radius: 8,
      maxRadius,
      color,
      alpha: 1.0,
      lineWidth: 3,
    });
  }

  public addFloatingText(x: number, y: number, text: string, color: string): void {
    this.floatingTexts.push({
      id: `text-${Date.now()}-${Math.random()}`,
      text,
      x,
      y,
      color,
      alpha: 1.0,
      vy: -45,
    });
  }
}

/**
 * Distance from point (px, py) to line segment (x1, y1) -> (x2, y2)
 */
export function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}
