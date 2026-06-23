"use client"

import React, { useState } from "react";
import { useLogisticRegression } from "./hooks/useLogisticRegression";
import { ModelInfoCard } from "./components/ModelInfoCard";
import { TrainingCard } from "./components/TrainingCard";
import { InputForm } from "./components/InputForm";
import { PredictionResult } from "./components/PredictionResult";
import { EmptyState } from "./components/EmptyState";
import { DatasetTable } from "./components/DatasetTable";
import { ErrorAlert } from "./components/ErrorAlert";
import {SCORE_TRAINING_DATA} from "../const/score-dataset"

interface StudentData {
  [key: string]: number;
  attendance: number;
  assignments: number;
  midExam: number;
  finalExam: number;
}

interface PredictionResult {
  probability: number;
  status: string;
  confidence: string;
}

// Dataset training (contoh data mahasiswa)
const TRAINING_DATA = {
  inputs: SCORE_TRAINING_DATA,
  outputs: [
    [1],[1],[0],[1],[0],[1],[0],[1],[0],[1],
    [0],[1],[0],[1],[0],[1],[0],[1],[0],[1],
    [1],[0],[1],[0],[1],[0],[1],[0],[1],[0],
  ],
};

const INPUT_FIELDS = [
  {
    name: "attendance",
    label: "Kehadiran",
    icon: "bi-calendar-check",
    color: "primary",
    min: 0,
    max: 100,
  },
  {
    name: "assignments",
    label: "Tugas",
    icon: "bi-file-earmark-text",
    color: "success",
    min: 0,
    max: 100,
  },
  {
    name: "midExam",
    label: "UTS",
    icon: "bi-journal-text",
    color: "warning",
    min: 0,
    max: 100,
  },
  {
    name: "finalExam",
    label: "UAS",
    icon: "bi-journal-check",
    color: "danger",
    min: 0,
    max: 100,
  },
];

const DATASET_COLUMNS = [
  { key: "attendance", label: "Kehadiran", icon: "bi-calendar-check", format: (v: number) => `${v}%` },
  { key: "assignments", label: "Tugas", icon: "bi-file-earmark-text", format: (v: number) => `${v}%` },
  { key: "midExam", label: "UTS", icon: "bi-journal-text", format: (v: number) => `${v}` },
  { key: "finalExam", label: "UAS", icon: "bi-journal-check", format: (v: number) => `${v}` },
];

