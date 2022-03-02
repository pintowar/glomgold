import { Refine } from "@pankod/refine-core";
import {
    notificationProvider,
    Layout,
    ErrorComponent,
} from "@pankod/refine-antd";
import dataProvider from "@pankod/refine-simple-rest";
import routerProvider from "@pankod/refine-react-router-v6";
import "@pankod/refine-antd/dist/styles.min.css";

import { ItemList, ItemCreate, ItemEdit, ItemShow } from "pages/items";
import { UserList, UserCreate, UserEdit, UserShow } from "pages/users";

const API_URL = "/api";

const App: React.FC = () => {
    return (
        <Refine
            routerProvider={routerProvider}
            dataProvider={dataProvider(API_URL)}
            resources={[
                {
                    name: "users", list: UserList, create: UserCreate, edit: UserEdit, show: UserShow, canDelete: true,
                },
                {
                    name: "items", list: ItemList, create: ItemCreate, edit: ItemEdit, show: ItemShow, canDelete: true,
                }
            ]}
            notificationProvider={notificationProvider}
            Layout={Layout}
            catchAll={<ErrorComponent />}
        />
    );
};

export default App;
