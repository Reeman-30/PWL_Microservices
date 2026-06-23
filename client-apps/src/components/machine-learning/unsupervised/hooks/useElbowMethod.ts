
import { useState, useEffect } from "react";
import { kmeans } from "ml-kmeans";

interface ElbowPoint {
  k: number;
  wcss: number; // Within-Cluster Sum of Squares
}

export function useElbowMethod(data: number[][], maxK: number = 10) {
  const [elbowData, setElbowData] = useState<ElbowPoint[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [optimalK, setOptimalK] = useState<number | null>(null);

  const calculateWCSS = (data: number[][], centroids: number[][], clusters: number[]): number => {
    let wcss = 0;
    
    data.forEach((point, idx) => {
      const cluster = clusters[idx];
      const centroid = centroids[cluster];
      
      const distance = Math.sqrt(
        point.reduce((sum, val, i) => sum + Math.pow(val - centroid[i], 2), 0)
      );
      
      wcss += distance * distance;
    });
    
    return wcss;
  };

  const findOptimalK = (elbowPoints: ElbowPoint[]): number => {
    if (elbowPoints.length < 3) return 2;

    // Calculate the rate of change (derivative)
    const derivatives: number[] = [];
    for (let i = 1; i < elbowPoints.length; i++) {
      const derivative = elbowPoints[i - 1].wcss - elbowPoints[i].wcss;
      derivatives.push(derivative);
    }

    // Find the elbow point (where the rate of change decreases significantly)
    let maxDecrease = 0;
    let elbowIndex = 1;
    
    for (let i = 1; i < derivatives.length; i++) {
      const decrease = derivatives[i - 1] - derivatives[i];
      if (decrease > maxDecrease) {
        maxDecrease = decrease;
        elbowIndex = i;
      }
    }

    return elbowPoints[elbowIndex].k;
  };

  const calculateElbowMethod = async () => {
    setIsCalculating(true);
    const results: ElbowPoint[] = [];

    // Calculate WCSS for k from 1 to maxK
    for (let k = 1; k <= maxK; k++) {
      try {
        if (k === 1) {
          // For k=1, WCSS is the sum of squared distances from the mean
          const mean = data[0].map((_, colIdx) => {
            const sum = data.reduce((acc, row) => acc + row[colIdx], 0);
            return sum / data.length;
          });

          const wcss = data.reduce((sum, point) => {
            const distance = Math.sqrt(
              point.reduce((s, val, i) => s + Math.pow(val - mean[i], 2), 0)
            );
            return sum + distance * distance;
          }, 0);

          results.push({ k, wcss });
        } else {
          const result = kmeans(data, k, {
            initialization: "kmeans++",
            maxIterations: 100,
          });

          const wcss = calculateWCSS(data, result.centroids, result.clusters);
          results.push({ k, wcss });
        }
      } catch (error) {
        console.error(`Error calculating WCSS for k=${k}:`, error);
      }

      // Add delay to simulate processing
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setElbowData(results);
    const optimal = findOptimalK(results);
    setOptimalK(optimal);
    setIsCalculating(false);
  };

  return {
    elbowData,
    isCalculating,
    optimalK,
    calculateElbowMethod,
  };
}