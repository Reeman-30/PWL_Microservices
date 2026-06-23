
import React, { useEffect, useRef } from "react";

interface ElbowPoint {
  k: number;
  wcss: number;
}

interface ElbowChartProps {
  data: ElbowPoint[];
  optimalK: number | null;
  width?: number;
  height?: number;
}

export function ElbowChart({ 
  data, 
  optimalK, 
  width = 800, 
  height = 400 
}: ElbowChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up padding and dimensions
    const padding = { top: 40, right: 40, bottom: 60, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find min and max values
    const maxWCSS = Math.max(...data.map((d) => d.wcss));
    const minWCSS = Math.min(...data.map((d) => d.wcss));
    const maxK = Math.max(...data.map((d) => d.k));

    // Scale functions
    const scaleX = (k: number) => padding.left + (k / maxK) * chartWidth;
    const scaleY = (wcss: number) =>
      padding.top + chartHeight - ((wcss - minWCSS) / (maxWCSS - minWCSS)) * chartHeight;

    // Draw axes
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // Draw Y-axis labels and grid lines
    ctx.fillStyle = "#666";
    ctx.font = "12px Arial";
    ctx.textAlign = "right";
    
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const wcss = minWCSS + (i / ySteps) * (maxWCSS - minWCSS);
      const y = scaleY(wcss);
      
      // Grid line
      ctx.strokeStyle = "#e0e0e0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      // Label
      ctx.fillText(wcss.toFixed(0), padding.left - 10, y + 4);
    }

    // Draw X-axis labels
    ctx.textAlign = "center";
    data.forEach((point) => {
      const x = scaleX(point.k);
      ctx.fillText(point.k.toString(), x, height - padding.bottom + 20);
    });

    // Draw axis titles
    ctx.fillStyle = "#333";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Number of Clusters (K)", width / 2, height - 10);
    
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("WCSS (Within-Cluster Sum of Squares)", 0, 0);
    ctx.restore();

    // Draw line chart
    ctx.strokeStyle = "#0d6efd";
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.forEach((point, idx) => {
      const x = scaleX(point.k);
      const y = scaleY(point.wcss);
      
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw data points
    data.forEach((point) => {
      const x = scaleX(point.k);
      const y = scaleY(point.wcss);
      
      // Highlight optimal K
      if (optimalK && point.k === optimalK) {
        ctx.fillStyle = "#dc3545";
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw label for optimal K
        ctx.fillStyle = "#dc3545";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`Optimal K = ${optimalK}`, x, y - 15);
      } else {
        ctx.fillStyle = "#0d6efd";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

  }, [data, optimalK, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border rounded bg-white"
    />
  );
}