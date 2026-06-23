import React from "react";
import { Footer, KeyConcepts, LearningTypes, TableComparison, UseCaseIndustry, Workflow } from "./components";

export default function Dashboard() {
  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="mb-5">
        <h1 className="display-5 fw-bold text-dark mb-2">
          <i className="bi bi-cpu me-3"></i>
          Machine Learning Dashboard
        </h1>
        <p className="text-muted fs-5">
          An exploration of the three primary paradigms in machine learning
        </p>
      </div>

      <LearningTypes />
      <TableComparison />
      <KeyConcepts />
      <Workflow />
      <UseCaseIndustry />
      <Footer />
    </div>
  );
}
