import { useState, useEffect, useRef } from "react";

interface TrainingData {
  inputs: number[][];
  outputs: number[][];
}

interface TrainingOptions {
  learningRate?: number;
  epochs?: number;
}

interface VerificationResult {
  input: number[];
  actual: number;
  predicted: number;
  match: boolean;
}

export function useLogisticRegression() {
  const [modelParams, setModelParams] = useState<number[] | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isModelReady, setIsModelReady] = useState(false);
  const [trainingAccuracy, setTrainingAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ref untuk track apakah komponen masih mounted
  // Mencegah setState dipanggil setelah komponen di-unmount (pindah halaman)
  const isMountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      // Cleanup saat komponen unmount (pindah halaman)
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Sigmoid function
  const sigmoid = (z: number): number => {
    return 1 / (1 + Math.exp(-z));
  };

  // Predict using logistic regression
  const predictLogistic = (input: number[], params: number[]): number => {
    let z = params[0]; // bias
    for (let i = 0; i < input.length; i++) {
      z += params[i + 1] * input[i];
    }
    return sigmoid(z);
  };

  // Train logistic regression using gradient descent
  const trainLogisticRegression = (
    inputs: number[][],
    outputs: number[][],
    learningRate: number,
    epochs: number
  ): number[] => {
    const numFeatures = inputs[0].length;
    const params = new Array(numFeatures + 1).fill(0); // [bias, w1, w2, ..., wn]

    for (let epoch = 0; epoch < epochs; epoch++) {
      const gradients = new Array(numFeatures + 1).fill(0);

      // Calculate gradients
      for (let i = 0; i < inputs.length; i++) {
        const prediction = predictLogistic(inputs[i], params);
        const error = prediction - outputs[i][0];

        gradients[0] += error; // bias gradient
        for (let j = 0; j < numFeatures; j++) {
          gradients[j + 1] += error * inputs[i][j];
        }
      }

      // Update parameters
      for (let j = 0; j < params.length; j++) {
        params[j] -= (learningRate * gradients[j]) / inputs.length;
      }
    }

    return params;
  };

  // Train model
  const trainModel = async (
    data: TrainingData,
    options: TrainingOptions = {}
  ) => {
    const { learningRate = 0.1, epochs = 3000 } = options;

    try {
      if (!isMountedRef.current) return;
      setIsTraining(true);
      setError(null);
      setTrainingProgress(0);

      // Simulate progress updates — simpan ke ref agar bisa di-cleanup saat unmount
      intervalRef.current = setInterval(() => {
        if (!isMountedRef.current) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          return;
        }
        setTrainingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            return prev;
          }
          return prev + 10;
        });
      }, 50);

      // Train the model
      const params = trainLogisticRegression(
        data.inputs,
        data.outputs,
        learningRate,
        epochs
      );

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Guard: jangan setState jika sudah unmount
      if (!isMountedRef.current) return;

      setTrainingProgress(100);

      // Calculate training accuracy
      let correct = 0;
      for (let i = 0; i < data.inputs.length; i++) {
        const prob = predictLogistic(data.inputs[i], params);
        const pred = prob >= 0.5 ? 1 : 0;
        if (pred === data.outputs[i][0]) correct++;
      }
      const accuracy = (correct / data.inputs.length) * 100;

      setModelParams(params);
      setTrainingAccuracy(accuracy);
      setIsModelReady(true);
      setIsTraining(false);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(
        `Gagal melatih model: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      setIsTraining(false);
      setTrainingProgress(0);
    }
  };

  // Make prediction
  const predict = (input: number[]): number | null => {
    if (!modelParams) {
      setError("Model belum siap. Silakan latih model terlebih dahulu.");
      return null;
    }

    try {
      setError(null);
      return predictLogistic(input, modelParams);
    } catch (err) {
      setError(
        `Gagal melakukan prediksi: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      return null;
    }
  };

  // Verify training data
  const verifyTrainingData = (
    data: TrainingData
  ): VerificationResult[] | null => {
    if (!modelParams) {
      setError("Model belum siap. Silakan latih model terlebih dahulu.");
      return null;
    }

    try {
      const results: VerificationResult[] = [];

      for (let i = 0; i < data.inputs.length; i++) {
        const prob = predictLogistic(data.inputs[i], modelParams);
        const predicted = prob >= 0.5 ? 1 : 0;
        const actual = data.outputs[i][0];

        results.push({
          input: data.inputs[i],
          actual,
          predicted: prob,
          match: predicted === actual,
        });
      }

      return results;
    } catch (err) {
      setError(
        `Gagal memverifikasi data: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      return null;
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Reset model
  const resetModel = () => {
    setModelParams(null);
    setIsModelReady(false);
    setTrainingAccuracy(null);
    setTrainingProgress(0);
    setError(null);
  };

  return {
    modelParams,
    isTraining,
    trainingProgress,
    isModelReady,
    trainingAccuracy,
    error,
    trainModel,
    predict,
    verifyTrainingData,
    clearError,
    resetModel,
  };
}