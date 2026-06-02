import React, {
  FC,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";

const ALLOWED_PATTERN =
  /^[a-zA-Z0-9\s.,!?@#$%&*()\-_+=:;"'<>\/\[\]{}|\\~`]*$/;

const validateInput = (value: string): boolean => {
  return ALLOWED_PATTERN.test(value);
};

const sanitizeInput = (value: string): string => {
  return value.replace(
    /[^a-zA-Z0-9\s.,!?@#$%&*()\-_+=:;"'<>\/\[\]{}|\\~`]/g,
    ""
  );
};

type LabelTitleProps = {
  title: ReactNode;
  required?: boolean;
};

const LabelTitle: FC<LabelTitleProps> = ({ title, required }) => {
  return (
    <label className={`form-label fw-semibold ${required ? "required" : ""}`}>
      {title}
    </label>
  );
};

type TextInputProps = {
  title?: ReactNode;
  required?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

const TextInput: FC<TextInputProps> = ({
  title,
  required,
  className = "",
  ...props
}) => {
  return (
    <div className="form-group mb-3">
      {title && <LabelTitle title={title} required={required} />}

      <input
        type="text"
        required={required}
        className={`form-control ${className}`}
        {...props}
      />
    </div>
  );
};

/* =======================
   TEXTAREA
======================= */

type TextAreaInputProps = {
  title?: ReactNode;
  required?: boolean;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

const TextAreaInput: FC<TextAreaInputProps> = ({
  title,
  required,
  className = "",
  ...props
}) => {
  return (
    <div className="form-group mb-3">
      {title && <LabelTitle title={title} required={required} />}

      <textarea
        required={required}
        className={`form-control ${className}`}
        {...props}
      />
    </div>
  );
};

type InputCheckboxProps = {
  title?: ReactNode;
  label?: ReactNode;
  isSwitch?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

const InputCheckbox: FC<InputCheckboxProps> = ({
  title,
  label,
  isSwitch = false,
  className = "",
  ...props
}) => {
  return (
    <div className="form-group">
      {title && <LabelTitle title={title} />}

      <div className={`form-check ${isSwitch ? "form-switch" : ""}`}>
        <input
          type="checkbox"
          className={`form-check-input ${className}`}
          {...props}
        />
        {label && <label className="form-check-label ms-1">{label}</label>}
      </div>
    </div>
  );
};

type InputImageProps = {
  title?: ReactNode;
  imagePreview?: string;
  required?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

const InputImage: FC<InputImageProps> = ({
  title,
  imagePreview,
  required,
  className = "",
  id,
  ...props
}) => {
  return (
    <div className="form-group mb-3">
      {title && <LabelTitle title={title} required={required} />}

      <input
        type="file"
        accept="image/*"
        required={required}
        id={id}
        className={`form-control ${className}`}
        {...props}
      />

      {imagePreview && (
        <div className="mt-3">
          <img
            src={imagePreview}
            alt="Preview"
            className="img-thumbnail"
            style={{
              maxWidth: "200px",
              maxHeight: "300px",
              objectFit: "cover",
            }}
          />
        </div>
      )}
    </div>
  );
};

export {
  validateInput,
  sanitizeInput,
  TextInput,
  TextAreaInput,
  InputCheckbox,
  InputImage,
};