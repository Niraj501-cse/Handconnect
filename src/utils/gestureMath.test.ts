import test from 'node:test';
import assert from 'node:assert/strict';
import {
  recognizeGesture,
  calculateFingerSpread,
  getRainbowBeamConnections,
  distance2D,
  LANDMARK_INDEX,
  Landmark,
} from './gestureMath';

// Helper to create synthetic 21 landmarks
function createBaseHand(): Landmark[] {
  // 21 landmarks initialized at 0,0
  const marks: Landmark[] = [];
  for (let i = 0; i < 21; i++) {
    marks.push({ x: 0.5, y: 0.8 });
  }
  // Wrist at (0.5, 0.8)
  marks[LANDMARK_INDEX.WRIST] = { x: 0.5, y: 0.8 };
  // Palm MCPs
  marks[LANDMARK_INDEX.INDEX_MCP] = { x: 0.45, y: 0.55 };
  marks[LANDMARK_INDEX.MIDDLE_MCP] = { x: 0.5, y: 0.52 };
  marks[LANDMARK_INDEX.RING_MCP] = { x: 0.55, y: 0.55 };
  marks[LANDMARK_INDEX.PINKY_MCP] = { x: 0.6, y: 0.6 };
  // Thumb base
  marks[LANDMARK_INDEX.THUMB_CMC] = { x: 0.42, y: 0.72 };
  marks[LANDMARK_INDEX.THUMB_MCP] = { x: 0.38, y: 0.65 };
  marks[LANDMARK_INDEX.THUMB_IP] = { x: 0.34, y: 0.60 };
  marks[LANDMARK_INDEX.THUMB_TIP] = { x: 0.30, y: 0.55 };
  return marks;
}

test('distance2D calculates exact Euclidean distance', () => {
  const p1 = { x: 0, y: 0 };
  const p2 = { x: 3, y: 4 };
  assert.equal(distance2D(p1, p2), 5);
});

test('recognizeGesture identifies Open Hand when all fingers extended', () => {
  const hand = createBaseHand();
  // Extend Index
  hand[LANDMARK_INDEX.INDEX_PIP] = { x: 0.45, y: 0.42 };
  hand[LANDMARK_INDEX.INDEX_DIP] = { x: 0.45, y: 0.32 };
  hand[LANDMARK_INDEX.INDEX_TIP] = { x: 0.45, y: 0.22 };
  // Extend Middle
  hand[LANDMARK_INDEX.MIDDLE_PIP] = { x: 0.5, y: 0.38 };
  hand[LANDMARK_INDEX.MIDDLE_DIP] = { x: 0.5, y: 0.28 };
  hand[LANDMARK_INDEX.MIDDLE_TIP] = { x: 0.5, y: 0.18 };
  // Extend Ring
  hand[LANDMARK_INDEX.RING_PIP] = { x: 0.55, y: 0.42 };
  hand[LANDMARK_INDEX.RING_DIP] = { x: 0.55, y: 0.32 };
  hand[LANDMARK_INDEX.RING_TIP] = { x: 0.55, y: 0.22 };
  // Extend Pinky
  hand[LANDMARK_INDEX.PINKY_PIP] = { x: 0.6, y: 0.48 };
  hand[LANDMARK_INDEX.PINKY_DIP] = { x: 0.6, y: 0.38 };
  hand[LANDMARK_INDEX.PINKY_TIP] = { x: 0.6, y: 0.28 };
  // Extend Thumb outward
  hand[LANDMARK_INDEX.THUMB_IP] = { x: 0.30, y: 0.65 };
  hand[LANDMARK_INDEX.THUMB_TIP] = { x: 0.22, y: 0.62 };

  const result = recognizeGesture(hand);
  assert.equal(result.name, 'Open Hand');
  assert.equal(result.extendedFingers.index, true);
  assert.equal(result.extendedFingers.middle, true);
  assert.equal(result.extendedFingers.ring, true);
  assert.equal(result.extendedFingers.pinky, true);
});

test('recognizeGesture identifies Fist when fingers curled toward palm', () => {
  const hand = createBaseHand();
  // Curled index
  hand[LANDMARK_INDEX.INDEX_PIP] = { x: 0.45, y: 0.50 };
  hand[LANDMARK_INDEX.INDEX_TIP] = { x: 0.45, y: 0.58 };
  // Curled middle
  hand[LANDMARK_INDEX.MIDDLE_PIP] = { x: 0.5, y: 0.48 };
  hand[LANDMARK_INDEX.MIDDLE_TIP] = { x: 0.5, y: 0.56 };
  // Curled ring
  hand[LANDMARK_INDEX.RING_PIP] = { x: 0.55, y: 0.50 };
  hand[LANDMARK_INDEX.RING_TIP] = { x: 0.55, y: 0.58 };
  // Curled pinky
  hand[LANDMARK_INDEX.PINKY_PIP] = { x: 0.6, y: 0.55 };
  hand[LANDMARK_INDEX.PINKY_TIP] = { x: 0.6, y: 0.62 };
  // Folded thumb
  hand[LANDMARK_INDEX.THUMB_TIP] = { x: 0.42, y: 0.62 };

  const result = recognizeGesture(hand);
  assert.equal(result.name, 'Fist');
  assert.equal(result.extendedFingers.index, false);
  assert.equal(result.extendedFingers.middle, false);
  assert.equal(result.extendedFingers.ring, false);
  assert.equal(result.extendedFingers.pinky, false);
});

