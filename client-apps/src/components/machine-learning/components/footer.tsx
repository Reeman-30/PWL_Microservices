import React from "react";

export const Footer = () => {
  return (
    <div className="alert alert-info border-0 shadow-sm" role="alert">
      <div className="d-flex align-items-start">
        <i className="bi bi-info-circle-fill fs-4 me-3"></i>
        <div>
          <h6 className="alert-heading fw-bold mb-2">Important Note</h6>
          <p className="mb-2">
            Machine Learning is a continuously evolving field. The selection of
            an appropriate learning paradigm (Supervised, Unsupervised, or
            Reinforcement Learning) depends on:
          </p>
          <ul className="mb-2">
            <li>The availability and structure of the data</li>
            <li>The defined business objectives</li>
            <li>The complexity of the problem statement</li>
            <li>
              Available resources (computational power, time constraints, and
              budget allocation)
            </li>
          </ul>
          <p className="mb-0">
            <strong>Recommendation:</strong> Begin with fundamental problems,
            establish a robust understanding of the core principles, and
            practice consistently. Avoid premature implementation of complex
            algorithms prior to mastering foundational models.
          </p>
        </div>
      </div>
    </div>
  );
};
