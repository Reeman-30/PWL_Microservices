"use client";

import React, { useState, useRef, useEffect } from "react";
import Layout from "./layout";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as tf from "@tensorflow/tfjs";
import { Alert } from "@/components/ui/alerts";
import { Skeleton } from "@/components/ui/loading";

interface Prediction {
  className: string;
  probability: number;
}

interface ClassificationResult {
  predictions: Prediction[];
  imageUrl: string;
  processingTime: number;
}

export default function ImageClassificationMobileNet() {
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClassifying, setIsClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [results, setResults] = useState<ClassificationResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [useWebcam, setUseWebcam] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load MobileNet Model
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
      console.log("Loading TensorFlow.js...");
      await tf.ready();
      console.log("Loading MobileNet model...");
      const loadedModel = await mobilenet.load({
        version: 2,
        alpha: 1.0,
      });
      setModel(loadedModel);
      setIsLoading(false);
      console.log("Model loaded successfully");
    } catch (err) {
      console.error("Error loading model:", err);
      setError(
        `Gagal memuat model: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      setIsLoading(false);
    }
  };

  // Handle File Upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
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
      setUseWebcam(false);
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

  // Classify Image
  const classifyImage = async () => {
    if (!model || !imageRef.current) {
      setError("Model atau gambar belum siap");
      return;
    }

    try {
      setIsClassifying(true);
      setError(null);

      const startTime = performance.now();
      const predictions = await model.classify(imageRef.current, 5);
      const endTime = performance.now();

      const formattedPredictions: Prediction[] = predictions.map((pred) => ({
        className: pred.className,
        probability: pred.probability,
      }));

      setResults({
        predictions: formattedPredictions,
        imageUrl: selectedImage!,
        processingTime: endTime - startTime,
      });

      setIsClassifying(false);
    } catch (err) {
      console.error("Error classifying image:", err);
      setError(
        `Gagal mengklasifikasi gambar: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      setIsClassifying(false);
    }
  };

  // Webcam Functions
  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraOn(true);
        setUseWebcam(true);
        setSelectedImage(null);
        setResults(null);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setUseWebcam(false);
  };

  const captureFromWebcam = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageUrl = canvas.toDataURL("image/jpeg");
      setSelectedImage(imageUrl);
      setResults(null);
      stopCamera();
    }
  };

  const classifyFromWebcam = async () => {
    if (!model || !videoRef.current) {
      setError("Model atau kamera belum siap");
      return;
    }

    try {
      setIsClassifying(true);
      setError(null);

      const startTime = performance.now();
      const predictions = await model.classify(videoRef.current, 5);
      const endTime = performance.now();

      const formattedPredictions: Prediction[] = predictions.map((pred) => ({
        className: pred.className,
        probability: pred.probability,
      }));

      setResults({
        predictions: formattedPredictions,
        imageUrl: "",
        processingTime: endTime - startTime,
      });

      setIsClassifying(false);
    } catch (err) {
      console.error("Error classifying from webcam:", err);
      setError(
        `Gagal mengklasifikasi dari webcam: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      setIsClassifying(false);
    }
  };

  // Reset
  const handleReset = () => {
    setSelectedImage(null);
    setResults(null);
    setError(null);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container my-5">
          <Skeleton />
          <div className="text-center mt-3">
            <p className="text-muted">Memuat model MobileNet...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container my-4">
        <div className="card shadow-sm">
          <div className="card-header bg-info text-white">
            <h3 className="mb-0">
              <i className="bi bi-image me-2"></i>
              Image Classification
            </h3>
            <p className="mb-0 small">
              Klasifikasi gambar menggunakan MobileNet v2
            </p>
          </div>

          <div className="card-body">
            {error && <Alert message={error} variant="danger" />}

            {/* Upload Options */}
            <div className="row mb-4">
              <div className="col-md-6 mb-3">
                <div
                  className={`border rounded p-4 text-center ${
                    dragActive ? "border-primary bg-light" : "border-secondary"
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

              <div className="col-md-6 mb-3">
                <div
                  className="border border-secondary rounded p-4 text-center"
                  style={{ minHeight: "200px" }}
                >
                  <i className="bi bi-camera-video fs-1 text-success"></i>
                  <h5 className="mt-3">Gunakan Webcam</h5>
                  <p className="text-muted">
                    Klasifikasi langsung dari kamera
                  </p>
                  {!isCameraOn ? (
                    <button
                      className="btn btn-success"
                      onClick={startCamera}
                      disabled={isClassifying}
                    >
                      <i className="bi bi-camera me-2"></i>
                      Aktifkan Kamera
                    </button>
                  ) : (
                    <button
                      className="btn btn-danger"
                      onClick={stopCamera}
                    >
                      <i className="bi bi-camera-video-off me-2"></i>
                      Matikan Kamera
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Webcam View */}
            {useWebcam && isCameraOn && (
              <div className="mb-4">
                <div className="card">
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-camera-video me-2"></i>
                      Live Camera
                    </h5>
                  </div>
                  <div className="card-body text-center">
                    <video
                      ref={videoRef}
                      className="img-fluid rounded"
                      style={{ maxHeight: "400px" }}
                    />
                    <div className="mt-3">
                      <button
                        className="btn btn-primary me-2"
                        onClick={classifyFromWebcam}
                        disabled={isClassifying}
                      >
                        {isClassifying ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Mengklasifikasi...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-play-circle me-2"></i>
                            Klasifikasi Sekarang
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={captureFromWebcam}
                        disabled={isClassifying}
                      >
                        <i className="bi bi-camera me-2"></i>
                        Capture & Klasifikasi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Image Preview */}
            {selectedImage && !useWebcam && (
              <div className="mb-4">
                <div className="card">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-image me-2"></i>
                      Gambar yang Dipilih
                    </h5>
                  </div>
                  <div className="card-body text-center">
                    <img
                      ref={imageRef}
                      src={selectedImage}
                      alt="Selected"
                      className="img-fluid rounded"
                      style={{ maxHeight: "400px" }}
                      crossOrigin="anonymous"
                    />
                    <div className="mt-3">
                      <button
                        className="btn btn-primary me-2"
                        onClick={classifyImage}
                        disabled={isClassifying}
                      >
                        {isClassifying ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Mengklasifikasi...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-play-circle me-2"></i>
                            Klasifikasi Gambar
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={handleReset}
                        disabled={isClassifying}
                      >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Classification Results */}
            {results && (
              <div className="card border-success">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-check-circle me-2"></i>
                    Hasil Klasifikasi
                  </h5>
                  <small>
                    Waktu Proses: {results.processingTime.toFixed(2)} ms
                  </small>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Klasifikasi</th>
                          <th>Confidence</th>
                          <th>Persentase</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.predictions.map((pred, index) => (
                          <tr key={index}>
                            <td>
                              <span
                                className={`badge ${
                                  index === 0
                                    ? "bg-success"
                                    : index === 1
                                      ? "bg-primary"
                                      : "bg-secondary"
                                }`}
                              >
                                #{index + 1}
                              </span>
                            </td>
                            <td>
                              <strong>{pred.className}</strong>
                            </td>
                            <td>
                              <div className="progress" style={{ height: "25px" }}>
                                <div
                                  className={`progress-bar ${
                                    index === 0
                                      ? "bg-success"
                                      : index === 1
                                        ? "bg-primary"
                                        : "bg-secondary"
                                  }`}
                                  role="progressbar"
                                  style={{
                                    width: `${pred.probability * 100}%`,
                                  }}
                                  aria-valuenow={pred.probability * 100}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                >
                                  {(pred.probability * 100).toFixed(2)}%
                                </div>
                              </div>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  pred.probability > 0.8
                                    ? "bg-success"
                                    : pred.probability > 0.5
                                      ? "bg-warning"
                                      : "bg-secondary"
                                }`}
                              >
                                {(pred.probability * 100).toFixed(2)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Top Prediction Highlight */}
                  <div className="alert alert-success mt-3">
                    <h5 className="alert-heading">
                      <i className="bi bi-trophy me-2"></i>
                      Prediksi Terbaik
                    </h5>
                    <hr />
                    <p className="mb-0">
                      <strong className="fs-4">
                        {results.predictions[0].className}
                      </strong>
                      <br />
                      <span className="text-muted">
                        Confidence:{" "}
                        {(results.predictions[0].probability * 100).toFixed(2)}%
                      </span>
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2 mt-3">
                    <button
                      className="btn btn-primary"
                      onClick={useWebcam ? classifyFromWebcam : classifyImage}
                      disabled={isClassifying}
                    >
                      <i className="bi bi-arrow-repeat me-2"></i>
                      Klasifikasi Ulang
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={handleReset}
                    >
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Gambar Baru
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            {!selectedImage && !useWebcam && (
              <div className="card bg-light mt-4">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-info-circle me-2"></i>
                    Cara Penggunaan
                  </h5>
                  <ol className="mb-0">
                    <li>
                      <strong>Upload Gambar:</strong> Klik area upload atau drag
                      & drop gambar (JPG, PNG, dll)
                    </li>
                    <li>
                      <strong>Gunakan Webcam:</strong> Aktifkan kamera untuk
                      klasifikasi real-time
                    </li>
                    <li>
                      <strong>Klasifikasi:</strong> Klik tombol "Klasifikasi
                      Gambar" untuk melihat hasil
                    </li>
                    <li>
                      <strong>Hasil:</strong> Sistem akan menampilkan top 5
                      prediksi dengan confidence score
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* Model Info */}
            <div className="card bg-info bg-opacity-10 mt-4">
              <div className="card-body">
                <h5 className="card-title">
                  <i className="bi bi-cpu me-2"></i>
                  Informasi Model
                </h5>
                <div className="row">
                  <div className="col-md-6">
                    <ul className="list-unstyled mb-0">
                      <li>
                        <strong>Model:</strong> MobileNet v2
                      </li>
                      <li>
                        <strong>Alpha:</strong> 1.0
                      </li>
                      <li>
                        <strong>Input Size:</strong> 224x224
                      </li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <ul className="list-unstyled mb-0">
                      <li>
                        <strong>Classes:</strong> 1000+ kategori
                      </li>
                      <li>
                        <strong>Framework:</strong> TensorFlow.js
                      </li>
                      <li>
                        <strong>Backend:</strong> WebGL
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Examples */}
            <div className="card mt-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-lightbulb me-2"></i>
                  Contoh Objek yang Dapat Diklasifikasi
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <h6 className="text-primary">
                      <i className="bi bi-box me-2"></i>
                      Objek Umum
                    </h6>
                    <ul className="small">
                      <li>Laptop, Mouse, Keyboard</li>
                      <li>Handphone, Tablet</li>
                      <li>Buku, Pena, Pensil</li>
                      <li>Botol, Gelas, Cangkir</li>
                    </ul>
                  </div>
                  <div className="col-md-4 mb-3">
                    <h6 className="text-success">
                      <i className="bi bi-tree me-2"></i>
                      Hewan & Tumbuhan
                    </h6>
                    <ul className="small">
                      <li>Kucing, Anjing, Burung</li>
                      <li>Bunga, Pohon, Tanaman</li>
                      <li>Ikan, Serangga</li>
                      <li>Buah-buahan, Sayuran</li>
                    </ul>
                  </div>
                  <div className="col-md-4 mb-3">
                    <h6 className="text-warning">
                      <i className="bi bi-car-front me-2"></i>
                      Kendaraan & Lainnya
                    </h6>
                    <ul className="small">
                      <li>Mobil, Motor, Sepeda</li>
                      <li>Pesawat, Kapal</li>
                      <li>Furniture, Peralatan</li>
                      <li>Makanan, Minuman</li>
                    </ul>
                  </div>
                </div>
                <div className="alert alert-info mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Tips:</strong> Untuk hasil terbaik, gunakan gambar
                  dengan objek yang jelas, pencahayaan baik, dan fokus pada satu
                  objek utama.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}