
export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  image: string;
}

export interface BanditArm {
  productId: number;
  pulls: number;
  totalReward: number;
  averageReward: number;
}

export interface UserInteraction {
  productId: number;
  action: "view" | "click" | "purchase";
  reward: number;
  timestamp: Date;
}

export interface RecommendationStats {
  totalInteractions: number;
  totalReward: number;
  averageReward: number;
  explorationRate: number;
  exploitationRate: number;
}

export type ActionType = "view" | "click" | "purchase";