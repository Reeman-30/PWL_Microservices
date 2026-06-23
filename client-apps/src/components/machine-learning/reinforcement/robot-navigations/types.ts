
export type CellType = "empty" | "agent" | "goal" | "trap" | "wall";

export interface Position {
  row: number;
  col: number;
}

export interface Cell {
  type: CellType;
  reward: number;
}

export type Action = "up" | "down" | "left" | "right";

export interface QTableEntry {
  up: number;
  down: number;
  left: number;
  right: number;
}

export interface Episode {
  episode: number;
  steps: number;
  totalReward: number;
  success: boolean;
}

export interface TrainingStats {
  totalEpisodes: number;
  successRate: number;
  averageSteps: number;
  averageReward: number;
}