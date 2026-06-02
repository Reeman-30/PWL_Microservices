import React, { FC, ReactNode } from "react";
import LayoutMicroservicesTemp from "@/components/microservices/layout-temp";

type Props = {
  children: ReactNode;
};

const Layout: FC<Props> = ({ children }) => {
  return <LayoutMicroservicesTemp>{children}</LayoutMicroservicesTemp>;
};

export default Layout;