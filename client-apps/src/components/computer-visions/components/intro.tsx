import React from "react";

export const IntroCV = () => {
  return (
    <div className="row mb-4">
      <div className="col-12">
        <div className="card shadow-sm bg-white">
          <div className="card-body p-4 ">
            <h3 className="card-title mb-3">
              <i className="bi bi-info-circle me-2 text-primary"></i>
              Tentang Computer Vision
            </h3>
            <p className="mb-3">
              Computer Vision adalah cabang dari Artificial Intelligence yang
              memungkinkan komputer untuk "melihat" dan memahami konten visual
              dari dunia nyata. Dengan TensorFlow.js, kita dapat menjalankan
              model Computer Vision langsung di browser tanpa memerlukan server
              backend.
            </p>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="p-3 bg-light rounded">
                  <h5 className="text-primary mb-2">
                    <i className="bi bi-lightning-charge me-2"></i>
                    Real-time Processing
                  </h5>
                  <p className="small mb-0">
                    Pemrosesan video dan gambar secara real-time langsung di
                    browser menggunakan WebGL acceleration
                  </p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light rounded">
                  <h5 className="text-success mb-2">
                    <i className="bi bi-shield-check me-2"></i>
                    Privacy First
                  </h5>
                  <p className="small mb-0">
                    Semua pemrosesan dilakukan di client-side, data tidak
                    dikirim ke server sehingga lebih aman dan private
                  </p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light rounded">
                  <h5 className="text-info mb-2">
                    <i className="bi bi-cpu me-2"></i>
                    No Server Required
                  </h5>
                  <p className="small mb-0">
                    Tidak memerlukan infrastruktur server yang kompleks, cukup
                    jalankan di browser modern
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
