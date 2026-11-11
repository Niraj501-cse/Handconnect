/**
 * HANDCONNECT - Pure Geometry & Gesture Mathematics
 * Handles 21-landmark calculations, gesture detection, finger spread,
 * and rainbow fingertip connection kinematics.
 */

export interface Landmark {
  x: number;
  y: number;
  z?: number;
}

export type GestureName = 
  | 'Open Hand'
  | 'Fist'
  | 'Pointing Finger'
  | 'Pinch'
  | 'Partial Hand';

export interface GestureDetectionResult {
  name: GestureName;
  confidence: number;
  description: string;
  extendedFingers: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
  pinchDistance?: number;
}

export interface RainbowBeamPair {
  fingerName: 'Thumb' | 'Index' | 'Middle' | 'Ring' | 'Pinky';
  landmarkIndex: number;
  color: string;
  glowColor: string;
  source: Landmark;
  target: Landmark;
  distance: number;
}

export const LANDMARK_INDEX = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;

export const RAINBOW_COLORS = [
  { name: 'Thumb', color: '#FF35C8', glow: 'rgba(255, 53, 200, 0.75)' },     // Neon Pink
  { name: 'Index', color: '#FFE83A', glow: 'rgba(255, 232, 58, 0.75)' },     // Glowing Yellow
  { name: 'Middle', color: '#00FF9D', glow: 'rgba(0, 255, 157, 0.75)' },     // Electric Green
  { name: 'Ring', color: '#00D9FF', glow: 'rgba(0, 217, 255, 0.75)' },       // Electric Blue
  { name: 'Pinky', color: '#9B5CFF', glow: 'rgba(155, 92, 255, 0.75)' },     // Neon Purple
] as const;

export const SKELETON_CONNECTIONS = [
  // Palm Base
  [0, 1], [1, 2], [2, 5], [5, 9], [9, 13], [13, 17], [17, 0],
  // Thumb
  [2, 3], [3, 4],
  // Index
  [5, 6], [6, 7], [7, 8],
  // Middle
  [9, 10], [10, 11], [11, 12],
  // Ring
  [13, 14], [14, 15], [15, 16],
  // Pinky
  [17, 18], [18, 19], [19, 20],
];

/**
 * 2D Euclidean distance between two landmarks
 */
