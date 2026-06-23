"use client"
import React from "react";

interface TrainingCardProps {
  isModelReady: boolean;
  isTraining: boolean;
  trainingProgress: number;
  trainingAccuracy: number | null;
  datasetSize: number;
  onStartTraining: () => void;
  onRetrain: () => void;
  onVerify?: () => void;
  verifyResults?: string | null;
}

export function TrainingCard({
  isModelReady,
  isTraining,
  trainingProgress,
  trainingAccuracy,
  datasetSize,
  onStartTraining,
  onRetrain,
  onVerify,
  verifyResults,
}: TrainingCardProps) {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-success text-white">
        <h5 className="mb-0">
          <i className="bi bi-cpu me-2"></i>
          Training Model
        </h5>
      </div>
      <div className="card-body">
        {!isModelReady && !isTraining && (
          <div className="text-center py-4">
            <i className="bi bi-robot fs-1 text-muted mb-3 d-block"></i>
            <p className="text-muted mb-3">
              Model belum dilatih. Klik tombol di bawah untuk memulai training.
            </p>
            <button
              className="btn btn-success btn-lg"
              onClick={onStartTraining}
              disabled={isTraining}
            >
              <i className="bi bi-play-fill me-2"></i>
              Mulai Training Model
            </button>
          </div>
        )}

        {isTraining && (
          <div>
            <div className="d-flex align-items-center mb-3">
              <div className="spinner-border text-success me-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <div className="flex-grow-1">
                <h6 className="mb-1">Training Model (Logistic Regression)...</h6>
                <p className="text-muted mb-0 small">
                  Gradient Descent sedang berjalan...
                </p>
              </div>
            </div>
            <div className="progress" style={{ height: "25px" }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated bg-success"
                role="progressbar"
                style={{ width: `${trainingProgress}%` }}
              >
                {trainingProgress.toFixed(0)}%
              </div>
            </div>
          </div>
        )}

        {isModelReady && !isTraining && (
          <div>
            <div
              className="alert alert-success d-flex align-items-center mb-3"
              role="alert"
            >
              <i className="bi bi-check-circle-fill fs-4 me-3"></i>
              <div>
                <h6 className="alert-heading mb-1">Model Siap Digunakan!</h6>
                <p className="mb-0 small">
                  Logistic Regression telah dilatih dengan {datasetSize} data.
                  {trainingAccuracy !== null && (
                    <>
                      {" "}
                      Akurasi training:{" "}
                      <strong>{trainingAccuracy.toFixed(1)}%</strong>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-success" onClick={onRetrain}>
                <i className="bi bi-arrow-clockwise me-2"></i>
                Latih Ulang
              </button>
              {onVerify && (
                <button className="btn btn-outline-secondary" onClick={onVerify}>
                  <i className="bi bi-check2-all me-2"></i>
                  Verifikasi Data Training
                </button>
              )}
            </div>

            {verifyResults && (
              <div className="mt-3">
                <pre
                  className="bg-light p-3 rounded small"
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    fontSize: "0.75rem",
                  }}
                >
                  {verifyResults}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}