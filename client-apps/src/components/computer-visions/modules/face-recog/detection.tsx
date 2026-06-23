"use client";
import React, { useRef, useState, useEffect } from "react";
import Temp from "./temp";
import * as blazeface from "@tensorflow-models/blazeface";
import { Tensor1D } from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";

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

export default function FaceDetect() {
  const [model, setModel] = useState<blazeface.BlazeFaceModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detections, setDetections] = useState<Prediction[]>([]);
  const [croppedFaces, setCroppedFaces] = useState<CroppedFace[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadModel();
  }, []);

  // Handle window resize untuk update canvas
  useEffect(() => {
    const handleResize = () => {
      if (detections.length > 0 && imageRef.current) {
        // Redraw dengan ukuran baru
        setTimeout(() => {
          if (imageRef.current) {
            drawDetections(detections, imageRef.current);
          }
        }, 100);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [detections]);

  const loadModel = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const loadedModel = await blazeface.load();

      setModel(loadedModel);
      setIsLoading(false);
      console.log("BlazeFace model loaded successfully");
    } catch (error) {
      console.error("Error loading model:", error);
      setError("Gagal memuat model. Silakan refresh halaman.");
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setDetections([]);
        setCroppedFaces([]);
        setError(null);
        setImageDimensions({ width: 0, height: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const detectFaces = async () => {
    if (!model || !selectedImage) return;

    try {
      setIsDetecting(true);
      setError(null);

      // Buat HTMLImageElement baru yang tidak di-render ke DOM
      const img = new Image();
      img.src = selectedImage;
      await new Promise((resolve) => (img.onload = resolve));

      // Simpan dimensi natural
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });

      // Deteksi pada image asli (natural size)
      const rawPredictions = await model.estimateFaces(img, false);
      const predictions = normalizedFacesToPredictions(rawPredictions);
      setDetections(predictions);

      drawDetections(predictions, img);
      cropFaces(img, predictions);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat mendeteksi wajah");
    } finally {
      setIsDetecting(false);
    }
  };

  const drawDetections = (predictions: Prediction[], img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    // Tentukan ukuran canvas output (sama seperti display gambar asli)
    const MAX_HEIGHT = 500;
    const containerWidth = canvas.parentElement?.clientWidth ?? naturalWidth;

    let drawWidth = containerWidth;
    let drawHeight = (naturalHeight / naturalWidth) * drawWidth;

    if (drawHeight > MAX_HEIGHT) {
      drawHeight = MAX_HEIGHT;
      drawWidth = (naturalWidth / naturalHeight) * drawHeight;
    }

    // Set canvas size
    canvas.width = drawWidth;
    canvas.height = drawHeight;

    // Hitung skala dari natural -> display
    const scaleX = drawWidth / naturalWidth;
    const scaleY = drawHeight / naturalHeight;

    // Gambar image ke canvas
    ctx.drawImage(img, 0, 0, drawWidth, drawHeight);

    predictions.forEach((prediction: Prediction, index: number) => {
      const [x1, y1] = prediction.topLeft;
      const [x2, y2] = prediction.bottomRight;

      const sx = x1 * scaleX;
      const sy = y1 * scaleY;
      const sw = (x2 - x1) * scaleX;
      const sh = (y2 - y1) * scaleY;

      // Bounding box
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = Math.max(2, drawWidth / 300);
      ctx.strokeRect(sx, sy, sw, sh);

      // Landmarks
      if (prediction.landmarks) {
        prediction.landmarks.forEach((lm) => {
          ctx.beginPath();
          ctx.arc(lm[0] * scaleX, lm[1] * scaleY, 3, 0, 2 * Math.PI);
          ctx.fillStyle = "#ff0000";
          ctx.fill();
        });
      }

      // Label confidence
      if (prediction.probability?.length > 0) {
        const score = (prediction.probability[0] * 100).toFixed(1);
        ctx.fillStyle = "rgba(0,255,0,0.85)";
        ctx.fillRect(sx, sy - 26, 68, 22);
        ctx.fillStyle = "#000";
        ctx.font = `bold ${Math.max(12, drawWidth / 40)}px Arial`;
        ctx.fillText(`${score}%`, sx + 5, sy - 9);
      }
    });
  };

  const cropFaces = (img: HTMLImageElement, predictions: Prediction[]) => {
    const croppedFacesData: CroppedFace[] = [];

    predictions.forEach((prediction, index) => {
      const [x1, y1] = prediction.topLeft;
      const [x2, y2] = prediction.bottomRight;

      // Tambahkan padding untuk crop yang lebih baik
      const padding = 20;
      const cropX = Math.max(0, x1 - padding);
      const cropY = Math.max(0, y1 - padding);
      const cropWidth = Math.min(
        img.naturalWidth - cropX,
        x2 - x1 + padding * 2,
      );
      const cropHeight = Math.min(
        img.naturalHeight - cropY,
        y2 - y1 + padding * 2,
      );

      // Buat canvas untuk crop
      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;
      const cropCtx = cropCanvas.getContext("2d");

      if (cropCtx) {
        // Crop gambar
        cropCtx.drawImage(
          img,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight,
        );

        // Convert ke data URL
        const croppedImageData = cropCanvas.toDataURL("image/png");
        const confidence = prediction.probability?.[0] || 0;

        croppedFacesData.push({
          imageData: croppedImageData,
          confidence: confidence,
          index: index + 1,
          position: { x: Math.round(x1), y: Math.round(y1) },
          size: {
            width: Math.round(x2 - x1),
            height: Math.round(y2 - y1),
          },
        });
      }
    });

    setCroppedFaces(croppedFacesData);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const resetDetection = () => {
    setSelectedImage(null);
    setDetections([]);
    setError(null);
    setImageDimensions({ width: 0, height: 0 });
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const downloadFace = (imageData: string, index: number) => {
    const link = document.createElement("a");
    link.href = imageData;
    link.download = `face_${index}.png`;
    link.click();
  };

  return (
    <Temp>
      <div className="text-start mb-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />
        <button
          className="btn btn-primary me-2"
          type="button"
          onClick={handleButtonClick}
          disabled={isLoading}
        >
          <i className="bi bi-upload me-2"></i>
          Upload Gambar!!!
        </button>

        {selectedImage && (
          <>
            <button
              className="btn btn-success me-2"
              type="button"
              onClick={detectFaces}
              disabled={isDetecting || isLoading}
            >
              <i className="bi bi-search me-2"></i>
              {isDetecting ? "Mendeteksi..." : "Deteksi Wajah"}
            </button>

            <button
              className="btn btn-danger"
              type="button"
              onClick={resetDetection}
              disabled={isDetecting}
            >
              <i className="bi bi-x-circle me-2"></i>
              Reset
            </button>
          </>
        )}
      </div>

      {isLoading && (
        <div className="alert alert-info">
          <i className="bi bi-hourglass-split me-2"></i>
          Memuat model BlazeFace...
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {detections.length > 0 && (
        <div className="alert alert-success mb-3">
          <i className="bi bi-check-circle me-2"></i>
          Terdeteksi <strong>{detections.length}</strong> wajah
        </div>
      )}

      <div className="row align-items-start">
        <div className="col-md-6 mb-3">
          <h5>Gambar Asli</h5>
          <div className="bg-light p-2 rounded border">
            {selectedImage ? (
              <img
                ref={imageRef}
                src={selectedImage}
                alt="Selected"
                className="img-fluid rounded"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  display: "block",
                }}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-image" style={{ fontSize: "3rem" }}></i>
                <p className="mt-2">Belum ada gambar yang dipilih</p>
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <h5>Hasil Deteksi</h5>
          <div className="bg-light p-2 rounded border">
            {selectedImage ? (
              <canvas
                ref={canvasRef}
                className="rounded"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
            ) : (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-cpu" style={{ fontSize: "3rem" }}></i>
                <p className="mt-2">Hasil deteksi akan muncul di sini</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {detections.length > 0 && (
        <div className="mt-3">
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
                  const width = x2 - x1;
                  const height = y2 - y1;

                  return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        {face.probability && face.probability.length > 0
                          ? (face.probability[0] * 100).toFixed(2)
                          : "0.00"}
                        %
                      </td>
                      <td>
                        ({Math.round(x1)}, {Math.round(y1)})
                      </td>
                      <td>
                        {Math.round(width)} x {Math.round(height)}
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

      {imageDimensions.width > 0 && (
        <div className="mt-3">
          <div className="alert alert-info">
            <strong>Info Gambar:</strong> {imageDimensions.width} x{" "}
            {imageDimensions.height} pixels
          </div>
        </div>
      )}

      {croppedFaces.length > 0 && (
        <div className="mt-4">
          <h5 className="mb-3">
            <i className="bi bi-person-bounding-box me-2"></i>
            Wajah yang Terdeteksi ({croppedFaces.length})
          </h5>
          <div className="row">
            {croppedFaces.map((face) => (
              <div key={face.index} className="col-md-4 col-lg-3 mb-3">
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
                  <div className="card-body p-2">
                    <img
                      src={face.imageData}
                      alt={`Face ${face.index}`}
                      className="img-fluid rounded"
                      style={{
                        width: "100%",
                        height: "auto",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                  <div className="card-footer bg-light">
                    <small className="text-muted d-block mb-2">
                      <i className="bi bi-geo-alt me-1"></i>
                      Posisi: ({face.position.x}, {face.position.y})
                    </small>
                    <small className="text-muted d-block mb-2">
                      <i className="bi bi-arrows-angle-expand me-1"></i>
                      Ukuran: {face.size.width} x {face.size.height}px
                    </small>
                    <button
                      className="btn btn-sm btn-outline-primary w-100"
                      onClick={() => downloadFace(face.imageData, face.index)}
                    >
                      <i className="bi bi-download me-2"></i>
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Temp>
  );
}
