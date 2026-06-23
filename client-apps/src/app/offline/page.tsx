"use client";

export default function OfflinePage() {
  return (
    <div className="container">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-6 text-center">
          <div className="mb-4">
            <i
              className="bi bi-wifi-off"
              style={{ fontSize: "5rem", color: "#6c757d" }}
            ></i>
          </div>
          <h1 className="display-4 mb-3">Anda Sedang Offline</h1>
          <p className="lead text-muted mb-4">
            Tidak ada koneksi internet. Beberapa fitur mungkin tidak tersedia.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Coba Lagi
          </button>
        </div>
      </div>
    </div>
  );
}