test('recognizeGesture identifies Pointing Finger when index is extended and others curled', () => {
  const hand = createBaseHand();
  // Extend index
  hand[LANDMARK_INDEX.INDEX_PIP] = { x: 0.45, y: 0.40 };
  hand[LANDMARK_INDEX.INDEX_DIP] = { x: 0.45, y: 0.30 };
  hand[LANDMARK_INDEX.INDEX_TIP] = { x: 0.45, y: 0.20 };
  // Curl others
  hand[LANDMARK_INDEX.MIDDLE_PIP] = { x: 0.5, y: 0.50 };
  hand[LANDMARK_INDEX.MIDDLE_TIP] = { x: 0.5, y: 0.58 };
  hand[LANDMARK_INDEX.RING_PIP] = { x: 0.55, y: 0.50 };
  hand[LANDMARK_INDEX.RING_TIP] = { x: 0.55, y: 0.58 };
  hand[LANDMARK_INDEX.PINKY_PIP] = { x: 0.6, y: 0.55 };
  hand[LANDMARK_INDEX.PINKY_TIP] = { x: 0.6, y: 0.62 };
  // Thumb relaxed / folded
  hand[LANDMARK_INDEX.THUMB_TIP] = { x: 0.40, y: 0.60 };

  const result = recognizeGesture(hand);
  assert.equal(result.name, 'Pointing Finger');
  assert.equal(result.extendedFingers.index, true);
  assert.equal(result.extendedFingers.middle, false);
});

test('recognizeGesture identifies Pinch when thumb and index tips are close', () => {
  const hand = createBaseHand();
  // Position thumb tip and index tip close together
  hand[LANDMARK_INDEX.THUMB_TIP] = { x: 0.42, y: 0.40 };
  hand[LANDMARK_INDEX.INDEX_TIP] = { x: 0.43, y: 0.40 };

  const result = recognizeGesture(hand);
  assert.equal(result.name, 'Pinch');
  assert.ok(result.pinchDistance !== undefined);
  assert.ok(result.pinchDistance < 0.38);
});

test('recognizeGesture identifies Partial Hand on 2 extended fingers (Victory posture)', () => {
  const hand = createBaseHand();
  // Extend index
  hand[LANDMARK_INDEX.INDEX_PIP] = { x: 0.45, y: 0.40 };
  hand[LANDMARK_INDEX.INDEX_TIP] = { x: 0.45, y: 0.20 };
  // Extend middle
  hand[LANDMARK_INDEX.MIDDLE_PIP] = { x: 0.5, y: 0.38 };
  hand[LANDMARK_INDEX.MIDDLE_TIP] = { x: 0.5, y: 0.18 };
  // Curl ring and pinky
  hand[LANDMARK_INDEX.RING_PIP] = { x: 0.55, y: 0.50 };
  hand[LANDMARK_INDEX.RING_TIP] = { x: 0.55, y: 0.58 };
  hand[LANDMARK_INDEX.PINKY_PIP] = { x: 0.6, y: 0.55 };
  hand[LANDMARK_INDEX.PINKY_TIP] = { x: 0.6, y: 0.62 };
  // Thumb folded
  hand[LANDMARK_INDEX.THUMB_TIP] = { x: 0.45, y: 0.65 };

  const result = recognizeGesture(hand);
  assert.equal(result.name, 'Partial Hand');
  assert.match(result.description, /Victory/);
});

test('calculateFingerSpread returns value between 0 and 100', () => {
  const hand = createBaseHand();
  const spread = calculateFingerSpread(hand);
  assert.ok(spread >= 0 && spread <= 100);
});

test('getRainbowBeamConnections produces 5 pairs connecting corresponding fingers', () => {
  const leftHand = createBaseHand();
  const rightHand = createBaseHand();
  rightHand[LANDMARK_INDEX.WRIST] = { x: 0.8, y: 0.8 };

  const beams = getRainbowBeamConnections(leftHand, rightHand);
  assert.equal(beams.length, 5);
  assert.deepEqual(
    beams.map(b => b.fingerName),
    ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']
  );
  // Each has color and valid distance
  beams.forEach(beam => {
    assert.ok(beam.color.startsWith('#'));
    assert.ok(typeof beam.distance === 'number');
  });
});
