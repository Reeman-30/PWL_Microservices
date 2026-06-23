import { Action, CellType } from "./types";

export const GRID_SIZE = 5;

export const REWARDS = {
  GOAL: 100,
  TRAP: -100,
  STEP: -1,
  WALL: -10,
};

export const ACTIONS: Action[] = ["up", "down", "left", "right"];

export const HYPERPARAMETERS = {
  LEARNING_RATE: 0.1,
  DISCOUNT_FACTOR: 0.9,
  EPSILON: 0.1, // Exploration rate
  MAX_STEPS: 50,
};

// Default grid layout
export const DEFAULT_GRID: CellType[][] = [
  ["empty", "empty", "empty", "empty", "empty"],
  ["empty", "trap", "empty", "trap", "empty"],
  ["empty", "empty", "wall", "empty", "empty"],
  ["empty", "trap", "empty", "empty", "goal"],
  ["agent", "empty", "empty", "trap", "empty"],
];