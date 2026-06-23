"use client";
import React, { useRef, useState, useEffect } from "react";
import Temp from "./temp";
import * as faceapi from "face-api.js";
import { Cards } from "@/components/ui/cards";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Prediction {
  topLeft: [number, number];
  bottomRight: [number, number];
  probability: number[];
  landmarks: number[][];
}

interface EmotionResult {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

interface CroppedFace {
  imageData: string;
  confidence: number;
  index: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  emotion?: EmotionResult;
  dominantEmotion?: string;
  age?: number;
  gender?: string;
  genderProbability?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmotionDRealTime() {
  const [isFaceApiLoaded, setIsFaceApiLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState<Prediction[]>([]);
  const [croppedFaces, setCroppedFaces] = useState<CroppedFace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  // null = no landmark, true = tiny, false = full
  const [landmarkMode, setLandmarkMode] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);
  const fpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const facingModeRef = useRef<"user" | "environment">("user");
  const isDetectingRef = useRef(false);
  const isCameraOnRef = useRef(false);
  const isFaceApiLoadedRef = useRef(false);
  const landmarkModeRef = useRef<boolean | null>(null);
  const ageGenderAvailableRef = useRef(false);
  const dimension_camera = { width: 700, height: 480 };
  const canvasInitializedRef = useRef(false);
  const lastDetectionsRef = useRef<Prediction[]>([]);
  const lastEmotionsRef = useRef<string[]>([]);
  const isRunningDetectionRef = useRef(false);

  useEffect(() => {
    facingModeRef.current = facingMode;
  }, [facingMode]);
  useEffect(() => {
    isDetectingRef.current = isDetecting;
  }, [isDetecting]);
  useEffect(() => {
    isCameraOnRef.current = isCameraOn;
  }, [isCameraOn]);
  useEffect(() => {
    isFaceApiLoadedRef.current = isFaceApiLoaded;
  }, [isFaceApiLoaded]);
  useEffect(() => {
    landmarkModeRef.current = landmarkMode;
  }, [landmarkMode]);

  useEffect(() => {
    loadModels();
    return () => {
      stopCamera();
    };
  }, []);

  // ── Load Models ─────────────────────────────────────────────────────────────
  // Strategy: load required models first, then try optional landmark models
  const loadModels = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const MODEL_URL = "/models";

      // REQUIRED: detector + expressions
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

      // OPTIONAL: age & gender model
      let ageGenderAvailable = false;
      try {
        await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
        ageGenderAvailable = true;
        console.log("Loaded: ageGenderNet");
      } catch {
        console.warn(
          "ageGenderNet tidak tersedia, fitur usia/gender dinonaktifkan.",
        );
      }

      // OPTIONAL: landmark — try tiny first, then full, then skip
      let lmMode: boolean | null = null;
      try {
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
        lmMode = true;
        console.log("Loaded: faceLandmark68TinyNet");
      } catch (e1) {
        console.warn(
          "faceLandmark68TinyNet gagal, mencoba faceLandmark68Net...",
          e1,
        );
        try {
          await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
          lmMode = false;
          console.log("Loaded: faceLandmark68Net");
        } catch (e2) {
          console.warn(
            "Landmark model tidak tersedia, landmark dinonaktifkan.",
            e2,
          );
          lmMode = null;
        }
      }

      ageGenderAvailableRef.current = ageGenderAvailable;
      setLandmarkMode(lmMode);
      landmarkModeRef.current = lmMode;
      setIsFaceApiLoaded(true);
      isFaceApiLoadedRef.current = true;
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading models:", err);
      setError(
        `Gagal memuat model: ${err instanceof Error ? err.message : String(err)}. ` +
          "Pastikan /public/models berisi: tiny_face_detector_model & face_expression_model.",
      );
      setIsLoading(false);
    }
  };

