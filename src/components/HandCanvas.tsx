import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  Landmark,
  LANDMARK_INDEX,
  RAINBOW_COLORS,
  SKELETON_CONNECTIONS,
  distance2D,
  recognizeGesture,
  calculateFingerSpread,
  getRainbowBeamConnections,
} from '../utils/gestureMath';
import { ParticleEngine } from '../utils/particleEngine';
import { THEME_PRESETS } from '../utils/themePresets';
import { CameraStatus, HandData, TrackingStatus } from '../types';
import { AirCanvasEngine } from '../utils/airCanvasMath';
import { cyberAudio } from '../utils/cyberAudio';
import { Camera, AlertTriangle, ShieldCheck, Play, Sparkles, PenTool } from 'lucide-react';

export interface HandCanvasHandle {
  captureSnapshot: () => void;
  triggerWipeShockwave: () => void;
}

interface HandCanvasProps {
  isTracking: boolean;
  facingMode: 'user' | 'environment';
  neonGlowEnabled: boolean;
  rainbowBeamsEnabled: boolean;
  particlesEnabled: boolean;
  activeThemeId: string;
  isSimulated: boolean;
  // Air Canvas integration
  airCanvasEnabled: boolean;
  brushColor: string;
  brushWidth: number;
  airCanvasEngine: AirCanvasEngine;
  onCameraStatusChange: (status: CameraStatus) => void;
  onTrackingStatusChange: (status: TrackingStatus) => void;
  onHandsUpdate: (left: HandData | null, right: HandData | null, fps: number) => void;
  onGestureDetected: (hand: 'Left' | 'Right', gesture: string, confidence: number) => void;
  onRequestStartTracking: () => void;
}

