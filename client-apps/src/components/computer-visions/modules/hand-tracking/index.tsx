"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import Layout from "../layout";
import {navigations} from "./navigations";

interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

interface HandDetection {
  landmarks: HandLandmark[];
  worldLandmarks: HandLandmark[];
  handedness: string;
  score: number;
}

interface HandInfo {
  id: string;
  handedness: string;
  confidence: number;
  landmarks: HandLandmark[];
  gesture?: string;
  fingerStates?: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
}

const HAND_LANDMARKS = [
  { id: 0, name: "Wrist", finger: "Base" },
  { id: 1, name: "Thumb CMC", finger: "Thumb" },
  { id: 2, name: "Thumb MCP", finger: "Thumb" },
  { id: 3, name: "Thumb IP", finger: "Thumb" },
  { id: 4, name: "Thumb Tip", finger: "Thumb" },
  { id: 5, name: "Index MCP", finger: "Index" },
  { id: 6, name: "Index PIP", finger: "Index" },
  { id: 7, name: "Index DIP", finger: "Index" },
  { id: 8, name: "Index Tip", finger: "Index" },
  { id: 9, name: "Middle MCP", finger: "Middle" },
  { id: 10, name: "Middle PIP", finger: "Middle" },
  { id: 11, name: "Middle DIP", finger: "Middle" },
  { id: 12, name: "Middle Tip", finger: "Middle" },
  { id: 13, name: "Ring MCP", finger: "Ring" },
  { id: 14, name: "Ring PIP", finger: "Ring" },
  { id: 15, name: "Ring DIP", finger: "Ring" },
  { id: 16, name: "Ring Tip", finger: "Ring" },
  { id: 17, name: "Pinky MCP", finger: "Pinky" },
  { id: 18, name: "Pinky PIP", finger: "Pinky" },
  { id: 19, name: "Pinky DIP", finger: "Pinky" },
  { id: 20, name: "Pinky Tip", finger: "Pinky" },
];

