"use client";

import React, { useState, ReactNode, FC } from "react";
import { Modal } from "react-bootstrap";
import { Button } from "@/components/ui/buttons";

type ModalSize = "sm" | "lg" | "xl";

type ModalState = {
  open: boolean;
  header?: ReactNode;
  message?: ReactNode;
  size?: ModalSize;
  footer?: ReactNode;
  onClose?: () => void;
  closable?: boolean;
};

type ModalResponseProps = {
  title?: ReactNode;
  message?: ReactNode;
  variant?: "success" | "danger";
};


const states: {
  setState: React.Dispatch<React.SetStateAction<ModalState>> | null;
  changeState: (data: Partial<ModalState>) => void;
} = {
  setState: null,
  changeState(data) {
    if (!this.setState) return;
    this.setState((prev) => ({
      ...prev,
      ...data,
    }));
  },
};


const handleClose = () => {
  states.changeState({ open: false });
};

const Modals: FC = () => {
  const [data, setData] = useState<ModalState>({
    open: false,
    header: "",
    message: "",
    size: "lg",
    footer: undefined,
    onClose: handleClose,
    closable: true,
  });

  states.setState = setData;

  return (
    <Modal
      show={data.open}
      onHide={data.closable ? data.onClose : undefined}
      size={data.size}
      backdrop="static"
      keyboard={false}
    >
      {data.header && (
        <Modal.Header>
          <h3 className="modal-title">{data.header}</h3>

          {data.closable && (
            <button onClick={data.onClose} className="btn-close" />
          )}
        </Modal.Header>
      )}

      <Modal.Body>{data.message}</Modal.Body>

      {data.footer && (
        <Modal.Footer>
          {data.closable && (
            <Button
              variant="secondary"
              outline
              className="px-5"
              onClick={data.onClose}
            >
              Close
            </Button>
          )}
          {data.footer}
        </Modal.Footer>
      )}
    </Modal>
  );
};

const ModalResponse: FC<ModalResponseProps> = ({
  title,
  message,
  variant = "success",
}) => {
  const isSuccess = variant === "success";

  return (
    <div className="text-center py-8">
      <i
        className={`bi ${
          isSuccess ? "bi-check2-circle text-success" : "bi-x-circle text-danger"
        }`}
        style={{ fontSize: "6em" }}
      />

      {title && (
        <h1 className={isSuccess ? "text-success" : "text-danger"}>
          {title}
        </h1>
      )}

      <p className="mb-4">
        {message ?? "There is some error on server"}
      </p>

      <Button onClick={() => openModal({ open: false })}>
        Ok, got it!
      </Button>
    </div>
  );
};

const openModal = (config: Partial<ModalState>) => {
  states.changeState({
    ...config,
    open: config.open ?? true,
    onClose:
      config.closable === false
        ? undefined
        : () => {
            config.onClose?.();
            handleClose();
          },
  });
};

export default Modals;
export { openModal, ModalResponse };