
import React from "react";

interface ControlPanelProps {
  epsilon: number;
  setEpsilon: (value: number) => void;
  isTraining: boolean;
  hasInteractions: boolean;
  onStartTraining: () => void;
  onGenerateRecommendations: () => void;
  onReset: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  epsilon,
  setEpsilon,
  isTraining,
  hasInteractions,
  onStartTraining,
  onGenerateRecommendations,
  onReset,
}) => {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">
          <i className="bi bi-sliders me-2"></i>
          Control Panel
        </h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <label className="form-label fw-semibold">
            Exploration Rate (ε)
          </label>
          <input
            type="range"
            className="form-range"
            min="0"
            max="1"
            step="0.1"
            value={epsilon}
            onChange={(e) => setEpsilon(parseFloat(e.target.value))}
            disabled={isTraining}
          />
          <div className="d-flex justify-content-between">
            <small className="text-muted">Exploitation</small>
            <small className="fw-bold">{epsilon.toFixed(1)}</small>
            <small className="text-muted">Exploration</small>
          </div>
        </div>

        <div className="d-grid gap-2">
          <button
            className="btn btn-success"
            onClick={onStartTraining}
            disabled={isTraining}
          >
            {isTraining ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></span>
                Training...
              </>
            ) : (
              <>
                <i className="bi bi-play-fill me-2"></i>
                Auto Training (50 interactions)
              </>
            )}
          </button>

          <button
            className="btn btn-primary"
            onClick={onGenerateRecommendations}
            disabled={isTraining || !hasInteractions}
          >
            <i className="bi bi-stars me-2"></i>
            Generate Recommendations
          </button>

          <button
            className="btn btn-outline-danger"
            onClick={onReset}
            disabled={isTraining}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Reset System
          </button>
        </div>

        <div className="mt-3 p-3 bg-light rounded">
          <h6 className="mb-2">
            <i className="bi bi-info-circle me-2"></i>
            Algorithm Info
          </h6>
          <small className="text-muted">
            <strong>Epsilon-Greedy:</strong> Balances exploration (trying new
            products) and exploitation (recommending best performers)
          </small>
        </div>
      </div>
    </div>
  );
};