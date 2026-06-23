
import React from "react";
import { ProductCard } from "./ProductCard";
import type { Product, BanditArm, ActionType } from "../types";

interface RecommendedProductsProps {
  products: Product[];
  bandits: Map<number, BanditArm>;
  onAction: (productId: number, action: ActionType) => void;
  formatCurrency: (amount: number) => string;
}

export const RecommendedProducts: React.FC<RecommendedProductsProps> = ({
  products,
  bandits,
  onAction,
  formatCurrency,
}) => {
  if (products.length === 0) return null;

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-warning text-dark">
        <h5 className="mb-0">
          <i className="bi bi-stars me-2"></i>
          Recommended for You
        </h5>
      </div>
      <div className="card-body">
        <div className="row g-3">
          {products.map((product) => {
            const bandit = bandits.get(product.id);
            return (
              <div key={product.id} className="col-md-4">
                <ProductCard
                  product={product}
                  bandit={bandit}
                  isRecommended={true}
                  onAction={onAction}
                  formatCurrency={formatCurrency}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};