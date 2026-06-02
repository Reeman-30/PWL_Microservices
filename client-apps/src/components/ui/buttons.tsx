import React, { ButtonHTMLAttributes, ReactNode, FC } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "light"
  | "dark";

type ButtonSize = "sm" | "md" | "lg";

type IconPosition = "left" | "right";

type ButtonProps = {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  outline?: boolean;
  icon?: string;
  iconPosition?: IconPosition;
  loading?: boolean;
  fullWidth?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const Button: FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  outline = false,
  icon,
  iconPosition = "left",
  disabled = false,
  loading = false,
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}) => {
  const variantClass = outline ? `btn-outline-${variant}` : `btn-${variant}`;
  const sizeClass = size !== "md" ? `btn-${size}` : "";
  const widthClass = fullWidth ? "w-100" : "";

  const buttonClasses = [
    "btn",
    "fw-semibold",
    variantClass,
    sizeClass,
    widthClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          />
          Loading...
        </>
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <i className={`bi bi-${icon} me-2`} />
          )}

          {children}

          {icon && iconPosition === "right" && (
            <i className={`bi bi-${icon} ms-2`} />
          )}
        </>
      )}
    </button>
  );
};

export { Button };