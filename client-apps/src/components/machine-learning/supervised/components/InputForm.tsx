"use client"
import React from "react";

interface InputField {
  name: string;
  label: string;
  icon: string;
  color: string;
  min: number;
  max: number;
}

interface InputFormProps {
  fields: InputField[];
  values: Record<string, number>;
  onChange: (field: string, value: number) => void;
  onSubmit: () => void;
  isDisabled: boolean;
  submitLabel: string;
}

export function InputForm({
  fields,
  values,
  onChange,
  onSubmit,
  isDisabled,
  submitLabel,
}: InputFormProps) {
  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-warning text-dark">
        <h5 className="mb-0">
          <i className="bi bi-pencil-square me-2"></i>
          Input Data Mahasiswa
        </h5>
      </div>
      <div className="card-body">
        {fields.map((field) => (
          <div key={field.name} className="mb-4">
            <label className="form-label fw-bold">
              <i className={`bi ${field.icon} text-${field.color} me-2`}></i>
              {field.label} ({field.min}-{field.max})
            </label>
            <input
              type="range"
              className="form-range"
              min={field.min}
              max={field.max}
              value={values[field.name]}
              onChange={(e) => onChange(field.name, Number(e.target.value))}
              disabled={isDisabled}
            />
            <div className="d-flex justify-content-between align-items-center mt-2">
              <input
                type="number"
                className="form-control form-control-sm"
                style={{ width: "80px" }}
                min={field.min}
                max={field.max}
                value={values[field.name]}
                onChange={(e) => onChange(field.name, Number(e.target.value))}
                disabled={isDisabled}
              />
              <span className={`badge bg-${field.color} fs-6`}>
                {values[field.name]}{field.max === 100 ? "%" : ""}
              </span>
            </div>
          </div>
        ))}

        <div className="d-grid">
          <button
            className="btn btn-warning btn-lg fw-bold"
            onClick={onSubmit}
            disabled={isDisabled}
          >
            <i className="bi bi-lightning-charge-fill me-2"></i>
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}