export const HandCanvas = forwardRef<HandCanvasHandle, HandCanvasProps>(({
  isTracking,
  facingMode,
  neonGlowEnabled,
  rainbowBeamsEnabled,
  particlesEnabled,
  activeThemeId,
  isSimulated,
  airCanvasEnabled,
  brushColor,
  brushWidth,
  airCanvasEngine,
  onCameraStatusChange,
  onTrackingStatusChange,
  onHandsUpdate,
  onGestureDetected,
  onRequestStartTracking,
}, ref) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isLoadingMediaPipe, setIsLoadingMediaPipe] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // References for render loop
  const handsDetectorRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const particleEngineRef = useRef<ParticleEngine>(new ParticleEngine());
  const animationFrameIdRef = useRef<number | null>(null);
  const isProcessingFrameRef = useRef<boolean>(false);

  // Shockwave wipe animation state
  const shockwaveRef = useRef<{ active: boolean; radius: number; maxRadius: number; alpha: number } | null>(null);

  // Live state refs
  const detectedHandsRef = useRef<{ left: HandData | null; right: HandData | null }>({
    left: null,
    right: null,
  });
  const prevGesturesRef = useRef<{ left: string | null; right: string | null }>({
    left: null,
    right: null,
  });
  const prevHandsCountRef = useRef<number>(0);

  // FPS calculation
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());
  const currentFpsRef = useRef<number>(0);

  // Simulation time tracker
  const simTimeRef = useRef<number>(0);

  const activeTheme = THEME_PRESETS.find((t) => t.id === activeThemeId) || THEME_PRESETS[0];

  // Expose imperative methods for snapshot capture and shockwave animation
  useImperativeHandle(ref, () => ({
    triggerWipeShockwave: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      shockwaveRef.current = {
        active: true,
        radius: 10,
        maxRadius: Math.hypot(canvas.width, canvas.height) / 2 + 100,
        alpha: 1.0,
      };
      cyberAudio.playWipeSound();
    },
    captureSnapshot: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Create an offscreen canvas to stamp the snapshot with an official cyber watermark
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = canvas.width;
      snapCanvas.height = canvas.height;
      const snapCtx = snapCanvas.getContext('2d');
      if (!snapCtx) return;

      // Draw the main visual frame
      snapCtx.drawImage(canvas, 0, 0);

      // Add Cyber Watermark Banner at the bottom
      snapCtx.save();
      const bannerHeight = 44;
      snapCtx.fillStyle = 'rgba(5, 5, 16, 0.85)';
      snapCtx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

      snapCtx.strokeStyle = 'rgba(0, 217, 255, 0.4)';
      snapCtx.lineWidth = 1;
      snapCtx.beginPath();
      snapCtx.moveTo(0, canvas.height - bannerHeight);
      snapCtx.lineTo(canvas.width, canvas.height - bannerHeight);
      snapCtx.stroke();

      snapCtx.font = 'bold 13px "Chakra Petch", sans-serif';
      snapCtx.fillStyle = '#00D9FF';
      snapCtx.fillText('HANDCONNECT // AI VISION KINEMATICS', 24, canvas.height - 18);

      const now = new Date();
      const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);
      snapCtx.font = '11px "JetBrains Mono", monospace';
      snapCtx.fillStyle = '#f1f5f9';
      snapCtx.textAlign = 'right';
      snapCtx.fillText(`${dateStr} UTC · 21-PT SKELETON · 100% LOCAL`, canvas.width - 24, canvas.height - 18);
      snapCtx.restore();

      // Convert to image download
      const dataUrl = snapCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `HandConnect_Snapshot_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
  }));

  // Clean stop webcam stream
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Initialize MediaPipe Hands instance
  const initMediaPipe = useCallback(async () => {
    if (handsDetectorRef.current) return handsDetectorRef.current;

    setIsLoadingMediaPipe(true);
    try {
      let retries = 0;
      while (!(window as any).Hands && retries < 25) {
        await new Promise((r) => setTimeout(r, 200));
        retries++;
      }

      if (!(window as any).Hands) {
        throw new Error('MediaPipe Hands library could not be loaded from CDN.');
      }

      const hands = new (window as any).Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results: any) => {
        handleMediaPipeResults(results);
      });

      handsDetectorRef.current = hands;
      setIsLoadingMediaPipe(false);
      return hands;
    } catch (err: any) {
      setIsLoadingMediaPipe(false);
      console.error('Failed to initialize MediaPipe Hands:', err);
      setCameraError(err.message || 'MediaPipe initialization failed.');
      return null;
    }
  }, []);

  // Process MediaPipe detection results
  const handleMediaPipeResults = (results: any) => {
    isProcessingFrameRef.current = false;

    if (!results || !results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      detectedHandsRef.current = { left: null, right: null };
      onTrackingStatusChange(isTracking ? 'SEARCHING' : 'STANDBY');
      onHandsUpdate(null, null, currentFpsRef.current);
      prevHandsCountRef.current = 0;
      cyberAudio.stopDrawingHum();
      return;
    }

    const landmarksList = results.multiHandLandmarks;
    const handednessList = results.multiHandedness || [];

    let leftHand: HandData | null = null;
    let rightHand: HandData | null = null;

    for (let i = 0; i < landmarksList.length; i++) {
      const rawLandmarks = landmarksList[i];
      // When video is mirrored horizontally, MediaPipe x is inverted
      const mirroredLandmarks: Landmark[] = rawLandmarks.map((pt: any) => ({
        x: 1 - pt.x,
        y: pt.y,
        z: pt.z,
      }));

      // In mirrored webcam feed, MediaPipe's "Left" label is the user's physical Right hand and vice versa
      const rawHandLabel = handednessList[i]?.label || (i === 0 ? 'Left' : 'Right');
      const score = handednessList[i]?.score || 0.95;
      
      const physicalHand: 'Left' | 'Right' = rawHandLabel === 'Left' ? 'Right' : 'Left';

      const gesture = recognizeGesture(mirroredLandmarks);
      const spread = calculateFingerSpread(mirroredLandmarks);

      const handData: HandData = {
        landmarks: mirroredLandmarks,
        handedness: physicalHand,
        gesture,
        fingerSpread: spread,
        confidence: Number((score * 100).toFixed(1)),
      };

      if (physicalHand === 'Left' && !leftHand) {
        leftHand = handData;
      } else if (physicalHand === 'Right' && !rightHand) {
        rightHand = handData;
      } else if (!leftHand) {
        leftHand = handData;
      } else if (!rightHand) {
        rightHand = handData;
      }
    }

    detectedHandsRef.current = { left: leftHand, right: rightHand };

    // Emit gesture transitions
    if (leftHand && leftHand.gesture.name !== prevGesturesRef.current.left) {
      prevGesturesRef.current.left = leftHand.gesture.name;
      onGestureDetected('Left', leftHand.gesture.name, leftHand.gesture.confidence);
      cyberAudio.playGestureSound(leftHand.gesture.name);
      if (leftHand.gesture.name === 'Pinch') {
        if (canvasRef.current) {
          const pinchPt = leftHand.landmarks[LANDMARK_INDEX.INDEX_TIP];
          particleEngineRef.current.emitSparks(
            pinchPt.x * canvasRef.current.width,
            pinchPt.y * canvasRef.current.height,
            activeTheme.leftHandColor,
            18
          );
        }
      }
    }

    if (rightHand && rightHand.gesture.name !== prevGesturesRef.current.right) {
      prevGesturesRef.current.right = rightHand.gesture.name;
      onGestureDetected('Right', rightHand.gesture.name, rightHand.gesture.confidence);
      cyberAudio.playGestureSound(rightHand.gesture.name);
      if (rightHand.gesture.name === 'Pinch') {
        if (canvasRef.current) {
          const pinchPt = rightHand.landmarks[LANDMARK_INDEX.INDEX_TIP];
          particleEngineRef.current.emitSparks(
            pinchPt.x * canvasRef.current.width,
            pinchPt.y * canvasRef.current.height,
            activeTheme.rightHandColor,
            18
          );
        }
      }
    }

    const handsCount = (leftHand ? 1 : 0) + (rightHand ? 1 : 0);
    if (handsCount === 2) {
      onTrackingStatusChange('LOCKED_2_HANDS');
      // Trigger rainbow chime when transitioning to 2 connected hands
      if (prevHandsCountRef.current < 2) {
        cyberAudio.playRainbowResonance();
      }
    } else if (handsCount === 1) {
      onTrackingStatusChange('TRACKING_1_HAND');
    } else {
      onTrackingStatusChange('SEARCHING');
    }
    prevHandsCountRef.current = handsCount;

    onHandsUpdate(leftHand, rightHand, currentFpsRef.current);
  };

  // Start webcam feed
  const startWebcam = useCallback(async () => {
    setCameraError(null);
    onCameraStatusChange('REQUESTING');

    try {
      await initMediaPipe();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((e) => console.warn('Video play warning:', e));
          onCameraStatusChange('ACTIVE');
          onTrackingStatusChange('SEARCHING');
        };
      }
    } catch (err: any) {
      console.warn('Webcam access error:', err);
      let errMsg = 'Camera access was denied or device not found.';
      if (err.name === 'NotAllowedError') {
        errMsg = 'Permission was denied. Please allow camera access in your browser settings to track hands.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No physical webcam detected on this device. You can test full features using Simulation Mode.';
      } else if (err.name === 'NotReadableError') {
        errMsg = 'Camera is currently in use by another application.';
      }
      setCameraError(errMsg);
      onCameraStatusChange('ERROR');
    }
  }, [facingMode, initMediaPipe, onCameraStatusChange, onTrackingStatusChange]);

  // Setup / teardown webcam on isTracking toggle
  useEffect(() => {
    if (isTracking && !isSimulated) {
      startWebcam();
    } else {
      stopWebcam();
      cyberAudio.stopDrawingHum();
      if (!isSimulated) {
        onCameraStatusChange('OFFLINE');
        onTrackingStatusChange('STANDBY');
      }
    }
    return () => {
      stopWebcam();
      cyberAudio.stopDrawingHum();
    };
  }, [isTracking, isSimulated, startWebcam, stopWebcam, onCameraStatusChange, onTrackingStatusChange]);

  // Generate synthetic simulated hands for demo / automated testing
  const updateSimulatedHands = () => {
    simTimeRef.current += 0.025;
    const t = simTimeRef.current;

    const leftBaseX = 0.34 + Math.sin(t * 0.7) * 0.06;
    const leftBaseY = 0.52 + Math.cos(t * 0.5) * 0.05;

    const rightBaseX = 0.66 - Math.sin(t * 0.7) * 0.06;
    const rightBaseY = 0.52 + Math.cos(t * 0.6) * 0.05;

    const gestureCycle = Math.floor(t / 4) % 4; // 0: Open, 1: Pointing, 2: Pinch, 3: Partial

    const buildSimHand = (baseX: number, baseY: number, isLeft: boolean): Landmark[] => {
      const marks: Landmark[] = [];
      const dir = isLeft ? -1 : 1;
      const wrist = { x: baseX, y: baseY + 0.22 };

      const mcp5 = { x: baseX - 0.04 * dir, y: baseY + 0.02 };
      const mcp9 = { x: baseX, y: baseY };
      const mcp13 = { x: baseX + 0.04 * dir, y: baseY + 0.02 };
      const mcp17 = { x: baseX + 0.07 * dir, y: baseY + 0.06 };

      const cmc = { x: baseX - 0.06 * dir, y: baseY + 0.14 };
      const thumbMcp = { x: baseX - 0.09 * dir, y: baseY + 0.09 };
      const thumbIp = { x: baseX - 0.11 * dir, y: baseY + 0.04 };
      let thumbTip = { x: baseX - 0.13 * dir, y: baseY - 0.01 };

      let indexTip = { x: mcp5.x, y: mcp5.y - 0.16 };
      let middleTip = { x: mcp9.x, y: mcp9.y - 0.18 };
      let ringTip = { x: mcp13.x, y: mcp13.y - 0.15 };
      let pinkyTip = { x: mcp17.x, y: mcp17.y - 0.12 };

      if (gestureCycle === 1) {
        // Pointing finger gesture: index moves in an elegant loop to demonstrate Air Canvas
        const loopAngle = t * 2.5;
        indexTip = {
          x: mcp5.x + Math.sin(loopAngle) * 0.08,
          y: mcp5.y - 0.16 + Math.cos(loopAngle) * 0.06,
        };
        middleTip = { x: mcp9.x, y: mcp9.y + 0.02 };
        ringTip = { x: mcp13.x, y: mcp13.y + 0.02 };
        pinkyTip = { x: mcp17.x, y: mcp17.y + 0.03 };
      } else if (gestureCycle === 2) {
        // Pinch
        thumbTip = { x: baseX - 0.04 * dir, y: baseY - 0.08 };
        indexTip = { x: baseX - 0.035 * dir, y: baseY - 0.08 };
      } else if (gestureCycle === 3) {
        // Partial: Victory peace sign
        ringTip = { x: mcp13.x, y: mcp13.y + 0.02 };
        pinkyTip = { x: mcp17.x, y: mcp17.y + 0.03 };
      }

      marks[0] = wrist;
      marks[1] = cmc;
      marks[2] = thumbMcp;
      marks[3] = thumbIp;
      marks[4] = thumbTip;

      marks[5] = mcp5;
      marks[6] = { x: (mcp5.x + indexTip.x) / 2, y: (mcp5.y + indexTip.y) / 2 };
      marks[7] = { x: (marks[6].x + indexTip.x) / 2, y: (marks[6].y + indexTip.y) / 2 };
      marks[8] = indexTip;

      marks[9] = mcp9;
      marks[10] = { x: (mcp9.x + middleTip.x) / 2, y: (mcp9.y + middleTip.y) / 2 };
      marks[11] = { x: (marks[10].x + middleTip.x) / 2, y: (marks[10].y + middleTip.y) / 2 };
      marks[12] = middleTip;

      marks[13] = mcp13;
      marks[14] = { x: (mcp13.x + ringTip.x) / 2, y: (mcp13.y + ringTip.y) / 2 };
      marks[15] = { x: (marks[14].x + ringTip.x) / 2, y: (marks[14].y + ringTip.y) / 2 };
      marks[16] = ringTip;

      marks[17] = mcp17;
      marks[18] = { x: (mcp17.x + pinkyTip.x) / 2, y: (mcp17.y + pinkyTip.y) / 2 };
      marks[19] = { x: (marks[18].x + pinkyTip.x) / 2, y: (marks[18].y + pinkyTip.y) / 2 };
      marks[20] = pinkyTip;

      return marks;
    };

    const simLeftLandmarks = buildSimHand(leftBaseX, leftBaseY, true);
    const simRightLandmarks = buildSimHand(rightBaseX, rightBaseY, false);

    const leftGest = recognizeGesture(simLeftLandmarks);
    const rightGest = recognizeGesture(simRightLandmarks);

    const leftHand: HandData = {
      landmarks: simLeftLandmarks,
      handedness: 'Left',
      gesture: leftGest,
      fingerSpread: calculateFingerSpread(simLeftLandmarks),
      confidence: 99.4,
    };

    const rightHand: HandData = {
      landmarks: simRightLandmarks,
      handedness: 'Right',
      gesture: rightGest,
      fingerSpread: calculateFingerSpread(simRightLandmarks),
      confidence: 99.2,
    };

    // Emit gesture transitions in simulation mode
    if (leftHand.gesture.name !== prevGesturesRef.current.left) {
      prevGesturesRef.current.left = leftHand.gesture.name;
      onGestureDetected('Left', leftHand.gesture.name, leftHand.gesture.confidence);
      cyberAudio.playGestureSound(leftHand.gesture.name);
      if (leftHand.gesture.name === 'Pinch') {
        if (canvasRef.current) {
          const pinchPt = leftHand.landmarks[LANDMARK_INDEX.INDEX_TIP];
          particleEngineRef.current.emitSparks(
            pinchPt.x * canvasRef.current.width,
            pinchPt.y * canvasRef.current.height,
            activeTheme.leftHandColor,
            16
          );
        }
      }
    }

    if (rightHand.gesture.name !== prevGesturesRef.current.right) {
      prevGesturesRef.current.right = rightHand.gesture.name;
      onGestureDetected('Right', rightHand.gesture.name, rightHand.gesture.confidence);
      cyberAudio.playGestureSound(rightHand.gesture.name);
      if (rightHand.gesture.name === 'Pinch') {
        if (canvasRef.current) {
          const pinchPt = rightHand.landmarks[LANDMARK_INDEX.INDEX_TIP];
          particleEngineRef.current.emitSparks(
            pinchPt.x * canvasRef.current.width,
            pinchPt.y * canvasRef.current.height,
            activeTheme.rightHandColor,
            16
          );
        }
      }
    }

    detectedHandsRef.current = { left: leftHand, right: rightHand };
    onTrackingStatusChange('LOCKED_2_HANDS');
    onHandsUpdate(leftHand, rightHand, currentFpsRef.current);
  };

  // Main high-performance Animation & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = async () => {
      if (!isRunning) return;

      // Calculate rolling FPS
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastFpsTimeRef.current;
      if (elapsed >= 500) {
        currentFpsRef.current = Math.round((frameCountRef.current * 1000) / elapsed);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }

      // Responsive canvas size matching container
      const container = containerRef.current;
      if (container) {
        const targetWidth = container.clientWidth || 1280;
        const targetHeight = container.clientHeight || 720;
        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          particleEngineRef.current.initAmbient(targetWidth, targetHeight);
        }
      }

      const width = canvas.width;
      const height = canvas.height;

      // 1. Process Video Frame if tracking with camera
      const video = videoRef.current;
      if (
        isTracking &&
        !isSimulated &&
        video &&
        video.readyState >= 2 &&
        handsDetectorRef.current &&
        !isProcessingFrameRef.current
      ) {
        isProcessingFrameRef.current = true;
        try {
          await handsDetectorRef.current.send({ image: video });
        } catch (e) {
          isProcessingFrameRef.current = false;
        }
      } else if (isSimulated) {
        updateSimulatedHands();
      }

      // 2. Clear canvas with deep cyber backdrop
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, width, height);

      // 3. Draw Mirrored Camera Feed if active
      if (isTracking && !isSimulated && video && video.readyState >= 2) {
        ctx.save();
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);
        ctx.restore();

        // Dark cyber overlay scrim
        ctx.fillStyle = 'rgba(5, 5, 16, 0.58)';
        ctx.fillRect(0, 0, width, height);
      } else {
        drawCyberGrid(ctx, width, height);
      }

      // 4. Update and Render Ambient Particles
      if (particlesEnabled) {
        particleEngineRef.current.update(width, height);
        particleEngineRef.current.drawAmbient(ctx);
      }

      const { left, right } = detectedHandsRef.current;

      // 5. AIR CANVAS POINT TRACKING & STROKE RECORDING
      let isAnyHandDrawing = false;
      let activeDrawingY = 0.5;

      if (airCanvasEnabled) {
        const checkDrawingForHand = (hand: HandData | null) => {
          if (!hand) return;
          const isPointing = hand.gesture.name === 'Pointing Finger';
          const tip = hand.landmarks[LANDMARK_INDEX.INDEX_TIP];
          const canvasX = tip.x * width;
          const canvasY = tip.y * height;

          if (isPointing) {
            isAnyHandDrawing = true;
            activeDrawingY = tip.y;
            const activeStroke = airCanvasEngine.getActiveStroke(hand.handedness);
            if (!activeStroke) {
              airCanvasEngine.startStroke(hand.handedness, { x: canvasX, y: canvasY }, brushColor, brushWidth);
            } else {
              airCanvasEngine.addPoint(hand.handedness, { x: canvasX, y: canvasY }, 3.5);
            }
          } else {
            airCanvasEngine.endStroke(hand.handedness);
          }
        };

        checkDrawingForHand(left);
        checkDrawingForHand(right);

        // Update audio theremin feedback while drawing
        if (isAnyHandDrawing) {
          cyberAudio.updateDrawingHum(activeDrawingY);
        } else {
          cyberAudio.stopDrawingHum();
        }

        // Render Air Canvas strokes
        airCanvasEngine.renderStrokes(ctx, neonGlowEnabled);
      } else {
        cyberAudio.stopDrawingHum();
      }

      // 6. Draw Rainbow Fingertip Connections when both hands are detected
      const activeBeams: any[] = [];
      if (rainbowBeamsEnabled && left && right) {
        const beams = getRainbowBeamConnections(left.landmarks, right.landmarks);
        drawRainbowBeams(ctx, beams, width, height, activeBeams);
      }

      // 7. Draw Traveling Energy Particles along beams
      if (particlesEnabled && activeBeams.length > 0) {
        particleEngineRef.current.drawBeamParticles(ctx, activeBeams);
      }

      // 8. Draw Neon Hand Skeletons
      if (left) {
        drawHandSkeleton(ctx, left, width, height, activeTheme.leftHandColor, activeTheme.leftHandGlow, neonGlowEnabled);
      }
      if (right) {
        drawHandSkeleton(ctx, right, width, height, activeTheme.rightHandColor, activeTheme.rightHandGlow, neonGlowEnabled);
      }

      // 9. Draw Active Drawing Brush Reticle at Pointing Fingertips
      if (airCanvasEnabled) {
        const drawCursorAtTip = (hand: HandData | null) => {
          if (!hand || hand.gesture.name !== 'Pointing Finger') return;
          const tip = hand.landmarks[LANDMARK_INDEX.INDEX_TIP];
          const x = tip.x * width;
          const y = tip.y * height;

          ctx.save();
          ctx.strokeStyle = brushColor;
          ctx.shadowColor = brushColor;
          ctx.shadowBlur = 14;
          ctx.lineWidth = 2;

          ctx.beginPath();
          ctx.arc(x, y, brushWidth * 1.5 + 4, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        };

        drawCursorAtTip(left);
        drawCursorAtTip(right);
      }

      // 10. Draw Contact Sparks
      if (particlesEnabled) {
        particleEngineRef.current.drawSparks(ctx);
      }

      // 11. Render Shockwave Wipe Animation if active
      if (shockwaveRef.current && shockwaveRef.current.active) {
        const sw = shockwaveRef.current;
        sw.radius += (sw.maxRadius - sw.radius) * 0.12 + 6;
        sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

        ctx.save();
        ctx.strokeStyle = '#00D9FF';
        ctx.shadowColor = '#00D9FF';
        ctx.shadowBlur = 25;
        ctx.lineWidth = 6 * sw.alpha;
        ctx.globalAlpha = sw.alpha;

        ctx.beginPath();
        ctx.arc(width / 2, height / 2, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (sw.radius >= sw.maxRadius || sw.alpha <= 0.02) {
          shockwaveRef.current = null;
        }
      }

      // 12. Draw HUD Crosshairs & Corner Telemetry Brackets
      drawHUDOverlays(ctx, width, height, left !== null || right !== null);

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cyberAudio.stopDrawingHum();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [
    isTracking,
    isSimulated,
    neonGlowEnabled,
    rainbowBeamsEnabled,
    particlesEnabled,
    activeTheme,
    airCanvasEnabled,
    brushColor,
    brushWidth,
    airCanvasEngine,
  ]);

  // Render Futuristic Cyber Grid
  const drawCyberGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(155, 92, 255, 0.07)';
    ctx.lineWidth = 1;

    const step = 48;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const cx = width / 2;
    const cy = height / 2;
    ctx.strokeStyle = 'rgba(0, 217, 255, 0.12)';
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(width, height) * 0.32, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 53, 200, 0.08)';
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(width, height) * 0.22, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  };

  // Render Rainbow Fingertip Connection Beams
  const drawRainbowBeams = (
    ctx: CanvasRenderingContext2D,
    beams: any[],
    width: number,
    height: number,
    activeBeamsOut: any[]
  ) => {
    ctx.save();
    const time = performance.now() * 0.003;

    for (let i = 0; i < beams.length; i++) {
      const b = beams[i];
      const p1 = { x: b.source.x * width, y: b.source.y * height };
      const p2 = { x: b.target.x * width, y: b.target.y * height };

      activeBeamsOut.push({
        source: p1,
        target: p2,
        color: b.color,
        glowColor: b.glowColor,
      });

      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const intensity = Math.min(1.5, Math.max(0.6, 280 / (dist + 50)));

      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const sineWobble = Math.sin(time * 4 + i * 1.3) * (dist * 0.08);
      const perpX = -(p2.y - p1.y) / (dist || 1) * sineWobble;
      const perpY = (p2.x - p1.x) / (dist || 1) * sineWobble;

      const ctrlX = midX + perpX;
      const ctrlY = midY + perpY;

      // Layer 1: Wide Diffused Glow
      if (neonGlowEnabled) {
        ctx.strokeStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 18 * intensity;
        ctx.lineWidth = 5 * intensity;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(ctrlX, ctrlY, p2.x, p2.y);
        ctx.stroke();
      }

      // Layer 2: Core Electric Laser Beam
      ctx.strokeStyle = '#FFFFFF';
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2.2 * intensity;
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(ctrlX, ctrlY, p2.x, p2.y);
      ctx.stroke();

      // Trigger spark burst if fingertips touch
      if (dist < 40 && Math.random() < 0.25) {
        particleEngineRef.current.emitSparks(midX, midY, b.color, 4);
      }
    }

    ctx.restore();
  };

  // Render Neon Hand Skeleton & Joints
  const drawHandSkeleton = (
    ctx: CanvasRenderingContext2D,
    hand: HandData,
    width: number,
    height: number,
    color: string,
    glowColor: string,
    glowOn: boolean
  ) => {
    ctx.save();
    const landmarks = hand.landmarks;

    const pts = landmarks.map((l) => ({
      x: l.x * width,
      y: l.y * height,
    }));

    // 1. Draw Bones
    for (const [fromIdx, toIdx] of SKELETON_CONNECTIONS) {
      const p1 = pts[fromIdx];
      const p2 = pts[toIdx];

      if (glowOn) {
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 4.5;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      ctx.strokeStyle = '#FFFFFF';
      ctx.shadowColor = color;
      ctx.shadowBlur = glowOn ? 6 : 0;
      ctx.lineWidth = 2.0;
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // 2. Draw 21 Joints
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const isFingertip = [4, 8, 12, 16, 20].includes(i);
      const isWrist = i === 0;

      const radius = isFingertip ? 6.5 : isWrist ? 6 : 4;

      if (glowOn) {
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = isFingertip ? 16 : 8;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      if (isFingertip) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 3. Pinch Reticle if pinch is engaged
    if (hand.gesture.name === 'Pinch') {
      const thumbTip = pts[LANDMARK_INDEX.THUMB_TIP];
      const indexTip = pts[LANDMARK_INDEX.INDEX_TIP];
      const pinchMidX = (thumbTip.x + indexTip.x) / 2;
      const pinchMidY = (thumbTip.y + indexTip.y) / 2;

      ctx.save();
      ctx.strokeStyle = '#00D9FF';
      ctx.shadowColor = '#00D9FF';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.85;

      ctx.beginPath();
      ctx.arc(pinchMidX, pinchMidY, 18, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pinchMidX - 24, pinchMidY);
      ctx.lineTo(pinchMidX - 10, pinchMidY);
      ctx.moveTo(pinchMidX + 10, pinchMidY);
      ctx.lineTo(pinchMidX + 24, pinchMidY);
      ctx.moveTo(pinchMidX, pinchMidY - 24);
      ctx.lineTo(pinchMidX, pinchMidY - 10);
      ctx.moveTo(pinchMidX, pinchMidY + 10);
      ctx.lineTo(pinchMidX, pinchMidY + 24);
      ctx.stroke();

      ctx.fillStyle = '#00D9FF';
      ctx.font = 'bold 10px "Chakra Petch", sans-serif';
      ctx.fillText('PINCH LOCK', pinchMidX - 28, pinchMidY - 28);
      ctx.restore();
    }

    // 4. Floating Holographic Hand Label near Wrist
    const wrist = pts[0];
    ctx.save();
    ctx.font = 'bold 11px "Chakra Petch", monospace';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.globalAlpha = 0.9;
    const label = `${hand.handedness.toUpperCase()} HAND: ${hand.gesture.name.toUpperCase()}`;
    ctx.fillText(label, wrist.x - 40, wrist.y + 24);
    ctx.restore();

    ctx.restore();
  };

  // Render Futuristic HUD Overlay Elements
  const drawHUDOverlays = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    hasTargets: boolean
  ) => {
    ctx.save();
    const cornerSize = 24;
    const pad = 16;
    ctx.strokeStyle = hasTargets ? 'rgba(0, 217, 255, 0.5)' : 'rgba(155, 92, 255, 0.25)';
    ctx.lineWidth = 2;

    // Top-Left corner bracket
    ctx.beginPath();
    ctx.moveTo(pad, pad + cornerSize);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + cornerSize, pad);
    ctx.stroke();

    // Top-Right corner bracket
    ctx.beginPath();
    ctx.moveTo(width - pad - cornerSize, pad);
    ctx.lineTo(width - pad, pad);
    ctx.lineTo(width - pad, pad + cornerSize);
    ctx.stroke();

    // Bottom-Left corner bracket
    ctx.beginPath();
    ctx.moveTo(pad, height - pad - cornerSize);
    ctx.lineTo(pad, height - pad);
    ctx.lineTo(pad + cornerSize, height - pad);
    ctx.stroke();

    // Bottom-Right corner bracket
    ctx.beginPath();
    ctx.moveTo(width - pad - cornerSize, height - pad);
    ctx.lineTo(width - pad, height - pad);
    ctx.lineTo(width - pad, height - pad - cornerSize);
    ctx.stroke();

    // Optical Center Target Crosshair
    const cx = width / 2;
    const cy = height / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy);
    ctx.lineTo(cx + 14, cy);
    ctx.moveTo(cx, cy - 14);
    ctx.lineTo(cx, cy + 14);
    ctx.stroke();

    // Small live stamp in bottom-left corner of canvas
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillText(
      `RES: ${width}x${height} | CORE: MEDIAPIPE HANDS | AI CONF: 98.4%`,
      pad + 8,
      height - pad - 6
    );

    ctx.restore();
  };

  return (
    <div
      id="canvas-viewport"
      ref={containerRef}
      className="relative w-full aspect-[16/9] min-h-[420px] max-h-[680px] bg-[#050510] rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl glass-panel-glow flex items-center justify-center"
    >
      {/* Hidden WebRTC Video Element */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="hidden"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Primary HTML5 Canvas Renderer */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair select-none"
      />

      {/* Cyber Scanline Overlay */}
      <div className="absolute inset-0 cyber-scanlines pointer-events-none" />

      {/* Top Banner Indicators */}
      <div className="absolute top-4 left-6 flex flex-wrap items-center gap-2.5 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-black/60 border border-purple-500/30 backdrop-blur-md text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${isTracking || isSimulated ? 'bg-[#00FF9D] animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-slate-200">
            {isSimulated
              ? 'SIMULATED HAND FEED'
              : isTracking
              ? 'LIVE SENSOR TRACKING'
              : 'SENSOR STANDBY'}
          </span>
        </div>
        {airCanvasEnabled && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-cyan-400/40 backdrop-blur-md text-xs font-mono text-cyan-300">
            <PenTool className="w-3 h-3 text-[#00D9FF]" />
            <span>AIR CANVAS ACTIVE</span>
          </div>
        )}
        {isTracking && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-cyan-500/30 backdrop-blur-md text-xs font-mono text-cyan-300">
            <Sparkles className="w-3 h-3 text-[#00D9FF]" />
            <span>21-PT KINEMATICS</span>
          </div>
        )}
      </div>

      {/* MediaPipe Loading State */}
      {isLoadingMediaPipe && (
        <div className="absolute inset-0 bg-[#050510]/80 backdrop-blur-md flex flex-col items-center justify-center z-20">
          <div className="relative w-16 h-16">
            <div className="w-16 h-16 rounded-full border-2 border-purple-500/20 border-t-[#00D9FF] animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-pink-500/20 border-b-[#FF35C8] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="mt-4 font-cyber text-sm tracking-wider uppercase text-white font-semibold">
            Calibrating MediaPipe Neural Pipeline...
          </p>
          <span className="text-xs font-mono text-slate-400 mt-1">
            Loading 21-landmark neural model into WebGL context
          </span>
        </div>
      )}

      {/* Camera Error / Troubleshooting Overlay */}
      {cameraError && !isSimulated && (
        <div className="absolute inset-0 bg-[#050510]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <h3 className="font-cyber font-bold text-base text-white tracking-wide">
            Camera Input Unavailable
          </h3>
          <p className="text-xs font-mono text-slate-300 max-w-md mt-2">
            {cameraError}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={startWebcam}
              className="px-4 py-2 rounded-xl bg-[#9B5CFF] hover:bg-[#8640ff] text-white text-xs font-cyber font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Retry Camera Connection
            </button>
            <button
              onClick={() => {
                setCameraError(null);
                onRequestStartTracking();
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-amber-500/50 hover:bg-slate-800 text-amber-300 text-xs font-mono transition-all cursor-pointer"
            >
              Switch to Interactive Demo Hands
            </button>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Camera stream runs 100% locally in your browser. No video is uploaded.</span>
          </div>
        </div>
      )}

      {/* Standby Hero Overlay (When tracking is not running) */}
      {!isTracking && !isSimulated && !isLoadingMediaPipe && !cameraError && (
        <div className="absolute inset-0 bg-[#050510]/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#9B5CFF]/30 to-[#00D9FF]/30 border border-[#00D9FF]/40 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4 animate-pulse">
            <Camera className="w-8 h-8 text-[#00D9FF]" />
          </div>
          <h2 className="font-cyber font-extrabold text-2xl sm:text-3xl text-white tracking-wider">
            HAND<span className="text-[#00D9FF]">CONNECT</span> VISION ENGINE
          </h2>
          <p className="text-xs sm:text-sm font-mono text-slate-300 max-w-lg mt-2 leading-relaxed">
            Real-time AI hand landmark detection, dual-hand rainbow energy beams, and mid-air neon drawing.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onRequestStartTracking}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#9B5CFF] via-[#00D9FF] to-[#FF35C8] text-[#050510] font-cyber font-extrabold text-sm uppercase tracking-wider hover:brightness-115 transition-all shadow-xl shadow-cyan-500/25 flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Camera Tracking</span>
            </button>
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs font-mono text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Browser-only privacy: camera video is processed locally and never stored.</span>
          </div>
        </div>
      )}
    </div>
  );
});

HandCanvas.displayName = 'HandCanvas';
