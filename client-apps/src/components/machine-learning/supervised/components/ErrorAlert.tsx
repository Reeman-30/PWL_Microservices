"use client"
import React from "react";

interface ErrorAlertProps {
  error: string | null;
  onDismiss: () => void;
}

export function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
  if (!error) return null;

  return (
    <div className="alert alert-danger alert-dismissible fade show" role="alert">
      <i className="bi bi-exclamation-triangle-fill me-2"></i>
      <strong>Error:</strong> {error}
      <button
        type="button"
        className="btn-close"
        onClick={onDismiss}
        aria-label="Close"
      ></button>
    </div>
  );
}