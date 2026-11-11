import test from 'node:test';
import assert from 'node:assert/strict';
import { AirCanvasEngine } from './airCanvasMath';

test('AirCanvasEngine starts and records strokes', () => {
  const engine = new AirCanvasEngine();
  assert.equal(engine.getStrokeCount(), 0);

  const stroke = engine.startStroke('Right', { x: 100, y: 150 }, '#00D9FF', 6);
  assert.equal(engine.getStrokeCount(), 1);
  assert.equal(stroke.hand, 'Right');
  assert.equal(stroke.color, '#00D9FF');
  assert.equal(stroke.points.length, 1);
  assert.equal(stroke.points[0].x, 100);
});

test('AirCanvasEngine adds points and enforces distance threshold', () => {
  const engine = new AirCanvasEngine();
  engine.startStroke('Left', { x: 50, y: 50 }, '#FF35C8', 4);

  // Close point (< 3px distance) should be filtered out to prevent jitter
  const addedTooClose = engine.addPoint('Left', { x: 51, y: 51 }, 5);
  assert.equal(addedTooClose, false);

  // Sufficiently far point should be added
  const addedFar = engine.addPoint('Left', { x: 70, y: 80 }, 5);
  assert.equal(addedFar, true);

  const active = engine.getActiveStroke('Left');
  assert.ok(active);
  assert.equal(active.points.length, 2);
});

test('AirCanvasEngine supports undo and clear operations', () => {
  const engine = new AirCanvasEngine();
  engine.startStroke('Right', { x: 10, y: 10 }, '#FFE83A', 6);
  engine.addPoint('Right', { x: 30, y: 30 });
  engine.endStroke('Right');

  engine.startStroke('Right', { x: 50, y: 50 }, '#FFE83A', 6);
  engine.endStroke('Right');
  assert.equal(engine.getStrokeCount(), 2);

  // Undo removes last stroke
  const undid = engine.undo();
  assert.equal(undid, true);
  assert.equal(engine.getStrokeCount(), 1);

  // Clear removes all strokes
  engine.clear();
  assert.equal(engine.getStrokeCount(), 0);
  assert.equal(engine.undo(), false);
});

test('AirCanvasEngine manages dual-hand simultaneous strokes', () => {
  const engine = new AirCanvasEngine();
  engine.startStroke('Left', { x: 100, y: 100 }, '#FF35C8', 6);
  engine.startStroke('Right', { x: 400, y: 100 }, '#FFE83A', 6);

  assert.equal(engine.getStrokeCount(), 2);
  assert.ok(engine.getActiveStroke('Left'));
  assert.ok(engine.getActiveStroke('Right'));

  engine.addPoint('Left', { x: 120, y: 120 });
  engine.addPoint('Right', { x: 420, y: 120 });

  assert.equal(engine.getActiveStroke('Left')?.points.length, 2);
  assert.equal(engine.getActiveStroke('Right')?.points.length, 2);

  engine.endStroke('Left');
  assert.equal(engine.getActiveStroke('Left'), undefined);
  assert.ok(engine.getActiveStroke('Right'));
});
