
import { ACTIONS, HYPERPARAMETERS, REWARDS } from "./constants";
import type { Action, Position, QTableEntry, CellType } from "./types";

export class QLearningAgent {
  private qTable: Map<string, QTableEntry>;
  private learningRate: number;
  private discountFactor: number;
  private epsilon: number;

  constructor(
    learningRate = HYPERPARAMETERS.LEARNING_RATE,
    discountFactor = HYPERPARAMETERS.DISCOUNT_FACTOR,
    epsilon = HYPERPARAMETERS.EPSILON
  ) {
    this.qTable = new Map();
    this.learningRate = learningRate;
    this.discountFactor = discountFactor;
    this.epsilon = epsilon;
  }

  private getStateKey(position: Position): string {
    return `${position.row},${position.col}`;
  }

  private initializeState(position: Position): void {
    const key = this.getStateKey(position);
    if (!this.qTable.has(key)) {
      this.qTable.set(key, {
        up: 0,
        down: 0,
        left: 0,
        right: 0,
      });
    }
  }

  public getQValue(position: Position, action: Action): number {
    this.initializeState(position);
    const key = this.getStateKey(position);
    return this.qTable.get(key)![action];
  }

  public getBestAction(position: Position): Action {
    this.initializeState(position);
    const key = this.getStateKey(position);
    const qValues = this.qTable.get(key)!;

    let bestAction: Action = "up";
    let maxValue = -Infinity;

    for (const action of ACTIONS) {
      if (qValues[action] > maxValue) {
        maxValue = qValues[action];
        bestAction = action;
      }
    }

    return bestAction;
  }

  public chooseAction(position: Position): Action {
    // Epsilon-greedy strategy
    if (Math.random() < this.epsilon) {
      // Explore: random action
      return ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    } else {
      // Exploit: best known action
      return this.getBestAction(position);
    }
  }

  public updateQValue(
    state: Position,
    action: Action,
    reward: number,
    nextState: Position
  ): void {
    this.initializeState(state);
    this.initializeState(nextState);

    const currentQ = this.getQValue(state, action);
    const maxNextQ = Math.max(
      ...ACTIONS.map((a) => this.getQValue(nextState, a))
    );

    // Q-Learning formula: Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
    const newQ =
      currentQ +
      this.learningRate * (reward + this.discountFactor * maxNextQ - currentQ);

    const key = this.getStateKey(state);
    const qValues = this.qTable.get(key)!;
    qValues[action] = newQ;
  }

  public getQTable(): Map<string, QTableEntry> {
    return this.qTable;
  }

  public setEpsilon(epsilon: number): void {
    this.epsilon = epsilon;
  }
}

export class GridWorld {
  private grid: CellType[][];
  private agentPosition: Position;
  private goalPosition: Position;
  private gridSize: number;

  constructor(grid: CellType[][]) {
    this.grid = grid;
    this.gridSize = grid.length;
    this.agentPosition = this.findPosition("agent");
    this.goalPosition = this.findPosition("goal");
  }

  private findPosition(type: CellType): Position {
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (this.grid[row][col] === type) {
          return { row, col };
        }
      }
    }
    return { row: 0, col: 0 };
  }

  public reset(): Position {
    this.agentPosition = this.findPosition("agent");
    return { ...this.agentPosition };
  }

  public step(action: Action): {
    nextState: Position;
    reward: number;
    done: boolean;
  } {
    const nextPosition = this.getNextPosition(this.agentPosition, action);

    // Check if move is valid
    if (!this.isValidPosition(nextPosition)) {
      return {
        nextState: this.agentPosition,
        reward: REWARDS.WALL,
        done: false,
      };
    }

    this.agentPosition = nextPosition;
    const cellType = this.grid[nextPosition.row][nextPosition.col];

    let reward = REWARDS.STEP;
    let done = false;

    if (cellType === "goal") {
      reward = REWARDS.GOAL;
      done = true;
    } else if (cellType === "trap") {
      reward = REWARDS.TRAP;
      done = true;
    }

    return {
      nextState: { ...this.agentPosition },
      reward,
      done,
    };
  }

  private getNextPosition(position: Position, action: Action): Position {
    const next = { ...position };

    switch (action) {
      case "up":
        next.row -= 1;
        break;
      case "down":
        next.row += 1;
        break;
      case "left":
        next.col -= 1;
        break;
      case "right":
        next.col += 1;
        break;
    }

    return next;
  }

  private isValidPosition(position: Position): boolean {
    if (
      position.row < 0 ||
      position.row >= this.gridSize ||
      position.col < 0 ||
      position.col >= this.gridSize
    ) {
      return false;
    }

    const cellType = this.grid[position.row][position.col];
    return cellType !== "wall";
  }

  public getAgentPosition(): Position {
    return { ...this.agentPosition };
  }

  public getGoalPosition(): Position {
    return { ...this.goalPosition };
  }

  public getCellType(position: Position): CellType {
    return this.grid[position.row][position.col];
  }
}