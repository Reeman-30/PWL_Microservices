/* eslint-disable react/display-name */
/* eslint-disable react-hooks/error-boundaries */
import React, { ReactNode, FC, isValidElement } from "react";
import { Alert } from "@/components/ui/alerts";

type CardsProps = {
  children: ReactNode;
};

type SectionProps = {
  children?: ReactNode;
  className?: string;
};

type CardsComponent = FC<CardsProps> & {
  Header: FC<SectionProps>;
  Toolbar: FC<SectionProps>;
  Body: FC<SectionProps>;
  Footer: FC<SectionProps>;
};

const Cards: CardsComponent = ({ children }) => {
  let header: React.ReactElement | null = null;
  let toolbar: React.ReactElement | null = null;
  let body: React.ReactElement | null = null;
  let footer: React.ReactElement | null = null;

  React.Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    if (child.type === Cards.Header) {
      header = child;
    } else if (child.type === Cards.Toolbar) {
      toolbar = child;
    } else if (child.type === Cards.Body) {
      body = child;
    } else if (child.type === Cards.Footer) {
      footer = child;
    }
  });

  try {
    return (
      <div className="card card-xl-stretch mb-4 shadow-sm">
        {header && (
          <div className="card-header border-0 py-0 bg-white">
            {header}
            {toolbar && <div className="card-toolbar">{toolbar}</div>}
          </div>
        )}

        {body}
        {footer}
      </div>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return <Alert message={message} />;
  }
};

Cards.Header = ({ children }) => (
  <div className="d-flex align-items-start justify-content-between mb-0 pt-3">
    {children}
  </div>
);

Cards.Toolbar = ({ children }) => <div>{children}</div>;

Cards.Body = ({ children, className = "" }) => {
  return <div className={`card-body ${className}`}>{children}</div>;
};

Cards.Footer = ({ children, className = "" }) => (
  <div className={`card-footer ${className}`}>{children}</div>
);

export { Cards };