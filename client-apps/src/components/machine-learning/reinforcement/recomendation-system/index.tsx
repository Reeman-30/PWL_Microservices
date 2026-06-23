"use client";

import React, { useState, useEffect } from "react";
import Layout from "../layout";
import { ControlPanel } from "./components/ControlPanel";
import { StatisticsCard } from "./components/StatisticsCard";
import { RecommendedProducts } from "./components/RecommendedProducts";
import { ProductList } from "./components/ProductList";
import { useMultiArmedBandit } from "./hooks/useMultiArmedBandit";
import { Product } from "./types";

// Sample Products
const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Laptop Gaming ROG",
    category: "Electronics",
    description: "High-performance gaming laptop with RTX 4060",
    image: "💻",
    basePrice: 15000000,
  },
  {
    id: 2,
    name: "iPhone 15 Pro Max",
    category: "Electronics",
    description: "Latest iPhone with A17 Pro chip",
    image: "📱",
    basePrice: 20000000,
  },
  {
    id: 3,
    name: "Sony WH-1000XM5",
    category: "Audio",
    description: "Premium noise-cancelling headphones",
    image: "🎧",
    basePrice: 5000000,
  },
  {
    id: 4,
    name: "MacBook Pro M3",
    category: "Electronics",
    description: "Professional laptop for creators",
    image: "💼",
    basePrice: 25000000,
  },
  {
    id: 5,
    name: "Samsung Galaxy S24",
    category: "Electronics",
    description: "Flagship Android smartphone",
    image: "📲",
    basePrice: 12000000,
  },
  {
    id: 6,
    name: "iPad Pro 12.9",
    category: "Tablets",
    description: "Powerful tablet with M2 chip",
    image: "📋",
    basePrice: 18000000,
  },
];

export default function Recomendation() {
  const {
    bandits,
    epsilon,
    setEpsilon,
    interactions,
    recommendedProducts,
    isTraining,
    stats,
    handleUserAction,
    generateRecommendations,
    startAutoTraining,
    resetSystem,
  } = useMultiArmedBandit(PRODUCTS);

  // Format currency helper
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Layout>
      <div className="my-4">
        <h2 className="mb-0">
          <i className="bi bi-stars me-2"></i>
          Recommendation System - Multi-Armed Bandit
        </h2>
        <p className="mb-0 mt-2 opacity-75">
          Sistem rekomendasi produk menggunakan Epsilon-Greedy Algorithm
        </p>
      </div>

      <div className="row g-4">
        {/* Left Column - Control Panel & Statistics */}
        <div className="col-lg-4">
          <ControlPanel
            epsilon={epsilon}
            setEpsilon={setEpsilon}
            isTraining={isTraining}
            onStartTraining={startAutoTraining}
            onGenerateRecommendations={generateRecommendations}
            onReset={resetSystem}
            hasInteractions={interactions.length > 0}
          />

          <StatisticsCard
            stats={stats}
            interactions={interactions}
            products={PRODUCTS}
          />
          
        </div>

        {/* Right Column - Main Content */}
        <div className="col-lg-8">
          {/* Recommended Products */}
          {recommendedProducts.length > 0 && (
            <RecommendedProducts
              products={recommendedProducts}
              bandits={bandits}
              onAction={handleUserAction}
              formatCurrency={formatCurrency}
            />
          )}

          {/* All Products */}
          <ProductList
            products={PRODUCTS}
            bandits={bandits}
            recommendedProductIds={recommendedProducts.map((p) => p.id)}
            onAction={handleUserAction}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </Layout>
  );
}