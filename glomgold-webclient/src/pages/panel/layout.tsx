import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Layout, Menu } from "antd";

import "./panel.css";
import { useAuthenticated, useLogout, usePermissions } from "@pankod/refine-core";
import routerProvider from "@pankod/refine-react-router-v6";

const { Link } = routerProvider;

const { Header, Content, Footer } = Layout;

export const PanelLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { isSuccess } = useAuthenticated();
    const { data: permissionsData } = usePermissions();

    const isAdmin = permissionsData?.includes("ROLE_ADMIN");

    const { mutate: logout } = useLogout();

    const location = useLocation();
    const [selectedMenu, setSelectedMenu] = useState(
        location.pathname.includes("report")
            ? "menu-report"
            : location.pathname.includes("profile")
            ? "menu-profile"
            : "menu-panel"
    );

    const handleClick = (key: string) => setSelectedMenu(key);

    const menuItems = [
        { key: "menu-panel", label: <Link to={"/panel"}>Panel</Link> },
        { key: "menu-report", label: <Link to={"/panel/report"}>Report</Link> },
        { key: "menu-profile", label: <Link to={"/panel/profile"}>Profile</Link> },
        { key: `${isAdmin ? "admin" : ""}`, label: <Link to={"/"}>Admin</Link> },
        { key: "menu-logout", label: <div onClick={() => logout()}>Logout</div> },
    ].filter(({ key }) => key);

    return isSuccess ? (
        <Layout>
            <Header style={{ position: "fixed", zIndex: 1, width: "100%" }}>
                <div className="logo">Glomgold</div>
                <Menu
                    onClick={(e) => handleClick(e.key)}
                    theme="dark"
                    mode="horizontal"
                    selectedKeys={[selectedMenu]}
                    items={menuItems}
                ></Menu>
            </Header>
            <Content className="site-layout">{children}</Content>
            <Footer style={{ textAlign: "center" }}>Glomgold ©2022 Created by pintowar</Footer>
        </Layout>
    ) : null;
};