export default function HandTracking() {
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedHands, setDetectedHands] = useState<HandInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  const [showGestures, setShowGestures] = useState(true);
  const [showFingerStates, setShowFingerStates] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);
  const fpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const facingModeRef = useRef<"user" | "environment">("user");
  const isDetectingRef = useRef(false);
  const isCameraOnRef = useRef(false);
  const isRunningDetectionRef = useRef(false);
  const lastDetectionsRef = useRef<HandInfo[]>([]);

  const dimension_camera = { width: 700, height: 480 };

  // Sync refs with state
  useEffect(() => {
    handLandmarkerRef.current = handLandmarker;
  }, [handLandmarker]);

  useEffect(() => {
    facingModeRef.current = facingMode;
  }, [facingMode]);

  useEffect(() => {
    isDetectingRef.current = isDetecting;
  }, [isDetecting]);

  useEffect(() => {
    isCameraOnRef.current = isCameraOn;
  }, [isCameraOn]);

  // Initialize MediaPipe Hand Landmarker
  useEffect(() => {
    loadModel();
    return () => {
      stopCamera();
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
  }, []);

  const loadModel = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load MediaPipe Hand Landmarker
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
        numHands: 2, // Detect up to 2 hands
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      setHandLandmarker(landmarker);
      handLandmarkerRef.current = landmarker;
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading MediaPipe Hand Landmarker:", error);
      setError("Gagal memuat model MediaPipe Hand Landmarker.");
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          if (!videoRef.current || !canvasRef.current) return;
          await videoRef.current.play();

          const canvas = canvasRef.current;
          const video = videoRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          setIsCameraOn(true);
          isCameraOnRef.current = true;

          fpsIntervalRef.current = setInterval(() => {
            setFps(frameCountRef.current);
            frameCountRef.current = 0;
          }, 1000);

          videoDrawLoop();
        };
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.");
    }
  };

  const stopCamera = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (fpsIntervalRef.current) {
      clearInterval(fpsIntervalRef.current);
      fpsIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;

    isCameraOnRef.current = false;
    isDetectingRef.current = false;
    isRunningDetectionRef.current = false;
    lastDetectionsRef.current = [];
    setIsCameraOn(false);
    setIsDetecting(false);
    setDetectedHands([]);
    setFps(0);

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const videoDrawLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!isCameraOnRef.current || !video || !canvas || video.readyState !== 4) {
      if (isCameraOnRef.current)
        animationRef.current = requestAnimationFrame(videoDrawLoop);
      return;
    }

    if (isDetectingRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (facingModeRef.current === "user") {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    animationRef.current = requestAnimationFrame(videoDrawLoop);
  };

  const startDetection = () => {
    if (!handLandmarkerRef.current || !videoRef.current || !canvasRef.current) {
      setError("Model atau kamera belum siap.");
      return;
    }
    isDetectingRef.current = true;
    isRunningDetectionRef.current = false;
    lastDetectionsRef.current = [];
    setIsDetecting(true);
    setError(null);

    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    detectLoop();
    runDetectionAsync();
  };

  const stopDetection = () => {
    isDetectingRef.current = false;
    isRunningDetectionRef.current = false;
    lastDetectionsRef.current = [];
    setIsDetecting(false);
    // setDetectedHands([]);

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    videoDrawLoop();
  };

  const detectLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!isDetectingRef.current || !isCameraOnRef.current) return;
    if (!video || !canvas) {
      animationRef.current = requestAnimationFrame(detectLoop);
      return;
    }
    if (video.readyState !== 4) {
      animationRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isFront = facingModeRef.current === "user";

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (isFront) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    if (lastDetectionsRef.current.length > 0) {
      drawHandDetections(lastDetectionsRef.current, canvas, isFront);
    }

    animationRef.current = requestAnimationFrame(detectLoop);
  };

  const runDetectionAsync = async () => {
    const video = videoRef.current;
    const landmarker = handLandmarkerRef.current;
    const canvas = canvasRef.current;

    if (!isDetectingRef.current || !video || !landmarker || !canvas) return;
    if (video.readyState !== 4) {
      setTimeout(runDetectionAsync, 100);
      return;
    }

    if (isRunningDetectionRef.current) return;
    isRunningDetectionRef.current = true;

    try {
      const startTimeMs = performance.now();
      const results = landmarker.detectForVideo(video, startTimeMs);

      if (!isDetectingRef.current) return;

      const handsInfo: HandInfo[] = [];

      if (results.landmarks && results.landmarks.length > 0) {
        for (let i = 0; i < results.landmarks.length; i++) {
          const landmarks = results.landmarks[i];
          const worldLandmarks = results.worldLandmarks?.[i] || [];
          const handedness = results.handednesses?.[i]?.[0];

          if (!handedness) continue;

          const handInfo: HandInfo = {
            id: `hand_${i}`,
            handedness: handedness.categoryName || "Unknown",
            confidence: handedness.score || 0,
            landmarks: landmarks.map((lm) => ({
              x: lm.x,
              y: lm.y,
              z: lm.z || 0,
            })),
          };

          // Detect finger states
          if (showFingerStates) {
            handInfo.fingerStates = detectFingerStates(landmarks);
          }

          // Detect gestures
          if (showGestures) {
            handInfo.gesture = detectGesture(landmarks, handInfo.fingerStates);
          }

          handsInfo.push(handInfo);
        }
      }

      lastDetectionsRef.current = handsInfo;
      setDetectedHands(handsInfo);
      frameCountRef.current++;
    } catch (error) {
      console.error("Detection error:", error);
    } finally {
      isRunningDetectionRef.current = false;
      if (isDetectingRef.current) {
        setTimeout(runDetectionAsync, 0);
      }
    }
  };

  // Detect finger states (open/closed)
  const detectFingerStates = (landmarks: any[]) => {
    const fingerStates = {
      thumb: false,
      index: false,
      middle: false,
      ring: false,
      pinky: false,
    };

    // Thumb: Compare tip (4) with IP joint (3)
    const thumbTip = landmarks[4];
    const thumbIP = landmarks[3];
    const thumbMCP = landmarks[2];
    const thumbDistance = Math.sqrt(
      Math.pow(thumbTip.x - thumbMCP.x, 2) +
        Math.pow(thumbTip.y - thumbMCP.y, 2),
    );
    fingerStates.thumb = thumbDistance > 0.1;

    // Index finger: Compare tip (8) with PIP joint (6)
    const indexTip = landmarks[8];
    const indexPIP = landmarks[6];
    const indexMCP = landmarks[5];
    fingerStates.index = indexTip.y < indexPIP.y;

    // Middle finger: Compare tip (12) with PIP joint (10)
    const middleTip = landmarks[12];
    const middlePIP = landmarks[10];
    fingerStates.middle = middleTip.y < middlePIP.y;

    // Ring finger: Compare tip (16) with PIP joint (14)
    const ringTip = landmarks[16];
    const ringPIP = landmarks[14];
    fingerStates.ring = ringTip.y < ringPIP.y;

    // Pinky finger: Compare tip (20) with PIP joint (18)
    const pinkyTip = landmarks[20];
    const pinkyPIP = landmarks[18];
    fingerStates.pinky = pinkyTip.y < pinkyPIP.y;

    return fingerStates;
  };

  // Detect hand gestures
  const detectGesture = (
    landmarks: any[],
    fingerStates?: {
      thumb: boolean;
      index: boolean;
      middle: boolean;
      ring: boolean;
      pinky: boolean;
    },
  ): string => {
    if (!fingerStates) return "Unknown";

    const { thumb, index, middle, ring, pinky } = fingerStates;

    // Open hand (all fingers extended)
    if (thumb && index && middle && ring && pinky) {
      return "Open Hand ✋";
    }

    // Closed fist (all fingers closed)
    if (!thumb && !index && !middle && !ring && !pinky) {
      return "Fist ✊";
    }

    // Peace sign (index and middle extended)
    if (!thumb && index && middle && !ring && !pinky) {
      return "Peace ✌️";
    }

    // Pointing (only index extended)
    if (!thumb && index && !middle && !ring && !pinky) {
      return "Pointing 👆";
    }

    // Thumbs up
    if (thumb && !index && !middle && !ring && !pinky) {
      return "Thumbs Up 👍";
    }

    // Rock sign (index and pinky extended)
    if (!thumb && index && !middle && !ring && pinky) {
      return "Rock 🤘";
    }

    // OK sign (thumb and index forming circle)
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
        Math.pow(thumbTip.y - indexTip.y, 2),
    );
    if (distance < 0.05 && middle && ring && pinky) {
      return "OK 👌";
    }

    return "Custom";
  };

  // Draw hand detections on canvas
  const drawHandDetections = (
    hands: HandInfo[],
    canvas: HTMLCanvasElement,
    isFront: boolean,
  ) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawingUtils = new DrawingUtils(ctx);

    hands.forEach((hand, index) => {
      const color = hand.handedness === "Left" ? "#00FF00" : "#FF0000";

      // Draw landmarks
      if (showLandmarks) {
        hand.landmarks.forEach((landmark) => {
          const x = isFront
            ? canvas.width - landmark.x * canvas.width
            : landmark.x * canvas.width;
          const y = landmark.y * canvas.height;

          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }

      // Draw connections
      if (showConnections) {
        const connections = [
          // Thumb
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 4],
          // Index finger
          [0, 5],
          [5, 6],
          [6, 7],
          [7, 8],
          // Middle finger
          [0, 9],
          [9, 10],
          [10, 11],
          [11, 12],
          // Ring finger
          [0, 13],
          [13, 14],
          [14, 15],
          [15, 16],
          // Pinky
          [0, 17],
          [17, 18],
          [18, 19],
          [19, 20],
          // Palm
          [5, 9],
          [9, 13],
          [13, 17],
        ];

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        connections.forEach(([start, end]) => {
          const startLandmark = hand.landmarks[start];
          const endLandmark = hand.landmarks[end];

          const x1 = isFront
            ? canvas.width - startLandmark.x * canvas.width
            : startLandmark.x * canvas.width;
          const y1 = startLandmark.y * canvas.height;

          const x2 = isFront
            ? canvas.width - endLandmark.x * canvas.width
            : endLandmark.x * canvas.width;
          const y2 = endLandmark.y * canvas.height;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        });
      }

      // Draw hand info
      const wrist = hand.landmarks[0];
      const x = isFront
        ? canvas.width - wrist.x * canvas.width
        : wrist.x * canvas.width;
      const y = wrist.y * canvas.height;

      ctx.font = "16px Arial";
      ctx.fillStyle = color;
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;

      const text = `${hand.handedness} (${(hand.confidence * 100).toFixed(0)}%)`;
      ctx.strokeText(text, x, y - 10);
      ctx.fillText(text, x, y - 10);

      // Draw gesture
      if (showGestures && hand.gesture) {
        ctx.font = "20px Arial";
        ctx.strokeText(hand.gesture, x, y - 35);
        ctx.fillText(hand.gesture, x, y - 35);
      }

      // Draw finger states
      if (showFingerStates && hand.fingerStates) {
        const fingerNames = ["👍", "☝️", "🖕", "💍", "🤙"];
        const fingerKeys: (keyof typeof hand.fingerStates)[] = [
          "thumb",
          "index",
          "middle",
          "ring",
          "pinky",
        ];

        ctx.font = "14px Arial";
        fingerKeys.forEach((key, i) => {
          const isOpen = hand.fingerStates![key];
          ctx.fillStyle = isOpen ? "#00FF00" : "#FF0000";
          ctx.fillText(
            `${fingerNames[i]} ${isOpen ? "✓" : "✗"}`,
            x,
            y + 15 + i * 20,
          );
        });
      }
    });
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    facingModeRef.current = newFacingMode;

    if (isCameraOn) {
      stopCamera();
      setTimeout(() => startCamera(), 500);
    }
  };

  return (
    <Layout navigations={navigations}>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border shadow-sm">
              <div className="card-body">
                <h2 className="card-title mb-3">
                  <i className="bi bi-hand-index me-2 text-primary"></i>
                  Hand Tracking dengan MediaPipe
                </h2>
                <p className="text-muted mb-0">
                  Deteksi dan tracking tangan secara real-time menggunakan
                  MediaPipe Hand Landmarker. Sistem dapat mendeteksi hingga 2
                  tangan sekaligus dengan 21 landmark points per tangan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="row mb-4">
            <div className="col-12">
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
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                  <div
                    className="spinner-border text-primary mb-3"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <h5 className="mb-2">Memuat Model MediaPipe...</h5>
                  <p className="text-muted mb-0">
                    Mohon tunggu, sedang mengunduh dan menginisialisasi model
                    Hand Landmarker
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && (
          <div className="row g-4">
            {/* Camera Feed */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-primary text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="bi bi-camera-video me-2"></i>
                      Camera Feed
                    </h5>
                    <div className="d-flex gap-2 align-items-center">
                      {isCameraOn && (
                        <>
                          <span className="badge bg-success">
                            <i className="bi bi-circle-fill me-1"></i>
                            Live
                          </span>
                          <span className="badge bg-light text-dark">
                            {fps} FPS
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="card-body p-0 position-relative bg-dark">
                  <div
                    className="position-relative"
                    style={{ aspectRatio: "16/9" }}
                  >
                    <video
                      ref={videoRef}
                      className="position-absolute w-100 h-100"
                      style={{
                        objectFit: "cover",
                        transform:
                          facingMode === "user" ? "scaleX(-1)" : "none",
                        display: isCameraOn ? "block" : "none",
                      }}
                      playsInline
                      muted
                    />
                    <canvas
                      ref={canvasRef}
                      className="position-absolute w-100 h-100"
                      style={{
                        objectFit: "cover",
                        display: isCameraOn ? "block" : "none",
                      }}
                    />
                    {!isCameraOn && (
                      <div className="position-absolute top-50 start-50 translate-middle text-center text-white">
                        <i className="bi bi-camera-video-off display-1 mb-3"></i>
                        <h5>Kamera Tidak Aktif</h5>
                        <p className="text-muted">
                          Klik tombol "Aktifkan Kamera" untuk memulai
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="card-footer bg-light">
                  <div className="row g-2">
                    <div className="col-md-4">
                      {!isCameraOn ? (
                        <button
                          className="btn btn-success w-100"
                          onClick={startCamera}
                          disabled={isLoading}
                        >
                          <i className="bi bi-camera-video me-2"></i>
                          Aktifkan Kamera
                        </button>
                      ) : (
                        <button
                          className="btn btn-danger w-100"
                          onClick={stopCamera}
                        >
                          <i className="bi bi-camera-video-off me-2"></i>
                          Matikan Kamera
                        </button>
                      )}
                    </div>
                    <div className="col-md-4">
                      {!isDetecting ? (
                        <button
                          className="btn btn-primary w-100"
                          onClick={startDetection}
                          disabled={!isCameraOn || isLoading}
                        >
                          <i className="bi bi-play-fill me-2"></i>
                          Mulai Deteksi
                        </button>
                      ) : (
                        <button
                          className="btn btn-warning w-100"
                          onClick={stopDetection}
                        >
                          <i className="bi bi-stop-fill me-2"></i>
                          Stop Deteksi
                        </button>
                      )}
                    </div>
                    <div className="col-md-4">
                      <button
                        className="btn btn-outline-secondary w-100"
                        onClick={switchCamera}
                        disabled={!isCameraOn || isLoading}
                      >
                        <i className="bi bi-arrow-repeat me-2"></i>
                        Ganti Kamera
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Detection Info & Settings */}
            <div className="col-lg-4">
              {/* Detection Results */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-info text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    Hasil Deteksi
                  </h5>
                </div>
                <div className="card-body">
                  {detectedHands.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="bi bi-hand-index display-4 text-muted mb-3"></i>
                      <p className="text-muted mb-0">
                        Tidak ada tangan terdeteksi
                      </p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {detectedHands.map((hand, index) => (
                        <div
                          key={hand.id}
                          className={`card border-${hand.handedness === "Left" ? "success" : "danger"}`}
                        >
                          <div
                            className={`card-header bg-${hand.handedness === "Left" ? "success" : "danger"} bg-opacity-10`}
                          >
                            <h6 className="mb-0">
                              <i
                                className={`bi bi-hand-${hand.handedness === "Left" ? "thumbs-up" : "thumbs-down"} me-2`}
                              ></i>
                              Tangan {hand.handedness}
                            </h6>
                          </div>
                          <div className="card-body">
                            <div className="mb-2">
                              <small className="text-muted">Confidence:</small>
                              <div
                                className="progress mt-1"
                                style={{ height: "8px" }}
                              >
                                <div
                                  className={`progress-bar bg-${hand.handedness === "Left" ? "success" : "danger"}`}
                                  role="progressbar"
                                  style={{ width: `${hand.confidence * 100}%` }}
                                  aria-valuenow={hand.confidence * 100}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <small className="text-muted">
                                {(hand.confidence * 100).toFixed(1)}%
                              </small>
                            </div>

                            {hand.gesture && (
                              <div className="mb-2">
                                <small className="text-muted">Gesture:</small>
                                <div className="badge bg-primary w-100 py-2 mt-1">
                                  {hand.gesture}
                                </div>
                              </div>
                            )}

                            {hand.fingerStates && (
                              <div>
                                <small className="text-muted d-block mb-2">
                                  Status Jari:
                                </small>
                                <div className="d-flex flex-wrap gap-1">
                                  {Object.entries(hand.fingerStates).map(
                                    ([finger, isOpen]) => (
                                      <span
                                        key={finger}
                                        className={`badge ${isOpen ? "bg-success" : "bg-secondary"}`}
                                      >
                                        {finger.charAt(0).toUpperCase() +
                                          finger.slice(1)}
                                        : {isOpen ? "✓" : "✗"}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="my-2">
                              <h6 className="mb-3">
                                <i className="bi bi-geo-alt me-2"></i>
                                21 Hand Landmarks
                              </h6>
                              <div
                                className="table-responsive"
                                style={{
                                  maxHeight: "400px",
                                  overflowY: "auto",
                                }}
                              >
                                <table className="table table-sm table-hover table-bordered">
                                  <thead className="table-dark sticky-top">
                                    <tr>
                                      <th
                                        style={{ width: "8%" }}
                                        className="text-center"
                                      >
                                        ID
                                      </th>
                                      <th style={{ width: "20%" }}>Landmark</th>
                                      <th style={{ width: "15%" }}>Finger</th>
                                      <th
                                        style={{ width: "19%" }}
                                        className="text-end"
                                      >
                                        X
                                      </th>
                                      <th
                                        style={{ width: "19%" }}
                                        className="text-end"
                                      >
                                        Y
                                      </th>
                                      <th
                                        style={{ width: "19%" }}
                                        className="text-end"
                                      >
                                        Z
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {hand.landmarks &&
                                    Object.values(hand.landmarks).length > 0 ? (
                                      hand.landmarks.map(
                                        (landmark, landmarkIndex) => {
                                          const landmarkInfo =
                                            HAND_LANDMARKS[landmarkIndex];

                                          // Color coding by finger
                                          let rowClass = "";
                                          switch (landmarkInfo.finger) {
                                            case "Base":
                                              rowClass = "table-primary";
                                              break;
                                            case "Thumb":
                                              rowClass = "table-warning";
                                              break;
                                            case "Index":
                                              rowClass = "table-success";
                                              break;
                                            case "Middle":
                                              rowClass = "table-info";
                                              break;
                                            case "Ring":
                                              rowClass = "table-danger";
                                              break;
                                            case "Pinky":
                                              rowClass = "table-secondary";
                                              break;
                                          }

                                          return (
                                            <tr
                                              key={landmarkIndex}
                                              className={rowClass}
                                            >
                                              <td className="text-center">
                                                <span className="badge bg-dark">
                                                  {landmarkIndex}
                                                </span>
                                              </td>
                                              <td>
                                                <small className="fw-bold">
                                                  {landmarkInfo.name}
                                                </small>
                                              </td>
                                              <td>
                                                <small className="text-muted">
                                                  {landmarkInfo.finger}
                                                </small>
                                              </td>
                                              <td className="text-end font-monospace">
                                                <small className="text-danger">
                                                  {landmark.x.toFixed(4)}
                                                </small>
                                              </td>
                                              <td className="text-end font-monospace">
                                                <small className="text-success">
                                                  {landmark.y.toFixed(4)}
                                                </small>
                                              </td>
                                              <td className="text-end font-monospace">
                                                <small className="text-primary">
                                                  {landmark.z.toFixed(4)}
                                                </small>
                                              </td>
                                            </tr>
                                          );
                                        },
                                      )
                                    ) : (
                                      <tr>
                                        <td colSpan={6}>No record found</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && (
          <div className="row g-4 my-2">
            <div className="col-6">
              {/* Display Settings */}
              <div className="card shadow-sm h-100">
                <div className="card-header bg-secondary text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-gear me-2"></i>
                    Pengaturan Tampilan
                  </h5>
                </div>
                <div className="card-body">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="showLandmarks"
                      checked={showLandmarks}
                      onChange={(e) => setShowLandmarks(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="showLandmarks">
                      <i className="bi bi-circle me-2"></i>
                      Tampilkan Landmarks
                    </label>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="showConnections"
                      checked={showConnections}
                      onChange={(e) => setShowConnections(e.target.checked)}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="showConnections"
                    >
                      <i className="bi bi-diagram-3 me-2"></i>
                      Tampilkan Koneksi
                    </label>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="showGestures"
                      checked={showGestures}
                      onChange={(e) => setShowGestures(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="showGestures">
                      <i className="bi bi-hand-thumbs-up me-2"></i>
                      Tampilkan Gesture
                    </label>
                  </div>

                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="showFingerStates"
                      checked={showFingerStates}
                      onChange={(e) => setShowFingerStates(e.target.checked)}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="showFingerStates"
                    >
                      <i className="bi bi-hand-index-thumb me-2"></i>
                      Tampilkan Status Jari
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="card shadow-sm h-100">
                <div className="card-header bg-dark text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-graph-up me-2"></i>
                    Statistik
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-4">
                      <div className="text-center p-3 bg-light rounded">
                        <i className="bi bi-hand-index display-6 text-primary mb-2"></i>
                        <h4 className="mb-0">{detectedHands.length}</h4>
                        <small className="text-muted">Tangan Terdeteksi</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="text-center p-3 bg-light rounded">
                        <i className="bi bi-speedometer2 display-6 text-success mb-2"></i>
                        <h4 className="mb-0">{fps}</h4>
                        <small className="text-muted">FPS</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="text-center p-3 bg-light rounded">
                        <i className="bi bi-camera display-6 text-info mb-2"></i>
                        <h5 className="mb-0">
                          {facingMode === "user"
                            ? "Kamera Depan"
                            : "Kamera Belakang"}
                        </h5>
                        <small className="text-muted">Mode Kamera</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Information Section */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Informasi Hand Tracking
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-4">
                  <div className="col-md-6">
                    <h6 className="text-primary mb-3">
                      <i className="bi bi-lightbulb me-2"></i>
                      Fitur Utama
                    </h6>
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        Deteksi hingga 2 tangan secara bersamaan
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        21 landmark points per tangan
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        Deteksi gesture tangan (Open Hand, Fist, Peace, dll)
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        Status jari (terbuka/tertutup)
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        Real-time tracking dengan performa tinggi
                      </li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-primary mb-3">
                      <i className="bi bi-hand-thumbs-up me-2"></i>
                      Gesture yang Didukung
                    </h6>
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <span className="badge bg-primary me-2">✋</span>
                        Open Hand - Semua jari terbuka
                      </li>
                      <li className="mb-2">
                        <span className="badge bg-primary me-2">✊</span>
                        Fist - Semua jari tertutup
                      </li>
                      <li className="mb-2">
                        <span className="badge bg-primary me-2">✌️</span>
                        Peace - Jari telunjuk dan tengah terbuka
                      </li>
                      <li className="mb-2">
                        <span className="badge bg-primary me-2">👆</span>
                        Pointing - Hanya jari telunjuk terbuka
                      </li>
                      <li className="mb-2">
                        <span className="badge bg-primary me-2">👍</span>
                        Thumbs Up - Hanya jempol terbuka
                      </li>
                      <li className="mb-2">
                        <span className="badge bg-primary me-2">🤘</span>
                        Rock - Jari telunjuk dan kelingking terbuka
                      </li>
                      <li className="mb-2">
                        <span className="badge bg-primary me-2">👌</span>
                        OK - Jempol dan telunjuk membentuk lingkaran
                      </li>
                    </ul>
                  </div>
                </div>

                <hr className="my-4" />

                <div className="row g-4">
                  <div className="col-md-6">
                    <h6 className="text-primary mb-3">
                      <i className="bi bi-cpu me-2"></i>
                      Teknologi yang Digunakan
                    </h6>
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <i className="bi bi-dot"></i>
                        <strong>MediaPipe Hand Landmarker:</strong> Model ML
                        untuk deteksi tangan
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-dot"></i>
                        <strong>WebGL:</strong> Rendering performa tinggi
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-dot"></i>
                        <strong>Canvas API:</strong> Visualisasi landmark dan
                        koneksi
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-dot"></i>
                        <strong>WebRTC:</strong> Akses kamera real-time
                      </li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-primary mb-3">
                      <i className="bi bi-question-circle me-2"></i>
                      Cara Penggunaan
                    </h6>
                    <ol className="ps-3">
                      <li className="mb-2">
                        Klik tombol <strong>"Aktifkan Kamera"</strong> untuk
                        mengakses kamera
                      </li>
                      <li className="mb-2">
                        Klik tombol <strong>"Mulai Deteksi"</strong> untuk
                        memulai tracking
                      </li>
                      <li className="mb-2">
                        Posisikan tangan Anda di depan kamera
                      </li>
                      <li className="mb-2">
                        Coba berbagai gesture untuk melihat deteksi
                      </li>
                      <li className="mb-2">
                        Gunakan pengaturan tampilan untuk menyesuaikan
                        visualisasi
                      </li>
                    </ol>
                  </div>
                </div>

                <div className="alert alert-info mt-4 mb-0" role="alert">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  <strong>Tips:</strong> Untuk hasil terbaik, pastikan
                  pencahayaan cukup dan tangan terlihat jelas di kamera. Hindari
                  background yang terlalu ramai atau memiliki warna yang mirip
                  dengan kulit tangan.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
