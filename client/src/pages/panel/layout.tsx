import React from "react";

import { Layout, Menu } from 'antd';

const { Header, Content, Footer } = Layout;

export const PanelLayout: React.FC = ({children}) => {

    return (
        <Layout>
            <Header style={{ position: 'fixed', zIndex: 1, width: '100%' }}>
                {/* <div className="logo">
                    Glomgold
                </div> */}
                <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['menu-panel']}>
                    <Menu.Item key="menu-panel">Panel</Menu.Item>
                    <Menu.Item key="menu-report">Report</Menu.Item>
                </Menu>
            </Header>
            <Content className="site-layout" style={{ backgroundColor: '#508bfc', minHeight: '100vh', padding: '0 50px', marginTop: 64 }}>
                {/* <Breadcrumb style={{ margin: '16px 0' }}>
                    <Breadcrumb.Item>Panel</Breadcrumb.Item>
                </Breadcrumb> */}
                {children}
            </Content>
            <Footer style={{ textAlign: 'center' }}>Glomgold ©2022 Created by pintowar</Footer>
        </Layout>
    );
};