import React from "react";
import type { TrainingStats, Episode } from "../types";

interface TrainingStatsCardProps {
  stats: TrainingStats | null;
  episodes: Episode[];
  currentEpisode: number;
  isTraining: boolean;
}

export function TrainingStatsCard({
  stats,
  episodes,
  currentEpisode,
  isTraining,
}: TrainingStatsCardProps) {
  const recentEpisodes = episodes.slice(-10);

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">
          <i className="bi bi-graph-up me-2"></i>
          Training Statistics
        </h5>
      </div>
      <div className="card-body">
        {isTraining && (
          <div className="mb-3">
            <div className="d-flex justify-content-between mb-2">
              <span>Training Progress</span>
              <span className="fw-bold">{currentEpisode} episodes</span>
            </div>
            <div className="progress" style={{ height: "25px" }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                style={{ width: "100%" }}
              >
                Training...
              </div>
            </div>
          </div>
        )}

        {stats && (
          <div>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <div className="card bg-success bg-opacity-10 border-success">
                  <div className="card-body">
                    <h6 className="text-success mb-2">
                      <i className="bi bi-trophy me-2"></i>
                      Success Rate
                    </h6>
                    <h3 className="mb-0">{stats.successRate.toFixed(1)}%</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card bg-info bg-opacity-10 border-info">
                  <div className="card-body">
                    <h6 className="text-info mb-2">
                      <i className="bi bi-speedometer2 me-2"></i>
                      Avg Steps
                    </h6>
                    <h3 className="mb-0">{stats.averageSteps.toFixed(1)}</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card bg-warning bg-opacity-10 border-warning">
                  <div className="card-body">
                    <h6 className="text-warning mb-2">
                      <i className="bi bi-star me-2"></i>
                      Avg Reward
                    </h6>
                    <h3 className="mb-0">{stats.averageReward.toFixed(1)}</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card bg-primary bg-opacity-10 border-primary">
                  <div className="card-body">
                    <h6 className="text-primary mb-2">
                      <i className="bi bi-collection me-2"></i>
                      Total Episodes
                    </h6>
                    <h3 className="mb-0">{stats.totalEpisodes}</h3>
                  </div>
                </div>
              </div>
            </div>

            {recentEpisodes.length > 0 && (
              <div className="card bg-light">
                <div className="card-body">
                  <h6 className="mb-3">
                    <i className="bi bi-clock-history me-2"></i>
                    Recent Episodes (Last 10)
                  </h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Episode</th>
                          <th>Steps</th>
                          <th>Reward</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentEpisodes.map((episode) => (
                          <tr key={episode.episode}>
                            <td>#{episode.episode}</td>
                            <td>{episode.steps}</td>
                            <td>
                              <span
                                className={
                                  episode.totalReward > 0
                                    ? "text-success"
                                    : "text-danger"
                                }
                              >
                                {episode.totalReward.toFixed(0)}
                              </span>
                            </td>
                            <td>
                              {episode.success ? (
                                <span className="badge bg-success">
                                  <i className="bi bi-check-circle me-1"></i>
                                  Success
                                </span>
                              ) : (
                                <span className="badge bg-danger">
                                  <i className="bi bi-x-circle me-1"></i>
                                  Failed
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!stats && !isTraining && (
          <div className="text-center py-4">
            <i className="bi bi-graph-up fs-1 text-muted mb-3 d-block"></i>
            <p className="text-muted mb-0">
              Belum ada data training. Mulai training untuk melihat statistik.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}