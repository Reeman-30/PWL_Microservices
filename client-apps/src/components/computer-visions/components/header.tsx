import React from "react";

export const HeaderCV = () => {
  const techStack = [
    {
      name: "TensorFlow.js",
      description: "Machine learning library untuk JavaScript",
      icon: "🧠",
    },
    {
      name: "Pre-trained Models",
      description: "Model yang sudah dilatih untuk berbagai task CV",
      icon: "📦",
    },
    {
      name: "WebGL Acceleration",
      description: "Hardware acceleration untuk performa optimal",
      icon: "⚡",
    },
    {
      name: "Real-time Processing",
      description: "Pemrosesan video dan gambar secara real-time",
      icon: "🎥",
    },
  ];
  return (
    <div className="row mb-4">
      <div className="col-12">
        <div className="rounded border border-primary shadow-sm p-4 bg-primary bg-gradient-primary text-white">
          <h1 className="display-4 fw-bold mb-3">
            <i className="bi bi-eye me-3"></i>
            Computer Vision Dashboard
          </h1>
          <p className="lead mb-4">
            Eksplorasi berbagai teknik Computer Vision menggunakan TensorFlow.js
            untuk aplikasi web real-time
          </p>
          <div className="row g-3">
            {techStack.map((tech, index) => (
              <div key={index} className="col-md-3 col-sm-6">
                <div className="d-flex align-items-center">
                  <span className="fs-2 me-2">{tech.icon}</span>
                  <div>
                    <h6 className="mb-0 fw-bold">{tech.name}</h6>
                    <small className="opacity-75">{tech.description}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
