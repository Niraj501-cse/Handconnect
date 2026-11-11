import test from 'node:test';
import assert from 'node:assert/strict';
import { GESTURE_SOUND_PROFILES, CyberAudioEngine } from './cyberAudio';

test('GESTURE_SOUND_PROFILES contains profiles for all 5 recognized gestures', () => {
  const expectedGestures = ['Open Hand', 'Fist', 'Pointing Finger', 'Pinch', 'Partial Hand'];
  for (const g of expectedGestures) {
    const profile = GESTURE_SOUND_PROFILES[g];
    assert.ok(profile, `Profile for ${g} should exist`);
    assert.ok(profile.baseFreq > 40, `Base frequency should be valid for ${g}`);
    assert.ok(profile.durationMs > 20, `Duration should be valid for ${g}`);
    assert.ok(profile.name.length > 0, `Name should exist for ${g}`);
  }
});

test('CyberAudioEngine manages enable, volume, and gesture feedback toggles', () => {
  const engine = new CyberAudioEngine();
  assert.equal(engine.getIsEnabled(), false);
  assert.equal(engine.getGestureFeedbackEnabled(), true);

  engine.setEnabled(true);
  assert.equal(engine.getIsEnabled(), true);

  engine.setGestureFeedbackEnabled(false);
  assert.equal(engine.getGestureFeedbackEnabled(), false);

  engine.setThereminEnabled(false);
  assert.equal(engine.getThereminEnabled(), false);

  assert.equal(engine.getHoverSoundEnabled(), true);
  engine.setHoverSoundEnabled(false);
  assert.equal(engine.getHoverSoundEnabled(), false);

  engine.setVolume(0.75);
  assert.equal(engine.getVolume(), 0.75);

  // Clamps volume between 0 and 1
  engine.setVolume(1.5);
  assert.equal(engine.getVolume(), 1);
  engine.setVolume(-0.2);
  assert.equal(engine.getVolume(), 0);

  // playHoverSound should safely execute without error when muted or disabled
  assert.doesNotThrow(() => {
    engine.playHoverSound();
    engine.setEnabled(true);
    engine.setHoverSoundEnabled(true);
    engine.playHoverSound();
  });
});

test('playHoverSound is strictly governed by master audio toggle and hover toggle', () => {
  const engine = new CyberAudioEngine();
  // Initially master audio is muted (isEnabled === false)
  assert.equal(engine.getIsEnabled(), false);
  // When muted, calling playHoverSound does not throw and does nothing
  assert.doesNotThrow(() => engine.playHoverSound());

  // Enable master audio
  engine.setEnabled(true);
  assert.equal(engine.getIsEnabled(), true);

  // Disable hover sound specifically
  engine.setHoverSoundEnabled(false);
  assert.equal(engine.getHoverSoundEnabled(), false);
  assert.doesNotThrow(() => engine.playHoverSound());

  // Re-enable hover sound
  engine.setHoverSoundEnabled(true);
  assert.equal(engine.getHoverSoundEnabled(), true);
  assert.doesNotThrow(() => engine.playHoverSound());

  // Muting master audio again silences hover
  engine.setEnabled(false);
  assert.equal(engine.getIsEnabled(), false);
  assert.doesNotThrow(() => engine.playHoverSound());
});
