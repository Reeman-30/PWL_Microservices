"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import Layout from "../layout";
import { Cards } from "@/components/ui/cards";
import {navigations} from "./navigations";

// ══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ══════════════════════════════════════════════════════════════════════════════

type GameState =
  | "IDLE"
  | "CAMERA_READY"
  | "RESIZING"
  | "SCANNING"
  | "PLAYING"
  | "SOLVED";

interface PuzzleTile {
  originalIndex: number;
  currentIndex: number;
}

interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface DragState {
  isDragging: boolean;
  tileIndex: number | null;
}

interface ResizeState {
  isResizing: boolean;
  initialDistance: number | null;
  initialSize: { width: number; height: number } | null;
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const COLS = 3;
const ROWS = 3;
const FRAME_THRESHOLD = 0.02;
const RESET_DWELL_MS = 2000;
const PINCH_THRESHOLD = 0.05;
const FIST_THRESHOLD = 0.15;
const MIN_BOARD_SIZE = 0.3; // 30% of screen
const MAX_BOARD_SIZE = 0.8; // 80% of screen
const RESIZE_SENSITIVITY = 0.5;
const dimension_camera = { width: "100%", height: 480 };

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Generate initial puzzle state with shuffled tiles
 */
function generatePuzzleState(cols: number, rows: number): PuzzleTile[] {
  const totalTiles = cols * rows;
  const tiles: PuzzleTile[] = [];

  for (let i = 0; i < totalTiles; i++) {
    tiles.push({ originalIndex: i, currentIndex: i });
  }

  // Shuffle tiles
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = tiles[i].currentIndex;
    tiles[i].currentIndex = tiles[j].currentIndex;
    tiles[j].currentIndex = temp;
  }

  return tiles;
}

/**
 * Check if puzzle is solved
 */
function checkWinCondition(tiles: PuzzleTile[]): boolean {
  return tiles.every((tile) => tile.originalIndex === tile.currentIndex);
}

/**
 * Get bounding box of hand landmarks
 */
function getBoundingBox(landmarks: any[]): BoundingBox {
  let minX = 1,
    maxX = 0,
    minY = 1,
    maxY = 0;

  for (const lm of landmarks) {
    if (lm.x < minX) minX = lm.x;
    if (lm.x > maxX) maxX = lm.x;
    if (lm.y < minY) minY = lm.y;
    if (lm.y > maxY) maxY = lm.y;
  }

  return { minX, maxX, minY, maxY };
}

/**
 * Detect pinch gesture (thumb and index finger close)
 */
function detectPinch(landmarks: any[]): boolean {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  const distance = Math.sqrt(
    Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2) +
      Math.pow(thumbTip.z - indexTip.z, 2),
  );

  return distance < PINCH_THRESHOLD;
}

/**
 * Detect fist gesture (all fingers closed)
 */
function detectFist(landmarks: any[]): boolean {
  const wrist = landmarks[0];
  const fingerTips = [
    landmarks[4], // thumb
    landmarks[8], // index
    landmarks[12], // middle
    landmarks[16], // ring
    landmarks[20], // pinky
  ];

  let closedCount = 0;

  for (const tip of fingerTips) {
    const distance = Math.sqrt(
      Math.pow(tip.x - wrist.x, 2) +
        Math.pow(tip.y - wrist.y, 2) +
        Math.pow(tip.z - wrist.z, 2),
    );

    if (distance < FIST_THRESHOLD) {
      closedCount++;
    }
  }

  return closedCount >= 4;
}

/**
 * Calculate distance between two hands
 */
function calculateHandDistance(hand1: any[], hand2: any[]): number {
  const center1 = hand1[9]; // Middle finger MCP
  const center2 = hand2[9];

  return Math.sqrt(
    Math.pow(center1.x - center2.x, 2) + Math.pow(center1.y - center2.y, 2),
  );
}

/**
 * Capture current video frame
 */
