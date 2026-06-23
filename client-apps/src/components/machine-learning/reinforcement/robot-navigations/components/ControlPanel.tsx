
import React, { useState } from "react";

interface ControlPanelProps {
  isTraining: boolean;
  isPlaying: boolean;
  hasTrainingData: boolean;
  onTrain: (episodes: number) => void;
  onPlay: () => void;
  onReset: () => void;
}

export function ControlPanel({
  isTraining,
  isPlaying,
  hasTrainingData,
  onTrain,
  onPlay,
  onReset,
}: ControlPanelProps) {
  const [numEpisodes, setNumEpisodes] = useState(100);

  const handleTrain = () => {
    if (numEpisodes > 0 && numEpisodes <= 1000) {
      onTrain(numEpisodes);
    }
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-dark text-white">
        <h5 className="mb-0">
          <i className="bi bi-controller me-2"></i>
          Control Panel
        </h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <label htmlFor="episodes" className="form-label fw-semibold">
            Number of Training Episodes
          </label>
          <input
            type="number"
            className="form-control"
            id="episodes"
            value={numEpisodes}
            onChange={(e) => setNumEpisodes(parseInt(e.target.value) || 0)}
            min="1"
            max="1000"
            disabled={isTraining || isPlaying}
          />
          <small className="text-muted">
            Recommended: 100-500 episodes for optimal learning
          </small>
        </div>

        <div className="d-grid gap-2">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleTrain}
            disabled={isTraining || isPlaying}
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
                Start Training
              </>
            )}
          </button>

          <button
            className="btn btn-success"
            onClick={onPlay}
            disabled={!hasTrainingData || isTraining || isPlaying}
          >
            {isPlaying ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></span>
                Playing...
              </>
            ) : (
              <>
                <i className="bi bi-robot me-2"></i>
                Watch Agent Play
              </>
            )}
          </button>

          <button
            className="btn btn-outline-danger"
            onClick={onReset}
            disabled={isTraining || isPlaying}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Reset Agent
          </button>
        </div>

        <div className="mt-3 p-3 bg-light rounded">
          <h6 className="mb-2">
            <i className="bi bi-info-circle me-2"></i>
            Legend
          </h6>
          <div className="d-flex flex-column gap-2">
            <div className="d-flex align-items-center">
              <span className="me-2" style={{ fontSize: "20px" }}>
                🤖
              </span>
              <span>Agent (Robot)</span>
            </div>
            <div className="d-flex align-items-center">
              <span className="me-2" style={{ fontSize: "20px" }}>
                🏆
              </span>
              <span>Goal (+100 reward)</span>
            </div>
            <div className="d-flex align-items-center">
              <span className="me-2" style={{ fontSize: "20px" }}>
                💀
              </span>
              <span>Trap (-100 reward)</span>
            </div>
            <div className="d-flex align-items-center">
              <span className="me-2" style={{ fontSize: "20px" }}>
                🧱
              </span>
              <span>Wall (blocked)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}