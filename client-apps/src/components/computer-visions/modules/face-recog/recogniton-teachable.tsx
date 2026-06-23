"use client";

import React, { useRef, useState, useEffect } from "react";
import Temp from "./temp";
import * as blazeface from "@tensorflow-models/blazeface";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import { Cards } from "@/components/ui/cards";

interface Prediction {
  topLeft: [number, number];
  bottomRight: [number, number];
  probability?: number[];
  landmarks?: number[][];
}

interface CroppedFace {
  imageData: string;
  confidence: number;
  index: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  prediction?: TeachablePrediction; // ✅ Tambahkan prediksi dari Teachable Machine
}

interface TeachablePrediction {
  className: string;
  probability: number;
}

interface TeachableModel {
  predict: (
    img: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
  ) => Promise<Array<{ className: string; probability: number }>>;
  dispose: () => void;
}

export default function FaceRecognitionTeachable() {
  const [blazefaceModel, setBlazefaceModel] =
    useState<blazeface.BlazeFaceModel | null>(null);
  const [teachableModel, setTeachableModel] = useState<TeachableModel | null>(
    null,
  );
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

  const blazefaceModelRef = useRef<blazeface.BlazeFaceModel | null>(null);
  const teachableModelRef = useRef<TeachableModel | null>(null);
  const facingModeRef = useRef<"user" | "environment">("user");
  const isDetectingRef = useRef(false);
  const isCameraOnRef = useRef(false);
  const dimension_camera = { width: 700, height: 480 };
  const canvasInitializedRef = useRef(false);
  const lastDetectionsRef = useRef<Prediction[]>([]);
  const isRunningDetectionRef = useRef(false);

  useEffect(() => {
    blazefaceModelRef.current = blazefaceModel;
  }, [blazefaceModel]);

  useEffect(() => {
    teachableModelRef.current = teachableModel;
  }, [teachableModel]);

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
    loadModels();
    return () => {
      stopCamera();
      if (teachableModelRef.current) {
        teachableModelRef.current.dispose();
      }
    };
  }, []);

  // ✅ Load kedua model: BlazeFace dan Teachable Machine
  const loadModels = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load BlazeFace model
      const loadedBlazeFace = await blazeface.load();
      setBlazefaceModel(loadedBlazeFace);
      blazefaceModelRef.current = loadedBlazeFace;

      // Load Teachable Machine model
      const modelURL =
        process.env.NEXT_PUBLIC_FRONTEND_URL +
        "/assets/dataset-face/tm-my-image-model/model.json";
      const metadataURL =
        process.env.NEXT_PUBLIC_FRONTEND_URL +
        "/assets/dataset-face/tm-my-image-model/metadata.json";

      const loadedTeachable = await loadTeachableMachineModel(
        modelURL,
        metadataURL,
      );
      setTeachableModel(loadedTeachable);
      teachableModelRef.current = loadedTeachable;

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading models:", error);
      setError(
        "Gagal memuat model. Pastikan file model ada di folder public/dataset/tm-my-image-model/",
      );
      setIsLoading(false);
    }
  };

  // ✅ Function untuk load Teachable Machine model
  const loadTeachableMachineModel = async (
    modelURL: string,
    metadataURL: string,
  ): Promise<TeachableModel> => {
    try {
      // Load model TensorFlow.js
      const model = await tf.loadLayersModel(modelURL);

      // Load metadata untuk mendapatkan class names
      const metadataResponse = await fetch(metadataURL);
      const metadata = await metadataResponse.json();
      const classNames = metadata.labels || [];

      // Wrapper function untuk prediksi
      const predict = async (
        img: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
      ) => {
        // Preprocess image: resize ke 224x224 dan normalize
        const tensor = tf.tidy(() => {
          const imgTensor = tf.browser.fromPixels(img);
          const resized = tf.image.resizeBilinear(imgTensor, [224, 224]);
          const normalized = resized.div(255.0);
          const batched = normalized.expandDims(0);
          return batched;
        });

        // Predict
        const predictions = (await model.predict(tensor)) as tf.Tensor;
        const probabilities = await predictions.data();
        tensor.dispose();
        predictions.dispose();

        // ✅ PERBAIKAN: Map ke class names dengan type yang jelas
        const results: Array<{ className: string; probability: number }> =
          classNames.map((className: string, index: number) => ({
            className,
            probability: probabilities[index],
          }));

        // ✅ PERBAIKAN: Sort dengan type assertion yang eksplisit
        results.sort(
          (
            a: { className: string; probability: number },
            b: { className: string; probability: number },
          ) => b.probability - a.probability,
        );

        return results;
      };

      const dispose = () => {
        model.dispose();
      };

      return { predict, dispose };
    } catch (error) {
      console.error("Error loading Teachable Machine model:", error);
      throw error;
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
    canvasInitializedRef.current = false;
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
    if (
      !blazefaceModelRef.current ||
      !teachableModelRef.current ||
      !videoRef.current ||
      !canvasRef.current
    ) {
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
    setDetections([]);
    // setCroppedFaces([]);

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
      drawDetections(
        lastDetectionsRef.current,
        canvas,
        isFront,
        video.videoWidth,
        video.videoHeight,
      );
    }

    animationRef.current = requestAnimationFrame(detectLoop);
  };

  const runDetectionAsync = async () => {
    const video = videoRef.current;
    const blazeface = blazefaceModelRef.current;
    const teachable = teachableModelRef.current;
    const canvas = canvasRef.current;

    if (
      !isDetectingRef.current ||
      !video ||
      !blazeface ||
      !teachable ||
      !canvas
    )
      return;
    if (video.readyState !== 4) {
      setTimeout(runDetectionAsync, 100);
      return;
    }

    if (isRunningDetectionRef.current) return;
    isRunningDetectionRef.current = true;

    try {
      const predictions = await blazeface.estimateFaces(video, false);
      if (!isDetectingRef.current) return;

      const typedPredictions = normalizedFacesToPredictions(predictions);
      lastDetectionsRef.current = typedPredictions;
      setDetections(typedPredictions);

      frameCountRef.current += 1;

      // ✅ Crop faces dan predict dengan Teachable Machine setiap 10 frame
      if (frameCountRef.current % 10 === 0 && typedPredictions.length > 0) {
        const isFront = facingModeRef.current === "user";
        await cropAndPredictFaces(video, typedPredictions, isFront, teachable);
      }
    } catch (err) {
      console.error("Detection error:", err);
    } finally {
      isRunningDetectionRef.current = false;
    }

    if (isDetectingRef.current) {
      runDetectionAsync();
    }
  };

  // ✅ Function untuk crop wajah dan predict dengan Teachable Machine
  const cropAndPredictFaces = async (
    video: HTMLVideoElement,
    predictions: Prediction[],
    isFront: boolean,
    teachable: TeachableModel,
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

    for (let index = 0; index < predictions.length; index++) {
      const prediction = predictions[index];
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
      if (!finalCtx) continue;

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

      // ✅ Predict dengan Teachable Machine menggunakan canvas 224x224
      let teachablePrediction: TeachablePrediction | undefined;
      try {
        const predictions = await teachable.predict(finalCanvas);
        if (predictions && predictions.length > 0) {
          // ✅ FILTER: Hanya ambil prediksi dengan confidence > 70%
          const highConfidencePrediction = predictions.find(
            (p) => p.probability > 0.7,
          );

          if (highConfidencePrediction) {
            teachablePrediction = {
              className: highConfidencePrediction.className,
              probability: highConfidencePrediction.probability,
            };
          } else {
            // ✅ Jika tidak ada yang > 70%, tandai sebagai "Unknown"
            teachablePrediction = {
              className: "Unknown",
              probability: predictions[0].probability,
            };
          }
        }
      } catch (err) {
        console.error("Error predicting face:", err);
      }

      croppedFacesData.push({
        imageData: finalCanvas.toDataURL("image/png"),
        confidence: prediction.probability?.[0] || 0,
        index: index + 1,
        position: { x: Math.round(x1), y: Math.round(y1) },
        size: { width: 224, height: 224 },
        prediction: teachablePrediction,
      });
    }

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

    const scaleX = videoWidth ? canvas.width / videoWidth : 1;
    const scaleY = videoHeight ? canvas.height / videoHeight : 1;

    predictions.forEach((prediction: Prediction, index: number) => {
      const [x1raw, y1raw] = prediction.topLeft;
      const [x2raw, y2raw] = prediction.bottomRight;

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

      // ✅ PERBAIKAN: Gunakan Array.isArray() untuk type checking yang lebih aman
      if (
        Array.isArray(prediction.probability) &&
        prediction.probability.length > 0
      ) {
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

  const downloadFace = (imageData: string, index: number) => {
    const link = document.createElement("a");
    link.href = imageData;
    link.download = `face_${index}_${Date.now()}.png`;
    link.click();
  };

  // ✅ Helper function untuk convert BlazeFace predictions
  const normalizedFacesToPredictions = (
    faces: blazeface.NormalizedFace[],
  ): Prediction[] => {
    return faces.map((face) => {
      const topLeft = extractPoint(face.topLeft);
      const bottomRight = extractPoint(face.bottomRight);
      const probability = extractNumberArray(face.probability);
      const landmarks = face.landmarks
        ? extractLandmarks(face.landmarks as number[][] | tf.Tensor1D[])
        : [];

      return {
        topLeft,
        bottomRight,
        probability,
        landmarks,
      };
    });
  };

  const extractPoint = (
    value: [number, number] | tf.Tensor1D,
  ): [number, number] => {
    if (Array.isArray(value)) {
      return value;
    }
    const arr = Array.from(value.dataSync());
    return [arr[0], arr[1]];
  };

  const extractNumberArray = (
    value: number | number[] | tf.Tensor1D | undefined,
  ): number[] => {
    if (value === undefined) return [];
    if (typeof value === "number") return [value];
    if (Array.isArray(value)) return value;
    // Jika Tensor1D
    if ("dataSync" in value) {
      return Array.from(value.dataSync());
    }
    return [];
  };

  const extractLandmarks = (value: number[][] | tf.Tensor1D[]): number[][] => {
    if (!value || value.length === 0) return [];

    // Check if first element is array (number[][])
    if (Array.isArray(value[0])) {
      return value as number[][];
    }

    // Otherwise treat as Tensor1D[]
    return (value as tf.Tensor1D[]).map((tensor) =>
      Array.from(tensor.dataSync()),
    );
  };

  return (
    <Temp>
      {isLoading && (
        <div className="alert alert-info mb-0 py-2 px-3 d-flex align-items-center gap-2">
          <div className="spinner-border spinner-border-sm" role="status"></div>
          Memuat model BlazeFace & Teachable Machine...
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
                    disabled={
                      !isCameraOn ||
                      isLoading ||
                      !blazefaceModel ||
                      !teachableModel
                    }
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
            <div>
              <div className="row">
                {croppedFaces.map((face) => (
                  <div key={face.index} className="col-12 mb-3">
                    <div className="card h-100 shadow-sm">
                      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                        <span>
                          <i className="bi bi-person-circle me-2"></i>
                          Wajah #{face.index}{" "}
                          {face.prediction ? face.prediction?.className : ""}
                        </span>
                        <span className="badge bg-light text-dark">
                          {(
                            (face.prediction
                              ? face.prediction.probability
                              : face.confidence) * 100
                          ).toFixed(1)}
                          %
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
                        {/* ✅ Tampilkan hasil prediksi Teachable Machine */}
                        {face.prediction && (
                          <div className="alert alert-success mb-2 py-2 px-2">
                            <strong>
                              <i className="bi bi-check-circle me-1"></i>
                              {face.prediction.className}
                            </strong>
                            <br />
                            <small>
                              Confidence:{" "}
                              {(face.prediction.probability * 100).toFixed(1)}%
                            </small>
                          </div>
                        )}
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
          )}
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </Temp>
  );
}
