import React from "react";

export const TableComparison = () => {
  const comparisonData = [
    {
      aspect: "Data Requirement",
      supervised: "Labeled data",
      unsupervised: "Unlabeled data",
      reinforcement: "Environment + Reward signal",
    },
    {
      aspect: "Learning Goal",
      supervised: "Predict output",
      unsupervised: "Find patterns",
      reinforcement: "Maximize reward",
    },
    {
      aspect: "Feedback Type",
      supervised: "Direct (correct answer)",
      unsupervised: "None",
      reinforcement: "Delayed (reward/penalty)",
    },
    {
      aspect: "Complexity",
      supervised: "Medium",
      unsupervised: "Low-Medium",
      reinforcement: "High",
    },
  ];
  return (
    <div className="card shadow-sm border-0 mb-5">
      <div className="card-header bg-dark text-white">
        <h5 className="mb-0">
          <i className="bi bi-table me-2"></i>
          Perbandingan Paradigma Machine Learning
        </h5>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th className="fw-bold">Aspek</th>
                <th className="fw-bold text-primary">
                  <i className="bi bi-diagram-3 me-2"></i>
                  Supervised
                </th>
                <th className="fw-bold text-success">
                  <i className="bi bi-grid-3x3 me-2"></i>
                  Unsupervised
                </th>
                <th className="fw-bold text-warning">
                  <i className="bi bi-arrow-repeat me-2"></i>
                  Reinforcement
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, index) => (
                <tr key={index}>
                  <td className="fw-semibold">{row.aspect}</td>
                  <td>{row.supervised}</td>
                  <td>{row.unsupervised}</td>
                  <td>{row.reinforcement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