  // ── Camera ──────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          if (!videoRef.current || !canvasRef.current) return;
          await videoRef.current.play();
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          canvasInitializedRef.current = true;
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
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    isCameraOnRef.current = false;
    isDetectingRef.current = false;
    isRunningDetectionRef.current = false;
    lastDetectionsRef.current = [];
    lastEmotionsRef.current = [];
    canvasInitializedRef.current = false;
    setIsCameraOn(false);
    setIsDetecting(false);
    setDetections([]);
    setCroppedFaces([]);
    setFps(0);
    if (canvasRef.current) {
      canvasRef.current
        .getContext("2d")
        ?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // ── Draw loops ───────────────────────────────────────────────────────────────
  const drawMirroredFrame = (
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
  ) => {
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
    if (ctx) drawMirroredFrame(ctx, video, canvas);
    animationRef.current = requestAnimationFrame(videoDrawLoop);
  };

  const detectLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!isDetectingRef.current || !isCameraOnRef.current) return;
    if (!video || !canvas || video.readyState !== 4) {
      animationRef.current = requestAnimationFrame(detectLoop);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawMirroredFrame(ctx, video, canvas);
    if (lastDetectionsRef.current.length > 0) {
      drawDetections(
        lastDetectionsRef.current,
        canvas,
        facingModeRef.current === "user",
        video.videoWidth,
        video.videoHeight,
        lastEmotionsRef.current,
      );
    }
    animationRef.current = requestAnimationFrame(detectLoop);
  };

