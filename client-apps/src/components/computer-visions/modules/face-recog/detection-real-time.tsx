"use client";
import React, { useRef, useState, useEffect } from "react";
import Temp from "./temp";
import * as blazeface from "@tensorflow-models/blazeface";
import { Tensor1D } from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import { Cards } from "@/components/ui/cards";

interface Prediction {
  topLeft: [number, number];
  bottomRight: [number, number];
  probability: number[];
  landmarks: number[][];
}

interface CroppedFace {
  imageData: string;
  confidence: number;
  index: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

// Helper: ekstrak array number dari nilai yang bisa berupa number, Tensor1D, atau undefined
function extractNumberArray(value: number | Tensor1D | undefined): number[] {
  if (value === undefined) return [];
  if (typeof value === "number") return [value];
  if (Array.isArray(value)) return value;

  try {
    console.log("value:", value);
    return Array.from((value as Tensor1D).dataSync());
  } catch (error) {
    console.warn("Error extracting number array:", error, "Value:", value);
    return [];
  }
}

// Helper: ekstrak tuple [number, number] dari nilai yang bisa berupa [number, number] atau Tensor1D
function extractPoint(value: [number, number] | Tensor1D): [number, number] {
  if (Array.isArray(value)) return value;
  const data = value.dataSync();
  return [data[0], data[1]];
}

// Helper: ekstrak array landmarks
function extractLandmarks(
  value: number[][] | Tensor1D[] | undefined,
): number[][] {
  if (!value) return [];
  return value.map((lm) => {
    if (Array.isArray(lm)) return lm;
    return Array.from((lm as Tensor1D).dataSync());
  });
}

// Mapper dari NormalizedFace[] ke Prediction[]
function normalizedFacesToPredictions(
  faces: blazeface.NormalizedFace[],
): Prediction[] {
  return faces.map((face) => ({
    topLeft: extractPoint(face.topLeft as [number, number] | Tensor1D),
    bottomRight: extractPoint(face.bottomRight as [number, number] | Tensor1D),
    probability: extractNumberArray(face.probability),
    landmarks: extractLandmarks(
      face.landmarks as number[][] | Tensor1D[] | undefined,
    ),
  }));
}

export default function FaceDetectRealTime() {
  const [model, setModel] = useState<blazeface.BlazeFaceModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState<Prediction[]>([]);
  const [croppedFaces, setCroppedFaces] = useState<CroppedFace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);
  const fpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // agar requestAnimationFrame selalu pakai nilai terbaru tanpa stale closure
  const modelRef = useRef<blazeface.BlazeFaceModel | null>(null);
  const facingModeRef = useRef<"user" | "environment">("user");
  const isDetectingRef = useRef(false);
  const isCameraOnRef = useRef(false);
  const dimension_camera = { width: 700, height: 480 };
  const canvasInitializedRef = useRef(false); // ✅ Track canvas initialization
  const lastDetectionsRef = useRef<Prediction[]>([]); // ✅ Simpan deteksi terakhir agar bisa digambar tiap frame
  const isRunningDetectionRef = useRef(false); // ✅ Flag agar estimateFaces tidak dipanggil bersamaan