export default function MLSamplePrediction() {
  const {
    modelParams,
    isTraining,
    trainingProgress,
    isModelReady,
    trainingAccuracy,
    error: modelError,
    trainModel,
    predict,
    verifyTrainingData,
    clearError,
  } = useLogisticRegression();

  const [studentData, setStudentData] = useState<StudentData>({
    attendance: 80,
    assignments: 75,
    midExam: 70,
    finalExam: 75,
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [verifyResults, setVerifyResults] = useState<string | null>(null);

  // Handle training
  const handleStartTraining = async () => {
    await trainModel(TRAINING_DATA, { learningRate: 0.1, epochs: 3000 });
  };

  // Handle prediction
  const handlePredict = () => {
    if (!isModelReady) {
      return;
    }

    const inputArray = [
      studentData.attendance,
      studentData.assignments,
      studentData.midExam,
      studentData.finalExam,
    ];

    const probability = predict(inputArray);

    if (probability !== null) {
      const confidence =
        probability >= 0.8 || probability <= 0.2
          ? "Tinggi"
          : (probability >= 0.6 && probability < 0.8) ||
            (probability > 0.2 && probability <= 0.4)
          ? "Sedang"
          : "Rendah";

      setPrediction({
        probability: probability * 100,
        status: probability >= 0.5 ? "Lulus" : "Tidak Lulus",
        confidence,
      });
    }
  };

  // Handle input change
  const handleInputChange = (field: string, value: number) => {
    setStudentData((prev) => ({
      ...prev,
      [field]: Math.max(0, Math.min(100, value)),
    }));
    setPrediction(null);
  };

  // Handle verify
  const handleVerify = () => {
    const results = verifyTrainingData(TRAINING_DATA);
    if (results) {
      let resultText = "";
      let correct = 0;

      results.forEach((result, i) => {
        const actual = TRAINING_DATA.outputs[i][0] === 1 ? "Lulus" : "Tidak Lulus";
        const predicted = result.predicted >= 0.5 ? "Lulus" : "Tidak Lulus";
        const match = actual === predicted;
        if (match) correct++;

        resultText += `Data #${i + 1} [${TRAINING_DATA.inputs[i].join(",")}] → Aktual: ${actual}, Prediksi: ${predicted} ${match ? "✅" : "❌"}\n`;
      });

      resultText += `\nAkurasi: ${correct}/${TRAINING_DATA.inputs.length} (${((correct / TRAINING_DATA.inputs.length) * 100).toFixed(1)}%)`;
      setVerifyResults(resultText);
    }
  };

  // Generate interpretation text
  const getInterpretation = () => {
    if (!prediction) return "";

    const { probability, status } = prediction;
    const avgScore = (
      (studentData.attendance +
        studentData.assignments +
        studentData.midExam +
        studentData.finalExam) /
      4
    ).toFixed(1);

    if (status === "Lulus") {
      return `Berdasarkan data yang diinputkan, mahasiswa memiliki <strong>probabilitas ${probability.toFixed(2)}%</strong> untuk <strong>lulus</strong>. 
              Rata-rata nilai keseluruhan adalah <strong>${avgScore}</strong>, yang menunjukkan performa akademik yang baik. 
              Model memprediksi bahwa mahasiswa ini kemungkinan besar akan berhasil menyelesaikan mata kuliah.`;
    } else {
      return `Berdasarkan data yang diinputkan, mahasiswa memiliki <strong>probabilitas ${(100 - probability).toFixed(2)}%</strong> untuk <strong>tidak lulus</strong>. 
              Rata-rata nilai keseluruhan adalah <strong>${avgScore}</strong>, yang menunjukkan performa akademik yang perlu ditingkatkan. 
              Disarankan untuk memberikan perhatian khusus dan bimbingan tambahan kepada mahasiswa ini.`;
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-2">
          <i className="bi bi-mortarboard-fill me-2 text-primary"></i>
          Prediksi Kelulusan Mahasiswa
        </h2>
        <p className="text-muted">
          Supervised Learning menggunakan <strong>Logistic Regression</strong> (deterministik &amp; akurat)
        </p>
      </div>

      {/* Error Alert */}
      <ErrorAlert error={modelError} onDismiss={clearError} />

      {/* Model Info & Training Cards */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <ModelInfoCard
            algorithmName="Logistic Regression"
            inputFeatures={["Kehadiran", "Tugas", "UTS", "UAS"]}
            outputType="Binary (Lulus/Tidak Lulus)"
            learningRate={0.1}
            epochs={3000}
            datasetSize={TRAINING_DATA.inputs.length}
          />
        </div>

        <div className="col-12">
          <TrainingCard
            isModelReady={isModelReady}
            isTraining={isTraining}
            trainingProgress={trainingProgress}
            trainingAccuracy={trainingAccuracy}
            datasetSize={TRAINING_DATA.inputs.length}
            onStartTraining={handleStartTraining}
            onRetrain={handleStartTraining}
            onVerify={handleVerify}
            verifyResults={verifyResults}
          />
        </div>
      </div>

      {/* Input Form & Prediction Result */}
      {isModelReady && (
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <InputForm
              fields={INPUT_FIELDS}
              values={studentData as Record<string, number>}
              onChange={handleInputChange}
              onSubmit={handlePredict}
              isDisabled={!isModelReady}
              submitLabel="Prediksi Kelulusan"
            />
          </div>

          <div className="col-md-6">
            {prediction ? (
              <PredictionResult
                probability={prediction.probability}
                status={prediction.status}
                confidence={prediction.confidence}
                inputSummary={[
                  {
                    label: "Kehadiran",
                    value: `${studentData.attendance}%`,
                    icon: "bi-calendar-check",
                    color: "primary",
                  },
                  {
                    label: "Tugas",
                    value: `${studentData.assignments}%`,
                    icon: "bi-file-earmark-text",
                    color: "success",
                  },
                  {
                    label: "UTS",
                    value: studentData.midExam,
                    icon: "bi-journal-text",
                    color: "warning",
                  },
                  {
                    label: "UAS",
                    value: studentData.finalExam,
                    icon: "bi-journal-check",
                    color: "danger",
                  },
                ]}
                interpretation={getInterpretation()}
              />
            ) : (
              <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-info text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-graph-up-arrow me-2"></i>
                    Hasil Prediksi
                  </h5>
                </div>
                <div className="card-body">
                  <EmptyState
                    icon="bi-bar-chart"
                    message="Masukkan data mahasiswa dan klik tombol 'Prediksi Kelulusan' untuk melihat hasil."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dataset Table */}
      <div className="row g-4">
        <div className="col-12">
          <DatasetTable
            columns={DATASET_COLUMNS}
            data={TRAINING_DATA.inputs}
            labels={TRAINING_DATA.outputs}
          />
        </div>
      </div>
    </div>
  );
}