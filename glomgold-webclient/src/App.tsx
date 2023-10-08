import { DevtoolsProvider, DevtoolsPanel } from "@refinedev/devtools";
import { Authenticated, CanAccess, Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import { ErrorComponent, notificationProvider, ThemedLayoutV2, ThemedSiderV2, ThemedTitleV2 } from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";
import { UsergroupAddOutlined, ShopOutlined, DashboardOutlined } from "@ant-design/icons";

import routerBindings, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import dataProvider from "@refinedev/simple-rest";
import { HashRouter, Outlet, Route, Routes, Navigate } from "react-router-dom";
import { axiosInstance, authProvider } from "./authProvider";
import { Header } from "./components/header";
import { ColorModeContextProvider } from "./contexts/color-mode";

import { ItemList, ItemEdit, ItemShow } from "./pages/admin/items";
import { UserList, UserCreate, UserEdit, UserShow } from "./pages/admin/users";
import { DashboardPage } from "./pages/admin/dashboard";

import { Login } from "./pages/login";

import { API_URL } from "./constants";
import { PanelLayout } from "./pages/panel/layout";
import { ControlPanel, ReportPanel, ProfilePanel } from "./pages/panel";
import { LocalStorage } from "./LocalStorage";

import logoCollapsed from "./assets/images/glomgold-logo-collapsed.png";

function App() {
  return (
    <HashRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <DevtoolsProvider>
            <Refine
              dataProvider={dataProvider(API_URL, axiosInstance)}
              notificationProvider={notificationProvider}
              routerProvider={routerBindings}
              authProvider={authProvider}
              accessControlProvider={{
                can: async ({ resource }) => {
                  const roles = LocalStorage.getInstance().getUserRoles();

                  const isAdmin = roles.includes("ROLE_ADMIN");
                  const isAdminResource = ["dashboard", "users", "items"].includes(resource ?? "");
                  const cond = !(!isAdmin && isAdminResource);
                  return { can: cond };
                },
              }}
              resources={[
                {
                  name: "dashboard",
                  list: "/admin/dashboard",
                  meta: {
                    label: "Dashboard",
                    icon: <DashboardOutlined />,
                  },
                },
                {
                  name: "users",
                  list: "/admin/users",
                  create: "/admin/users/create",
                  edit: "/admin/users/edit/:id",
                  show: "/admin/users/show/:id",
                  meta: {
                    icon: <UsergroupAddOutlined />,
                    canDelete: true,
                  },
                },
                {
                  name: "items",
                  list: "/admin/items",
                  edit: "/admin/items/edit/:id",
                  show: "/admin/items/show/:id",
                  meta: {
                    icon: <ShopOutlined />,
                    canDelete: true,
                  },
                },
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
              }}
            >
              <Routes>
                <Route index element={<Navigate to={"/login"} />} />
                <Route
                  path="/admin"
                  element={
                    <Authenticated fallback={<CatchAllNavigate to="/login" />}>
                      <CanAccess fallback={<CatchAllNavigate to="/panel" />}>
                        <ThemedLayoutV2
                          Header={() => <Header sticky />}
                          Title={(props) => (
                            <ThemedTitleV2
                              {...props}
                              text="Glomgold"
                              icon={<img src={logoCollapsed} height={"25px"} />}
                            />
                          )}
                          Sider={(props) => <ThemedSiderV2 {...props} fixed />}
                        >
                          <Outlet />
                        </ThemedLayoutV2>
                      </CanAccess>
                    </Authenticated>
                  }
                >
                  <Route index element={<NavigateToResource resource="dashboard" />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="users">
                    <Route index element={<UserList />} />
                    <Route path="create" element={<UserCreate />} />
                    <Route path="edit/:id" element={<UserEdit />} />
                    <Route path="show/:id" element={<UserShow />} />
                  </Route>
                  <Route path="items">
                    <Route index element={<ItemList />} />
                    <Route path="edit/:id" element={<ItemEdit />} />
                    <Route path="show/:id" element={<ItemShow />} />
                  </Route>
                  <Route path="*" element={<ErrorComponent />} />
                </Route>
                <Route
                  path="/panel"
                  element={
                    <Authenticated fallback={<CatchAllNavigate to="/login" />}>
                      <CanAccess fallback={<CatchAllNavigate to="/login" />}>
                        <PanelLayout>
                          <Outlet />
                        </PanelLayout>
                      </CanAccess>
                    </Authenticated>
                  }
                >
                  <Route index element={<ControlPanel />} />
                  <Route path="report" element={<ReportPanel />} />
                  <Route path="profile" element={<ProfilePanel />} />
                </Route>
                <Route
                  element={
                    <Authenticated fallback={<Outlet />}>
                      <NavigateToResource />
                    </Authenticated>
                  }
                >
                  <Route path="/login" element={<Login />} />
                </Route>
              </Routes>

              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler
                handler={({ autoGeneratedTitle }) => autoGeneratedTitle.replace("refine", "Glomgold")}
              />
            </Refine>
            <DevtoolsPanel />
          </DevtoolsProvider>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </HashRouter>
  );
}

export default App;
