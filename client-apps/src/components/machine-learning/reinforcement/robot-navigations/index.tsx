"use client";

import React, { useState } from "react";
import { DEFAULT_GRID } from "./constants";
import { useQLearning } from "./hooks/useQLearning";
import { GridVisualization } from "./components/GridVisualization";
import { TrainingStatsCard } from "./components/TrainingStatsCard";
import { ControlPanel } from "./components/ControlPanel";
import AlgoritmExplain from "./components/AlgoritmExplain";
import Layout from "../layout";

export default function RobotNavigation() {
  const [grid] = useState(DEFAULT_GRID);

  const {
    isTraining,
    episodes,
    currentEpisode,
    trainingStats,
    agentPath,
    isPlaying,
    trainAgent,
    playOptimalPath,
    resetAgent,
  } = useQLearning(grid);

  const [currentPathIndex, setCurrentPathIndex] = useState<number | undefined>(
    undefined,
  );

  const handlePlay = async () => {
    setCurrentPathIndex(undefined);
    await playOptimalPath();
  };

  React.useEffect(() => {
    if (isPlaying && agentPath.length > 0) {
      let index = 0;
      const interval = setInterval(() => {
        setCurrentPathIndex(index);
        index++;
        if (index >= agentPath.length) {
          clearInterval(interval);
          setCurrentPathIndex(undefined);
        }
      }, 300);

      return () => clearInterval(interval);
    }
  }, [isPlaying, agentPath]);

  return (
    <Layout>
      <div className="my-4">
        <h2 className="mb-0">
          <i className="bi bi-robot me-2"></i>
          Reinforcement Learning - Q-Learning Grid World
        </h2>
        <p className="mb-0 mt-2 opacity-75">
          Simulasi agent belajar menavigasi grid untuk mencapai goal sambil
          menghindari trap
        </p>
      </div>

      <div className="row g-4">
        {/* Grid Visualization */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">
                <i className="bi bi-grid-3x3 me-2"></i>
                Grid World Environment
              </h5>
            </div>
            <div className="card-body d-flex align-items-center justify-content-center">
              <GridVisualization
                grid={grid}
                agentPath={agentPath}
                currentPosition={currentPathIndex}
              />
            </div>
            {agentPath.length > 0 && (
              <div className="card-footer bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">
                    <i className="bi bi-signpost me-2"></i>
                    Path Length: <strong>{agentPath.length}</strong> steps
                  </span>
                  {currentPathIndex !== undefined && (
                    <span className="badge bg-info">
                      Step {currentPathIndex + 1} / {agentPath.length}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Control Panel */}
        <div className="col-lg-6">
          <ControlPanel
            isTraining={isTraining}
            isPlaying={isPlaying}
            hasTrainingData={episodes.length > 0}
            onTrain={trainAgent}
            onPlay={handlePlay}
            onReset={resetAgent}
          />
        </div>

        {/* Training Statistics */}
        <div className="col-12">
          <TrainingStatsCard
            stats={trainingStats}
            episodes={episodes}
            currentEpisode={currentEpisode}
            isTraining={isTraining}
          />
        </div>

        {/* Algorithm Explanation */}
        <AlgoritmExplain />
      </div>
    </Layout>
  );
}
