import React, { FC, ReactNode } from "react";
import { Cards } from "@/components/ui/cards";

type CardCalculatesProps = {
  title: ReactNode;
  value: ReactNode;
  icon?: string;
  color?: string;
  className?: string;
};

const CardCalculates: FC<CardCalculatesProps> = ({
  title,
  value,
  icon,
  color = "#437059",
  className = "",
}) => {
  return (
    <Cards>
      <Cards.Body>
        <div
          className={`d-flex justify-content-between align-items-center ${className}`}
        >
          <div>
            <p className="text-muted mb-1 small">{title}</p>
            <h4 className="mb-0" style={{ color }}>
              {value}
            </h4>
          </div>

          <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{
              backgroundColor: `${color}1A`, // opacity ~10%
              width: 40,
              height: 40,
            }}
          >
            {icon && <i className={`bi bi-${icon} fs-4`} style={{ color }} />}
          </div>
        </div>
      </Cards.Body>
    </Cards>
  );
};

export { CardCalculates };
