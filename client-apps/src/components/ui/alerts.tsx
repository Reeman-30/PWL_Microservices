import React, { FC } from "react";

type AlertVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "light"
  | "dark";

type AlertProps = {
  message?: string;
  variant?: AlertVariant;
  className?: string;
};

const Alert: FC<AlertProps> = ({
  message,
  variant = "warning",
  className = "",
}) => {
  return (
    <div
      className={`alert alert-${variant} alert-dismissible fade show ${className}`}
      role="alert"
    >
      {message}
      <button
        type="button"
        className="btn-close"
        data-bs-dismiss="alert"
        aria-label="Close"
      />
    </div>
  );
};

export { Alert };