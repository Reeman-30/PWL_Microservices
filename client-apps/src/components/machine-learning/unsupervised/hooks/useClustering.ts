
import { useState } from "react";
import { kmeans } from "ml-kmeans";

interface ClusterResult {
  clusters: number[];
  centroids: number[][];
  iterations: number;
}

interface StudentCluster {
  data: number[];
  cluster: number;
  label: string;
  distance: number;
}

interface ClusterStats {
  cluster0: {
    count: number;
    label: string;
    avgScore: number;
  };
  cluster1: {
    count: number;
    label: string;
    avgScore: number;
  };
}

export function useClustering(trainingData: number[][]) {
  const [clusterResult, setClusterResult] = useState<ClusterResult | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [studentClusters, setStudentClusters] = useState<StudentCluster[]>([]);

  const calculateDistance = (point: number[], centroid: number[]): number => {
    return Math.sqrt(
      point.reduce(
        (sum, val, idx) => sum + Math.pow(val - centroid[idx], 2),
        0,
      ),
    );
  };

  const determineClusterLabel = (centroids: number[][]): string[] => {
    const centroidAverages = centroids.map(
      (centroid) =>
        centroid.reduce((sum, val) => sum + val, 0) / centroid.length,
    );

    const maxAvg = Math.max(...centroidAverages);
    return centroids.map((_, idx) =>
      centroidAverages[idx] === maxAvg ? "Lulus" : "Tidak Lulus",
    );
  };

  const performClustering = () => {
    setIsTraining(true);

    setTimeout(() => {
      try {
        const result = kmeans(trainingData, 2, {
          initialization: "kmeans++",
          maxIterations: 100,
        });

        const clusterLabels = determineClusterLabel(result.centroids);

        const studentsWithClusters: StudentCluster[] = trainingData.map(
          (data, idx) => {
            const cluster = result.clusters[idx];
            const distance = calculateDistance(data, result.centroids[cluster]);

            return {
              data,
              cluster,
              label: clusterLabels[cluster],
              distance,
            };
          },
        );

        setClusterResult({
          clusters: result.clusters,
          centroids: result.centroids,
          iterations: result.iterations,
        });
        setStudentClusters(studentsWithClusters);
        setIsTraining(false);
      } catch (error) {
        console.error("Error during clustering:", error);
        setIsTraining(false);
      }
    }, 1000);
  };

  const getClusterStats = (): ClusterStats | null => {
    if (!clusterResult) return null;

    const cluster0 = studentClusters.filter((s) => s.cluster === 0);
    const cluster1 = studentClusters.filter((s) => s.cluster === 1);

    return {
      cluster0: {
        count: cluster0.length,
        label: cluster0[0]?.label || "Unknown",
        avgScore:
          cluster0.reduce(
            (sum, s) => sum + s.data.reduce((a, b) => a + b, 0) / s.data.length,
            0,
          ) / cluster0.length,
      },
      cluster1: {
        count: cluster1.length,
        label: cluster1[0]?.label || "Unknown",
        avgScore:
          cluster1.reduce(
            (sum, s) => sum + s.data.reduce((a, b) => a + b, 0) / s.data.length,
            0,
          ) / cluster1.length,
      },
    };
  };

  return {
    clusterResult,
    isTraining,
    studentClusters,
    performClustering,
    getClusterStats,
  };
}