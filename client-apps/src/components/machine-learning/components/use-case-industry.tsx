import React from "react";

export const UseCaseIndustry = () => {
  return (
    <div className="row g-4 mt-4 mb-5">
      <div className="col-12">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-dark text-white">
            <h5 className="mb-0">
              <i className="bi bi-building me-2"></i>
              Machine Learning Use Cases by Industry
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-4">
              {[
                {
                  industry: "Healthcare",
                  icon: "bi-heart-pulse",
                  color: "danger",
                  cases: [
                    "Disease diagnosis & prediction",
                    "Drug discovery & development",
                    "Medical image analysis",
                    "Patient risk stratification",
                  ],
                },
                {
                  industry: "Finance",
                  icon: "bi-currency-dollar",
                  color: "success",
                  cases: [
                    "Fraud detection",
                    "Credit scoring",
                    "Algorithmic trading",
                    "Risk management",
                  ],
                },
                {
                  industry: "E-Commerce",
                  icon: "bi-cart",
                  color: "primary",
                  cases: [
                    "Product recommendations",
                    "Dynamic pricing",
                    "Customer segmentation",
                    "Demand forecasting",
                  ],
                },
                {
                  industry: "Manufacturing",
                  icon: "bi-gear-wide-connected",
                  color: "warning",
                  cases: [
                    "Predictive maintenance",
                    "Quality control",
                    "Supply chain optimization",
                    "Process automation",
                  ],
                },
                {
                  industry: "Transportation",
                  icon: "bi-truck",
                  color: "info",
                  cases: [
                    "Route optimization",
                    "Autonomous vehicles",
                    "Traffic prediction",
                    "Fleet management",
                  ],
                },
                {
                  industry: "Marketing",
                  icon: "bi-megaphone",
                  color: "secondary",
                  cases: [
                    "Customer churn prediction",
                    "Sentiment analysis",
                    "Ad targeting",
                    "Campaign optimization",
                  ],
                },
              ].map((item, index) => (
                <div key={index} className="col-md-6 col-lg-4">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className={`card-header bg-${item.color} text-white`}>
                      <h6 className="mb-0 d-flex align-items-center">
                        <i className={`bi ${item.icon} me-2 fs-5`}></i>
                        {item.industry}
                      </h6>
                    </div>
                    <div className="card-body">
                      <ul className="list-unstyled mb-0">
                        {item.cases.map((useCase, idx) => (
                          <li key={idx} className="mb-2">
                            <i
                              className={`bi bi-arrow-right-circle-fill text-${item.color} me-2`}
                            ></i>
                            <small>{useCase}</small>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
