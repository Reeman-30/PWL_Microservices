"use client"
import React from "react";

interface EmptyStateProps {
  icon?: string;
  title?: string;
  message: string;
}

export function EmptyState({
  icon = "bi-bar-chart",
  title,
  message,
}: EmptyStateProps) {
  return (
    <div className="text-center py-5">
      <i className={`bi ${icon} fs-1 text-muted mb-3 d-block`}></i>
      {title && <h5 className="text-muted mb-2">{title}</h5>}
      <p className="text-muted">{message}</p>
    </div>
  );
}