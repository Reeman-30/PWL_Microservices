"use client"
import React from "react";

interface PredictionResultProps {
  probability: number;
  status: string;
  confidence: string;
  inputSummary: Array<{ label: string; value: number | string; icon: string; color: string }>;
  interpretation: string;
}

export function PredictionResult({
  probability,
  status,
  confidence,
  inputSummary,
  interpretation,
}: PredictionResultProps) {
  const isPositive = status === "Lulus";

  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-info text-white">
        <h5 className="mb-0">
          <i className="bi bi-graph-up-arrow me-2"></i>
          Hasil Prediksi
        </h5>
      </div>
      <div className="card-body">
        {/* Status Badge */}
        <div className="text-center mb-4">
          <div
            className={`badge fs-3 px-4 py-3 ${
              isPositive ? "bg-success" : "bg-danger"
            }`}
          >
            <i
              className={`bi ${
                isPositive ? "bi-check-circle-fill" : "bi-x-circle-fill"
              } me-2`}
            ></i>
            {status}
          </div>
        </div>

        {/* Probability */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-bold">Probabilitas Kelulusan:</span>
            <span className="badge bg-primary fs-6">
              {probability.toFixed(2)}%
            </span>
          </div>
          <div className="progress" style={{ height: "30px" }}>
            <div
              className={`progress-bar ${
                probability >= 50 ? "bg-success" : "bg-danger"
              }`}
              role="progressbar"
              style={{ width: `${probability}%` }}
            >
              {probability.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Confidence Level */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <span className="fw-bold">Tingkat Kepercayaan:</span>
            <span
              className={`badge fs-6 ${
                confidence === "Tinggi"
                  ? "bg-success"
                  : confidence === "Sedang"
                  ? "bg-warning text-dark"
                  : "bg-danger"
              }`}
            >
              {confidence}
            </span>
          </div>
        </div>

        {/* Input Summary */}
        <div className="card bg-light">
          <div className="card-body">
            <h6 className="fw-bold mb-3">Ringkasan Data Input:</h6>
            <div className="row g-2">
              {inputSummary.map((item, index) => (
                <div key={index} className="col-6">
                  <div className="d-flex align-items-center">
                    <i className={`bi ${item.icon} text-${item.color} me-2`}></i>
                    <small>
                      <strong>{item.label}:</strong> {item.value}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interpretation */}
        <div className="alert alert-info mt-3 mb-0" role="alert">
          <h6 className="alert-heading">
            <i className="bi bi-lightbulb-fill me-2"></i>
            Interpretasi:
          </h6>
          <p className="mb-0 small" dangerouslySetInnerHTML={{ __html: interpretation }} />
        </div>
      </div>
    </div>
  );
}