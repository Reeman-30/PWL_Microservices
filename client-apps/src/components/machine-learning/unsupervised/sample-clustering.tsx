"use client";

import React, { useState } from "react";
import { DatasetTable } from "./components/DatasetTable";
import { ClusteringCard } from "./components/ClusteringCard";
import { ClusterResultTable } from "./components/ClusterResultTable";
import { useClustering } from "./hooks/useClustering";
import { SCORE_TRAINING_DATA } from "../const/score-dataset";
import { ElbowMethodCard } from "./components/ElbowMethodCard";
import { useElbowMethod } from "./hooks/useElbowMethod";

const DATASET_COLUMNS = [
  {
    key: "attendance",
    label: "Kehadiran",
    icon: "bi-calendar-check",
    format: (v: number) => `${v}%`,
  },
  {
    key: "assignments",
    label: "Tugas",
    icon: "bi-file-earmark-text",
    format: (v: number) => `${v}%`,
  },
  {
    key: "midExam",
    label: "UTS",
    icon: "bi-journal-text",
    format: (v: number) => `${v}`,
  },
  {
    key: "finalExam",
    label: "UAS",
    icon: "bi-journal-check",
    format: (v: number) => `${v}`,
  },
];

export default function SampleClustering() {
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

  const {
    clusterResult,
    isTraining,
    studentClusters,
    performClustering,
    getClusterStats,
  } = useClustering(SCORE_TRAINING_DATA);

  const { elbowData, isCalculating, optimalK, calculateElbowMethod } = useElbowMethod(SCORE_TRAINING_DATA, 10);

  const stats = getClusterStats();

  return (
    <div className="container-fluid mt-3">
      {/* Header Section */}
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-2">
          <i className="bi bi-mortarboard-fill me-2 text-success"></i>
          Clustering Kelulusan Mahasiswa (K-Means)
        </h2>
        <p className="text-muted">
          Unsupervised Learning menggunakan <strong>K-Means Clustering</strong>{" "}
          untuk mengelompokkan mahasiswa ke dalam 2 cluster (Lulus/Tidak Lulus)
        </p>
      </div>

      {/* Clustering Card */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <ClusteringCard
            isTraining={isTraining}
            clusterResult={clusterResult}
            onStartClustering={performClustering}
            onRetrain={performClustering}
            stats={stats}
            studentClusters={studentClusters}
          />
        </div>
      </div>

      {clusterResult && (
        <>
          {/* Cluster Result Table */}
          <div className="row g-4">
            <div className="col-12">
              <ClusterResultTable
                studentClusters={studentClusters}
                selectedStudent={selectedStudent}
                onSelectStudent={setSelectedStudent}
              />
            </div>
          </div>

          {/* Elbow Method Card */}
          <div className="row g-4 mb-4">
            <div className="col-12">
              <ElbowMethodCard
                elbowData={elbowData}
                isCalculating={isCalculating}
                optimalK={optimalK}
                onCalculate={calculateElbowMethod}
              />
            </div>
          </div>
        </>
      )}

      {/* Original Dataset Table */}
      <div className="row g-4 mt-3">
        <div className="col-12">
          <DatasetTable columns={DATASET_COLUMNS} data={SCORE_TRAINING_DATA} />
        </div>
      </div>
    </div>
  );
}
