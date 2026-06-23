
import React from "react";
import { ElbowChart } from "./ElbowChart";

interface ElbowPoint {
  k: number;
  wcss: number;
}

interface ElbowMethodCardProps {
  elbowData: ElbowPoint[];
  isCalculating: boolean;
  optimalK: number | null;
  onCalculate: () => void;
}

export function ElbowMethodCard({
  elbowData,
  isCalculating,
  optimalK,
  onCalculate,
}: ElbowMethodCardProps) {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-info text-white">
        <h5 className="mb-0">
          <i className="bi bi-graph-up me-2"></i>
          Elbow Method - Menentukan K Optimal
        </h5>
      </div>
      <div className="card-body">
        {elbowData.length === 0 && !isCalculating && (
          <div className="text-center py-4">
            <i className="bi bi-bar-chart fs-1 text-muted mb-3 d-block"></i>
            <p className="text-muted mb-3">
              Gunakan Elbow Method untuk menentukan jumlah cluster (K) yang optimal
            </p>
            <button
              className="btn btn-info btn-lg text-white"
              onClick={onCalculate}
            >
              <i className="bi bi-calculator me-2"></i>
              Hitung Elbow Method
            </button>
          </div>
        )}

        {isCalculating && (
          <div className="text-center py-5">
            <div className="spinner-border text-info mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h6 className="mb-2">Menghitung WCSS untuk setiap K...</h6>
            <p className="text-muted small mb-0">
              Proses ini akan menguji K dari 1 hingga 10
            </p>
          </div>
        )}

        {elbowData.length > 0 && !isCalculating && (
          <div>
            {/* Optimal K Info */}
            {optimalK && (
              <div className="alert alert-info d-flex align-items-center mb-4">
                <i className="bi bi-info-circle-fill fs-4 me-3"></i>
                <div>
                  <h6 className="alert-heading mb-1">K Optimal Ditemukan!</h6>
                  <p className="mb-0 small">
                    Berdasarkan Elbow Method, jumlah cluster optimal adalah{" "}
                    <strong className="text-danger">K = {optimalK}</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="mb-4 d-flex justify-content-center">
              <ElbowChart 
                data={elbowData} 
                optimalK={optimalK}
                width={800}
                height={400}
              />
            </div>

            {/* WCSS Table */}
            <div className="card bg-light">
              <div className="card-body">
                <h6 className="mb-3">
                  <i className="bi bi-table me-2"></i>
                  Tabel WCSS untuk Setiap K
                </h6>
                <div className="table-responsive">
                  <table className="table table-sm table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="text-center">K (Jumlah Cluster)</th>
                        <th className="text-center">WCSS</th>
                        <th className="text-center">Penurunan WCSS</th>
                        <th className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {elbowData.map((point, idx) => {
                        const decrease = idx > 0 
                          ? elbowData[idx - 1].wcss - point.wcss 
                          : 0;
                        const isOptimal = point.k === optimalK;
                        
                        return (
                          <tr 
                            key={point.k}
                            className={isOptimal ? "table-danger" : ""}
                          >
                            <td className="text-center">
                              <strong>{point.k}</strong>
                            </td>
                            <td className="text-center">
                              {point.wcss.toFixed(2)}
                            </td>
                            <td className="text-center">
                              {idx > 0 ? (
                                <span className="text-success">
                                  <i className="bi bi-arrow-down me-1"></i>
                                  {decrease.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="text-center">
                              {isOptimal && (
                                <span className="badge bg-danger">
                                  <i className="bi bi-star-fill me-1"></i>
                                  Optimal
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="alert alert-light border mt-3 mb-0">
              <h6 className="mb-2">
                <i className="bi bi-lightbulb me-2"></i>
                Cara Membaca Elbow Chart:
              </h6>
              <ul className="mb-0 small">
                <li>
                  <strong>WCSS (Within-Cluster Sum of Squares)</strong> mengukur 
                  seberapa kompak data dalam setiap cluster
                </li>
                <li>
                  Semakin kecil WCSS, semakin baik clustering (data lebih kompak)
                </li>
                <li>
                  <strong>Elbow Point</strong> adalah titik di mana penurunan WCSS 
                  mulai melambat (membentuk "siku")
                </li>
                <li>
                  K optimal biasanya berada di elbow point, karena menambah K 
                  setelahnya tidak memberikan peningkatan signifikan
                </li>
              </ul>
            </div>

            {/* Recalculate Button */}
            <div className="text-center mt-3">
              <button 
                className="btn btn-outline-info"
                onClick={onCalculate}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Hitung Ulang
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}