export function distance2D(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Calculate the reference scale of the hand (wrist to middle MCP)
 */
export function getPalmScale(landmarks: Landmark[]): number {
  if (!landmarks || landmarks.length < 21) return 1;
  const wrist = landmarks[LANDMARK_INDEX.WRIST];
  const middleMcp = landmarks[LANDMARK_INDEX.MIDDLE_MCP];
  return Math.max(0.01, distance2D(wrist, middleMcp));
}

/**
 * Checks whether a finger is extended based on joint distances
 */
export function checkFingerExtension(landmarks: Landmark[]) {
  if (!landmarks || landmarks.length < 21) {
    return { thumb: false, index: false, middle: false, ring: false, pinky: false };
  }

  const wrist = landmarks[LANDMARK_INDEX.WRIST];
  const palmScale = getPalmScale(landmarks);

  // For Index, Middle, Ring, Pinky: tip should be further from wrist than PIP joint
  const isExtended = (tipIdx: number, pipIdx: number, mcpIdx: number) => {
    const tip = landmarks[tipIdx];
    const pip = landmarks[pipIdx];
    const mcp = landmarks[mcpIdx];
    const distWristTip = distance2D(wrist, tip);
    const distWristPip = distance2D(wrist, pip);
    const distMcpTip = distance2D(mcp, tip);
    const distMcpPip = distance2D(mcp, pip);
    return distWristTip > distWristPip * 1.12 && distMcpTip > distMcpPip * 1.2;
  };

  const index = isExtended(LANDMARK_INDEX.INDEX_TIP, LANDMARK_INDEX.INDEX_PIP, LANDMARK_INDEX.INDEX_MCP);
  const middle = isExtended(LANDMARK_INDEX.MIDDLE_TIP, LANDMARK_INDEX.MIDDLE_PIP, LANDMARK_INDEX.MIDDLE_MCP);
  const ring = isExtended(LANDMARK_INDEX.RING_TIP, LANDMARK_INDEX.RING_PIP, LANDMARK_INDEX.RING_MCP);
  const pinky = isExtended(LANDMARK_INDEX.PINKY_TIP, LANDMARK_INDEX.PINKY_PIP, LANDMARK_INDEX.PINKY_MCP);

  // Thumb: measure distance from thumb tip to pinky MCP compared to thumb IP
  const thumbTip = landmarks[LANDMARK_INDEX.THUMB_TIP];
  const thumbIp = landmarks[LANDMARK_INDEX.THUMB_IP];
  const pinkyMcp = landmarks[LANDMARK_INDEX.PINKY_MCP];
  const thumbMcp = landmarks[LANDMARK_INDEX.THUMB_MCP];
  
  const distThumbTipPinky = distance2D(thumbTip, pinkyMcp);
  const distThumbIpPinky = distance2D(thumbIp, pinkyMcp);
  const distThumbTipMcp = distance2D(thumbTip, thumbMcp);
  const thumb = distThumbTipPinky > distThumbIpPinky * 1.08 && distThumbTipMcp > palmScale * 0.45;

  return { thumb, index, middle, ring, pinky };
}

/**
 * Gesture Recognition Engine
 * Evaluates the 21 landmarks geometrically
 */
export function recognizeGesture(landmarks: Landmark[]): GestureDetectionResult {
  if (!landmarks || landmarks.length < 21) {
    return {
      name: 'Partial Hand',
      confidence: 0,
      description: 'Insufficient landmarks',
      extendedFingers: { thumb: false, index: false, middle: false, ring: false, pinky: false }
    };
  }

  const palmScale = getPalmScale(landmarks);
  const extended = checkFingerExtension(landmarks);
  const thumbTip = landmarks[LANDMARK_INDEX.THUMB_TIP];
  const indexTip = landmarks[LANDMARK_INDEX.INDEX_TIP];
  
  const pinchDist = distance2D(thumbTip, indexTip) / palmScale;

  const { thumb, index, middle, ring, pinky } = extended;
  const extendedCount = [thumb, index, middle, ring, pinky].filter(Boolean).length;
  const fourFingersCount = [index, middle, ring, pinky].filter(Boolean).length;
  const wrist = landmarks[LANDMARK_INDEX.WRIST];
  const distWristIndex = distance2D(wrist, indexTip);

  // 1. PINCH DETECTION
  // When thumb tip and index tip meet, and index reaches out towards thumb
  if (pinchDist < 0.38 && (index || distWristIndex > palmScale * 0.95)) {
    const confidence = Math.min(1, Math.max(0.65, 1 - (pinchDist / 0.38) * 0.4));
    return {
      name: 'Pinch',
      confidence: Number((confidence * 100).toFixed(1)),
      description: 'Thumb & Index contact detected',
      extendedFingers: extended,
      pinchDistance: Number(pinchDist.toFixed(2))
    };
  }

  // 2. FIST DETECTION
  // When all 4 fingers are curled tight into the palm
  if (fourFingersCount === 0) {
    return {
      name: 'Fist',
      confidence: 96.5,
      description: 'All fingers curled firmly',
      extendedFingers: extended
    };
  }

  // 3. POINTING FINGER DETECTION
  // Only index finger extended; middle, ring, pinky curled
  if (index && !middle && !ring && !pinky) {
    return {
      name: 'Pointing Finger',
      confidence: thumb ? 94.0 : 98.2,
      description: 'Index extended, others curled',
      extendedFingers: extended
    };
  }

  // 4. OPEN HAND DETECTION
  // All 5 fingers extended or 4 fingers fully extended
  if (fourFingersCount === 4 && thumb) {
    return {
      name: 'Open Hand',
      confidence: 99.1,
      description: 'All 5 fingers fully extended',
      extendedFingers: extended
    };
  }

  if (fourFingersCount === 4 && !thumb) {
    return {
      name: 'Open Hand',
      confidence: 91.5,
      description: 'Fingers spread, thumb relaxed',
      extendedFingers: extended
    };
  }

  // 5. PARTIAL HAND DETECTION
  // Any transitional state (e.g. Peace/Victory, Rock-on, Thumbs-up, etc.)
  let subDesc = 'Partial extension';
  if (index && middle && !ring && !pinky) {
    subDesc = 'Victory / Peace posture';
  } else if (thumb && !index && !middle && !ring && !pinky) {
    subDesc = 'Thumbs-up posture';
  } else if (index && pinky && !middle && !ring) {
    subDesc = 'Rock posture';
  } else {
    subDesc = `${extendedCount} of 5 fingers extended`;
  }

  return {
    name: 'Partial Hand',
    confidence: Number((80 + extendedCount * 3.5).toFixed(1)),
    description: subDesc,
    extendedFingers: extended
  };
}

/**
 * Calculates finger spread percentage (0% to 100%)
 * Measures the distances between adjacent tips relative to palm width
 */
export function calculateFingerSpread(landmarks: Landmark[]): number {
  if (!landmarks || landmarks.length < 21) return 0;

  const palmWidth = distance2D(landmarks[LANDMARK_INDEX.INDEX_MCP], landmarks[LANDMARK_INDEX.PINKY_MCP]);
  if (palmWidth < 0.001) return 0;

  const d1 = distance2D(landmarks[LANDMARK_INDEX.THUMB_TIP], landmarks[LANDMARK_INDEX.INDEX_TIP]);
  const d2 = distance2D(landmarks[LANDMARK_INDEX.INDEX_TIP], landmarks[LANDMARK_INDEX.MIDDLE_TIP]);
  const d3 = distance2D(landmarks[LANDMARK_INDEX.MIDDLE_TIP], landmarks[LANDMARK_INDEX.RING_TIP]);
  const d4 = distance2D(landmarks[LANDMARK_INDEX.RING_TIP], landmarks[LANDMARK_INDEX.PINKY_TIP]);

  const totalSpread = (d1 + d2 + d3 + d4) / palmWidth;
  // Normalized baseline: 1.2 is narrow/fist, 3.8+ is wide spread
  const normalized = Math.min(100, Math.max(0, ((totalSpread - 1.2) / 2.6) * 100));
  return Math.round(normalized);
}

/**
 * Connects corresponding fingertips of both hands for Rainbow Beams
 */
export function getRainbowBeamConnections(
  hand1Landmarks: Landmark[],
  hand2Landmarks: Landmark[]
): RainbowBeamPair[] {
  if (!hand1Landmarks || !hand2Landmarks || hand1Landmarks.length < 21 || hand2Landmarks.length < 21) {
    return [];
  }

  const tipIndices: Array<{ name: RainbowBeamPair['fingerName']; idx: number; color: string; glow: string }> = [
    { name: 'Thumb', idx: LANDMARK_INDEX.THUMB_TIP, color: RAINBOW_COLORS[0].color, glow: RAINBOW_COLORS[0].glow },
    { name: 'Index', idx: LANDMARK_INDEX.INDEX_TIP, color: RAINBOW_COLORS[1].color, glow: RAINBOW_COLORS[1].glow },
    { name: 'Middle', idx: LANDMARK_INDEX.MIDDLE_TIP, color: RAINBOW_COLORS[2].color, glow: RAINBOW_COLORS[2].glow },
    { name: 'Ring', idx: LANDMARK_INDEX.RING_TIP, color: RAINBOW_COLORS[3].color, glow: RAINBOW_COLORS[3].glow },
    { name: 'Pinky', idx: LANDMARK_INDEX.PINKY_TIP, color: RAINBOW_COLORS[4].color, glow: RAINBOW_COLORS[4].glow },
  ];

  return tipIndices.map(item => {
    const p1 = hand1Landmarks[item.idx];
    const p2 = hand2Landmarks[item.idx];
    return {
      fingerName: item.name,
      landmarkIndex: item.idx,
      color: item.color,
      glowColor: item.glow,
      source: p1,
      target: p2,
      distance: distance2D(p1, p2),
    };
  });
}
