import React, { FC } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "light"
  | "dark";

type SkeletonProps = {
  lines?: number;
};

const Skeleton: FC<SkeletonProps> = ({ lines = 5 }) => {
  return (
    <div className="card">
      <div className="card-body">
        <div className="card-text placeholder-glow">
          {Array.from({ length: lines }).map((_, index) => (
            <span
              key={index}
              className={`placeholder col-${((index % 6) + 4)}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

type SpinnerProps = {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
};

const Spinner: FC<SpinnerProps> = ({
  variant = "primary",
  size = "md",
}) => {
  const sizeClass = size === "sm" ? "spinner-border-sm" : "";

  return (
    <div
      className={`spinner-border text-${variant} ${sizeClass}`}
      role="status"
    >
      <span className="visually-hidden">Loading...</span>
    </div>
  );
};

export { Skeleton, Spinner };