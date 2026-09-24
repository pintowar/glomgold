import { DevtoolsProvider, DevtoolsPanel } from "@refinedev/devtools";
import { Authenticated, CanAccess, Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import { ErrorComponent, ThemedLayout, ThemedSider, ThemedTitle, useNotificationProvider } from "@refinedev/antd";
import { App as AntdApp } from "antd";
import "@refinedev/antd/dist/reset.css";
import { UsergroupAddOutlined, ShopOutlined, DashboardOutlined } from "@ant-design/icons";

import routerBindings, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import type { QueryClientConfig } from "@tanstack/react-query";
import { shouldRetryQuery } from "./authUtils.ts";
import { panelDataProvider } from "./providers/panelDataProvider";
import { HashRouter, Outlet, Route, Routes, Navigate } from "react-router-dom";
import { authProvider } from "./authProvider";
import { Header } from "./components";
import { ColorModeContextProvider } from "./contexts/color-mode";

import { ItemList, ItemEdit, ItemShow } from "./pages/admin/items";
import { UserList, UserCreate, UserEdit, UserShow } from "./pages/admin/users";
import { DashboardPage } from "./pages/admin/dashboard";

import { Login } from "./pages/login";

import { PanelLayout } from "./pages/panel/layout";
import { ControlPanel, ReportPanel, ProfilePanel, OverallReportPanel } from "./pages/panel";

import logoCollapsed from "./assets/images/glomgold-logo-collapsed.png";

const accessControlProvider = {
  can: async ({ resource }: { resource?: string }) => {
    const roles = ((await authProvider.getPermissions?.()) ?? []) as string[];

    const isAdmin = roles.includes("ROLE_ADMIN");
    const isAdminResource = ["dashboard", "users", "items"].includes(resource ?? "");
    return { can: isAdmin || !isAdminResource };
  },
};

const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => shouldRetryQuery(failureCount, error),
    },
  },
};

const resources = [
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
];

function InnerApp() {
  const notificationProvider = useNotificationProvider();

  return (
    <Refine
      dataProvider={panelDataProvider}
      notificationProvider={notificationProvider}
      routerProvider={routerBindings}
      authProvider={authProvider}
      accessControlProvider={accessControlProvider}
      resources={resources}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
        reactQuery: { clientConfig: queryClientConfig },
      }}
    >
      <Routes>
        <Route index element={<Navigate to={"/login"} />} />
        <Route
          path="/admin"
          element={
            <Authenticated key="admin" fallback={<CatchAllNavigate to="/login" />}>
              <CanAccess fallback={<CatchAllNavigate to="/panel" />}>
                <ThemedLayout
                  Header={() => <Header sticky />}
                  Title={(props) => (
                    <ThemedTitle {...props} text="Glomgold" icon={<img src={logoCollapsed} height={"25px"} />} />
                  )}
                  Sider={(props) => <ThemedSider {...props} fixed />}
                >
                  <Outlet />
                </ThemedLayout>
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
            <Authenticated key="panel" fallback={<CatchAllNavigate to="/login" />}>
              <CanAccess fallback={<CatchAllNavigate to="/login" />}>
                <PanelLayout>
                  <Outlet />
                </PanelLayout>
              </CanAccess>
            </Authenticated>
          }
        >
          <Route index element={<ControlPanel />} />
          <Route path="yearly-report" element={<ReportPanel />} />
          <Route path="overall-report" element={<OverallReportPanel />} />
          <Route path="profile" element={<ProfilePanel />} />
        </Route>
        <Route
          element={
            <Authenticated key="login" fallback={<Outlet />}>
              <NavigateToResource />
            </Authenticated>
          }
        >
          <Route path="/login" element={<Login />} />
        </Route>
      </Routes>

      <RefineKbar />
      <UnsavedChangesNotifier />
      <DocumentTitleHandler handler={({ autoGeneratedTitle }) => autoGeneratedTitle.replace("refine", "Glomgold")} />
    </Refine>
  );
}

function App() {
  return (
    <HashRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <DevtoolsProvider>
            <AntdApp>
              <InnerApp />
            </AntdApp>
            <DevtoolsPanel />
          </DevtoolsProvider>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </HashRouter>
  );
}

export default App;
