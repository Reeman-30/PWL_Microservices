import React from "react";

export const KeyConcepts = () => {
  return (
    <div className="row g-4 mb-5">
      <div className="col-12">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0">
              <i className="bi bi-book me-2"></i>
              Core Concepts of Machine Learning
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-4">
              <div className="col-md-6">
                <h6 className="fw-bold text-primary mb-3">
                  <i className="bi bi-database me-2"></i>
                  Data Processing
                </h6>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <strong>Feature Engineering:</strong> The process of
                    generating new attributes or features from raw data.
                  </li>
                  <li className="mb-2">
                    <strong>Data Splitting:</strong> Partitioning datasets into
                    Training, Validation, and Testing sets (typically 70/15/15).
                  </li>
                  <li className="mb-2">
                    <strong>Normalization:</strong> Scaling numerical features
                    to a standardized range.
                  </li>
                  <li className="mb-2">
                    <strong>Handling Missing Data:</strong> Addressing
                    incomplete datasets through imputation or deletion
                    strategies.
                  </li>
                </ul>
              </div>

              <div className="col-md-6">
                <h6 className="fw-bold text-success mb-3">
                  <i className="bi bi-graph-up me-2"></i>
                  Model Evaluation
                </h6>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <strong>Overfitting:</strong> Model terlalu fit dengan
                    training data
                  </li>
                  <li className="mb-2">
                    <strong>Underfitting:</strong> Model terlalu sederhana
                  </li>
                  <li className="mb-2">
                    <strong>Cross-Validation:</strong> K-fold validation untuk
                    evaluasi robust
                  </li>
                  <li className="mb-2">
                    <strong>Bias-Variance Tradeoff:</strong> Balance antara bias
                    dan variance
                  </li>
                </ul>
              </div>

              <div className="col-md-6">
                <h6 className="fw-bold text-warning mb-3">
                  <i className="bi bi-speedometer2 me-2"></i>
                  Performance Metrics
                </h6>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <strong>Classification:</strong> Accuracy, Precision,
                    Recall, F1-Score
                  </li>
                  <li className="mb-2">
                    <strong>Regression:</strong> MSE, RMSE, MAE, R²
                  </li>
                  <li className="mb-2">
                    <strong>Clustering:</strong> Silhouette Score,
                    Davies-Bouldin Index
                  </li>
                  <li className="mb-2">
                    <strong>RL:</strong> Cumulative Reward, Episode Length
                  </li>
                </ul>
              </div>

              <div className="col-md-6">
                <h6 className="fw-bold text-danger mb-3">
                  <i className="bi bi-tools me-2"></i>
                  Optimization Techniques
                </h6>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <strong>Gradient Descent:</strong> Optimasi iteratif untuk
                    minimize loss
                  </li>
                  <li className="mb-2">
                    <strong>Regularization:</strong> L1/L2 untuk prevent
                    overfitting
                  </li>
                  <li className="mb-2">
                    <strong>Hyperparameter Tuning:</strong> Grid/Random search
                  </li>
                  <li className="mb-2">
                    <strong>Ensemble Methods:</strong> Bagging, Boosting,
                    Stacking
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
