"use client";

import React, { useState, useRef, useEffect } from "react";
import Layout from "../layout";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import { Alert } from "@/components/ui/alerts";
import { Skeleton } from "@/components/ui/loading";

interface Detection {
  bbox: [number, number, number, number]; // [x, y, width, height]
  class: string;
  score: number;
}

interface DetectionResult {
  detections: Detection[];
  imageUrl: string;
  processingTime: number;
  totalObjects: number;
}

interface ObjectCount {
  [key: string]: number;
}

export default function CocoSsdImageDetection() {
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [results, setResults] = useState<DetectionResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [objectCounts, setObjectCounts] = useState<ObjectCount>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load COCO-SSD Model
  useEffect(() => {
    loadModel();
  }, []);

  const loadModel = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Loading TensorFlow.js...");
      await tf.ready();
      console.log("Loading COCO-SSD model...");
      const loadedModel = await cocoSsd.load({
        base: "mobilenet_v2", // atau 'lite_mobilenet_v2' untuk performa lebih cepat
      });
      setModel(loadedModel);
      setIsLoading(false);
      console.log("Model loaded successfully");
    } catch (err) {
      console.error("Error loading model:", err);
      setError(
        `Gagal memuat model: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      setIsLoading(false);
    }
  };
  const [imageLoaded, setImageLoaded] = useState(false);

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageLoaded(false); // Reset state
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setSelectedImage(imageUrl);
        setResults(null);
        setObjectCounts({});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageLoad = () => {
    console.log("Image loaded successfully");
    setImageLoaded(true);
  };

  // Process Image File
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar (JPG, PNG, dll)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setSelectedImage(imageUrl);
      setResults(null);
      setError(null);
      setObjectCounts({});
    };
    reader.readAsDataURL(file);
  };

  // Handle Drag and Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Count objects by class
  const countObjects = (detections: Detection[]): ObjectCount => {
    const counts: ObjectCount = {};
    detections.forEach((detection) => {
      const className = detection.class;
      counts[className] = (counts[className] || 0) + 1;
    });
    return counts;
  };

  // Get color for object class
  const getColorForClass = (className: string): string => {
    const colors: { [key: string]: string } = {
      person: "#FF6B6B",
      car: "#4ECDC4",
      truck: "#45B7D1",
      bus: "#96CEB4",
      motorcycle: "#FFEAA7",
      bicycle: "#DFE6E9",
      dog: "#FD79A8",
      cat: "#FDCB6E",
      bird: "#6C5CE7",
      // ... tambahkan warna untuk class lainnya
    };
    return colors[className] || "#00D2D3";
  };

  // Detect objects from image
  const detectObjects = async () => {
    if (!model) {
      setError("Model belum dimuat. Silakan tunggu...");
      return;
    }

    if (!imageRef.current) {
      setError("Referensi gambar tidak ditemukan");
      return;
    }

    if (!canvasRef.current) {
      setError("Canvas tidak ditemukan");
      return;
    }

    if (!imageLoaded) {
      setError("Gambar masih dalam proses loading. Silakan tunggu...");
      return;
    }

    if (
      imageRef.current.naturalWidth === 0 ||
      imageRef.current.naturalHeight === 0
    ) {
      setError("Gambar belum sepenuhnya dimuat. Silakan coba lagi.");
      return;
    }

    try {
      setIsDetecting(true);
      setError(null);

      const image = imageRef.current;
      const canvas = canvasRef.current;

      // ✅ PENTING: Set ukuran canvas SEBELUM melakukan apa pun
      //   const naturalWidth = image.naturalWidth;
      //   const naturalHeight = image.naturalHeight;

      //   canvas.width = naturalWidth;
      //   canvas.height = naturalHeight;

      const displayWidth = image.clientWidth;
      const displayHeight = image.clientHeight;

      canvas.width = displayWidth;
      canvas.height = displayHeight;

      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      // ✅ Tunggu sebentar agar canvas benar-benar siap (force reflow)
      await new Promise((resolve) => setTimeout(resolve, 50));

      console.log("Starting detection...", {
        imageWidth: displayWidth,
        imageHeight: displayHeight,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        modelLoaded: !!model,
      });

      const startTime = performance.now();
      const predictions = await model.detect(image);
      const endTime = performance.now();

      console.log("Detection complete:", predictions);

      const detections: Detection[] = predictions.map((pred) => ({
        bbox: pred.bbox,
        class: pred.class,
        score: pred.score,
      }));

      // Draw image and detections on canvas
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // ✅ Clear canvas dengan ukuran yang tepat
        ctx.clearRect(0, 0, displayWidth, displayHeight);

        // ✅ Draw image dengan ukuran natural
        ctx.drawImage(image, 0, 0, displayWidth, displayHeight);

        // Draw detections
        detections.forEach((detection) => {
          const [x, y, width, height] = detection.bbox;

          // Draw bounding box with glow effect
          ctx.shadowColor = getColorForClass(detection.class);
          ctx.shadowBlur = 15;
          ctx.strokeStyle = getColorForClass(detection.class);
          ctx.lineWidth = Math.max(3, displayWidth / 400);
          ctx.strokeRect(x, y, width, height);

          // Reset shadow for text
          ctx.shadowBlur = 0;

          // Draw label background
          const label = `${detection.class} ${Math.round(detection.score * 100)}%`;
          const fontSize = Math.max(16, displayWidth / 50);
          ctx.font = `bold ${fontSize}px Arial`;
          const textWidth = ctx.measureText(label).width;
          const labelHeight = fontSize * 1.8;

          ctx.fillStyle = getColorForClass(detection.class);
          ctx.fillRect(x, y - labelHeight, textWidth + 10, labelHeight);

          // Draw label text
          ctx.fillStyle = "white";
          ctx.fillText(label, x + 5, y - fontSize / 3);

          // Draw corner markers
          const cornerSize = Math.max(15, displayWidth / 80);
          ctx.lineWidth = Math.max(4, displayWidth / 300);

          // Top-left
          ctx.beginPath();
          ctx.moveTo(x, y + cornerSize);
          ctx.lineTo(x, y);
          ctx.lineTo(x + cornerSize, y);
          ctx.stroke();

          // Top-right
          ctx.beginPath();
          ctx.moveTo(x + width - cornerSize, y);
          ctx.lineTo(x + width, y);
          ctx.lineTo(x + width, y + cornerSize);
          ctx.stroke();

          // Bottom-left
          ctx.beginPath();
          ctx.moveTo(x, y + height - cornerSize);
          ctx.lineTo(x, y + height);
          ctx.lineTo(x + cornerSize, y + height);
          ctx.stroke();

          // Bottom-right
          ctx.beginPath();
          ctx.moveTo(x + width - cornerSize, y + height);
          ctx.lineTo(x + width, y + height);
          ctx.lineTo(x + width, y + height - cornerSize);
          ctx.stroke();
        });
      }

      // Count objects
      const counts = countObjects(detections);
      setObjectCounts(counts);

      setResults({
        detections,
        imageUrl: selectedImage || "",
        processingTime: endTime - startTime,
        totalObjects: detections.length,
      });

      setIsDetecting(false);
    } catch (err) {
      console.error("Error detecting objects:", err);
      setError(
        `Gagal mendeteksi objek: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      setIsDetecting(false);
    }
  };

  // Reset
  const handleReset = () => {
    setSelectedImage(null);
    setResults(null);
    setError(null);
    setObjectCounts({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  if (isLoading) {
    return (
      <Layout navigations={[]}>
        <div className="container my-5">
          <Skeleton />
          <div className="text-center mt-3">
            <p className="text-muted">Memuat model COCO-SSD...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout navigations={[]}>
      <div className="container my-4">
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <h3 className="mb-0">
              <i className="bi bi-bounding-box me-2"></i>
              Object Detection - COCO-SSD
            </h3>
            <p className="mb-0 small">
              Deteksi objek menggunakan COCO-SSD (80 kategori objek)
            </p>
          </div>

          <div className="card-body">
            {error && <Alert message={error} variant="danger" />}

            {/* Upload Options */}
            {!selectedImage && (
              <div className="row mb-4">
                <div className="col-md-6 mb-3">
                  <div
                    className={`border rounded p-4 text-center ${
                      dragActive
                        ? "border-primary bg-light"
                        : "border-secondary"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    style={{ cursor: "pointer", minHeight: "200px" }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="bi bi-cloud-upload fs-1 text-primary"></i>
                    <h5 className="mt-3">Upload Gambar</h5>
                    <p className="text-muted">
                      Klik atau drag & drop gambar di sini
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="d-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Selected Image Preview */}
            {selectedImage && (
              <div className="mb-4">
                <div className="card">
                  <div className="card-header bg-info text-white">
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="mb-0">
                        <i className="bi bi-image me-2"></i>
                        Gambar yang Dipilih
                      </h5>
                      <div className="">
                        <button
                          className="btn btn-primary me-2"
                          onClick={detectObjects}
                          disabled={isDetecting || !imageLoaded}
                        >
                          {isDetecting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Mendeteksi...
                            </>
                          ) : !imageLoaded ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Loading gambar...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-play-circle me-2"></i>
                              Deteksi Objek
                            </>
                          )}
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={handleReset}
                          disabled={isDetecting}
                        >
                          <i className="bi bi-arrow-clockwise me-2"></i>
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="position-relative d-inline-block">
                      {/* ✅ Gambar selalu ditampilkan, tapi disembunyikan jika ada results */}
                      <img
                        ref={imageRef}
                        src={selectedImage}
                        alt="Selected"
                        className="img-fluid rounded"
                        style={{
                          maxHeight: "500px",
                          display: results ? "none" : "block",
                        }}
                        crossOrigin="anonymous"
                        onLoad={handleImageLoad}
                        onError={() => {
                          setError("Gagal memuat gambar");
                          setImageLoaded(false);
                        }}
                      />

                      {!imageLoaded && !results && (
                        <div className="position-absolute top-50 start-50 translate-middle">
                          <div
                            className="spinner-border text-primary"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      )}

                      {/* ✅ Canvas SELALU di-render (tidak conditional), tapi disembunyikan jika belum ada results */}
                      <canvas
                        ref={canvasRef}
                        className="img-fluid rounded"
                        style={{
                          maxHeight: "500px",
                          display: results ? "block" : "none", // ✅ Sembunyikan jika belum ada results
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detection Results */}
            {results && (
              <div className="row">
                {/* Summary Card */}
                <div className="col-md-4 mb-3">
                  <div className="card border-success h-100">
                    <div className="card-header bg-success text-white">
                      <h5 className="mb-0">
                        <i className="bi bi-graph-up me-2"></i>
                        Ringkasan Deteksi
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <h6 className="text-muted">Total Objek Terdeteksi</h6>
                        <h2 className="text-success mb-0">
                          {results.totalObjects}
                        </h2>
                      </div>
                      <div className="mb-3">
                        <h6 className="text-muted">Waktu Proses</h6>
                        <h4 className="mb-0">
                          {results.processingTime.toFixed(2)} ms
                        </h4>
                      </div>
                      <div>
                        <h6 className="text-muted">Kategori Terdeteksi</h6>
                        <h4 className="mb-0">
                          {Object.keys(objectCounts).length}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Object Counts */}
                <div className="col-md-8 mb-3">
                  <div className="card border-primary h-100">
                    <div className="card-header bg-primary text-white">
                      <h5 className="mb-0">
                        <i className="bi bi-bar-chart-fill me-2"></i>
                        Jumlah Objek per Kategori
                      </h5>
                    </div>
                    <div className="card-body">
                      {Object.keys(objectCounts).length > 0 ? (
                        <div className="row g-2">
                          {Object.entries(objectCounts)
                            .sort((a, b) => b[1] - a[1])
                            .map(([className, count]) => (
                              <div key={className} className="col-md-6">
                                <div
                                  className="d-flex align-items-center justify-content-between p-3 rounded"
                                  style={{
                                    backgroundColor: `${getColorForClass(className)}20`,
                                    border: `2px solid ${getColorForClass(className)}`,
                                  }}
                                >
                                  <div className="d-flex align-items-center">
                                    <div
                                      className="rounded-circle me-3"
                                      style={{
                                        width: "40px",
                                        height: "40px",
                                        backgroundColor:
                                          getColorForClass(className),
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "white",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {count}
                                    </div>
                                    <div>
                                      <h6 className="mb-0 text-capitalize">
                                        {className}
                                      </h6>
                                      <small className="text-muted">
                                        {(
                                          (count / results.totalObjects) *
                                          100
                                        ).toFixed(1)}
                                        %
                                      </small>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-muted text-center">
                          Tidak ada objek terdeteksi
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detailed Detection List */}
                <div className="col-12">
                  <div className="card border-info">
                    <div className="card-header bg-info text-white">
                      <h5 className="mb-0">
                        <i className="bi bi-list-ul me-2"></i>
                        Detail Deteksi Objek
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Objek</th>
                              <th>Confidence</th>
                              <th>Posisi (X, Y)</th>
                              <th>Ukuran (W × H)</th>
                              <th>Progress</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.detections
                              .sort((a, b) => b.score - a.score)
                              .map((detection, index) => {
                                const [x, y, width, height] = detection.bbox;
                                const confidence = (
                                  detection.score * 100
                                ).toFixed(1);
                                return (
                                  <tr key={index}>
                                    <td>
                                      <span
                                        className="badge"
                                        style={{
                                          backgroundColor: getColorForClass(
                                            detection.class,
                                          ),
                                        }}
                                      >
                                        {index + 1}
                                      </span>
                                    </td>
                                    <td>
                                      <strong className="text-capitalize">
                                        {detection.class}
                                      </strong>
                                    </td>
                                    <td>
                                      <span
                                        className={`badge ${
                                          detection.score > 0.8
                                            ? "bg-success"
                                            : detection.score > 0.6
                                              ? "bg-warning"
                                              : "bg-secondary"
                                        }`}
                                      >
                                        {confidence}%
                                      </span>
                                    </td>
                                    <td>
                                      <code>
                                        ({Math.round(x)}, {Math.round(y)})
                                      </code>
                                    </td>
                                    <td>
                                      <code>
                                        {Math.round(width)} ×{" "}
                                        {Math.round(height)}
                                      </code>
                                    </td>
                                    <td style={{ width: "200px" }}>
                                      <div
                                        className="progress"
                                        style={{ height: "20px" }}
                                      >
                                        <div
                                          className={`progress-bar ${
                                            detection.score > 0.8
                                              ? "bg-success"
                                              : detection.score > 0.6
                                                ? "bg-warning"
                                                : "bg-secondary"
                                          }`}
                                          role="progressbar"
                                          style={{ width: `${confidence}%` }}
                                          aria-valuenow={parseFloat(confidence)}
                                          aria-valuemin={0}
                                          aria-valuemax={100}
                                        >
                                          {confidence}%
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Info Card */}
            <div className="card bg-light mt-4">
              <div className="card-body">
                <h6 className="card-title">
                  <i className="bi bi-info-circle me-2"></i>
                  Informasi Model COCO-SSD
                </h6>
                <ul className="mb-0">
                  <li>Model dapat mendeteksi 80 kategori objek berbeda</li>
                  <li>
                    Kategori meliputi: person, car, truck, bus, motorcycle,
                    bicycle, dog, cat, bird, dan lainnya
                  </li>
                  <li>
                    Confidence score menunjukkan tingkat keyakinan deteksi
                    (0-100%)
                  </li>
                  <li>
                    Bounding box menunjukkan lokasi dan ukuran objek dalam
                    gambar
                  </li>
                  <li>
                    Warna berbeda untuk setiap kategori objek memudahkan
                    identifikasi
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
