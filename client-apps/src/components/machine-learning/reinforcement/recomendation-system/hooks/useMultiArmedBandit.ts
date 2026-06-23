
import { useState, useEffect, useRef, useCallback } from "react";
import type {
  Product,
  BanditArm,
  UserInteraction,
  RecommendationStats,
  ActionType,
} from "../types";

export function useMultiArmedBandit(products: Product[]) {
  const [bandits, setBandits] = useState<Map<number, BanditArm>>(new Map());
  const [epsilon, setEpsilon] = useState(0.3);
  const [interactions, setInteractions] = useState<UserInteraction[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [stats, setStats] = useState<RecommendationStats>({
    totalInteractions: 0,
    totalReward: 0,
    averageReward: 0,
    explorationRate: 0,
    exploitationRate: 0,
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize bandits
  useEffect(() => {
    const initialBandits = new Map<number, BanditArm>();
    products.forEach((product) => {
      initialBandits.set(product.id, {
        productId: product.id,
        pulls: 0,
        totalReward: 0,
        averageReward: 0,
      });
    });
    setBandits(initialBandits);
  }, [products]);

  // Calculate reward based on user action
  const calculateReward = useCallback((action: ActionType): number => {
    switch (action) {
      case "view":
        return 1;
      case "click":
        return 5;
      case "purchase":
        return 20;
      default:
        return 0;
    }
  }, []);

  // Epsilon-Greedy Algorithm
  const selectProduct = useCallback((): Product => {
    // Exploration: Random selection
    if (Math.random() < epsilon) {
      const randomIndex = Math.floor(Math.random() * products.length);
      return products[randomIndex];
    }

    // Exploitation: Select best performing product
    let bestProduct = products[0];
    let bestReward = -Infinity;

    products.forEach((product) => {
      const bandit = bandits.get(product.id);
      if (bandit && bandit.averageReward > bestReward) {
        bestReward = bandit.averageReward;
        bestProduct = product;
      }
    });

    return bestProduct;
  }, [epsilon, products, bandits]);

  // Update bandit statistics
  const updateBandit = useCallback((productId: number, reward: number) => {
    setBandits((prevBandits) => {
      const newBandits = new Map(prevBandits);
      const bandit = newBandits.get(productId);

      if (bandit) {
        const newPulls = bandit.pulls + 1;
        const newTotalReward = bandit.totalReward + reward;
        const newAverageReward = newTotalReward / newPulls;

        newBandits.set(productId, {
          ...bandit,
          pulls: newPulls,
          totalReward: newTotalReward,
          averageReward: newAverageReward,
        });
      }

      return newBandits;
    });
  }, []);

  // Handle user interaction
  const handleUserAction = useCallback(
    (productId: number, action: ActionType) => {
      const reward = calculateReward(action);

      const interaction: UserInteraction = {
        productId,
        action,
        reward,
        timestamp: new Date(),
      };

      setInteractions((prev) => [...prev, interaction]);
      updateBandit(productId, reward);

      setStats((prev) => {
        const newTotal = prev.totalInteractions + 1;
        const newTotalReward = prev.totalReward + reward;
        return {
          totalInteractions: newTotal,
          totalReward: newTotalReward,
          averageReward: newTotalReward / newTotal,
          explorationRate: prev.explorationRate,
          exploitationRate: prev.exploitationRate,
        };
      });
    },
    [calculateReward, updateBandit]
  );

  // Generate recommendations
  const generateRecommendations = useCallback(() => {
    const recommendations: Product[] = [];
    const numRecommendations = 3;

    for (let i = 0; i < numRecommendations; i++) {
      const selected = selectProduct();
      if (!recommendations.find((p) => p.id === selected.id)) {
        recommendations.push(selected);
      }
    }

    setRecommendedProducts(recommendations);
  }, [selectProduct]);

  // Auto-training simulation
  const startAutoTraining = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsTraining(true);

    const actions: ActionType[] = [
      "view",
      "view",
      "view",
      "click",
      "click",
      "purchase",
    ];

    for (let i = 0; i < 50; i++) {
      if (!isMountedRef.current) break;

      await new Promise((resolve) => setTimeout(resolve, 100));

      const randomProduct =
        products[Math.floor(Math.random() * products.length)];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];

      handleUserAction(randomProduct.id, randomAction);
    }

    if (isMountedRef.current) {
      setIsTraining(false);
      generateRecommendations();
    }
  }, [products, handleUserAction, generateRecommendations]);

  // Reset system
  const resetSystem = useCallback(() => {
    const initialBandits = new Map<number, BanditArm>();
    products.forEach((product) => {
      initialBandits.set(product.id, {
        productId: product.id,
        pulls: 0,
        totalReward: 0,
        averageReward: 0,
      });
    });
    setBandits(initialBandits);
    setInteractions([]);
    setRecommendedProducts([]);
    setStats({
      totalInteractions: 0,
      totalReward: 0,
      averageReward: 0,
      explorationRate: 0,
      exploitationRate: 0,
    });
  }, [products]);

  return {
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
  };
}