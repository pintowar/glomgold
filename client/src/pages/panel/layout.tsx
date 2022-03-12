import React from "react";
import { Layout, Menu } from 'antd';

import './panel.css'
import { useLogout } from "@pankod/refine-core";
import routerProvider from "@pankod/refine-react-router-v6";
import { LocalStorage } from "LocalStorage";

const { Link } = routerProvider;

const { Header, Content, Footer } = Layout;

export const PanelLayout: React.FC = ({children}) => {
    const storage = LocalStorage.getInstance()
    const isLogged = Object.keys(storage.getUser()).length !== 0;

    const { mutate: logout } = useLogout();

    return isLogged ? (
        <Layout>
            <Header style={{ position: 'fixed', zIndex: 1, width: '100%' }}>
                <div className="logo">
                    Glomgold
                </div>
                <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['menu-panel']}>
                    <Menu.Item key="menu-panel">
                        <Link to={'/panel'}>Panel</Link>
                    </Menu.Item>
                    <Menu.Item key="menu-report">
                        <Link to={'/report'}>Report</Link>
                    </Menu.Item>
                    <Menu.Item key="menu-logout" onClick={() => logout()}>Logout</Menu.Item>
                </Menu>
            </Header>
            <Content className="site-layout">
                {children}
            </Content>
            <Footer style={{ textAlign: 'center' }}>Glomgold ©2022 Created by pintowar</Footer>
        </Layout>
    ) : null;
};