
import React from "react";
import { ProductCard } from "./ProductCard";
import type { Product, BanditArm, ActionType } from "../types";

interface ProductListProps {
  products: Product[];
  bandits: Map<number, BanditArm>;
  recommendedProductIds: number[];
  onAction: (productId: number, action: ActionType) => void;
  formatCurrency: (amount: number) => string;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  bandits,
  recommendedProductIds,
  onAction,
  formatCurrency,
}) => {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-secondary text-white">
        <h5 className="mb-0">
          <i className="bi bi-box-seam me-2"></i>
          All Products & Performance
        </h5>
      </div>
      <div className="card-body">
        <div className="row g-3">
          {products.map((product) => {
            const bandit = bandits.get(product.id);
            const isRecommended = recommendedProductIds.includes(product.id);

            return (
              <div key={product.id} className="col-md-6 col-lg-4">
                <ProductCard
                  product={product}
                  bandit={bandit}
                  isRecommended={isRecommended}
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