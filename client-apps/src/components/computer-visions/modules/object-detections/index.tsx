"use client";

import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import Layout from "../layout";
import { Alert } from "@/components/ui/alerts";
import { Skeleton } from "@/components/ui/loading";
import {navigations} from "./navigations";

interface Detection {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

interface ObjectCount {
  [key: string]: number;
}

interface TrackedObject {
  id: string;
  class: string;
  lastSeen: number;
  position: { x: number; y: number };
}

interface TotalObjectCount {
  [key: string]: number;
}

export default function ObjectDetections() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackedObjectsRef = useRef<Map<string, TrackedObject>>(new Map());

  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [objectCounts, setObjectCounts] = useState<ObjectCount>({});
  const [totalDetections, setTotalDetections] = useState(0);
  const [totalObjectCount, setTotalObjectCount] = useState<TotalObjectCount>(
    {},
  );
  const [fps, setFps] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>(
    [],
  );

  // Load TensorFlow model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log("Initializing TensorFlow.js...");
        await tf.setBackend("webgl");
        await tf.ready();

        console.log("TensorFlow.js backend:", tf.getBackend());
        console.log("Loading COCO-SSD model...");

        const loadedModel = await cocoSsd.load({
          base: "lite_mobilenet_v2",
        });

        console.log("Model loaded successfully");
        setModel(loadedModel);
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading model:", err);
        setError(
          `Gagal memuat model deteksi: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
        setIsLoading(false);
      }
    };

    loadModel();

    return () => {
      if (model) {
        model.dispose();
      }
    };
  }, []);

  // Get available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput",
        );
        setAvailableCameras(videoDevices);
        if (videoDevices.length > 0 && !selectedCamera) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error getting cameras:", err);
        setError("Gagal mendapatkan daftar kamera");
      }
    };

    getCameras();
  }, []);

  // Start webcam
  const startWebcam = async () => {
    try {
      setError(null);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: selectedCamera
          ? { deviceId: { exact: selectedCamera } }
          : { facingMode: "user" },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsWebcamActive(true);
          syncCanvasSize();
        };
      }
    } catch (err) {
      console.error("Error starting webcam:", err);
      setError(
        "Gagal mengakses webcam. Pastikan Anda telah memberikan izin akses kamera.",
      );
    }
  };

  // Stop webcam
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsWebcamActive(false);

    if (isDetecting) {
      toggleDetection();
    }
  };

  // Sync canvas size with video
  const syncCanvasSize = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const rect = video.getBoundingClientRect();
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  };

  // Detect objects
  const detectObjects = async () => {
    if (!model || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== 4) return;

    const startTime = performance.now();
    const currentTime = Date.now();

    try {
      const predictions = await model.detect(video);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const counts: ObjectCount = {};
      let total = 0;
      const currentFrameObjects = new Set<string>();

      predictions.forEach((prediction: Detection) => {
        const [x, y, width, height] = prediction.bbox;

        // Count current frame objects
        counts[prediction.class] = (counts[prediction.class] || 0) + 1;
        total++;

        // Create unique ID based on position and class
        const centerX = Math.round(x + width / 2);
        const centerY = Math.round(y + height / 2);
        const objectId = `${prediction.class}_${Math.floor(centerX / 50)}_${Math.floor(centerY / 50)}`;

        currentFrameObjects.add(objectId);

        // Check if this is a new object (not seen in last 2 seconds)
        const tracked = trackedObjectsRef.current.get(objectId);
        if (!tracked || currentTime - tracked.lastSeen > 2000) {
          // New object detected, add to total count
          setTotalObjectCount((prev) => ({
            ...prev,
            [prediction.class]: (prev[prediction.class] || 0) + 1,
          }));
        }

        // Update tracking
        trackedObjectsRef.current.set(objectId, {
          id: objectId,
          class: prediction.class,
          lastSeen: currentTime,
          position: { x: centerX, y: centerY },
        });

        // Draw bounding box
        ctx.strokeStyle = getColorForClass(prediction.class);
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Draw label background
        const label = `${prediction.class} ${Math.round(prediction.score * 100)}%`;
        ctx.font = "16px Arial";
        const textWidth = ctx.measureText(label).width;
        ctx.fillStyle = getColorForClass(prediction.class);
        ctx.fillRect(x, y - 25, textWidth + 10, 25);

        // Draw label text
        ctx.fillStyle = "white";
        ctx.fillText(label, x + 5, y - 7);
      });

      // Clean up old tracked objects (not seen in last 5 seconds)
      trackedObjectsRef.current.forEach((value, key) => {
        if (currentTime - value.lastSeen > 5000) {
          trackedObjectsRef.current.delete(key);
        }
      });

      setObjectCounts(counts);
      setTotalDetections(total);

      // Calculate FPS
      const endTime = performance.now();
      const currentFps = 1000 / (endTime - startTime);
      setFps(Math.round(currentFps));
    } catch (err) {
      console.error("Detection error:", err);
    }
  };

  // Get color for object class
  const getColorForClass = (className: string): string => {
    // const colors: { [key: string]: string } = {
    //   person: "#FF6B6B",
    //   car: "#4ECDC4",
    //   bicycle: "#45B7D1",
    //   motorcycle: "#FFA07A",
    //   bus: "#98D8C8",
    //   truck: "#F7DC6F",
    //   cat: "#BB8FCE",
    //   dog: "#85C1E2",
    //   bird: "#F8B739",
    //   bottle: "#52B788",
    //   cup: "#E63946",
    //   laptop: "#457B9D",
    //   cell_phone: "#A8DADC",
    //   book: "#48d819",
    //   chair: "#E76F51",
    //   keyboard: "#2A9D8F",
    // };
    return "#0f6ee9";
  };

  // Toggle detection
  const toggleDetection = () => {
    if (isDetecting) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      setIsDetecting(false);

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height,
          );
        }
      }
    } else {
      setIsDetecting(true);
      syncCanvasSize();
      detectionIntervalRef.current = window.setInterval(detectObjects, 100);
    }
  };

  // Reset counters
  const resetCounters = () => {
    setTotalObjectCount({});
    trackedObjectsRef.current.clear();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Sync canvas on resize
  useEffect(() => {
    const handleResize = () => {
      syncCanvasSize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Layout navigations={navigations}>
      {isLoading ? (
        <Skeleton />
      ) : (
        <>
          <div className="card mb-3">
            <div className="card-header">
              <div className="d-flex align-items-center justify-content-between">
                <span className="card-label fs-3">
                  <i className="bi bi-camera-video me-2"></i>
                  Deteksi Objek Real-time dengan Webcam
                </span>
                <span className="d-flex align-items-center">
                  <div
                    className={`p-2 bg-${isDetecting ? "success" : "danger"} me-1 rounded-circle`}
                  ></div>
                  <span>{isDetecting ? "Active" : "Not Active"}</span>
                </span>
              </div>
            </div>
            <div className="card-body">
              {error && <Alert message={error} variant="danger" />}

              {/* Camera Selection */}
              <div className="form-field mb-3">
                <label className="fw-bold mb-2">Pilih Kamera:</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-camera"></i>
                  </span>
                  <select
                    className="form-select"
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    disabled={isWebcamActive}
                  >
                    {availableCameras.map((camera) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label ||
                          `Camera ${camera.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                  {!isWebcamActive ? (
                    <button
                      className="btn btn-primary"
                      onClick={startWebcam}
                      disabled={!model}
                    >
                      <i className="bi bi-play-circle me-2"></i>
                      Aktifkan Webcam
                    </button>
                  ) : (
                    <button className="btn btn-danger" onClick={stopWebcam}>
                      <i className="bi bi-stop-circle me-2"></i>
                      Matikan Webcam
                    </button>
                  )}
                </div>
              </div>

              {/* Video Container */}
              <div
                ref={containerRef}
                style={{
                  position: "relative",
                  display: isWebcamActive ? "block" : "none",
                }}
              >
                <video
                  ref={videoRef}
                  className="bg-dark"
                  style={{ height: 500, width: "100%" }}
                  autoPlay
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  style={{
                    pointerEvents: "none",
                    objectFit: "contain",
                    height: 500,
                    width: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                />
              </div>

              {/* Placeholder */}
              {!isWebcamActive && (
                <div className="text-center py-5 bg-light rounded">
                  <i className="bi bi-camera-video-off fs-1 text-muted"></i>
                  <p className="text-muted mt-3">
                    Klik tombol "Aktifkan Webcam" untuk memulai deteksi objek
                  </p>
                </div>
              )}
            </div>
            <div className="card-footer">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <button
                    className="btn btn-primary d-flex align-items-center"
                    onClick={toggleDetection}
                    disabled={!model || isLoading || !isWebcamActive}
                  >
                    <i
                      className={`bi ${isDetecting ? "bi-stop-circle" : "bi-play-circle"} fs-4 me-2`}
                    ></i>
                    <span>{isDetecting ? "Stop" : "Start"}</span>
                    <span className="ms-1">Detection</span>
                  </button>
                  <button
                    className="btn btn-lg btn-outline-primary ms-2"
                    disabled
                  >
                    FPS: {fps}
                  </button>
                </div>
                <button
                  className="btn btn-warning"
                  onClick={resetCounters}
                  disabled={!isDetecting}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Reset Counter
                </button>
              </div>
            </div>
          </div>

          {/* Detection Results - Current Frame */}
          <div className="card mb-3">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">
                <i className="bi bi-eye me-2"></i>
                Deteksi Saat Ini (Current Frame)
              </h5>
            </div>
            <div className="card-body">
              <h2 className="mb-3">
                📦 Total Objek Terdeteksi:{" "}
                <span className="badge bg-info">{totalDetections}</span>
              </h2>
              {Object.keys(objectCounts).length > 0 ? (
                <div className="row g-3">
                  {Object.entries(objectCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([className, count]) => (
                      <div key={className} className="col-md-3 col-sm-4 col-6">
                        <div className="card text-center border-info">
                          <div className="card-body py-2">
                            <div
                              className="mb-2"
                              style={{
                                width: "30px",
                                height: "30px",
                                backgroundColor: getColorForClass(className),
                                margin: "0 auto",
                                borderRadius: "4px",
                              }}
                            ></div>
                            <h6 className="card-subtitle mb-1 text-muted text-capitalize">
                              {className}
                            </h6>
                            <h3 className="card-title mb-0">{count}</h3>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="alert alert-light text-center" role="alert">
                  <i className="bi bi-info-circle me-2"></i>
                  Tidak ada objek yang terdeteksi saat ini
                </div>
              )}
            </div>
          </div>

          {/* Total Accumulated Count */}
          <div className="card mb-3">
            <div className="card-header bg-success text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-bar-chart-fill me-2"></i>
                  Total Akumulasi Objek Terdeteksi
                </h5>
                <span className="badge bg-light text-dark">
                  Total:{" "}
                  {Object.values(totalObjectCount).reduce(
                    (sum, count) => sum + count,
                    0,
                  )}
                </span>
              </div>
            </div>
            <div className="card-body">
              {Object.keys(totalObjectCount).length > 0 ? (
                <>
                  <div className="alert alert-success mb-3">
                    <i className="bi bi-info-circle me-2"></i>
                    Counter ini menghitung total objek unik yang terdeteksi
                    selama sesi deteksi berlangsung
                  </div>
                  <div className="row g-3">
                    {Object.entries(totalObjectCount)
                      .sort(([, a], [, b]) => b - a)
                      .map(([className, count]) => (
                        <div
                          key={className}
                          className="col-md-3 col-sm-4 col-6"
                        >
                          <div className="card text-center border-success shadow-sm">
                            <div className="card-body py-3">
                              <div
                                className="mb-2"
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  backgroundColor: getColorForClass(className),
                                  margin: "0 auto",
                                  borderRadius: "8px",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                }}
                              ></div>
                              <h6 className="card-subtitle mb-2 text-muted text-capitalize fw-bold">
                                {className}
                              </h6>
                              <h2 className="card-title mb-0 text-success">
                                {count}
                              </h2>
                              <small className="text-muted">objek</small>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <div className="alert alert-light text-center" role="alert">
                  <i className="bi bi-hourglass-split me-2"></i>
                  Belum ada objek yang tercatat. Mulai deteksi untuk melihat
                  statistik.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
