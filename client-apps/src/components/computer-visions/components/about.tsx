import React from "react";

const AboutCV = () => {
  return (
    <div className="row mb-4">
      <div className="col-12">
        <div className="card border shadow-sm">
          <div className="card-body p-4">
            <h3 className="card-title mb-3">
              <i className="bi bi-gear me-2 text-primary"></i>
              Tentang TensorFlow.js
            </h3>
            <div className="row">
              <div className="col-md-8">
                <p className="mb-3">
                  TensorFlow.js adalah library machine learning untuk JavaScript
                  yang memungkinkan kita untuk melatih dan menjalankan model ML
                  langsung di browser atau Node.js. Library ini mendukung
                  berbagai pre-trained models untuk Computer Vision yang dapat
                  langsung digunakan.
                </p>
                <h5 className="mb-3">Keunggulan TensorFlow.js:</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="d-flex align-items-start">
                      <i className="bi bi-check-circle-fill text-success me-2 mt-1"></i>
                      <div>
                        <strong>Client-side Processing</strong>
                        <p className="small mb-0">
                          Semua komputasi dilakukan di browser, tidak perlu
                          server ML yang mahal
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex align-items-start">
                      <i className="bi bi-check-circle-fill text-success me-2 mt-1"></i>
                      <div>
                        <strong>WebGL Acceleration</strong>
                        <p className="small mb-0">
                          Memanfaatkan GPU untuk komputasi yang lebih cepat
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex align-items-start">
                      <i className="bi bi-check-circle-fill text-success me-2 mt-1"></i>
                      <div>
                        <strong>Pre-trained Models</strong>
                        <p className="small mb-0">
                          Banyak model siap pakai untuk berbagai task CV
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex align-items-start">
                      <i className="bi bi-check-circle-fill text-success me-2 mt-1"></i>
                      <div>
                        <strong>Privacy & Security</strong>
                        <p className="small mb-0">
                          Data tidak perlu dikirim ke server eksternal
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-light border">
                  <div className="card-body">
                    <h6 className="fw-bold mb-3">
                      <i className="bi bi-box-seam me-2"></i>
                      Pre-trained Models
                    </h6>
                    <ul className="list-unstyled small">
                      <li className="mb-2">
                        <i className="bi bi-dot text-primary"></i>
                        <strong>COCO-SSD</strong> - Object Detection
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-dot text-success"></i>
                        <strong>BlazeFace</strong> - Face Detection
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-dot text-info"></i>
                        <strong>MobileNet</strong> - Image Classification
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-dot text-warning"></i>
                        <strong>PoseNet</strong> - Pose Estimation
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-dot text-danger"></i>
                        <strong>HandPose</strong> - Hand Tracking
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-dot text-secondary"></i>
                        <strong>DeepLab</strong> - Segmentation
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TipsCV = () => {
  return (
    <div className="row mb-4">
      <div className="col-12">
        <div className="card border shadow-sm">
          <div className="card-body p-4">
            <h3 className="card-title mb-3">
              <i className="bi bi-speedometer2 me-2 text-success"></i>
              Tips Optimasi Performa
            </h3>
            <div className="row g-3">
              <div className="col-md-3">
                <div className="text-center p-3 bg-light rounded">
                  <i className="bi bi-gpu-card fs-1 text-primary mb-2 d-block"></i>
                  <h6 className="fw-bold">Gunakan WebGL</h6>
                  <p className="small mb-0">
                    Aktifkan WebGL backend untuk akselerasi GPU
                  </p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center p-3 bg-light rounded">
                  <i className="bi bi-arrow-down-circle fs-1 text-success mb-2 d-block"></i>
                  <h6 className="fw-bold">Resize Input</h6>
                  <p className="small mb-0">
                    Kurangi resolusi input untuk performa lebih cepat
                  </p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center p-3 bg-light rounded">
                  <i className="bi bi-clock-history fs-1 text-info mb-2 d-block"></i>
                  <h6 className="fw-bold">Batch Processing</h6>
                  <p className="small mb-0">
                    Proses multiple frames sekaligus jika memungkinkan
                  </p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center p-3 bg-light rounded">
                  <i className="bi bi-memory fs-1 text-warning mb-2 d-block"></i>
                  <h6 className="fw-bold">Memory Management</h6>
                  <p className="small mb-0">
                    Dispose tensors yang tidak digunakan untuk hemat memori
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResourscesCV = () => {
  return (
    <div className="row">
      <div className="col-12">
        <div className="card border shadow-sm">
          <div className="card-body p-4">
            <h3 className="card-title mb-3">
              <i className="bi bi-book me-2 text-info"></i>
              Sumber Belajar & Dokumentasi
            </h3>
            <div className="row g-3">
              <div className="col-md-4">
                <a
                  href="https://www.tensorflow.org/js"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-decoration-none"
                >
                  <div className="card border-primary h-100">
                    <div className="card-body">
                      <h5 className="text-primary">
                        <i className="bi bi-file-earmark-text me-2"></i>
                        TensorFlow.js Docs
                      </h5>
                      <p className="small mb-0">
                        Dokumentasi resmi TensorFlow.js dengan tutorial dan API
                        reference lengkap
                      </p>
                    </div>
                  </div>
                </a>
              </div>
              <div className="col-md-4">
                <a
                  href="https://github.com/tensorflow/tfjs-models"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-decoration-none"
                >
                  <div className="card border-success h-100">
                    <div className="card-body">
                      <h5 className="text-success">
                        <i className="bi bi-github me-2"></i>
                        TFJS Models
                      </h5>
                      <p className="small mb-0">
                        Repository GitHub dengan berbagai pre-trained models dan
                        contoh implementasi
                      </p>
                    </div>
                  </div>
                </a>
              </div>
              <div className="col-md-4">
                <a
                  href="https://www.tensorflow.org/js/demos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-decoration-none"
                >
                  <div className="card border-info h-100">
                    <div className="card-body">
                      <h5 className="text-info">
                        <i className="bi bi-play-circle me-2"></i>
                        Live Demos
                      </h5>
                      <p className="small mb-0">
                        Kumpulan demo interaktif untuk berbagai aplikasi
                        TensorFlow.js
                      </p>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { AboutCV, TipsCV, ResourscesCV };