function captureFrame(
  video: HTMLVideoElement,
  width: number,
  height: number,
): ImageData {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d");

  if (!tempCtx) {
    throw new Error("Failed to get canvas context");
  }

  // Draw mirrored video
  tempCtx.save();
  tempCtx.scale(-1, 1);
  tempCtx.drawImage(video, -width, 0, width, height);
  tempCtx.restore();

  return tempCtx.getImageData(0, 0, width, height);
}

/**
 * Get tile index at given position
 */
function getTileIndexAtPosition(
  x: number,
  y: number,
  boardCoords: BoundingBox,
  canvasWidth: number,
  canvasHeight: number,
): number | null {
  const boardSX = (1 - boardCoords.maxX) * canvasWidth;
  const boardSY = boardCoords.minY * canvasHeight;
  const boardW = (1 - boardCoords.minX) * canvasWidth - boardSX;
  const boardH = boardCoords.maxY * canvasHeight - boardSY;

  const relX = x - boardSX;
  const relY = y - boardSY;

  if (relX < 0 || relX > boardW || relY < 0 || relY > boardH) {
    return null;
  }

  const tileW = boardW / COLS;
  const tileH = boardH / ROWS;

  const col = Math.floor(relX / tileW);
  const row = Math.floor(relY / tileH);

  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
    return null;
  }

  return row * COLS + col;
}

/**
 * Render the puzzle game board with tiles
 */
