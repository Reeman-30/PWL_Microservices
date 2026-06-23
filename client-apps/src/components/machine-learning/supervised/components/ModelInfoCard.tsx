"use client"
import React from "react";

interface ModelInfoCardProps {
  algorithmName: string;
  inputFeatures: string[];
  outputType: string;
  learningRate: number;
  epochs: number;
  datasetSize: number;
}

export function ModelInfoCard({
  algorithmName,
  inputFeatures,
  outputType,
  learningRate,
  epochs,
  datasetSize,
}: ModelInfoCardProps) {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">
          <i className="bi bi-info-circle me-2"></i>
          Informasi Model
        </h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <h6 className="fw-bold mb-3">Algoritma:</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <i className="bi bi-arrow-right-circle text-primary me-2"></i>
                <strong>{algorithmName}</strong>
              </li>
              <li className="mb-2">
                <i className="bi bi-arrow-right-circle text-primary me-2"></i>
                <strong>Input:</strong> {inputFeatures.length} fitur (
                {inputFeatures.join(", ")})
              </li>
              <li className="mb-2">
                <i className="bi bi-arrow-right-circle text-primary me-2"></i>
                <strong>Output:</strong> {outputType}
              </li>
              <li className="mb-2">
                <i className="bi bi-arrow-right-circle text-primary me-2"></i>
                <strong>Inisialisasi:</strong> Bobot = 0 (deterministik)
              </li>
            </ul>
          </div>
          <div className="col-md-6">
            <h6 className="fw-bold mb-3">Spesifikasi Training:</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <i className="bi bi-gear text-success me-2"></i>
                <strong>Learning Rate:</strong> {learningRate}
              </li>
              <li className="mb-2">
                <i className="bi bi-arrow-repeat text-success me-2"></i>
                <strong>Epochs:</strong> {epochs}
              </li>
              <li className="mb-2">
                <i className="bi bi-graph-up text-success me-2"></i>
                <strong>Loss:</strong> Binary Cross-Entropy
              </li>
              <li className="mb-2">
                <i className="bi bi-collection text-success me-2"></i>
                <strong>Dataset:</strong> {datasetSize} data
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}