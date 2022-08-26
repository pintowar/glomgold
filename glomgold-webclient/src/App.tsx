import React from "react";
import { Refine } from "@pankod/refine-core";
import { notificationProvider, Layout, ErrorComponent, Icons } from "@pankod/refine-antd";
import dataProvider from "@pankod/refine-simple-rest";
import routerProvider from "@pankod/refine-react-router-v6";
import "@pankod/refine-antd/dist/styles.min.css";

import { ItemList, ItemCreate, ItemEdit, ItemShow } from "./pages/items";
import { UserList, UserCreate, UserEdit, UserShow } from "./pages/users";
import { ControlPanel, ReportPanel, ProfilePanel } from "./pages/panel";
import { DashboardPage } from "./pages/dashboard";
import { LoginPage } from "./pages/login";
import { Title, Sider } from "./components";
import { axiosInstance, authProvider } from "./authProvider";

import { API_URL } from "./constants";

import { LocalStorage } from "./LocalStorage";

const App: React.FC = () => {
    return (
        <Refine
            routerProvider={{
                ...routerProvider,
                routes: [
                    {
                        element: <ControlPanel />,
                        path: "/panel",
                    },
                    {
                        element: <ReportPanel />,
                        path: "/panel/report",
                    },
                    {
                        element: <ProfilePanel />,
                        path: "/panel/profile",
                    },
                ],
            }}
            dataProvider={dataProvider(API_URL, axiosInstance)}
            resources={[
                {
                    name: "users",
                    list: UserList,
                    create: UserCreate,
                    edit: UserEdit,
                    show: UserShow,
                    canDelete: true,
                    icon: <Icons.UsergroupAddOutlined />,
                },
                {
                    name: "items",
                    list: ItemList,
                    create: ItemCreate,
                    edit: ItemEdit,
                    show: ItemShow,
                    canDelete: true,
                    icon: <Icons.ShopOutlined />,
                },
            ]}
            notificationProvider={notificationProvider}
            authProvider={authProvider}
            accessControlProvider={{
                can: async ({ resource }) => {
                    const roles = LocalStorage.getInstance().getUserRoles();

                    const isAdmin = roles.includes("ROLE_ADMIN");
                    const isAdminResource = ["dashboard", "users", "items"].includes(resource);
                    const cond = !(!isAdmin && isAdminResource);
                    return { can: cond };
                },
            }}
            Title={Title}
            Sider={Sider}
            LoginPage={LoginPage}
            Layout={Layout}
            DashboardPage={DashboardPage}
            catchAll={<ErrorComponent />}
        />
    );
};

export default App;
