
import React from "react";
import type { Product, BanditArm, ActionType } from "../types";

interface ProductCardProps {
  product: Product;
  bandit?: BanditArm;
  isRecommended?: boolean;
  onAction: (productId: number, action: ActionType) => void;
  formatCurrency: (amount: number) => string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  bandit,
  isRecommended = false,
  onAction,
  formatCurrency,
}) => {
  return (
    <div
      className={`card h-100 ${isRecommended ? "border-warning border-2" : ""}`}
    >
      <div className="card-body text-center">
        <div className="display-1 mb-3">{product.image}</div>
        <h6 className="card-title">{product.name}</h6>
        <p className="card-text small text-muted">{product.description}</p>
        <p className="fw-bold text-primary mb-3">
          {formatCurrency(product.basePrice)}
        </p>

        {bandit && (
          <div className="mb-3">
            <small className="text-muted d-block">
              Avg Reward: <strong>{bandit.averageReward.toFixed(2)}</strong>
            </small>
            <small className="text-muted d-block">
              Interactions: <strong>{bandit.pulls}</strong>
            </small>
          </div>
        )}

        <div className="d-grid gap-2">
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => onAction(product.id, "view")}
          >
            <i className="bi bi-eye me-1"></i>
            View
          </button>
          <button
            className="btn btn-sm btn-outline-success"
            onClick={() => onAction(product.id, "click")}
          >
            <i className="bi bi-hand-index me-1"></i>
            Click
          </button>
          <button
            className="btn btn-sm btn-success"
            onClick={() => onAction(product.id, "purchase")}
          >
            <i className="bi bi-cart-check me-1"></i>
            Purchase
          </button>
        </div>
      </div>
    </div>
  );
};