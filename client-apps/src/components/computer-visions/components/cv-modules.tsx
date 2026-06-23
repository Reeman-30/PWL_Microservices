import Link from "next/link";
import React from "react";

export const CVModules = () => {
  const cvModules = [
    {
      id: 3,
      title: "Image Classification",
      description:
        "Klasifikasi gambar menggunakan pre-trained models seperti MobileNet untuk mengkategorikan objek dalam gambar",
      icon: "🏞️",
      color: "info",
      features: [
        "1000+ kategori klasifikasi",
        "Transfer learning support",
        "Batch processing",
        "Top-K predictions",
      ],
      algorithms: ["MobileNet", "ResNet", "Inception", "EfficientNet"],
      useCases: [
        "Product Categorization - Klasifikasi produk otomatis",
        "Medical Imaging - Klasifikasi X-ray atau CT scan",
        "Quality Control - Deteksi cacat produk",
      ],
      path: "/modules/computer-visions/image-classification",
      available: true,
    },
    {
      id: 1,
      title: "Object Detection",
      description:
        "Deteksi objek real-time menggunakan COCO-SSD model untuk mengenali berbagai objek dalam gambar atau video",
      icon: "🎯",
      color: "primary",
      features: [
        "Deteksi 80+ kategori objek",
        "Real-time detection dari webcam",
        "Bounding box visualization",
        "Confidence score untuk setiap deteksi",
      ],
      algorithms: ["COCO-SSD", "MobileNet", "Single Shot Detector (SSD)"],
      useCases: [
        "Vehicle Detection - Menghitung kendaraan di CCTV",
        "Product Recognition - Identifikasi produk di retail",
        "Safety Monitoring - Deteksi APD di area kerja",
      ],
      path: "/modules/computer-visions/object-detections",
      available: true,
    },
    {
      id: 2,
      title: "Face Detection & Recognition",
      description:
        "Sistem deteksi dan pengenalan wajah menggunakan BlazeFace dan FaceNet untuk identifikasi wajah secara akurat",
      icon: "👤",
      color: "success",
      features: [
        "Real-time face detection",
        "Face landmarks detection (6 points)",
        "Multiple faces detection",
        "Face cropping & extraction",
      ],
      algorithms: ["BlazeFace", "MediaPipe", "Face Mesh"],
      useCases: [
        "Attendance System - Absensi otomatis",
        "Security Access - Kontrol akses berbasis wajah",
        "Customer Analytics - Analisis demografi pengunjung",
      ],
      path: "/modules/computer-visions/face-detections",
      available: true,
    },
    {
      id: 4,
      title: "Pose Estimation",
      description:
        "Deteksi pose tubuh manusia menggunakan PoseNet untuk tracking gerakan dan posisi tubuh real-time",
      icon: "🤸",
      color: "warning",
      features: [
        "17 keypoints detection",
        "Multi-person pose detection",
        "Skeleton visualization",
        "Gesture recognition",
      ],
      algorithms: ["PoseNet", "MoveNet", "BlazePose"],
      useCases: [
        "Fitness Tracking - Monitoring latihan olahraga",
        "Ergonomics Analysis - Analisis postur kerja",
        "Motion Capture - Capture gerakan untuk animasi",
      ],
      path: "/computer-vision/pose-estimation",
      available: false,
    },
    {
      id: 5,
      title: "Hand Tracking",
      description:
        "Pelacakan tangan dan gesture recognition menggunakan MediaPipe Hands untuk deteksi 21 landmark tangan",
      icon: "✋",
      color: "danger",
      features: [
        "21 hand landmarks",
        "Multi-hand tracking",
        "Gesture recognition",
        "Hand pose classification",
      ],
      algorithms: ["MediaPipe Hands", "HandPose", "Hand Tracking"],
      useCases: [
        "Sign Language Recognition - Penerjemah bahasa isyarat",
        "Touchless Control - Kontrol tanpa sentuhan",
        "Virtual Try-On - Mencoba cincin/jam tangan virtual",
      ],
      path: "/modules/computer-visions/hand-tracking",
      available: true,
    },
    {
      id: 6,
      title: "Semantic Segmentation",
      description:
        "Segmentasi gambar pixel-level menggunakan DeepLab untuk memisahkan objek berdasarkan kategori",
      icon: "🎨",
      color: "secondary",
      features: [
        "Pixel-level segmentation",
        "20+ object categories",
        "Background removal",
        "Mask generation",
      ],
      algorithms: ["DeepLab", "U-Net", "Mask R-CNN", "SegNet"],
      useCases: [
        "Background Removal - Hapus background otomatis",
        "Medical Segmentation - Segmentasi organ medis",
        "Autonomous Driving - Segmentasi jalan dan objek",
      ],
      path: "/computer-vision/semantic-segmentation",
      available: false,
    },
  ];
  return (
    <div className="row mb-4">
      <div className="col-12">
        <h3 className="mb-3">
          <i className="bi bi-grid-3x3-gap me-2"></i>
          Computer Vision Modules
        </h3>
      </div>
      {cvModules.map((module) => (
        <div key={module.id} className="col-lg-6 col-xl-4 mb-4">
          <div
            className={`card border shadow-sm h-100 ${!module.available ? "opacity-75" : ""}`}
          >
            <div className={`card-header bg-${module.color} text-white`}>
              <h4 className="card-title mb-0">
                <span className="fs-2 me-2">{module.icon}</span>
                {module.title}
                {!module.available && (
                  <span className="badge bg-warning text-dark ms-2">
                    Coming Soon
                  </span>
                )}
              </h4>
            </div>
            <div className="card-body">
              <p className="card-text mb-3">{module.description}</p>

              {/* Features */}
              <h6 className="fw-bold mb-2">
                <i className="bi bi-check-circle me-2 text-success"></i>
                Fitur Utama:
              </h6>
              <ul className="small mb-3">
                {module.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>

              {/* Algorithms */}
              <h6 className="fw-bold mb-2">
                <i className="bi bi-cpu me-2 text-primary"></i>
                Algoritma:
              </h6>
              <div className="mb-3">
                {module.algorithms.map((algo, idx) => (
                  <span
                    key={idx}
                    className={`badge bg-${module.color} bg-opacity-10 text-${module.color} me-1 mb-1`}
                  >
                    {algo}
                  </span>
                ))}
              </div>

              {/* Use Cases */}
              <h6 className="fw-bold mb-2">
                <i className="bi bi-lightbulb me-2 text-warning"></i>
                Use Cases:
              </h6>
              <ul className="small mb-3">
                {module.useCases.map((useCase, idx) => (
                  <li key={idx}>{useCase}</li>
                ))}
              </ul>

              {/* Action Button */}
              <div className="d-grid">
                {module.available ? (
                  <Link
                    href={module.path}
                    className={`btn btn-${module.color}`}
                  >
                    <i className="bi bi-play-circle me-2"></i>
                    Open Module
                  </Link>
                ) : (
                  <button className="btn btn-secondary" disabled>
                    <i className="bi bi-hourglass-split me-2"></i>
                    Segera Hadir
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
