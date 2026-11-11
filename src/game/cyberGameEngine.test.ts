import test from 'node:test';
import assert from 'node:assert/strict';
import { CyberGameEngine, distToSegment, WAVE_CONFIGS } from './cyberGameEngine';

test('distToSegment calculates perpendicular and endpoint distances accurately', () => {
  // Horizontal segment (0, 100) -> (200, 100)
  assert.equal(distToSegment(50, 100, 0, 100, 200, 100), 0);
  assert.equal(distToSegment(50, 120, 0, 100, 200, 100), 20);
  // Beyond left endpoint
  assert.equal(distToSegment(-30, 100, 0, 100, 200, 100), 30);
  // Beyond right endpoint
  assert.equal(distToSegment(240, 100, 0, 100, 200, 100), 40);
});

test('CyberGameEngine initializes and handles start / restart', () => {
  const engine = new CyberGameEngine({ width: 1000, height: 800 });
  assert.equal(engine.screenState, 'TITLE_SCREEN');

  engine.startGame();
  assert.equal(engine.screenState, 'PLAYING');
  assert.equal(engine.health, 100);
  assert.equal(engine.score, 0);
  assert.equal(engine.streak, 0);
  assert.equal(engine.multiplier, 1);
  assert.equal(engine.empCharge, 100);
  assert.equal(engine.currentWaveIndex, 0);

  engine.pauseGame();
  assert.equal(engine.screenState, 'PAUSED');
  engine.pauseGame();
  assert.equal(engine.screenState, 'PLAYING');
});

test('CyberGameEngine blade slice damages and destroys targets', () => {
  const engine = new CyberGameEngine({ width: 1000, height: 800 });
  engine.startGame();

  // Add dummy target at (500, 300) with radius 25
  engine.targets.push({
    id: 'test-target-1',
    type: 'BIT',
    x: 500,
    y: 300,
    vx: 0,
    vy: 100,
    radius: 25,
    health: 1,
    maxHealth: 1,
    color: '#00D9FF',
    glowColor: '#00D9FF',
    points: 100,
    angle: 0,
    rotationSpeed: 1,
    telegraphTimer: 0,
    isTelegraphing: false,
    spawnTime: 0,
  });

  assert.equal(engine.targets.length, 1);

  // Perform slice through (480, 300) -> (520, 300)
  engine.addBladePoint('right', 480, 300);
  engine.addBladePoint('right', 520, 300);

  // Target should be destroyed, awarding 100 points
  assert.equal(engine.targets.length, 0);
  assert.equal(engine.score, 100);
  assert.equal(engine.streak, 1);
  assert.equal(engine.totalKills, 1);
});

test('CyberGameEngine handles armored targets requiring multiple hits', () => {
  const engine = new CyberGameEngine({ width: 1000, height: 800 });
  engine.startGame();

  engine.targets.push({
    id: 'test-armored',
    type: 'ARMORED',
    x: 400,
    y: 200,
    vx: 0,
    vy: 50,
    radius: 30,
    health: 2,
    maxHealth: 2,
    color: '#FFE83A',
    glowColor: '#FFE83A',
    points: 300,
    angle: 0,
    rotationSpeed: 1,
    telegraphTimer: 0,
    isTelegraphing: false,
    spawnTime: 0,
  });

  // Hit 1: damages from 2 to 1
  engine.addBladePoint('left', 390, 200);
  engine.addBladePoint('left', 410, 200);
  assert.equal(engine.targets.length, 1);
  assert.equal(engine.targets[0].health, 1);
  assert.equal(engine.totalKills, 0);

  // Hit 2: destroys
  engine.addBladePoint('left', 390, 200);
  engine.addBladePoint('left', 410, 200);
  assert.equal(engine.targets.length, 0);
  assert.equal(engine.totalKills, 1);
  assert.equal(engine.score, 300);
});

test('CyberGameEngine EMP shockwave wipes screen and discharges meter', () => {
  const engine = new CyberGameEngine({ width: 1000, height: 800 });
  engine.startGame();
  engine.empCharge = 100;

  engine.targets.push({
    id: 'emp-target-1',
    type: 'BIT',
    x: 200,
    y: 200,
    vx: 0,
    vy: 100,
    radius: 20,
    health: 1,
    maxHealth: 1,
    color: '#00D9FF',
    glowColor: '#00D9FF',
    points: 100,
    angle: 0,
    rotationSpeed: 1,
    telegraphTimer: 0,
    isTelegraphing: false,
    spawnTime: 0,
  });

  const empFired = engine.triggerEmpShockwave();
  assert.equal(empFired, true);
  // EMP dropped from 100 and only gained +6 kill bonus
  assert.equal(engine.empCharge, 6);
  assert.equal(engine.targets.length, 0);
  assert.equal(engine.totalKills, 1);

  // Cannot fire second EMP immediately with 0 charge
  const empFiredAgain = engine.triggerEmpShockwave();
  assert.equal(empFiredAgain, false);
});

test('WAVE_CONFIGS contains 5 progressive sector configurations', () => {
  assert.equal(WAVE_CONFIGS.length, 5);
  for (let i = 0; i < WAVE_CONFIGS.length; i++) {
    const wave = WAVE_CONFIGS[i];
    assert.equal(wave.waveNumber, i + 1);
    assert.ok(wave.totalEnemies > 5);
    assert.ok(wave.spawnInterval > 0);
    assert.ok(wave.types.length > 0);
  }
});
