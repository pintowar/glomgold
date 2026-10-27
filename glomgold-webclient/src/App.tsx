import { DevtoolsProvider, DevtoolsPanel } from "@refinedev/devtools";
import { Authenticated, CanAccess, Refine, useGetIdentity } from "@refinedev/core";
import { useEffect, useMemo } from "react";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import { ErrorComponent, ThemedLayout, ThemedSider, ThemedTitle, useNotificationProvider } from "@refinedev/antd";
import { App as AntdApp } from "antd";
import "@refinedev/antd/dist/reset.css";
import {
  UsergroupAddOutlined,
  ShopOutlined,
  DashboardOutlined,
  BankOutlined,
  TagsOutlined,
  FolderOutlined,
} from "@ant-design/icons";

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
import { LocaleProvider, useLocale } from "./i18n/LocaleContext";
import { buildI18nProvider } from "./i18n/provider";
import { normalizeLang } from "./i18n/locale";

import { ItemList, ItemEdit, ItemShow, ItemCreate } from "./pages/admin/items";
import { AccountList, AccountCreate, AccountEdit } from "./pages/admin/accounts";
import { CategoryList, CategoryCreate, CategoryEdit } from "./pages/admin/categories";
import { CategoryGroupList, CategoryGroupCreate, CategoryGroupEdit } from "./pages/admin/category-groups";
import { UserList, UserCreate, UserEdit, UserShow } from "./pages/admin/users";
import { DashboardPage } from "./pages/admin/dashboard";

import { Login } from "./pages/login";

import { PanelLayout } from "./pages/panel/layout";
import { ControlPanel, ReportPanel, ProfilePanel, OverallReportPanel, AccountsPanel } from "./pages/panel";

import logoCollapsed from "./assets/images/glomgold-logo-collapsed.png";

const accessControlProvider = {
  can: async ({ resource }: { resource?: string }) => {
    const roles = ((await authProvider.getPermissions?.()) ?? []) as string[];

    const isAdmin = roles.includes("ROLE_ADMIN");
    const adminResources = ["dashboard", "users", "items", "accounts", "categories", "category-groups"];
    return { can: isAdmin || !adminResources.includes(resource ?? "") };
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
    create: "/admin/items/create",
    edit: "/admin/items/edit/:id",
    show: "/admin/items/show/:id",
    meta: {
      icon: <ShopOutlined />,
      canDelete: true,
    },
  },
  {
    name: "accounts",
    list: "/admin/accounts",
    create: "/admin/accounts/create",
    edit: "/admin/accounts/edit/:id",
    meta: {
      icon: <BankOutlined />,
      canDelete: true,
    },
  },
  {
    name: "categories",
    list: "/admin/categories",
    create: "/admin/categories/create",
    edit: "/admin/categories/edit/:id",
    meta: {
      icon: <TagsOutlined />,
    },
  },
  {
    name: "category-groups",
    list: "/admin/category-groups",
    create: "/admin/category-groups/create",
    edit: "/admin/category-groups/edit/:id",
    meta: {
      icon: <FolderOutlined />,
    },
  },
];

/** Pushes the logged-in user's profile locale into the app locale (profile wins over browser). */
function ProfileLocaleSync() {
  const { data: identity } = useGetIdentity<{ locale?: string }>();
  const { lang, setLang } = useLocale();
  useEffect(() => {
    const tag = (identity as { locale?: string } | undefined)?.locale;
    if (tag) {
      const next = normalizeLang(tag);
      if (next !== lang) setLang(next);
    }
  }, [identity, lang, setLang]);
  return null;
}

function InnerApp() {
  const notificationProvider = useNotificationProvider();
  const { lang, setLang } = useLocale();
  const i18nProvider = useMemo(() => buildI18nProvider(lang, setLang), [lang, setLang]);

  return (
    <Refine
      dataProvider={panelDataProvider}
      notificationProvider={notificationProvider}
      routerProvider={routerBindings}
      authProvider={authProvider}
      i18nProvider={i18nProvider}
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
            <Route path="create" element={<ItemCreate />} />
            <Route path="edit/:id" element={<ItemEdit />} />
            <Route path="show/:id" element={<ItemShow />} />
          </Route>
          <Route path="accounts">
            <Route index element={<AccountList />} />
            <Route path="create" element={<AccountCreate />} />
            <Route path="edit/:id" element={<AccountEdit />} />
          </Route>
          <Route path="categories">
            <Route index element={<CategoryList />} />
            <Route path="create" element={<CategoryCreate />} />
            <Route path="edit/:id" element={<CategoryEdit />} />
          </Route>
          <Route path="category-groups">
            <Route index element={<CategoryGroupList />} />
            <Route path="create" element={<CategoryGroupCreate />} />
            <Route path="edit/:id" element={<CategoryGroupEdit />} />
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
          <Route path="accounts" element={<AccountsPanel />} />
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

      <ProfileLocaleSync />
      <RefineKbar />
      <UnsavedChangesNotifier />
      <DocumentTitleHandler handler={({ autoGeneratedTitle }) => autoGeneratedTitle.replace("refine", "Glomgold")} />
    </Refine>
  );
}

function App() {
  return (
    <HashRouter>
      <LocaleProvider>
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
      </LocaleProvider>
    </HashRouter>
  );
}

export default App;
