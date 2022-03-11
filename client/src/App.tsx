import { Refine } from "@pankod/refine-core";
import {
    notificationProvider,
    LoginPage,
    Layout,
    ErrorComponent,
} from "@pankod/refine-antd";
import dataProvider from "@pankod/refine-simple-rest";
import routerProvider from "@pankod/refine-react-router-v6";
import "@pankod/refine-antd/dist/styles.min.css";

import { ItemList, ItemCreate, ItemEdit, ItemShow } from "pages/items";
import { UserList, UserCreate, UserEdit, UserShow } from "pages/users";
import { ControlPanel, ReportPanel } from "pages/panel";
import { DashboardPage } from "pages/dashboard";
import { generateAuthProvider } from "authProvider";

import { API_URL } from "./constants";

import axios from 'axios';
import { LocalStorage } from "LocalStorage";

const axiosInstance = axios.create()
const authProvider = generateAuthProvider(axiosInstance)

const App: React.FC = () => {
    return (
        <Refine
            routerProvider={{
                ...routerProvider,
                routes: [
                    {
                        exact: true,
                        element: <ControlPanel axios={axiosInstance}/>,
                        path: '/panel',
                    },
                    {
                        exact: true,
                        element: <ReportPanel axios={axiosInstance}/>,
                        path: '/report',
                    }
                ]
            }}
            dataProvider={dataProvider(API_URL, axiosInstance)}
            resources={[
                {
                    name: "users", list: UserList, create: UserCreate, edit: UserEdit, show: UserShow, canDelete: true
                },
                {
                    name: "items", list: ItemList, create: ItemCreate, edit: ItemEdit, show: ItemShow, canDelete: true
                }
            ]}
            notificationProvider={notificationProvider}
            authProvider={authProvider}
            accessControlProvider={{
                can: async ({ resource }) => {
                    const roles = LocalStorage.getInstance().getUserRoles()

                    const isAdmin = roles.includes('ROLE_ADMIN')
                    const isAdminResource = ['dashboard', 'users', 'items'].includes(resource)
                    const cond = !isAdmin && isAdminResource ? false : true
                    return { can: cond }
                }
            }}
            LoginPage={LoginPage}
            Layout={Layout}
            DashboardPage={DashboardPage}
            catchAll={<ErrorComponent />}
        />
    );
};

export default App;