  useEffect(() => {
    modelRef.current = model;
  }, [model]);
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
    loadModel();
    return () => {
      stopCamera();
    };
  }, []);

  const loadModel = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedModel = await blazeface.load();
      setModel(loadedModel);
      modelRef.current = loadedModel;
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading model:", error);
      setError("Gagal memuat model BlazeFace. Silakan refresh halaman.");
      setIsLoading(false);
    }
  };

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

          // ✅ Setup canvas SEKALI saat video loaded
          const canvas = canvasRef.current;
          const video = videoRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
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
    canvasInitializedRef.current = false; // ✅ Reset flag
    setIsCameraOn(false);
    setIsDetecting(false);
    setDetections([]);
    setCroppedFaces([]);
    setFps(0);

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Loop gambar video ke canvas tanpa deteksi (saat kamera ON tapi deteksi OFF)
  const videoDrawLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!isCameraOnRef.current || !video || !canvas || video.readyState !== 4) {
      if (isCameraOnRef.current)
        animationRef.current = requestAnimationFrame(videoDrawLoop);
      return;
    }

    // Kalau deteksi aktif, biarkan detectLoop yang handle
    if (isDetectingRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ✅ JANGAN set canvas.width/height di sini (sudah di-set saat startCamera)

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame
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
    if (!modelRef.current || !videoRef.current || !canvasRef.current) {
      setError("Model atau kamera belum siap.");
      return;
    }
    isDetectingRef.current = true;
    isRunningDetectionRef.current = false;
    lastDetectionsRef.current = [];
    setIsDetecting(true);
    setError(null);

    // Cancel loop video biasa, ganti ke detect loop
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    // Jalankan RAF loop untuk render video + overlay
    detectLoop();
    // Jalankan async loop untuk deteksi wajah
    runDetectionAsync();
  };

  const stopDetection = () => {
    isDetectingRef.current = false;
    isRunningDetectionRef.current = false;
    lastDetectionsRef.current = [];
    setIsDetecting(false);
    setDetections([]);
    // setCroppedFaces([]);

    // Cancel detect loop, kembali ke video draw loop
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

    // 1. Clear dan gambar video frame SETIAP frame (smooth video)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (isFront) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    // 2. Gambar bounding box dari deteksi TERAKHIR yang tersimpan (overlay persistent)
    if (lastDetectionsRef.current.length > 0) {
      drawDetections(
        lastDetectionsRef.current,
        canvas,
        isFront,
        video.videoWidth,
        video.videoHeight,
      );
    }

    // 3. Jadwalkan frame berikutnya
    animationRef.current = requestAnimationFrame(detectLoop);
  };

  // Loop deteksi terpisah dari RAF — berjalan secepat model bisa
  const runDetectionAsync = async () => {
    const video = videoRef.current;
    const model = modelRef.current;
    const canvas = canvasRef.current;

    if (!isDetectingRef.current || !video || !model || !canvas) return;
    if (video.readyState !== 4) {
      setTimeout(runDetectionAsync, 100);
      return;
    }

    if (isRunningDetectionRef.current) return; // hindari overlap
    isRunningDetectionRef.current = true;

    try {
      const predictions = await model.estimateFaces(video, false);
      if (!isDetectingRef.current) return; // sudah stop saat menunggu

      const typedPredictions = normalizedFacesToPredictions(predictions);
      lastDetectionsRef.current = typedPredictions; // simpan untuk RAF loop
      setDetections(typedPredictions);

      frameCountRef.current += 1;
      if (frameCountRef.current % 10 === 0 && typedPredictions.length > 0) {
        const isFront = facingModeRef.current === "user";
        cropFacesFromVideo(video, typedPredictions, isFront);
      }
    } catch (err) {
      console.error("Detection error:", err);
    } finally {
      isRunningDetectionRef.current = false;
    }

    // Langsung jalankan lagi selama deteksi aktif
    if (isDetectingRef.current) {
      runDetectionAsync();
    }
  };

  const cropFacesFromVideo = (
    video: HTMLVideoElement,
    predictions: Prediction[],
    isFront: boolean,
  ) => {
    const offscreen = document.createElement("canvas");
    offscreen.width = video.videoWidth;
    offscreen.height = video.videoHeight;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    if (isFront) {
      offCtx.save();
      offCtx.scale(-1, 1);
      offCtx.drawImage(
        video,
        -offscreen.width,
        0,
        offscreen.width,
        offscreen.height,
      );
      offCtx.restore();
    } else {
      offCtx.drawImage(video, 0, 0, offscreen.width, offscreen.height);
    }

    const croppedFacesData: CroppedFace[] = [];
    predictions.forEach((prediction, index) => {
      let [x1, y1] = prediction.topLeft;
      let [x2, y2] = prediction.bottomRight;

      if (isFront) {
        const mx1 = offscreen.width - x2;
        const mx2 = offscreen.width - x1;
        x1 = mx1;
        x2 = mx2;
      }

      const padding = 20;
      const cropX = Math.max(0, x1 - padding);
      const cropY = Math.max(0, y1 - padding);
      const cropW = Math.min(offscreen.width - cropX, x2 - x1 + padding * 2);
      const cropH = Math.min(offscreen.height - cropY, y2 - y1 + padding * 2);

      // ✅ Canvas sementara untuk crop area asli
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = cropW;
      tempCanvas.height = cropH;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      tempCtx.drawImage(
        offscreen,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        cropW,
        cropH,
      );

      // ✅ Canvas final dengan ukuran 224x224
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = 224;
      finalCanvas.height = 224;
      const finalCtx = finalCanvas.getContext("2d");
      if (!finalCtx) return;

      // ✅ Resize ke 224x224 dengan mempertahankan aspect ratio (cover mode)
      const scale = Math.max(224 / cropW, 224 / cropH);
      const scaledW = cropW * scale;
      const scaledH = cropH * scale;
      const offsetX = (224 - scaledW) / 2;
      const offsetY = (224 - scaledH) / 2;

      // Fill background dengan warna hitam (opsional)
      finalCtx.fillStyle = "#000000";
      finalCtx.fillRect(0, 0, 224, 224);

      // Draw image dengan aspect ratio preserved
      finalCtx.drawImage(
        tempCanvas,
        0,
        0,
        cropW,
        cropH,
        offsetX,
        offsetY,
        scaledW,
        scaledH,
      );

      croppedFacesData.push({
        imageData: finalCanvas.toDataURL("image/png"),
        confidence: prediction.probability?.[0] || 0,
        index: index + 1,
        position: { x: Math.round(x1), y: Math.round(y1) },
        size: { width: 224, height: 224 },
      });
    });

    setCroppedFaces(croppedFacesData);
  };

  const drawDetections = (
    predictions: Prediction[],
    canvas: HTMLCanvasElement,
    isMirrored: boolean = false,
    videoWidth?: number,
    videoHeight?: number,
  ) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Hitung faktor skala jika canvas berbeda ukuran dengan video asli
    const scaleX = videoWidth ? canvas.width / videoWidth : 1;
    const scaleY = videoHeight ? canvas.height / videoHeight : 1;

    predictions.forEach((prediction: Prediction, index: number) => {
      const [x1raw, y1raw] = prediction.topLeft;
      const [x2raw, y2raw] = prediction.bottomRight;

      // Terapkan skala koordinat
      const x1 = x1raw * scaleX;
      const y1 = y1raw * scaleY;
      const x2 = x2raw * scaleX;
      const y2 = y2raw * scaleY;

      // Mirror koordinat X jika kamera depan
      const drawX1 = isMirrored ? canvas.width - x2 : x1;
      const drawX2 = isMirrored ? canvas.width - x1 : x2;
      const w = drawX2 - drawX1;
      const h = y2 - y1;

      // Bounding box dengan efek glow
      ctx.shadowColor = "#00ff00";
      ctx.shadowBlur = 15;
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 3;
      ctx.strokeRect(drawX1, y1, w, h);
      ctx.shadowBlur = 0;

      // Corner markers
      const cs = Math.min(w, h) * 0.2;
      ctx.strokeStyle = "#00ffcc";
      ctx.lineWidth = 5;

      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(drawX1, y1 + cs);
      ctx.lineTo(drawX1, y1);
      ctx.lineTo(drawX1 + cs, y1);
      ctx.stroke();

      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(drawX2 - cs, y1);
      ctx.lineTo(drawX2, y1);
      ctx.lineTo(drawX2, y1 + cs);
      ctx.stroke();

      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(drawX1, y2 - cs);
      ctx.lineTo(drawX1, y2);
      ctx.lineTo(drawX1 + cs, y2);
      ctx.stroke();

      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(drawX2 - cs, y2);
      ctx.lineTo(drawX2, y2);
      ctx.lineTo(drawX2, y2 - cs);
      ctx.stroke();

      // Landmarks
      if (prediction.landmarks) {
        prediction.landmarks.forEach((lm) => {
          const lmX = lm[0] * scaleX;
          const lmY = lm[1] * scaleY;
          const lx = isMirrored ? canvas.width - lmX : lmX;
          ctx.beginPath();
          ctx.arc(lx, lmY, 5, 0, 2 * Math.PI);
          ctx.fillStyle = "#ff4444";
          ctx.shadowColor = "#ff4444";
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      // Label confidence
      if (prediction.probability?.length > 0) {
        const score = (prediction.probability[0] * 100).toFixed(1);
        const label = `Face ${index + 1}: ${score}%`;
        ctx.font = "bold 18px monospace";
        const tw = ctx.measureText(label).width;

        ctx.fillStyle = "rgba(0, 255, 0, 0.9)";
        ctx.fillRect(drawX1, y1 - 34, tw + 16, 28);
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(drawX1, y1 - 34, tw + 16, 28);
        ctx.fillStyle = "#000";
        ctx.fillText(label, drawX1 + 8, y1 - 12);
      }
    });
  };

  const switchCamera = async () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    stopCamera();
    setFacingMode(newMode);
    facingModeRef.current = newMode;
    setTimeout(async () => {
      try {
        setError(null);
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

            // ✅ Reset canvas size sesuai video baru
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
      } catch (err) {
        setError("Gagal mengganti kamera.");
      }
    }, 300);
  };

  const captureFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `capture_${Date.now()}.png`;
    link.click();
  };

  const captureFaceFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !isCameraOn) {
      setError("Kamera belum aktif.");
      return;
    }

    if (detections.length === 0) {
      setError("Tidak ada wajah yang terdeteksi.");
      return;
    }

    // Buat offscreen canvas untuk capture video frame
    const offscreen = document.createElement("canvas");
    offscreen.width = video.videoWidth;
    offscreen.height = video.videoHeight;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    const isFront = facingModeRef.current === "user";

    // Draw video frame ke offscreen canvas
    if (isFront) {
      offCtx.save();
      offCtx.scale(-1, 1);
      offCtx.drawImage(
        video,
        -offscreen.width,
        0,
        offscreen.width,
        offscreen.height,
      );
      offCtx.restore();
    } else {
      offCtx.drawImage(video, 0, 0, offscreen.width, offscreen.height);
    }

    // Loop semua deteksi dan crop setiap wajah
    detections.forEach((prediction, index) => {
      let [x1, y1] = prediction.topLeft;
      let [x2, y2] = prediction.bottomRight;

      if (isFront) {
        const mx1 = offscreen.width - x2;
        const mx2 = offscreen.width - x1;
        x1 = mx1;
        x2 = mx2;
      }

      const padding = 20;
      const cropX = Math.max(0, x1 - padding);
      const cropY = Math.max(0, y1 - padding);
      const cropW = Math.min(offscreen.width - cropX, x2 - x1 + padding * 2);
      const cropH = Math.min(offscreen.height - cropY, y2 - y1 + padding * 2);

      // Canvas sementara untuk crop area asli
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = cropW;
      tempCanvas.height = cropH;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      tempCtx.drawImage(
        offscreen,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        cropW,
        cropH,
      );

      // Canvas final dengan ukuran 224x224
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = 224;
      finalCanvas.height = 224;
      const finalCtx = finalCanvas.getContext("2d");
      if (!finalCtx) return;

      // Resize ke 224x224 dengan mempertahankan aspect ratio
      const scale = Math.max(224 / cropW, 224 / cropH);
      const scaledW = cropW * scale;
      const scaledH = cropH * scale;
      const offsetX = (224 - scaledW) / 2;
      const offsetY = (224 - scaledH) / 2;

      // Fill background dengan warna hitam
      finalCtx.fillStyle = "#000000";
      finalCtx.fillRect(0, 0, 224, 224);

      // Draw image dengan aspect ratio preserved
      finalCtx.drawImage(
        tempCanvas,
        0,
        0,
        cropW,
        cropH,
        offsetX,
        offsetY,
        scaledW,
        scaledH,
      );

      // Auto download setiap wajah
      const link = document.createElement("a");
      link.href = finalCanvas.toDataURL("image/png");
      link.download = `face_${index + 1}_${Date.now()}.png`;
      link.click();

      // Delay kecil antar download agar tidak bentrok
      if (index < detections.length - 1) {
        setTimeout(() => {}, 100);
      }
    });

    // Tampilkan notifikasi sukses
    setError(null);
    // alert(`Berhasil mendownload ${detections.length} wajah!`);
  };

  const downloadFace = (imageData: string, index: number) => {
    const link = document.createElement("a");
    link.href = imageData;
    link.download = `face_${index}_${Date.now()}.png`;
    link.click();
  };

  return (
    <Temp>
      {isLoading && (
        <div className="alert alert-info mb-0 py-2 px-3 d-flex align-items-center gap-2">
          <div className="spinner-border spinner-border-sm" role="status"></div>
          Memuat model BlazeFace...
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
                <div className="col-lg-3">
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
                <div className="col-lg-3">
                  <button
                    className={`btn btn-${!isDetecting ? "primary" : "danger"} w-100`}
                    type="button"
                    onClick={!isDetecting ? startDetection : stopDetection}
                    disabled={!isCameraOn || isLoading || !model}
                  >
                    <i
                      className={`bi bi-${!isDetecting ? "play-fill" : "stop-circle"} me-2`}
                    ></i>
                    <span>{isDetecting ? "Stop" : "Start"} Deteksi</span>
                  </button>
                </div>
                <div className="col-lg-3">
                  <button
                    className="btn btn-outline-dark w-100"
                    type="button"
                    onClick={captureFaceFrame}
                    disabled={!isCameraOn || isLoading || !model}
                  >
                    <i className="bi bi-person-bounding-box me-2"></i>Capture
                    Face
                  </button>
                </div>
                <div className="col-lg-3">
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
            <div className="mt-0">
              <h5 className="mb-3">
                <i className="bi bi-person-bounding-box me-2"></i>
                Wajah yang Terdeteksi ({croppedFaces.length})
              </h5>
              <div
                style={{
                  maxHeight: 450,
                  overflowX: "hidden",
                  overflowY: "auto",
                }}
              >
                <div className="row">
                  {croppedFaces.map((face) => (
                    <div key={face.index} className="col-12 mb-3">
                      <div className="card h-100 shadow-sm">
                        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                          <span>
                            <i className="bi bi-person-circle me-2"></i>
                            Wajah #{face.index}
                          </span>
                          <span className="badge bg-light text-dark">
                            {(face.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="card-body p-2 d-flex align-items-center justify-content-center bg-light">
                          {/* ✅ Gunakan max-width + height: auto agar tidak melebar */}
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
                          <small className="text-muted d-block mb-1">
                            <i className="bi bi-geo-alt me-1"></i>
                            Posisi: ({face.position.x}, {face.position.y})
                          </small>
                          <small className="text-muted d-block mb-2">
                            <i className="bi bi-arrows-angle-expand me-1"></i>
                            Ukuran: {face.size.width} x {face.size.height}px
                          </small>
                          <button
                            className="btn btn-sm btn-outline-primary w-100"
                            onClick={() =>
                              downloadFace(face.imageData, face.index)
                            }
                          >
                            <i className="bi bi-download me-2"></i>Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabel Deteksi */}
      {detections.length > 0 && (
        <div className="mt-2">
          <h5>Detail Deteksi</h5>
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Confidence</th>
                  <th>Posisi (X, Y)</th>
                  <th>Ukuran (W x H)</th>
                  <th>Landmarks</th>
                </tr>
              </thead>
              <tbody>
                {detections.map((face, index) => {
                  const [x1, y1] = face.topLeft;
                  const [x2, y2] = face.bottomRight;
                  return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        {face.probability?.length > 0
                          ? (face.probability[0] * 100).toFixed(2)
                          : "0.00"}
                        %
                      </td>
                      <td>
                        ({Math.round(x1)}, {Math.round(y1)})
                      </td>
                      <td>
                        {Math.round(x2 - x1)} x {Math.round(y2 - y1)}
                      </td>
                      <td>{face.landmarks?.length || 0} points</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </Temp>
  );
}
