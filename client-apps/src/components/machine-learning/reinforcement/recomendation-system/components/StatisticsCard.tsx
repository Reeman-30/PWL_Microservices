
import React from "react";
import type { RecommendationStats, UserInteraction, Product } from "../types";

interface StatisticsCardProps {
  stats: RecommendationStats;
  interactions: UserInteraction[];
  products: Product[];
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({
  stats,
  interactions,
  products,
}) => {
  return (
    <div className="card shadow-sm border-0 mt-3">
      <div className="card-header bg-info text-white">
        <h5 className="mb-0">
          <i className="bi bi-graph-up me-2"></i>
          Statistics
        </h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">Total Interactions</span>
            <strong>{stats.totalInteractions}</strong>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">Total Reward</span>
            <strong className="text-success">
              {stats.totalReward.toFixed(0)}
            </strong>
          </div>
          <div className="d-flex justify-content-between">
            <span className="text-muted">Average Reward</span>
            <strong className="text-primary">
              {stats.averageReward.toFixed(2)}
            </strong>
          </div>
        </div>

        {interactions.length > 0 && (
          <div className="mt-3">
            <h6 className="mb-2">Recent Interactions</h6>
            <div className="overflow-auto" style={{ maxHeight: "200px" }}>
              {interactions
                .slice(-10)
                .reverse()
                .map((interaction, idx) => {
                  const product = products.find(
                    (p) => p.id === interaction.productId
                  );
                  return (
                    <div
                      key={idx}
                      className="d-flex justify-content-between align-items-center mb-2 p-2 bg-white rounded border"
                    >
                      <div>
                        <small className="d-block fw-semibold">
                          {product?.name}
                        </small>
                        <small className="text-muted">
                          {interaction.action}
                        </small>
                      </div>
                      <span className="badge bg-success">
                        +{interaction.reward}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};