"use client"
import React from "react";

interface DatasetColumn {
  key: string;
  label: string;
  icon?: string;
  format?: (value: any) => string;
}

interface DatasetTableProps {
  columns: DatasetColumn[];
  data: any[][];
  labels: number[][];
  labelMapping?: Record<number, { label: string; className: string }>;
}

export function DatasetTable({
  columns,
  data,
  labels,
  labelMapping = {
    1: { label: "Lulus", className: "bg-success" },
    0: { label: "Tidak Lulus", className: "bg-danger" },
  },
}: DatasetTableProps) {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-secondary text-white">
        <h5 className="mb-0">
          <i className="bi bi-table me-2"></i>
          Dataset Training ({data.length} Data)
        </h5>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                {columns.map((col, idx) => (
                  <th key={idx}>
                    {col.icon && <i className={`bi ${col.icon} me-1`}></i>}
                    {col.label}
                  </th>
                ))}
                <th>
                  <i className="bi bi-award me-1"></i>Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => {
                const labelValue = labels[rowIndex][0];
                const labelInfo = labelMapping[labelValue];

                return (
                  <tr key={rowIndex}>
                    <td>{rowIndex + 1}</td>
                    {row.map((cell, cellIndex) => {
                      const column = columns[cellIndex];
                      const formattedValue = column?.format
                        ? column.format(cell)
                        : cell;
                      return <td key={cellIndex}>{formattedValue}</td>;
                    })}
                    <td>
                      <span className={`badge ${labelInfo?.className || "bg-secondary"}`}>
                        {labelInfo?.label || labelValue}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}