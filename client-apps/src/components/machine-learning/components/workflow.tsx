import React from "react";

export const Workflow = () => {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-secondary text-white">
        <h5 className="mb-0">
          <i className="bi bi-diagram-2 me-2"></i>
          Machine Learning Workflow
        </h5>
      </div>
      <div className="card-body">
        <div className="row g-3">
          {[
            {
              step: "1",
              title: "Problem Definition",
              desc: "Define the problem statement and establish business objectives",
              icon: "bi-question-circle",
            },
            {
              step: "2",
              title: "Data Collection",
              desc: "Acquire and perform exploratory analysis on the relevant data",
              icon: "bi-database",
            },
            {
              step: "3",
              title: "Data Preprocessing",
              desc: "Data cleaning, transformation, and feature engineering",
              icon: "bi-funnel",
            },
            {
              step: "4",
              title: "Model Selection",
              desc: "Select the appropriate machine learning algorithms",
              icon: "bi-cpu",
            },
            {
              step: "5",
              title: "Training",
              desc: "Train the model using the designated training dataset",
              icon: "bi-gear",
            },
            {
              step: "6",
              title: "Evaluation",
              desc: "Assess model performance using the testing dataset",
              icon: "bi-graph-up",
            },
            {
              step: "7",
              title: "Tuning",
              desc: "Optimize hyperparameters for enhanced performance",
              icon: "bi-sliders",
            },
            {
              step: "8",
              title: "Deployment",
              desc: "Deploy the finalized model into the production environment",
              icon: "bi-cloud-upload",
            },
          ].map((item, index) => (
            <div key={index} className="col-6 col-md-3">
              <div className="text-center p-3 border rounded bg-light h-100">
                <div
                  className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: "50px", height: "50px" }}
                >
                  <strong>{item.step}</strong>
                </div>
                <i
                  className={`bi ${item.icon} fs-3 text-primary d-block mb-2`}
                ></i>
                <h6 className="fw-bold mb-2">{item.title}</h6>
                <small className="text-muted">{item.desc}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
