"use client";
import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { Skeleton } from "@/components/ui/loading";
import Hls from "hls.js";
import { Alert } from "@/components/ui/alerts";
import Layout from "../../layout";
import {navigations} from "../navigations";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayer {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
}

// Types
interface VehicleCount {
  car: number;
  truck: number;
  bus: number;
  motorcycle: number;
  bicycle: number;
}

interface Detection {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

// Declare YouTube API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function VehicleDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const youtubePlayerRef = useRef<any>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const trackedVehiclesRef = useRef<
    Map<string, { class: string; lastSeen: number }>
  >(new Map());

  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentVehicleCount, setCurrentVehicleCount] = useState<VehicleCount>({
    car: 0,
    truck: 0,
    bus: 0,
    motorcycle: 0,
    bicycle: 0,
  });
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
  const [streamUrl, setStreamUrl] = useState<string>(
    "https://its.binamarga.pu.go.id:8989/play/hls/CT-09/index.m3u8",
  );
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoSource, setVideoSource] = useState<"stream" | "youtube" | "file">(
    "stream",
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Extract YouTube video ID from URL
  const extractYouTubeId = (url: string): string | null => {
    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };

  // Load YouTube IFrame API
  const loadYouTubeAPI = (): Promise<void> => {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        resolve();
        return;
      }

      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        resolve();
      };
    });
  };

  // Initialize YouTube Player
  const initYouTubePlayer = (videoId: string) => {
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.destroy();
    }

    const playerElement = document.getElementById("youtube-player");
    if (!playerElement) return;

    youtubePlayerRef.current = new window.YT.Player("youtube-player", {
      height: "700",
      width: "100%",
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: (event: any) => {
          console.log("YouTube player ready");
          setIsVideoLoaded(true);
          setIsLoadingVideo(false);
          setError(null);

          // Start capturing frames
          startYouTubeFrameCapture();
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            console.log("YouTube video playing");
          }
        },
        onError: (event: any) => {
          console.error("YouTube player error:", event.data);
          setError(
            "Gagal memuat video YouTube. Pastikan video dapat diputar dan tidak dibatasi.",
          );
          setIsLoadingVideo(false);
        },
      },
    });
  };

  // Start capturing frames from YouTube
  const startYouTubeFrameCapture = () => {
    const iframe = document.querySelector(
      "#youtube-player iframe",
    ) as HTMLIFrameElement;
    if (!iframe || !videoRef.current) return;

    // Create a hidden video element to capture YouTube frames
    const captureCanvas = document.createElement("canvas");
    const captureCtx = captureCanvas.getContext("2d");

    if (!captureCtx) return;

    // Note: Due to CORS restrictions, we cannot directly capture YouTube iframe content
    // This is a limitation of browser security policies
    console.warn("Direct YouTube frame capture is restricted by CORS policy");
    setError(
      "⚠️ Catatan: Deteksi pada video YouTube memiliki keterbatasan karena kebijakan CORS browser. Untuk hasil terbaik, gunakan video file atau live stream.",
    );
  };

  // Load YouTube video
  const loadYouTubeVideo = async () => {
    const videoId = extractYouTubeId(youtubeUrl);

    if (!videoId) {
      setError(
        "URL YouTube tidak valid. Contoh: https://www.youtube.com/watch?v=VIDEO_ID",
      );
      return;
    }

    setIsLoadingVideo(true);
    setError(null);
    setIsVideoLoaded(false);

    try {
      await loadYouTubeAPI();

      // Wait a bit for DOM to be ready
      setTimeout(() => {
        initYouTubePlayer(videoId);
      }, 100);
    } catch (err) {
      console.error("Error loading YouTube video:", err);
      setError("Gagal memuat YouTube API");
      setIsLoadingVideo(false);
    }
  };

  // Load video file
  const loadVideoFile = () => {
    if (!selectedFile || !videoRef.current) {
      setError("Pilih file video terlebih dahulu");
      return;
    }

    setIsLoadingVideo(true);
    setError(null);

    const video = videoRef.current;
    const fileURL = URL.createObjectURL(selectedFile);

    video.src = fileURL;
    video.load();

    video.onloadedmetadata = () => {
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

    video.onerror = () => {
      setError("Gagal memuat file video. Pastikan format video didukung.");
      setIsLoadingVideo(false);
    };
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/quicktime",
      ];
      if (!validTypes.includes(file.type)) {
        setError("Format file tidak didukung. Gunakan MP4, WebM, atau OGG.");
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  // Detect vehicles
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

      const currentCounts: VehicleCount = {
        car: 0,
        truck: 0,
        bus: 0,
        motorcycle: 0,
        bicycle: 0,
      };

      const currentFrameVehicles = new Set<string>();

      vehicleDetections.forEach((prediction: Detection) => {
        const [x, y, width, height] = prediction.bbox;

        const centerX = Math.round(x + width / 2);
        const centerY = Math.round(y + height / 2);
        const vehicleId = `${prediction.class}_${Math.floor(centerX / 50)}_${Math.floor(centerY / 50)}`;

        currentFrameVehicles.add(vehicleId);

        if (prediction.class in currentCounts) {
          currentCounts[prediction.class as keyof VehicleCount]++;
        }

        const tracked = trackedVehiclesRef.current.get(vehicleId);
        if (!tracked || currentTime - tracked.lastSeen > 2000) {
          setTotalVehicleCount((prev) => ({
            ...prev,
            [prediction.class]:
              prev[prediction.class as keyof VehicleCount] + 1,
          }));
        }

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

      // Clean up old tracked vehicles
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
        setError(null);

        console.log("Initializing TensorFlow.js...");

        // Set backend to WebGL for better performance
        await tf.setBackend("webgl");
        await tf.ready();

        console.log("TensorFlow.js backend:", tf.getBackend());
        console.log("Loading COCO-SSD model...");

        const loadedModel = await cocoSsd.load({
          base: "lite_mobilenet_v2", // Gunakan model yang lebih ringan
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

  // Load video stream (HLS)
  const loadVideoStream = () => {
    const trimmedUrl = streamUrl.trim();

    if (!trimmedUrl || trimmedUrl.length === 0) {
      setError("URL stream tidak boleh kosong");
      return;
    }

    if (!trimmedUrl.endsWith(".m3u8")) {
      setError("URL harus berformat .m3u8");
      return;
    }

    setIsLoadingVideo(true);
    setError(null);

    setTimeout(() => {
      const video = videoRef.current;

      if (!video) {
        setError("Video element tidak tersedia");
        setIsLoadingVideo(false);
        return;
      }

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
    }, 100);
  };

  // Sync canvas size with video display size
  const syncCanvasSize = () => {
    if (!videoRef.current || !canvasRef.current || !containerRef.current)
      return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const rect = video.getBoundingClientRect();

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

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

  // Reset total count
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

  // Reset video source
  const resetVideoSource = () => {
    // Stop detection
    if (isDetecting) {
      toggleDetection();
    }

    // Clear video
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
    }

    // Destroy HLS
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Destroy YouTube player
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.destroy();
      youtubePlayerRef.current = null;
    }

    // Reset states
    setIsVideoLoaded(false);
    setStreamUrl("");
    setYoutubeUrl("");
    setSelectedFile(null);
    setError(null);
    resetTotalCount();
    setCurrentVehicleCount({
      car: 0,
      truck: 0,
      bus: 0,
      motorcycle: 0,
      bicycle: 0,
    });
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
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.destroy();
      }
    };
  }, []);

  // StatCard Component
  const StatCard = ({ label, count }: { label: string; count: number }) => (
    <div className="card text-center" style={{ minWidth: "120px" }}>
      <div className="card-body py-2">
        <h6 className="card-subtitle mb-1 text-muted">{label}</h6>
        <h3 className="card-title mb-0">{count}</h3>
      </div>
    </div>
  );

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

              <div className="form-field mb-3">
                <label className="fw-bold mb-2">Video Source:</label>
                <div className="btn-group w-100 mb-3" role="group">
                  <button
                    type="button"
                    className={`btn ${videoSource === "file" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => {
                      setVideoSource("file");
                      resetVideoSource();
                    }}
                  >
                    <i className="bi bi-file-earmark-play me-2"></i>
                    Video File
                  </button>
                  <button
                    type="button"
                    className={`btn ${videoSource === "stream" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => {
                      setVideoSource("stream");
                      resetVideoSource();
                    }}
                  >
                    <i className="bi bi-broadcast me-2"></i>
                    Live Stream (M3U8)
                  </button>
                  <button
                    type="button"
                    className={`btn d-none ${videoSource === "youtube" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => {
                      setVideoSource("youtube");
                      resetVideoSource();
                    }}
                  >
                    <i className="bi bi-youtube me-2"></i>
                    YouTube Video
                  </button>
                </div>

                {videoSource === "stream" && (
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
                )}

                {videoSource === "youtube" && (
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-youtube"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      disabled={isLoadingVideo}
                    />
                    <button
                      className="btn btn-sm btn-outline-primary px-3"
                      onClick={loadYouTubeVideo}
                      disabled={!youtubeUrl || isLoadingVideo}
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
                )}

                {videoSource === "file" && (
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-file-earmark-play"></i>
                    </span>
                    <input
                      type="file"
                      className="form-control"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      onChange={handleFileChange}
                      disabled={isLoadingVideo}
                    />
                    <button
                      className="btn btn-sm btn-outline-primary px-3"
                      onClick={loadVideoFile}
                      disabled={!selectedFile || isLoadingVideo}
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
                )}
              </div>

              <div
                ref={containerRef}
                style={{
                  position: "relative",
                  display:
                    isVideoLoaded && videoSource !== "youtube"
                      ? "block"
                      : "none",
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

              {/* YouTube Player Container */}
              {videoSource === "youtube" && (
                <div
                  style={{
                    display: isVideoLoaded ? "block" : "none",
                    position: "relative",
                  }}
                >
                  <div id="youtube-player"></div>
                </div>
              )}

              {/* Loading indicator */}
              {isLoadingVideo && (
                <div className="text-center py-5 bg-light rounded">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted mt-3">Memuat video...</p>
                </div>
              )}

              {/* Placeholder when video not loaded */}
              {!isVideoLoaded && !isLoadingVideo && (
                <div className="text-center py-5 bg-light rounded">
                  <i className="bi bi-camera-video-off fs-1 text-muted"></i>
                  <p className="text-muted mt-3">
                    {videoSource === "stream" &&
                      "Masukkan URL stream M3U8 dan klik tombol play untuk memulai"}
                    {videoSource === "youtube" &&
                      "Masukkan URL YouTube dan klik tombol play untuk memulai"}
                    {videoSource === "file" &&
                      "Pilih file video dan klik tombol play untuk memulai"}
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
                <button
                  className="btn btn-lg btn-outline-primary ms-2"
                  disabled
                >
                  FPS: {fps}
                </button>
              </div>
            </div>
          </div>

          {/* Current Detection Card */}
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
                  {Object.values(currentVehicleCount).reduce(
                    (a, b) => a + b,
                    0,
                  )}
                </span>
              </h2>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <StatCard label="Mobil" count={currentVehicleCount.car} />
                <StatCard label="Truk" count={currentVehicleCount.truck} />
                <StatCard label="Bus" count={currentVehicleCount.bus} />
                <StatCard
                  label="Motor"
                  count={currentVehicleCount.motorcycle}
                />
                <StatCard label="Sepeda" count={currentVehicleCount.bicycle} />
              </div>
            </div>
          </div>

          {/* Total Accumulated Count Card */}
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
                <StatCard label="Mobil" count={totalVehicleCount.car} />
                <StatCard label="Truk" count={totalVehicleCount.truck} />
                <StatCard label="Bus" count={totalVehicleCount.bus} />
                <StatCard label="Motor" count={totalVehicleCount.motorcycle} />
                <StatCard label="Sepeda" count={totalVehicleCount.bicycle} />
              </div>
              <div className="alert alert-info mt-3 mb-0" role="alert">
                <i className="bi bi-info-circle me-2"></i>
                <small>
                  Total ini menghitung semua kendaraan unik yang terdeteksi
                  sejak deteksi dimulai. Kendaraan yang sama tidak akan dihitung
                  ulang dalam 2 detik.
                </small>
              </div>
            </div>
          </div>

          {/* Legend Card */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-palette me-2"></i>
                Legenda Warna
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center">
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      backgroundColor: "#00FF00",
                      border: "2px solid #000",
                      marginRight: "10px",
                    }}
                  ></div>
                  <span>Mobil</span>
                </div>
                <div className="d-flex align-items-center">
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      backgroundColor: "#FF0000",
                      border: "2px solid #000",
                      marginRight: "10px",
                    }}
                  ></div>
                  <span>Truk</span>
                </div>
                <div className="d-flex align-items-center">
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      backgroundColor: "#0000FF",
                      border: "2px solid #000",
                      marginRight: "10px",
                    }}
                  ></div>
                  <span>Bus</span>
                </div>
                <div className="d-flex align-items-center">
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      backgroundColor: "#FFFF00",
                      border: "2px solid #000",
                      marginRight: "10px",
                    }}
                  ></div>
                  <span>Motor</span>
                </div>
                <div className="d-flex align-items-center">
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      backgroundColor: "#FF00FF",
                      border: "2px solid #000",
                      marginRight: "10px",
                    }}
                  ></div>
                  <span>Sepeda</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
