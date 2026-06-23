import React, { FC, ReactNode } from "react";
import LayoutCVTemp from "@/components/computer-visions/layout-temp";

type Props = {
  children: ReactNode;
};

const Layout: FC<Props> = ({ children }) => {
  return <LayoutCVTemp>{children}</LayoutCVTemp>;
};

export default Layout;