  // ── Detection ────────────────────────────────────────────────────────────────
  const startDetection = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError("Kamera belum siap.");
      return;
    }
    if (!isFaceApiLoadedRef.current) {
      setError("Model belum siap.");
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
    lastEmotionsRef.current = [];
    setIsDetecting(false);
    setDetections([]);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    videoDrawLoop();
  };

  // ── Core async detection loop ─────────────────────────────────────────────
  const runDetectionAsync = async () => {
    const video = videoRef.current;
    if (!isDetectingRef.current || !video) return;
    if (video.readyState !== 4) {
      setTimeout(runDetectionAsync, 100);
      return;
    }
    if (isRunningDetectionRef.current) return;
    isRunningDetectionRef.current = true;

    try {
      const lmMode = landmarkModeRef.current;
      const isFront = facingModeRef.current === "user";
      const opts = new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 });

      let typedPredictions: Prediction[] = [];

      if (lmMode !== null) {
        // With landmarks (tiny or full)
        const baseChain = faceapi
          .detectAllFaces(video, opts)
          .withFaceLandmarks(lmMode === true)
          .withFaceExpressions();
        const rawDetections = await (ageGenderAvailableRef.current
          ? baseChain.withAgeAndGender()
          : baseChain);

        if (!isDetectingRef.current) return;

        typedPredictions = rawDetections.map((det) => {
          const box = det.detection.box;
          return {
            topLeft: [box.left, box.top] as [number, number],
            bottomRight: [box.right, box.bottom] as [number, number],
            probability: [det.detection.score],
            landmarks: det.landmarks.positions.map((p) => [p.x, p.y]),
          };
        });

        frameCountRef.current += 1;
        lastDetectionsRef.current = typedPredictions;
        setDetections(typedPredictions);

        if (frameCountRef.current % 10 === 0 && rawDetections.length > 0) {
          const emotions = await cropAndDetectEmotions(
            video,
            rawDetections,
            isFront,
          );
          if (emotions) lastEmotionsRef.current = emotions;
        }
      } else {
        // Without landmarks — expressions only
        const baseChain2 = faceapi
          .detectAllFaces(video, opts)
          .withFaceExpressions();
        const rawDetections = await (ageGenderAvailableRef.current
          ? baseChain2.withAgeAndGender()
          : baseChain2);

        if (!isDetectingRef.current) return;

        typedPredictions = rawDetections.map((det) => {
          const box = det.detection.box;
          return {
            topLeft: [box.left, box.top] as [number, number],
            bottomRight: [box.right, box.bottom] as [number, number],
            probability: [det.detection.score],
            landmarks: [],
          };
        });

        frameCountRef.current += 1;
        lastDetectionsRef.current = typedPredictions;
        setDetections(typedPredictions);

        if (frameCountRef.current % 10 === 0 && rawDetections.length > 0) {
          const emotions = await cropAndDetectEmotionsNoLandmark(
            video,
            rawDetections,
            isFront,
          );
          if (emotions) lastEmotionsRef.current = emotions;
        }
      }
    } catch (err) {
      console.error("Detection error:", err);
    } finally {
      isRunningDetectionRef.current = false;
    }

    if (isDetectingRef.current) runDetectionAsync();
  };

  // ── Crop + Emotion (with landmarks) ─────────────────────────────────────────
  const cropAndDetectEmotions = async (
    video: HTMLVideoElement,
    rawDetections: faceapi.WithFaceExpressions<
      faceapi.WithFaceLandmarks<
        { detection: faceapi.FaceDetection },
        faceapi.FaceLandmarks68
      >
    >[],
    isFront: boolean,
  ): Promise<string[]> => {
    const offscreen = buildOffscreen(video, isFront);
    const croppedFacesData: CroppedFace[] = [];

    for (let i = 0; i < rawDetections.length; i++) {
      const det = rawDetections[i];
      const crop = getCropBox(
        det.detection.box,
        offscreen.width,
        offscreen.height,
        isFront,
      );
      const imageData = cropToDataUrl(offscreen, crop);
      const expressions = det.expressions;
      const dominantEmotion = getDominant(expressions);
      const detAny = det as any;
      const age: number | undefined =
        detAny.age !== undefined ? Math.round(detAny.age) : undefined;
      const gender: string | undefined = detAny.gender;
      const genderProbability: number | undefined = detAny.genderProbability;

      croppedFacesData.push({
        imageData,
        confidence: det.detection.score,
        index: i + 1,
        position: {
          x: Math.round(crop.x1),
          y: Math.round(det.detection.box.top),
        },
        size: { width: Math.round(crop.w), height: Math.round(crop.h) },
        emotion: expressions as unknown as EmotionResult,
        dominantEmotion,
        age,
        gender,
        genderProbability,
      });
    }
    setCroppedFaces(croppedFacesData);
    return croppedFacesData.map((f) => f.dominantEmotion || "");
  };

  // ── Crop + Emotion (no landmarks) ────────────────────────────────────────────
  const cropAndDetectEmotionsNoLandmark = async (
    video: HTMLVideoElement,
    rawDetections: faceapi.WithFaceExpressions<{
      detection: faceapi.FaceDetection;
    }>[],
    isFront: boolean,
  ): Promise<string[]> => {
    const offscreen = buildOffscreen(video, isFront);
    const croppedFacesData: CroppedFace[] = [];

    for (let i = 0; i < rawDetections.length; i++) {
      const det = rawDetections[i];
      const crop = getCropBox(
        det.detection.box,
        offscreen.width,
        offscreen.height,
        isFront,
      );
      const imageData = cropToDataUrl(offscreen, crop);
      const expressions = det.expressions;
      const dominantEmotion = getDominant(expressions);
      const detAny = det as any;
      const age: number | undefined =
        detAny.age !== undefined ? Math.round(detAny.age) : undefined;
      const gender: string | undefined = detAny.gender;
      const genderProbability: number | undefined = detAny.genderProbability;

      croppedFacesData.push({
        imageData,
        confidence: det.detection.score,
        index: i + 1,
        position: {
          x: Math.round(crop.x1),
          y: Math.round(det.detection.box.top),
        },
        size: { width: Math.round(crop.w), height: Math.round(crop.h) },
        emotion: expressions as unknown as EmotionResult,
        dominantEmotion,
        age,
        gender,
        genderProbability,
      });
    }
    setCroppedFaces(croppedFacesData);
    return croppedFacesData.map((f) => f.dominantEmotion || "");
  };

  // ── Crop helpers ──────────────────────────────────────────────────────────────
  const buildOffscreen = (
    video: HTMLVideoElement,
    isFront: boolean,
  ): HTMLCanvasElement => {
    const c = document.createElement("canvas");
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    const ctx = c.getContext("2d")!;
    if (isFront) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -c.width, 0, c.width, c.height);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, c.width, c.height);
    }
    return c;
  };

  const getCropBox = (
    box: faceapi.Box,
    canvasW: number,
    canvasH: number,
    isFront: boolean,
  ) => {
    const padding = 20;
    let x1 = box.left;
    let x2 = box.right;
    if (isFront) {
      x1 = canvasW - box.right;
      x2 = canvasW - box.left;
    }
    const cropX = Math.max(0, x1 - padding);
    const cropY = Math.max(0, box.top - padding);
    const w = Math.min(canvasW - cropX, x2 - x1 + padding * 2);
    const h = Math.min(canvasH - cropY, box.height + padding * 2);
    return { x1, cropX, cropY, w, h };
  };

  const cropToDataUrl = (
    offscreen: HTMLCanvasElement,
    crop: { cropX: number; cropY: number; w: number; h: number },
  ): string => {
    const c = document.createElement("canvas");
    c.width = crop.w;
    c.height = crop.h;
    c.getContext("2d")!.drawImage(
      offscreen,
      crop.cropX,
      crop.cropY,
      crop.w,
      crop.h,
      0,
      0,
      crop.w,
      crop.h,
    );
    return c.toDataURL("image/png");
  };

  const getDominant = (
    expressions: faceapi.FaceExpressions | Record<string, number>,
  ): string => {
    // Jika expressions adalah FaceExpressions dari face-api.js
    if ("asSortedArray" in expressions) {
      return (expressions as faceapi.FaceExpressions).asSortedArray()[0]
        .expression;
    }

    // Jika expressions adalah object biasa
    return (Object.entries(expressions) as [string, number][]).reduce((a, b) =>
      a[1] > b[1] ? a : b,
    )[0];
  };

  // ── Draw bounding boxes ───────────────────────────────────────────────────────
  const drawDetections = (
    predictions: Prediction[],
    canvas: HTMLCanvasElement,
    isMirrored: boolean,
    videoWidth?: number,
    videoHeight?: number,
    emotions?: string[],
  ) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scaleX = videoWidth ? canvas.width / videoWidth : 1;
    const scaleY = videoHeight ? canvas.height / videoHeight : 1;

    predictions.forEach((pred, index) => {
      const [x1raw, y1raw] = pred.topLeft;
      const [x2raw, y2raw] = pred.bottomRight;
      const x1 = x1raw * scaleX;
      const y1 = y1raw * scaleY;
      const x2 = x2raw * scaleX;
      const y2 = y2raw * scaleY;
      const drawX1 = isMirrored ? canvas.width - x2 : x1;
      const drawX2 = isMirrored ? canvas.width - x1 : x2;
      const w = drawX2 - drawX1;
      const h = y2 - y1;

      ctx.shadowColor = "#00ff00";
      ctx.shadowBlur = 15;
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 3;
      ctx.strokeRect(drawX1, y1, w, h);
      ctx.shadowBlur = 0;

      const cs = Math.min(w, h) * 0.2;
      ctx.strokeStyle = "#00ffcc";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(drawX1, y1 + cs);
      ctx.lineTo(drawX1, y1);
      ctx.lineTo(drawX1 + cs, y1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(drawX2 - cs, y1);
      ctx.lineTo(drawX2, y1);
      ctx.lineTo(drawX2, y1 + cs);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(drawX1, y2 - cs);
      ctx.lineTo(drawX1, y2);
      ctx.lineTo(drawX1 + cs, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(drawX2 - cs, y2);
      ctx.lineTo(drawX2, y2);
      ctx.lineTo(drawX2, y2 - cs);
      ctx.stroke();

      pred.landmarks.forEach((lm) => {
        const lx = isMirrored ? canvas.width - lm[0] * scaleX : lm[0] * scaleX;
        const ly = lm[1] * scaleY;
        ctx.beginPath();
        ctx.arc(lx, ly, 2, 0, 2 * Math.PI);
        ctx.fillStyle = "#ff4444";
        ctx.shadowColor = "#ff4444";
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      if (pred.probability.length > 0) {
        const emotion = emotions?.[index];
        const emotionLabel = emotion
          ? `${getEmotionEmoji(emotion)} ${emotion.toUpperCase()}`
          : `Face ${index + 1}`;
        const label = `${emotionLabel} ${(pred.probability[0] * 100).toFixed(1)}%`;
        ctx.font = "bold 18px monospace";
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = "rgba(0,255,0,0.9)";
        ctx.fillRect(drawX1, y1 - 34, tw + 16, 28);
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(drawX1, y1 - 34, tw + 16, 28);
        ctx.fillStyle = "#000";
        ctx.fillText(label, drawX1 + 8, y1 - 12);
      }
    });
  };

  // ── Switch Camera ─────────────────────────────────────────────────────────────
  const switchCamera = async () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    stopCamera();
    setFacingMode(newMode);
    facingModeRef.current = newMode;
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: newMode,
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
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            canvasInitializedRef.current = true;
            isCameraOnRef.current = true;
            setIsCameraOn(true);
            fpsIntervalRef.current = setInterval(() => {
              setFps(frameCountRef.current);
              frameCountRef.current = 0;
            }, 1000);
            videoDrawLoop();
          };
        }
      } catch {
        setError("Gagal mengganti kamera.");
      }
    }, 300);
  };

  const captureFrame = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL("image/png");
    link.download = `capture_${Date.now()}.png`;
    link.click();
  };

  const downloadFace = (imageData: string, index: number) => {
    const link = document.createElement("a");
    link.href = imageData;
    link.download = `face_${index}_${Date.now()}.png`;
    link.click();
  };

  const getGenderEmoji = (g?: string) =>
    g === "male" ? "♂️" : g === "female" ? "♀️" : "⚧️";

  const getEmotionEmoji = (e: string) =>
    ({
      neutral: "😐",
      happy: "😊",
      sad: "😢",
      angry: "😠",
      fearful: "😨",
      disgusted: "🤢",
      surprised: "😲",
    })[e] || "😐";

  const getEmotionColor = (e: string) =>
    ({
      neutral: "#6c757d",
      happy: "#28a745",
      sad: "#007bff",
      angry: "#dc3545",
      fearful: "#ffc107",
      disgusted: "#17a2b8",
      surprised: "#fd7e14",
    })[e] || "#6c757d";

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Temp>
      {isLoading && (
        <div className="alert alert-info mb-0 py-2 px-3 d-flex align-items-center gap-2">
          <div className="spinner-border spinner-border-sm" role="status"></div>
          Memuat model face-api.js...
        </div>
      )}
      {error && (
        <div className="alert alert-danger mb-0 py-2 px-3">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      <div className="row my-2">
        <div className="col-lg-8">
          <Cards>
            <Cards.Body className="px-0 py-0 rounded">
              <div className="bg-primary rounded-top p-2">
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="mb-0 text-white">
                    <i className="bi bi-camera-video me-2"></i>
                    <span className="fw-bold">Camera Feed</span>
                  </h5>

                  <div>
                    {isCameraOn && (
                      <>
                        <span className="badge bg-danger me-2">
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

              {/* Canvas output: */}
              <div className="render-canvas-camera">
                <video
                  ref={videoRef}
                  style={{
                    display: "none",
                    width: dimension_camera.width,
                    height: dimension_camera.height,
                  }}
                  playsInline
                  muted
                />

                <div className="bg-dark p-2">
                  {!isCameraOn && (
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
                  <div className="row justify-content-center">
                    <div className="col-auto">
                      <div className="d-flex align-items-center  position-relative">
                        <div className="">
                          <canvas
                            ref={canvasRef}
                            className="rounded"
                            style={{
                              width: dimension_camera.width,
                              height: dimension_camera.height,
                              display: isCameraOn ? "block" : "none",
                              maxHeight: "600px",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Cards.Body>
            <Cards.Footer className="bg-light">
              <div className="row">
                <div className="col-lg-4">
                  <button
                    className={`btn btn-${!isCameraOn ? "success" : "warning"} w-100`}
                    type="button"
                    onClick={!isCameraOn ? startCamera : stopCamera}
                    disabled={isLoading}
                  >
                    <i
                      className={`bi bi-${!isCameraOn ? "camera-video" : "camera-video-off"} me-2`}
                    ></i>
                    <span>{!isCameraOn ? "Aktifkan" : "Matikan"} Kamera</span>
                  </button>
                </div>
                <div className="col-lg-4">
                  <button
                    className={`btn btn-${!isDetecting ? "primary" : "danger"} w-100`}
                    type="button"
                    onClick={!isDetecting ? startDetection : stopDetection}
                    disabled={!isCameraOn || isLoading || !isFaceApiLoaded}
                  >
                    <i
                      className={`bi bi-${!isDetecting ? "play-fill" : "stop-circle"} me-2`}
                    ></i>
                    <span>{isDetecting ? "Stop" : "Start"} Deteksi</span>
                  </button>
                </div>
                <div className="col-lg-4">
                  <button
                    className="btn btn-outline-secondary w-100"
                    type="button"
                    onClick={switchCamera}
                    disabled={!isCameraOn || isLoading}
                  >
                    <i className="bi bi-arrow-repeat me-2"></i>Switch Camera
                  </button>
                </div>
              </div>
            </Cards.Footer>
          </Cards>
        </div>
        <div className="col-lg-4">
          {croppedFaces.length > 0 && (
            <div className="row">
              {croppedFaces.map((face) => (
                <div key={face.index} className="col-12 mb-3">
                  <div className="card h-100 shadow-sm">
                    <div
                      className="card-header text-white d-flex justify-content-between align-items-center"
                      style={{
                        backgroundColor: face.dominantEmotion
                          ? getEmotionColor(face.dominantEmotion)
                          : "#6c757d",
                      }}
                    >
                      <span>
                        <i className="bi bi-person-circle me-2"></i>Wajah #
                        {face.index}
                      </span>
                      <span className="badge bg-light text-dark">
                        {(face.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="card-body p-2 d-flex align-items-center justify-content-center bg-light">
                      <img
                        src={face.imageData}
                        alt={`Face ${face.index}`}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "200px",
                          width: "auto",
                          height: "auto",
                          display: "block",
                          borderRadius: "4px",
                        }}
                      />
                    </div>
                    <div className="card-footer bg-light">
                      {face.emotion && face.dominantEmotion ? (
                        <div>
                          <div
                            className="alert mb-2 py-2 px-2"
                            style={{
                              backgroundColor: getEmotionColor(
                                face.dominantEmotion,
                              ),
                              color: "#fff",
                              border: "none",
                            }}
                          >
                            <div className="d-flex align-items-center justify-content-between">
                              <strong>
                                <span style={{ fontSize: "1.5rem" }}>
                                  {getEmotionEmoji(face.dominantEmotion)}
                                </span>{" "}
                                {face.dominantEmotion.toUpperCase()}
                              </strong>
                              <span className="badge bg-light text-dark">
                                {(
                                  face.emotion[
                                    face.dominantEmotion as keyof EmotionResult
                                  ] * 100
                                ).toFixed(1)}
                                %
                              </span>
                            </div>
                          </div>
                          {/* Age & Gender */}
                          {(face.age !== undefined || face.gender) && (
                            <div className="d-flex gap-2 mb-2">
                              {face.gender && (
                                <div
                                  className="flex-fill text-center rounded py-1 px-2"
                                  style={{
                                    background:
                                      face.gender === "male"
                                        ? "#cfe2ff"
                                        : "#f8d7da",
                                    fontSize: "0.82rem",
                                  }}
                                >
                                  <div style={{ fontSize: "1.2rem" }}>
                                    {getGenderEmoji(face.gender)}
                                  </div>
                                  <strong>
                                    {face.gender === "male"
                                      ? "Laki-laki"
                                      : "Perempuan"}
                                  </strong>
                                  {face.genderProbability !== undefined && (
                                    <div
                                      className="text-muted"
                                      style={{ fontSize: "0.72rem" }}
                                    >
                                      {(face.genderProbability * 100).toFixed(
                                        0,
                                      )}
                                      %
                                    </div>
                                  )}
                                </div>
                              )}
                              {face.age !== undefined && (
                                <div
                                  className="flex-fill text-center rounded py-1 px-2"
                                  style={{
                                    background: "#fff3cd",
                                    fontSize: "0.82rem",
                                  }}
                                >
                                  <div style={{ fontSize: "1.2rem" }}>🎂</div>
                                  <strong>~{face.age} th</strong>
                                  <div
                                    className="text-muted"
                                    style={{ fontSize: "0.72rem" }}
                                  >
                                    estimasi usia
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="mb-2">
                            <small className="text-muted d-block mb-1">
                              <strong>Detail Emosi:</strong>
                            </small>
                            {Object.entries(face.emotion)
                              .sort(([, a], [, b]) => b - a)
                              .map(([emotion, value]) => (
                                <div key={emotion} className="mb-1">
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <small>
                                      <span style={{ fontSize: "1rem" }}>
                                        {getEmotionEmoji(emotion)}
                                      </span>{" "}
                                      {emotion}
                                    </small>
                                    <small className="text-muted">
                                      {(value * 100).toFixed(1)}%
                                    </small>
                                  </div>
                                  <div
                                    className="progress"
                                    style={{ height: "6px" }}
                                  >
                                    <div
                                      className="progress-bar"
                                      role="progressbar"
                                      style={{
                                        width: `${value * 100}%`,
                                        backgroundColor:
                                          getEmotionColor(emotion),
                                      }}
                                      aria-valuenow={value * 100}
                                      aria-valuemin={0}
                                      aria-valuemax={100}
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ) : (
                        <div className="alert alert-warning mb-2 py-2 px-2">
                          <small>
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            Emosi tidak terdeteksi
                          </small>
                        </div>
                      )}
                      <small className="text-muted d-block mb-1">
                        <i className="bi bi-geo-alt me-1"></i>Posisi: (
                        {face.position.x}, {face.position.y})
                      </small>
                      <small className="text-muted d-block mb-2">
                        <i className="bi bi-arrows-angle-expand me-1"></i>
                        Ukuran: {face.size.width} x {face.size.height}px
                      </small>
                      <button
                        className="btn btn-sm btn-outline-primary w-100"
                        onClick={() => downloadFace(face.imageData, face.index)}
                      >
                        <i className="bi bi-download me-2"></i>Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </Temp>
  );
}
