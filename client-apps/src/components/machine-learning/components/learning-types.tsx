import React from "react";

export const LearningTypes = () => {
  const learningTypes = [
    {
      type: "Supervised Learning",
      icon: "bi-diagram-3",
      color: "primary",
      description:
        "Learning utilizing labeled data. The model analyzes input-output pairs to predict outcomes for unseen datasets.",
      examples: [
        "Spam email classification",
        "Real estate price prediction",
        "Handwriting recognition",
        "Medical diagnosis",
      ],
      algorithms: [
        "Linear Regression",
        "Logistic Regression",
        "Decision Trees",
        "Random Forest",
        "Support Vector Machines (SVM)",
        "Neural Networks",
      ],
      characteristics: [
        "Requires annotated training datasets",
        "Objective: minimize predictive error",
        "Evaluated using quantitative metrics (accuracy, precision, recall)",
      ],
    },
    {
      type: "Unsupervised Learning",
      icon: "bi-grid-3x3",
      color: "success",
      description:
        "Learning without predefined labels. The model autonomously identifies latent patterns and structures within the data.",
      examples: [
        "Customer segmentation",
        "Anomaly and fraud detection",
        "Product recommendation systems",
        "Data dimensionality reduction",
      ],
      algorithms: [
        "K-Means Clustering",
        "Hierarchical Clustering",
        "DBSCAN",
        "Principal Component Analysis (PCA)",
        "Autoencoders",
        "Gaussian Mixture Models",
      ],
      characteristics: [
        "Operates on unlabeled data",
        "Objective: discover underlying data structures and distributions",
        "Evaluation is highly subjective (e.g., utilizing silhouette scores or the elbow method)",
      ],
    },
    {
      type: "Reinforcement Learning",
      icon: "bi-arrow-repeat",
      color: "warning",
      description:
        "Learning through environmental interaction. An autonomous agent learns to execute optimal decision-making strategies via trial-and-error and a feedback reward mechanism.",
      examples: [
        "Game playing AI (e.g., AlphaGo, Chess)",
        "Robotic navigation",
        "Autonomous driving systems",
        "Financial market trading optimization",
        "Recomendation systems",
      ],
      algorithms: [
        "Q-Learning",
        "Deep Q-Networks (DQN)",
        "Policy Gradient",
        "Actor-Critic",
        "Proximal Policy Optimization (PPO)",
        "Monte Carlo Methods",
      ],
      characteristics: [
        "Learns through feedback loops of rewards and penalties",
        "Objective: maximize long-term cumulative reward",
        "Requires a dynamic environment for continuous exploration",
      ],
    },
  ];
  return (
    <div className="row g-4 mb-5">
      {learningTypes.map((learning, index) => (
        <div key={index} className="col-12 col-lg-4">
          <div className="card h-100 shadow-sm border-0">
            <div className={`card-header bg-${learning.color} text-white`}>
              <h5 className="mb-0 d-flex align-items-center">
                <i className={`bi ${learning.icon} me-2 fs-4`}></i>
                {learning.type}
              </h5>
            </div>
            <div className="card-body">
              <p className="text-muted mb-4">{learning.description}</p>

              {/* Examples */}
              <h6 className="fw-bold mb-3">
                <i className="bi bi-lightbulb text-warning me-2"></i>
                Practical Applications:
              </h6>
              <ul className="list-unstyled mb-4">
                {learning.examples.map((example, idx) => (
                  <li key={idx} className="mb-2">
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    <small>{example}</small>
                  </li>
                ))}
              </ul>

              {/* Algorithms */}
              <h6 className="fw-bold mb-3">
                <i className="bi bi-gear text-primary me-2"></i>
                Algoritma Populer:
              </h6>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {learning.algorithms.map((algo, idx) => (
                  <span
                    key={idx}
                    className={`badge bg-${learning.color} bg-opacity-10 text-${learning.color} border border-${learning.color}`}
                  >
                    {algo}
                  </span>
                ))}
              </div>

              {/* Characteristics */}
              <h6 className="fw-bold mb-3">
                <i className="bi bi-star text-info me-2"></i>
                Karakteristik:
              </h6>
              <ul className="list-unstyled">
                {learning.characteristics.map((char, idx) => (
                  <li key={idx} className="mb-2">
                    <i className="bi bi-arrow-right-circle me-2 text-secondary"></i>
                    <small>{char}</small>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
