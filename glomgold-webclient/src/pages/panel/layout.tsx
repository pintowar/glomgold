import React from "react";
import { Layout } from "antd";

import "./panel.css";

const { Content, Footer } = Layout;
import { Header } from "../../components";

export const PanelLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <Layout>
      <Header sticky />
      <Content className="site-layout">{children}</Content>
      <Footer style={{ textAlign: "center" }}>Glomgold ©{new Date().getFullYear()} Created by pintowar</Footer>
    </Layout>
  );
};
