"use client";

import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import { Alert } from "@/components/ui/alerts";
import { Skeleton } from "@/components/ui/loading";

interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

interface VehicleCount {
  car: number;
  truck: number;
  bus: number;
  motorcycle: number;
  bicycle: number;
}

export default function CCTVObjDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [vehicleCount, setVehicleCount] = useState<VehicleCount>({
    car: 0,
    truck: 0,
    bus: 0,
    motorcycle: 0,
    bicycle: 0,
  });

  const [currentVehicleCount, setCurrentVehicleCount] = useState<VehicleCount>({
    car: 0,
    truck: 0,
    bus: 0,
    motorcycle: 0,
    bicycle: 0,
  });

  // State untuk total accumulated count
  const [totalVehicleCount, setTotalVehicleCount] = useState<VehicleCount>({
    car: 0,
    truck: 0,
    bus: 0,
    motorcycle: 0,
    bicycle: 0,
  });

  const [fps, setFps] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>("");
  //https://its.binamarga.pu.go.id:8989/play/hls/CT-01/index.m3u8
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const detectionIntervalRef = useRef<number | null>(null);
  const trackedVehiclesRef = useRef<
    Map<string, { class: string; lastSeen: number }>
  >(new Map());

  const detectVehicles = async () => {
    if (!model || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== 4) return;

    syncCanvasSize();

    const startTime = performance.now();
    const currentTime = Date.now();

    try {
      const predictions = await model.detect(video);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const vehicleClasses = ["car", "truck", "bus", "motorcycle", "bicycle"];
      const vehicleDetections = predictions.filter((prediction) =>
        vehicleClasses.includes(prediction.class),
      );

      // Count current frame vehicles
      const currentCounts: VehicleCount = {
        car: 0,
        truck: 0,
        bus: 0,
        motorcycle: 0,
        bicycle: 0,
      };

      // Track detected vehicles in current frame
      const currentFrameVehicles = new Set<string>();

      vehicleDetections.forEach((prediction: Detection) => {
        const [x, y, width, height] = prediction.bbox;

        // Create a simple ID based on position and class
        const centerX = Math.round(x + width / 2);
        const centerY = Math.round(y + height / 2);
        const vehicleId = `${prediction.class}_${Math.floor(centerX / 50)}_${Math.floor(centerY / 50)}`;

        currentFrameVehicles.add(vehicleId);

        // Increment current count
        if (prediction.class in currentCounts) {
          currentCounts[prediction.class as keyof VehicleCount]++;
        }

        // Check if this is a new vehicle (not seen in last 2 seconds)
        const tracked = trackedVehiclesRef.current.get(vehicleId);
        if (!tracked || currentTime - tracked.lastSeen > 2000) {
          // New vehicle detected, add to total count
          setTotalVehicleCount((prev) => ({
            ...prev,
            [prediction.class]:
              prev[prediction.class as keyof VehicleCount] + 1,
          }));
        }

        // Update tracking
        trackedVehiclesRef.current.set(vehicleId, {
          class: prediction.class,
          lastSeen: currentTime,
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

      // Clean up old tracked vehicles (not seen in last 5 seconds)
      trackedVehiclesRef.current.forEach((value, key) => {
        if (currentTime - value.lastSeen > 5000) {
          trackedVehiclesRef.current.delete(key);
        }
      });

      setCurrentVehicleCount(currentCounts);

      // Calculate FPS
      const endTime = performance.now();
      const currentFps = 1000 / (endTime - startTime);
      setFps(Math.round(currentFps));
    } catch (err) {
      console.error("Detection error:", err);
    }
  };

  // Load TensorFlow model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true);
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
        setIsLoading(false);
      } catch (err) {
        setError("Gagal memuat model deteksi");
        setIsLoading(false);
        console.error("Error loading model:", err);
      }
    };

    loadModel();
  }, []);

  // Function to load video stream
  const loadVideoStream = () => {
    const trimmedUrl = streamUrl.trim();

    if (!trimmedUrl || trimmedUrl.length === 0) {
      setError("URL stream tidak boleh kosong");
      return;
    }

    // Validasi format URL m3u8
    if (!trimmedUrl.endsWith(".m3u8")) {
      setError("URL harus berformat .m3u8");
      return;
    }

    setIsLoadingVideo(true);
    setError(null);

    // Wait for video element to be ready
    setTimeout(() => {
      const video = videoRef.current;

      if (!video) {
        setError("Video element tidak tersedia");
        setIsLoadingVideo(false);
        return;
      }

      // Destroy existing HLS instance if any
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
        });

        hlsRef.current = hls;

        hls.loadSource(trimmedUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log("Manifest parsed successfully");
          video
            .play()
            .then(() => {
              console.log("Video playing successfully");
              setIsVideoLoaded(true);
              setIsLoadingVideo(false);
              setError(null);
            })
            .catch((err) => {
              console.error("Error playing video:", err);
              setError(`Gagal memutar video: ${err.message}`);
              setIsLoadingVideo(false);
            });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS Error:", data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error("Network error, trying to recover...");
                setError("Error jaringan, mencoba memulihkan...");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error("Media error, trying to recover...");
                setError("Error media, mencoba memulihkan...");
                hls.recoverMediaError();
                break;
              default:
                setError(`Error fatal: ${data.details}`);
                setIsLoadingVideo(false);
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support (Safari)
        video.src = trimmedUrl;

        const handleLoadedMetadata = () => {
          video
            .play()
            .then(() => {
              setIsVideoLoaded(true);
              setIsLoadingVideo(false);
              setError(null);
            })
            .catch((err) => {
              console.error("Error playing video:", err);
              setError(`Gagal memutar video: ${err.message}`);
              setIsLoadingVideo(false);
            });
        };

        const handleError = (e: Event) => {
          console.error("Video error:", e);
          setError("Gagal memuat video stream");
          setIsLoadingVideo(false);
        };

        video.addEventListener("loadedmetadata", handleLoadedMetadata, {
          once: true,
        });
        video.addEventListener("error", handleError, { once: true });
      } else {
        setError("Browser tidak mendukung HLS streaming");
        setIsLoadingVideo(false);
      }
    }, 100); // Delay 100ms untuk memastikan video element sudah ter-render
  };

  // Sync canvas size with video display size
  const syncCanvasSize = () => {
    if (!videoRef.current || !canvasRef.current || !containerRef.current)
      return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Get the actual displayed size of the video
    const rect = video.getBoundingClientRect();

    // Set canvas size to match displayed video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Set canvas display size to match video display size
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  };

  // Sync canvas size when video loads and on window resize
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      syncCanvasSize();
    };

    const handleResize = () => {
      syncCanvasSize();
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    window.addEventListener("resize", handleResize);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Get color for vehicle class
  const getColorForClass = (className: string): string => {
    const colors: { [key: string]: string } = {
      car: "#00FF00",
      truck: "#FF0000",
      bus: "#0000FF",
      motorcycle: "#FFFF00",
      bicycle: "#FF00FF",
    };
    return colors[className] || "#FFFFFF";
  };

  // Start/Stop detection
  const toggleDetection = () => {
    if (isDetecting) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      setIsDetecting(false);

      // Clear canvas when stopping
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
      detectionIntervalRef.current = window.setInterval(detectVehicles, 100);
    }
  };

  const resetTotalCount = () => {
    setTotalVehicleCount({
      car: 0,
      truck: 0,
      bus: 0,
      motorcycle: 0,
      bicycle: 0,
    });
    trackedVehiclesRef.current.clear();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  if (isLoading) {
    return <div className="container my-5"><Skeleton /></div>;
  } else {
    return (
      <div className="container my-5">
        <div className="card mb-3">
          <div className="card-header">
            <div className="d-flex align-items-center justify-content-between">
              <span className="card-lable fs-3">
                Deteksi Kendaraan Real-time
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

            <div className="form-field mb-2">
              <label className="fw-bold">Stream URL:</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-camera-video"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter stream video url for extension m3u8"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  disabled={isLoadingVideo}
                />
                <button
                  className="btn btn-sm btn-outline-primary px-3"
                  onClick={loadVideoStream}
                  disabled={!streamUrl || isLoadingVideo}
                >
                  {isLoadingVideo ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <i className="bi bi-play-circle-fill fs-5"></i>
                  )}
                </button>
              </div>
            </div>

            <div
              ref={containerRef}
              style={{
                position: "relative",
                display: isVideoLoaded ? "block" : "none",
              }}
            >
              <video
                ref={videoRef}
                className="bg-dark"
                style={{ height: 700, width: "100%" }}
                muted
                playsInline
                autoPlay
              />
              <canvas
                ref={canvasRef}
                style={{
                  pointerEvents: "none",
                  objectFit: "contain",
                  height: 700,
                  width: "100%",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              />
            </div>

            {/* Loading indicator */}
            {isLoadingVideo && (
              <div className="text-center py-5 bg-light rounded">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mt-3">Memuat video stream...</p>
              </div>
            )}

            {/* Placeholder when video not loaded */}
            {!isVideoLoaded && !isLoadingVideo && (
              <div className="text-center py-5 bg-light rounded">
                <i className="bi bi-camera-video-off fs-1 text-muted"></i>
                <p className="text-muted mt-3">
                  Masukkan URL stream dan klik tombol play untuk memulai
                </p>
              </div>
            )}
          </div>
          <div className="card-footer">
            <div className="d-flex align-items-center justify-content-start">
              <button
                className="btn btn-primary d-flex align-items-center"
                onClick={toggleDetection}
                disabled={!model || isLoading || !isVideoLoaded}
              >
                <i
                  className={`bi ${isDetecting ? "bi-stop-circle" : "bi-play-circle"} fs-4 me-2`}
                ></i>
                <span>{isDetecting ? "Stop" : "Start"}</span>
                <span className="ms-1">Detection</span>
              </button>
              <button className="btn btn-lg btn-outline-primary ms-2" disabled>
                FPS: {fps}
              </button>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0">
              <i className="bi bi-eye me-2"></i>
              Deteksi Saat Ini (Real-time)
            </h5>
          </div>
          <div className="card-body">
            <h2 className="mb-3">
              🚙 Jumlah Kendaraan Terdeteksi:{" "}
              <span className="badge bg-info">
                {Object.values(currentVehicleCount).reduce((a, b) => a + b, 0)}
              </span>
            </h2>
            <div className="d-flex align-items-center flex-wrap gap-2">
              <StatCard
                label="Mobil"
                count={currentVehicleCount.car}
              />
              <StatCard
                label="Truk"
                count={currentVehicleCount.truck}
              />
              <StatCard
                label="Bus"
                count={currentVehicleCount.bus}
              />
              <StatCard
                label="Motor"
                count={currentVehicleCount.motorcycle}
              />
              <StatCard
                label="Sepeda"
                count={currentVehicleCount.bicycle}
              />
            </div>
          </div>
        </div>

        {/* Total Accumulated Count */}
        <div className="card mb-3">
          <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-bar-chart-fill me-2"></i>
              Total Kendaraan Terakumulasi
            </h5>
            <button
              className="btn btn-sm btn-light"
              onClick={resetTotalCount}
              title="Reset total count"
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Reset
            </button>
          </div>
          <div className="card-body">
            <h2 className="mb-3">
              📊 Total Kendaraan:{" "}
              <span className="badge bg-success">
                {Object.values(totalVehicleCount).reduce((a, b) => a + b, 0)}
              </span>
            </h2>
            <div className="d-flex align-items-center flex-wrap gap-2">
              <StatCard
                label="Mobil"
                count={totalVehicleCount.car}
              />
              <StatCard
                label="Truk"
                count={totalVehicleCount.truck}
              />
              <StatCard
                label="Bus"
                count={totalVehicleCount.bus}
              />
              <StatCard
                label="Motor"
                count={totalVehicleCount.motorcycle}
              />
              <StatCard
                label="Sepeda"
                count={totalVehicleCount.bicycle}
              />
            </div>
            <div className="alert alert-info mt-3 mb-0" role="alert">
              <i className="bi bi-info-circle me-2"></i>
              <small>
                Total ini menghitung semua kendaraan unik yang terdeteksi sejak
                deteksi dimulai. Kendaraan yang sama tidak akan dihitung ulang
                dalam 2 detik.
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Stat Card Component
interface StatCardProps {
  label: string;
  count: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, count }) => {
  return (
    <div className="border rounded text-center me-2">
      <div className="title px-5 py-1 rounded-top fw-bold bg-light">
        {label}
      </div>
      <div className="count">{count}</div>
    </div>
  );
};

// Legend Item Component
interface LegendItemProps {
  color: string;
  label: string;
}

const LegendItem: React.FC<LegendItemProps> = ({ color, label }) => {
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded ${color}`}></div>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
};
