import { useState, useRef } from "react";
import { QLearningAgent, GridWorld } from "../qlearning";
import { HYPERPARAMETERS } from "../constants";
import type { Episode, TrainingStats, Position, CellType } from "../types";

export function useQLearning(grid: CellType[][]) {
  const [isTraining, setIsTraining] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [trainingStats, setTrainingStats] = useState<TrainingStats | null>(null);
  const [agentPath, setAgentPath] = useState<Position[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const agentRef = useRef<QLearningAgent | null>(null);
  const worldRef = useRef<GridWorld | null>(null);

  const initializeAgent = () => {
    agentRef.current = new QLearningAgent();
    worldRef.current = new GridWorld(grid);
  };

  const trainAgent = async (numEpisodes: number) => {
    if (!agentRef.current || !worldRef.current) {
      initializeAgent();
    }

    setIsTraining(true);
    setEpisodes([]);
    setCurrentEpisode(0);

    const agent = agentRef.current!;
    const world = worldRef.current!;
    const episodeResults: Episode[] = [];

    for (let episode = 0; episode < numEpisodes; episode++) {
      let state = world.reset();
      let totalReward = 0;
      let steps = 0;
      let done = false;

      // Decay epsilon over time (more exploration at start, more exploitation later)
      const epsilon = Math.max(
        0.01,
        HYPERPARAMETERS.EPSILON * (1 - episode / numEpisodes)
      );
      agent.setEpsilon(epsilon);

      while (!done && steps < HYPERPARAMETERS.MAX_STEPS) {
        const action = agent.chooseAction(state);
        const { nextState, reward, done: isDone } = world.step(action);

        agent.updateQValue(state, action, reward, nextState);

        state = nextState;
        totalReward += reward;
        steps++;
        done = isDone;
      }

      const success = world.getCellType(state) === "goal";

      episodeResults.push({
        episode: episode + 1,
        steps,
        totalReward,
        success,
      });

      setCurrentEpisode(episode + 1);
      setEpisodes([...episodeResults]);

      // Add small delay for visualization
      if (episode % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    // Calculate training statistics
    const successCount = episodeResults.filter((e) => e.success).length;
    const avgSteps =
      episodeResults.reduce((sum, e) => sum + e.steps, 0) / numEpisodes;
    const avgReward =
      episodeResults.reduce((sum, e) => sum + e.totalReward, 0) / numEpisodes;

    setTrainingStats({
      totalEpisodes: numEpisodes,
      successRate: (successCount / numEpisodes) * 100,
      averageSteps: avgSteps,
      averageReward: avgReward,
    });

    setIsTraining(false);
  };

  const playOptimalPath = async () => {
    if (!agentRef.current || !worldRef.current) {
      return;
    }

    setIsPlaying(true);
    const agent = agentRef.current;
    const world = worldRef.current;

    let state = world.reset();
    const path: Position[] = [{ ...state }];
    let done = false;
    let steps = 0;

    // Use greedy policy (epsilon = 0)
    agent.setEpsilon(0);

    while (!done && steps < HYPERPARAMETERS.MAX_STEPS) {
      const action = agent.getBestAction(state);
      const { nextState, done: isDone } = world.step(action);

      state = nextState;
      path.push({ ...state });
      done = isDone;
      steps++;

      setAgentPath([...path]);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setIsPlaying(false);
  };

  const resetAgent = () => {
    agentRef.current = null;
    worldRef.current = null;
    setEpisodes([]);
    setCurrentEpisode(0);
    setTrainingStats(null);
    setAgentPath([]);
    setIsPlaying(false);
  };

  return {
    isTraining,
    episodes,
    currentEpisode,
    trainingStats,
    agentPath,
    isPlaying,
    trainAgent,
    playOptimalPath,
    resetAgent,
    agent: agentRef.current,
  };
}