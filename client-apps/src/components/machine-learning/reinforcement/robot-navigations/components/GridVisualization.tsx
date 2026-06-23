
import React from "react";
import type { CellType, Position } from "../types";

interface GridVisualizationProps {
  grid: CellType[][];
  agentPath?: Position[];
  currentPosition?: number;
}

export function GridVisualization({
  grid,
  agentPath = [],
  currentPosition,
}: GridVisualizationProps) {
  const getCellClass = (row: number, col: number, type: CellType): string => {
    const baseClass = "border d-flex align-items-center justify-content-center";
    const sizeClass = "position-relative";

    // Check if this cell is in the agent's path
    const isInPath = agentPath.some((pos) => pos.row === row && pos.col === col);
    const pathIndex = agentPath.findIndex(
      (pos) => pos.row === row && pos.col === col
    );
    const isCurrentPosition =
      currentPosition !== undefined && pathIndex === currentPosition;

    let colorClass = "bg-light";
    if (type === "goal") colorClass = "bg-success";
    else if (type === "trap") colorClass = "bg-danger";
    else if (type === "wall") colorClass = "bg-secondary";
    else if (type === "agent") colorClass = "bg-primary";
    else if (isInPath) colorClass = "bg-info bg-opacity-25";

    return `${baseClass} ${sizeClass} ${colorClass}`;
  };

  const getCellIcon = (type: CellType): string => {
    switch (type) {
      case "goal":
        return "🏆";
      case "trap":
        return "💀";
      case "wall":
        return "🧱";
      case "agent":
        return "🤖";
      default:
        return "";
    }
  };

  return (
    <div className="d-inline-block border border-dark rounded p-2 bg-white">
      <div className="d-flex flex-column gap-1">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="d-flex gap-1">
            {row.map((cell, colIndex) => {
              const pathIndex = agentPath.findIndex(
                (pos) => pos.row === rowIndex && pos.col === colIndex
              );
              const isCurrentPosition =
                currentPosition !== undefined && pathIndex === currentPosition;

              return (
                <div
                  key={colIndex}
                  className={getCellClass(rowIndex, colIndex, cell)}
                  style={{
                    width: "60px",
                    height: "60px",
                    fontSize: "24px",
                  }}
                >
                  {isCurrentPosition ? (
                    <span className="animate-bounce">🤖</span>
                  ) : (
                    getCellIcon(cell)
                  )}
                  {pathIndex >= 0 && !isCurrentPosition && (
                    <span
                      className="position-absolute top-0 start-0 badge bg-info text-dark"
                      style={{ fontSize: "10px" }}
                    >
                      {pathIndex + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}