function renderPuzzleGame(
  ctx: CanvasRenderingContext2D,
  puzzleImage: HTMLCanvasElement,
  tiles: PuzzleTile[],
  cols: number,
  rows: number,
  boardW: number,
  boardH: number,
  dragInfo: { index: number; x: number; y: number } | null,
  hoverIndex: number | null,
): void {
  const tileW = boardW / cols;
  const tileH = boardH / rows;
  const srcTileW = puzzleImage.width / cols;
  const srcTileH = puzzleImage.height / rows;

  // Draw all tiles except the one being dragged
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const currentIndex = tile.currentIndex;

    // Skip if this tile is being dragged
    if (dragInfo && dragInfo.index === i) {
      continue;
    }

    const destCol = i % cols;
    const destRow = Math.floor(i / cols);
    const destX = destCol * tileW;
    const destY = destRow * tileH;

    const srcCol = currentIndex % cols;
    const srcRow = Math.floor(currentIndex / cols);
    const srcX = srcCol * srcTileW;
    const srcY = srcRow * srcTileH;

    // Draw tile
    ctx.drawImage(
      puzzleImage,
      srcX,
      srcY,
      srcTileW,
      srcTileH,
      destX,
      destY,
      tileW,
      tileH,
    );

    // Draw border
    ctx.strokeStyle = i === hoverIndex ? "#ccff00" : "#333333";
    ctx.lineWidth = 2;
    ctx.strokeRect(destX, destY, tileW, tileH);

    // Highlight hover
    if (i === hoverIndex) {
      ctx.fillStyle = "rgba(204, 255, 0, 0.2)";
      ctx.fillRect(destX, destY, tileW, tileH);
    }
  }

  // Draw dragged tile at cursor position
  if (dragInfo) {
    const tile = tiles[dragInfo.index];
    const currentIndex = tile.currentIndex;

    const srcCol = currentIndex % cols;
    const srcRow = Math.floor(currentIndex / cols);
    const srcX = srcCol * srcTileW;
    const srcY = srcRow * srcTileH;

    // Draw with offset from cursor
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 10;

    ctx.drawImage(
      puzzleImage,
      srcX,
      srcY,
      srcTileW,
      srcTileH,
      dragInfo.x - tileW / 2,
      dragInfo.y - tileH / 2,
      tileW,
      tileH,
    );

    ctx.restore();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function GestureCamera() {
  // ─────────────────────────────────────────────────────────────────────────
  // REFS
  // ─────────────────────────────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastResultsRef = useRef<any>(null);
  // Game state refs
  const puzzleImageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const puzzleTilesRef = useRef<PuzzleTile[] | null>(null);
  const gameBoardCoordsRef = useRef<BoundingBox | null>(null);
  const lastFrameCoordsRef = useRef<{ bbox: BoundingBox; time: number } | null>(
    null,
  );
  const fistHoldStartRef = useRef<number | null>(null);
  const dragRef = useRef<DragState>({ isDragging: false, tileIndex: null });
  const smoothCursorRef = useRef({ x: 0, y: 0 });
  const resizeRef = useRef<ResizeState>({
    isResizing: false,
    initialDistance: null,
    initialSize: null,
  });
  const boardSizeRef = useRef({ width: 0.5, height: 0.5 }); // Default 50% of screen

  // ─────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────
  const [gameState, setGameState] = useState<GameState>("IDLE");
  const [modelLoaded, setModelLoaded] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null,
  );

  // ─────────────────────────────────────────────────────────────────────────
  // LOAD MODEL
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
        );

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        handLandmarkerRef.current = landmarker;
        setModelLoaded(true);
      } catch (err) {
        console.error("Error loading model:", err);
        setError("Failed to load AI model");
      }
    };

    loadModel();

    return () => {
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // CAMERA CONTROLS
  // ─────────────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
        setGameState("CAMERA_READY");
        setError(null);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Failed to access camera. Please grant camera permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }

    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }

    setCameraReady(false);
    setGameState("IDLE");
    resetGame();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // GAME CONTROLS
  // ─────────────────────────────────────────────────────────────────────────
  const startResizing = () => {
    if (gameState !== "CAMERA_READY") return;
    setGameState("RESIZING");
    boardSizeRef.current = { width: 0.5, height: 0.5 }; // Reset to default
  };

  const startScanning = () => {
    if (gameState !== "RESIZING") return;
    setGameState("SCANNING");
    lastFrameCoordsRef.current = null;
  };

  const resetGame = useCallback(() => {
    puzzleImageCanvasRef.current = null;
    puzzleTilesRef.current = null;
    gameBoardCoordsRef.current = null;
    lastFrameCoordsRef.current = null;
    fistHoldStartRef.current = null;
    dragRef.current = { isDragging: false, tileIndex: null };
    smoothCursorRef.current = { x: 0, y: 0 };
    resizeRef.current = {
      isResizing: false,
      initialDistance: null,
      initialSize: null,
    };

    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }

    setTimeElapsed(0);
    setGameState("CAMERA_READY");
  }, [timerInterval]);

  // ─────────────────────────────────────────────────────────────────────────
  // TIMER
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState === "PLAYING" && !timerInterval) {
      const interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    } else if (gameState !== "PLAYING" && timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [gameState]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER LOOP
  // ─────────────────────────────────────────────────────────────────────────
  const renderLoop = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = handLandmarkerRef.current;

    if (!video || !canvas || !landmarker || video.readyState !== 4) {
      requestRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw mirrored video
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -width, 0, width, height);
    ctx.restore();

    // Detect hands
    const startTimeMs = performance.now();
    const results = landmarker.detectForVideo(video, startTimeMs);
    lastResultsRef.current = results;

    // ═══════════════════════════════════════════════════════════════════════
    // GAME STATE: CAMERA_READY
    // ═══════════════════════════════════════════════════════════════════════
    if (gameState === "CAMERA_READY") {
      // Draw instructions
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, height - 120, width, 120);

      ctx.fillStyle = "#ffffff";
      ctx.font = "24px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("Camera Ready!", width / 2, height - 80);

      ctx.font = "16px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#ccff00";
      ctx.fillText(
        "Click 'Resize Board' to adjust puzzle size with two hands",
        width / 2,
        height - 40,
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GAME STATE: RESIZING
    // ═══════════════════════════════════════════════════════════════════════
    else if (gameState === "RESIZING") {
      // Draw preview board
      const boardW = width * boardSizeRef.current.width;
      const boardH = height * boardSizeRef.current.height;
      const boardX = (width - boardW) / 2;
      const boardY = (height - boardH) / 2;

      // Draw board outline
      ctx.strokeStyle = "#ccff00";
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 10]);
      ctx.strokeRect(boardX, boardY, boardW, boardH);
      ctx.setLineDash([]);

      // Draw grid
      ctx.strokeStyle = "rgba(204, 255, 0, 0.3)";
      ctx.lineWidth = 1;

      for (let i = 1; i < COLS; i++) {
        const x = boardX + (boardW / COLS) * i;
        ctx.beginPath();
        ctx.moveTo(x, boardY);
        ctx.lineTo(x, boardY + boardH);
        ctx.stroke();
      }

      for (let i = 1; i < ROWS; i++) {
        const y = boardY + (boardH / ROWS) * i;
        ctx.beginPath();
        ctx.moveTo(boardX, y);
        ctx.lineTo(boardX + boardW, y);
        ctx.stroke();
      }

      // Handle two-hand resize
      if (results && results.landmarks && results.landmarks.length === 2) {
        const hand1 = results.landmarks[0];
        const hand2 = results.landmarks[1];

        // Draw hand landmarks
        const drawingUtils = new DrawingUtils(ctx);

        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-width, 0);

        [hand1, hand2].forEach((landmarks) => {
          drawingUtils.drawConnectors(
            landmarks,
            HandLandmarker.HAND_CONNECTIONS,
            { color: "#00ff00", lineWidth: 2 },
          );
          drawingUtils.drawLandmarks(landmarks, {
            color: "#ff0000",
            lineWidth: 1,
            radius: 3,
          });
        });

        ctx.restore();

        // Calculate distance between hands
        const distance = calculateHandDistance(hand1, hand2);

        if (!resizeRef.current.isResizing) {
          // Start resizing
          resizeRef.current = {
            isResizing: true,
            initialDistance: distance,
            initialSize: { ...boardSizeRef.current },
          };
        } else {
          // Update board size based on hand distance
          const initialDist = resizeRef.current.initialDistance!;
          const initialSize = resizeRef.current.initialSize!;
          const distanceChange = (distance - initialDist) * RESIZE_SENSITIVITY;

          let newWidth = initialSize.width + distanceChange;
          let newHeight = initialSize.height + distanceChange;

          // Clamp to min/max
          newWidth = Math.max(
            MIN_BOARD_SIZE,
            Math.min(MAX_BOARD_SIZE, newWidth),
          );
          newHeight = Math.max(
            MIN_BOARD_SIZE,
            Math.min(MAX_BOARD_SIZE, newHeight),
          );

          boardSizeRef.current = { width: newWidth, height: newHeight };
        }

        // Draw instruction
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, height - 100, width, 100);

        ctx.fillStyle = "#00ff00";
        ctx.font = "20px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          "✋ Spread hands apart to enlarge ✋",
          width / 2,
          height - 60,
        );
        ctx.fillText(
          "👌 Bring hands together to shrink 👌",
          width / 2,
          height - 30,
        );
      } else {
        // Reset resize state if not two hands
        resizeRef.current = {
          isResizing: false,
          initialDistance: null,
          initialSize: null,
        };

        // Draw instruction
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, height - 80, width, 80);

        ctx.fillStyle = "#ffffff";
        ctx.font = "20px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          "Show both hands to resize the board",
          width / 2,
          height - 40,
        );
      }

      // Draw size info
      ctx.fillStyle = "#ccff00";
      ctx.font = "16px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `Board Size: ${Math.round(boardSizeRef.current.width * 100)}%`,
        width / 2,
        boardY - 20,
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GAME STATE: SCANNING
    // ═══════════════════════════════════════════════════════════════════════
    else if (gameState === "SCANNING") {
      if (results && results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const bbox = getBoundingBox(landmarks);

        // Calculate board position using saved size
        const boardW = width * boardSizeRef.current.width;
        const boardH = height * boardSizeRef.current.height;
        const boardX = (width - boardW) / 2;
        const boardY = (height - boardH) / 2;

        // Draw board outline (area yang akan di-capture)
        ctx.strokeStyle = "#ccff00";
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]);
        ctx.strokeRect(boardX, boardY, boardW, boardH);
        ctx.setLineDash([]);

        // Draw grid preview
        ctx.strokeStyle = "rgba(204, 255, 0, 0.3)";
        ctx.lineWidth = 1;

        for (let i = 1; i < COLS; i++) {
          const x = boardX + (boardW / COLS) * i;
          ctx.beginPath();
          ctx.moveTo(x, boardY);
          ctx.lineTo(x, boardY + boardH);
          ctx.stroke();
        }

        for (let i = 1; i < ROWS; i++) {
          const y = boardY + (boardH / ROWS) * i;
          ctx.beginPath();
          ctx.moveTo(boardX, y);
          ctx.lineTo(boardX + boardW, y);
          ctx.stroke();
        }

        // Draw hand frame (untuk tracking stabilitas)
        const frameX = (1 - bbox.maxX) * width;
        const frameY = bbox.minY * height;
        const frameW = (1 - bbox.minX) * width - frameX;
        const frameH = bbox.maxY * height - frameY;

        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        ctx.strokeRect(frameX, frameY, frameW, frameH);

        // Draw corners
        const cornerSize = 20;
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 4;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(frameX, frameY + cornerSize);
        ctx.lineTo(frameX, frameY);
        ctx.lineTo(frameX + cornerSize, frameY);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(frameX + frameW - cornerSize, frameY);
        ctx.lineTo(frameX + frameW, frameY);
        ctx.lineTo(frameX + frameW, frameY + cornerSize);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(frameX, frameY + frameH - cornerSize);
        ctx.lineTo(frameX, frameY + frameH);
        ctx.lineTo(frameX + cornerSize, frameY + frameH);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(frameX + frameW - cornerSize, frameY + frameH);
        ctx.lineTo(frameX + frameW, frameY + frameH);
        ctx.lineTo(frameX + frameW, frameY + frameH - cornerSize);
        ctx.stroke();

        // Check if frame is stable
        const now = performance.now();
        const lastFrame = lastFrameCoordsRef.current;

        if (lastFrame) {
          const deltaX = Math.abs(bbox.minX - lastFrame.bbox.minX);
          const deltaY = Math.abs(bbox.minY - lastFrame.bbox.minY);
          const deltaW = Math.abs(bbox.maxX - lastFrame.bbox.maxX);
          const deltaH = Math.abs(bbox.maxY - lastFrame.bbox.maxY);

          const isStable =
            deltaX < FRAME_THRESHOLD &&
            deltaY < FRAME_THRESHOLD &&
            deltaW < FRAME_THRESHOLD &&
            deltaH < FRAME_THRESHOLD;

          if (isStable) {
            const elapsed = now - lastFrame.time;
            const progress = Math.min(elapsed / 2000, 1);

            // Draw progress bar
            const barWidth = boardW * 0.8;
            const barHeight = 10;
            const barX = boardX + (boardW - barWidth) / 2;
            const barY = boardY + boardH + 20;

            ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
            ctx.fillRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = "#00ff00";
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);

            ctx.strokeStyle = "#00ff00";
            ctx.lineWidth = 2;
            ctx.strokeRect(barX, barY, barWidth, barHeight);

            // Draw progress percentage
            ctx.fillStyle = "#ffffff";
            ctx.font = "16px 'JetBrains Mono', monospace";
            ctx.textAlign = "center";
            ctx.fillText(
              `${Math.round(progress * 100)}%`,
              barX + barWidth / 2,
              barY + barHeight + 20,
            );

            // Capture when progress complete
            if (progress >= 1) {
              try {
                // ✅ Capture area dari bounding box yang sudah ditentukan
                const capturedFrame = captureFrame(video, width, height);
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = width;
                tempCanvas.height = height;
                const tempCtx = tempCanvas.getContext("2d");

                if (tempCtx) {
                  tempCtx.putImageData(capturedFrame, 0, 0);

                  // ✅ Crop ke area board yang sudah ditentukan (bukan hand frame)
                  const croppedCanvas = document.createElement("canvas");
                  croppedCanvas.width = boardW;
                  croppedCanvas.height = boardH;
                  const croppedCtx = croppedCanvas.getContext("2d");

                  if (croppedCtx) {
                    // Crop dari board area
                    croppedCtx.drawImage(
                      tempCanvas,
                      boardX,
                      boardY,
                      boardW,
                      boardH,
                      0,
                      0,
                      boardW,
                      boardH,
                    );

                    // ✅ Simpan cropped image sebagai puzzle image
                    puzzleImageCanvasRef.current = croppedCanvas;
                    puzzleTilesRef.current = generatePuzzleState(COLS, ROWS);

                    // ✅ Simpan koordinat board untuk gameplay
                    gameBoardCoordsRef.current = {
                      minX: boardX / width,
                      maxX: (boardX + boardW) / width,
                      minY: boardY / height,
                      maxY: (boardY + boardH) / height,
                    };

                    setGameState("PLAYING");
                  }
                }
              } catch (err) {
                console.error("Error capturing frame:", err);
                setError("Failed to capture frame");
              }
            }
          } else {
            lastFrameCoordsRef.current = { bbox, time: now };
          }
        } else {
          lastFrameCoordsRef.current = { bbox, time: now };
        }

        // Draw instruction
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, height - 100, width, 100);

        ctx.fillStyle = "#ffffff";
        ctx.font = "20px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          "Hold your hand steady inside the yellow box",
          width / 2,
          height - 60,
        );
        ctx.fillStyle = "#ccff00";
        ctx.font = "16px 'JetBrains Mono', monospace";
        ctx.fillText(
          "The puzzle will be created from the board area",
          width / 2,
          height - 30,
        );
      } else {
        lastFrameCoordsRef.current = null;

        // Draw board outline even without hand
        const boardW = width * boardSizeRef.current.width;
        const boardH = height * boardSizeRef.current.height;
        const boardX = (width - boardW) / 2;
        const boardY = (height - boardH) / 2;

        ctx.strokeStyle = "#ccff00";
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]);
        ctx.strokeRect(boardX, boardY, boardW, boardH);
        ctx.setLineDash([]);

        // Draw instruction
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, height - 100, width, 100);

        ctx.fillStyle = "#ffffff";
        ctx.font = "20px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          "Show your hand inside the yellow box",
          width / 2,
          height - 60,
        );
        ctx.fillStyle = "#ccff00";
        ctx.font = "16px 'JetBrains Mono', monospace";
        ctx.fillText(
          "Hold steady to capture the puzzle image",
          width / 2,
          height - 30,
        );
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GAME STATE: PLAYING
    // ═══════════════════════════════════════════════════════════════════════
    else if (gameState === "PLAYING") {
      const puzzleImage = puzzleImageCanvasRef.current;
      const tiles = puzzleTilesRef.current;
      const boardCoords = gameBoardCoordsRef.current;

      if (puzzleImage && tiles && boardCoords) {
        // Calculate board position using saved size
        const boardW = width * boardSizeRef.current.width;
        const boardH = height * boardSizeRef.current.height;
        const boardSX = (width - boardW) / 2;
        const boardSY = (height - boardH) / 2;

        // Draw puzzle board
        ctx.save();
        ctx.translate(boardSX, boardSY);

        let hoverIndex: number | null = null;
        let dragInfo: { index: number; x: number; y: number } | null = null;

        // Handle hand interaction
        if (results && results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          const isPinching = detectPinch(landmarks);
          const isFist = detectFist(landmarks);

          // Get cursor position (index finger tip)
          const indexTip = landmarks[8];
          const cursorX = (1 - indexTip.x) * width;
          const cursorY = indexTip.y * height;

          // Smooth cursor movement
          smoothCursorRef.current.x +=
            (cursorX - smoothCursorRef.current.x) * 0.3;
          smoothCursorRef.current.y +=
            (cursorY - smoothCursorRef.current.y) * 0.3;

          const smoothX = smoothCursorRef.current.x;
          const smoothY = smoothCursorRef.current.y;

          // Draw cursor
          ctx.save();
          ctx.translate(-boardSX, -boardSY);
          ctx.beginPath();
          ctx.arc(smoothX, smoothY, 10, 0, 2 * Math.PI);
          ctx.fillStyle = isPinching ? "#00ff00" : "#ccff00";
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();

          // Get tile at cursor
          const tileIndex = getTileIndexAtPosition(
            smoothX,
            smoothY,
            {
              minX: boardSX / width,
              maxX: (boardSX + boardW) / width,
              minY: boardSY / height,
              maxY: (boardSY + boardH) / height,
            },
            width,
            height,
          );

          if (tileIndex !== null) {
            hoverIndex = tileIndex;
          }

          // Handle drag
          if (isPinching) {
            if (!dragRef.current.isDragging && tileIndex !== null) {
              dragRef.current = { isDragging: true, tileIndex };
            }

            if (
              dragRef.current.isDragging &&
              dragRef.current.tileIndex !== null
            ) {
              dragInfo = {
                index: dragRef.current.tileIndex,
                x: smoothX - boardSX,
                y: smoothY - boardSY,
              };
            }
          } else {
            // Release drag
            if (
              dragRef.current.isDragging &&
              dragRef.current.tileIndex !== null
            ) {
              const draggedTileIndex = dragRef.current.tileIndex;
              const targetTileIndex = tileIndex;

              if (
                targetTileIndex !== null &&
                targetTileIndex !== draggedTileIndex
              ) {
                // Swap tiles
                const temp = tiles[draggedTileIndex].currentIndex;
                tiles[draggedTileIndex].currentIndex =
                  tiles[targetTileIndex].currentIndex;
                tiles[targetTileIndex].currentIndex = temp;

                // Check win condition
                if (checkWinCondition(tiles)) {
                  setGameState("SOLVED");
                }
              }
            }

            dragRef.current = { isDragging: false, tileIndex: null };
          }

          // Handle reset gesture (fist)
          if (isFist) {
            if (fistHoldStartRef.current === null) {
              fistHoldStartRef.current = performance.now();
            } else {
              const elapsed = performance.now() - fistHoldStartRef.current;
              if (elapsed >= RESET_DWELL_MS) {
                resetGame();
                fistHoldStartRef.current = null;
              }
            }
          } else {
            fistHoldStartRef.current = null;
          }
        }

        // Render puzzle
        renderPuzzleGame(
          ctx,
          puzzleImage,
          tiles,
          COLS,
          ROWS,
          boardW,
          boardH,
          dragInfo,
          hoverIndex,
        );

        ctx.restore();

        // Draw timer
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(width - 200, 20, 180, 60);

        ctx.fillStyle = "#ffffff";
        ctx.font = "24px 'JetBrains Mono', monospace";
        ctx.textAlign = "right";
        const minutes = Math.floor(timeElapsed / 60);
        const seconds = timeElapsed % 60;
        ctx.fillText(
          `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
          width - 30,
          60,
        );

        // Draw instructions
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, height - 100, width, 100);

        ctx.fillStyle = "#ffffff";
        ctx.font = "16px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("👌 Pinch to drag tiles", width / 2, height - 60);
        ctx.fillText("✊ Hold fist for 2s to reset", width / 2, height - 30);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GAME STATE: SOLVED
    // ═══════════════════════════════════════════════════════════════════════
    else if (gameState === "SOLVED") {
      const puzzleImage = puzzleImageCanvasRef.current;

      if (puzzleImage) {
        // Calculate board position
        const boardW = width * boardSizeRef.current.width;
        const boardH = height * boardSizeRef.current.height;
        const boardSX = (width - boardW) / 2;
        const boardSY = (height - boardH) / 2;

        // Draw completed puzzle
        ctx.drawImage(puzzleImage, boardSX, boardSY, boardW, boardH);

        // Draw victory overlay
        ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
        ctx.fillRect(0, 0, width, height);

        // Draw victory message
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(width / 2 - 250, height / 2 - 150, 500, 300);

        ctx.fillStyle = "#00ff00";
        ctx.font = "bold 48px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("🎉 PUZZLE SOLVED! 🎉", width / 2, height / 2 - 60);

        ctx.fillStyle = "#ffffff";
        ctx.font = "32px 'JetBrains Mono', monospace";
        const minutes = Math.floor(timeElapsed / 60);
        const seconds = timeElapsed % 60;
        ctx.fillText(
          `Time: ${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
          width / 2,
          height / 2 + 20,
        );

        ctx.font = "20px 'JetBrains Mono', monospace";
        ctx.fillStyle = "#ccff00";
        ctx.fillText(
          "Click 'Play Again' to start a new game",
          width / 2,
          height / 2 + 80,
        );
      }
    }

    requestRef.current = requestAnimationFrame(renderLoop);
  }, [gameState, timeElapsed]);

  // Start render loop when camera is ready
  useEffect(() => {
    if (cameraReady && modelLoaded) {
      renderLoop();
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [cameraReady, modelLoaded, renderLoop]);

  // ─────────────────────────────────────────────────────────────────────────
  // FORMAT TIME
  // ─────────────────────────────────────────────────────────────────────────
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Layout navigations={navigations}>
      {/* Error display */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Loading overlay */}
      {!modelLoaded && (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5 className="mb-2">Memuat Model MediaPipe...</h5>
            <p className="text-muted mb-0">
              Mohon tunggu, sedang mengunduh dan menginisialisasi model Hand
              Landmarker
            </p>
          </div>
        </div>
      )}
      {/* Animated background */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>

      <Cards>
        <Cards.Body className="px-0 py-0 rounded">
          <div className="bg-primary p-2">
            <div className="d-flex align-items-center justify-content-between">
              <h5 className="mb-0 text-white">
                <i className="bi bi-camera-video me-2"></i>
                <span className="fw-bold">Camera Feed</span>
              </h5>

              <div>
                {cameraReady && (
                  <>
                    <span className="badge bg-danger me-2">
                      <i className="bi bi-circle-fill me-1"></i>
                      Live
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="render-canvas-camera">
            <video
              ref={videoRef}
              className="hidden"
              playsInline
              muted
              style={{
                display: "none",
                width: dimension_camera.width,
              }}
            />
            <div className="bg-dark p-2">
              {!cameraReady && (
                <div
                  className="text-center py-5 text-muted d-flex flex-column align-items-center justify-content-center"
                  style={{ minHeight: dimension_camera.height }}
                >
                  <i
                    className="bi bi-camera-video-off text-white"
                    style={{ fontSize: "4rem" }}
                  ></i>
                  <p className="mt-1 text-white fs-4">Kamera tidak aktif</p>
                </div>
              )}
              <div>
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{
                    display: cameraReady ? "block" : "none",
                    width: dimension_camera.width,
                  }}
                />
              </div>
            </div>
          </div>
        </Cards.Body>
        <Cards.Footer className="bg-light">
            <div className="row">
              <div className="col-lg-3">
                <button
                  className={`btn btn-${!cameraReady ? "success" : "warning"} w-100`}
                  type="button"
                  onClick={!cameraReady ? startCamera : stopCamera}
                  disabled={!modelLoaded}
                >
                  <i
                    className={`bi bi-${!cameraReady ? "camera-video" : "camera-video-off"} me-2`}
                  ></i>
                  <span>{!cameraReady ? "Aktifkan" : "Matikan"} Kamera</span>
                </button>
              </div>
              <div className="col-lg-3">
                {cameraReady && gameState === "CAMERA_READY" && (
                  <button
                    onClick={startResizing}
                    className="btn btn-info w-100"
                  >
                    <i className="bi bi-arrows-angle-expand"></i>
                    Resize Board
                  </button>
                )}
              </div>
              <div className="col-lg-3">
                {gameState === "RESIZING" && (
                  <button
                    onClick={startScanning}
                    className="btn btn-success w-100"
                  >
                    <i className="bi bi-hand-index"></i>
                    Start Scanning
                  </button>
                )}
              </div>
            </div>
        </Cards.Footer>
      </Cards>
    </Layout>
  );
}

export default function HandGesturePuzzle() {
  return <GestureCamera />;
}
