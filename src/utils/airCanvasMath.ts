/**
 * HANDCONNECT - Air Canvas Stroke & Curve Mathematics
 * Handles point collection, Bezier smoothing, stroke history, undo, and bounds.
 */

export interface CanvasPoint {
  x: number;
  y: number;
  time: number;
  pressure?: number;
}

export interface DrawingStroke {
  id: string;
  hand: 'Left' | 'Right';
  color: string;
  width: number;
  points: CanvasPoint[];
}

export class AirCanvasEngine {
  private strokes: DrawingStroke[] = [];
  private activeStrokes: Map<'Left' | 'Right', DrawingStroke> = new Map();
  private maxStrokes = 60;

  public getStrokes(): DrawingStroke[] {
    return this.strokes;
  }

  public getActiveStroke(hand: 'Left' | 'Right'): DrawingStroke | undefined {
    return this.activeStrokes.get(hand);
  }

  /**
   * Start a new stroke for a given hand
   */
  public startStroke(hand: 'Left' | 'Right', point: { x: number; y: number }, color: string, width: number): DrawingStroke {
    // If an active stroke already exists for this hand, finish it first
    this.endStroke(hand);

    const newStroke: DrawingStroke = {
      id: `${Date.now()}-${hand}-${Math.random().toString(36).substring(2, 6)}`,
      hand,
      color,
      width,
      points: [{ x: point.x, y: point.y, time: performance.now() }],
    };

    this.activeStrokes.set(hand, newStroke);
    this.strokes.push(newStroke);

    // Keep max strokes limit to prevent memory bloat
    if (this.strokes.length > this.maxStrokes) {
      this.strokes.shift();
    }

    return newStroke;
  }

  /**
   * Add a new point to the active stroke of a hand
   */
  public addPoint(hand: 'Left' | 'Right', point: { x: number; y: number }, minDistance: number = 3): boolean {
    const active = this.activeStrokes.get(hand);
    if (!active) return false;

    const lastPoint = active.points[active.points.length - 1];
    if (lastPoint) {
      const dist = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y);
      if (dist < minDistance) {
        return false; // Skip redundant dense jitter points
      }
    }

    active.points.push({
      x: point.x,
      y: point.y,
      time: performance.now(),
    });

    return true;
  }

  /**
   * Complete the active stroke for a hand
   */
  public endStroke(hand: 'Left' | 'Right'): void {
    this.activeStrokes.delete(hand);
  }

  /**
   * Undo the most recent stroke
   */
  public undo(): boolean {
    if (this.strokes.length === 0) return false;
    const removed = this.strokes.pop();
    if (removed) {
      if (this.activeStrokes.get(removed.hand)?.id === removed.id) {
        this.activeStrokes.delete(removed.hand);
      }
      return true;
    }
    return false;
  }

  /**
   * Clear all drawing strokes
   */
  public clear(): void {
    this.strokes = [];
    this.activeStrokes.clear();
  }

  public getStrokeCount(): number {
    return this.strokes.length;
  }

  /**
   * Render all recorded and active strokes to the canvas with glowing neon curves
   */
  public renderStrokes(ctx: CanvasRenderingContext2D, glowEnabled: boolean = true): void {
    if (this.strokes.length === 0) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of this.strokes) {
      const pts = stroke.points;
      if (pts.length < 2) continue;

      // Pass 1: Outer Neon Diffused Glow
      if (glowEnabled) {
        ctx.strokeStyle = stroke.color;
        ctx.shadowColor = stroke.color;
        ctx.shadowBlur = stroke.width * 2.5;
        ctx.lineWidth = stroke.width * 2.2;
        ctx.globalAlpha = 0.45;
        this.drawSmoothedPath(ctx, pts);
      }

      // Pass 2: Sharp Inner Bright Core
      ctx.strokeStyle = '#FFFFFF';
      ctx.shadowColor = stroke.color;
      ctx.shadowBlur = glowEnabled ? 8 : 0;
      ctx.lineWidth = Math.max(2, stroke.width * 0.7);
      ctx.globalAlpha = 0.95;
      this.drawSmoothedPath(ctx, pts);
    }

    ctx.restore();
  }

  /**
   * Draw quadratic Bezier curve through points for silky smooth drawing
   */
  private drawSmoothedPath(ctx: CanvasRenderingContext2D, pts: CanvasPoint[]): void {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    if (pts.length === 2) {
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.stroke();
      return;
    }

    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }

    // Connect to the final point
    const last = pts[pts.length - 1];
    const secondLast = pts[pts.length - 2];
    ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
    ctx.stroke();
  }
}
