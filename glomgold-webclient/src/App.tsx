import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { Authenticated, CanAccess, Refine, useGetIdentity } from "@refinedev/core";
import { useEffect, useMemo } from "react";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import type { QueryClientConfig } from "@tanstack/react-query";
import { HashRouter, Navigate, Outlet, Route, Routes } from "react-router";

import { AppLayout } from "@/components/layout/app-layout";
import { ErrorComponent } from "@/components/refine-ui/layout/error-component";
import { Toaster } from "@/components/refine-ui/notification/toaster";
import { useNotificationProvider } from "@/components/refine-ui/notification/use-notification-provider";
import { ThemeProvider } from "@/components/refine-ui/theme/theme-provider";
import { LocaleProvider, useLocale } from "@/i18n/LocaleContext";
import { normalizeLang } from "@/i18n/locale";
import { buildI18nProvider } from "@/i18n/provider";
import { authProvider } from "@/providers/auth";
import { shouldRetryQuery } from "@/providers/authUtils";
import { panelDataProvider } from "@/providers/data";

import { AccountCreate, AccountEdit, AccountList } from "@/pages/admin/accounts";
import { CategoryCreate, CategoryEdit, CategoryList } from "@/pages/admin/categories";
import { CategoryGroupCreate, CategoryGroupEdit, CategoryGroupList } from "@/pages/admin/category-groups";
import { DashboardPage } from "@/pages/admin/dashboard";
import { ItemCreate, ItemEdit, ItemList, ItemShow } from "@/pages/admin/items";
import { UserCreate, UserEdit, UserList, UserShow } from "@/pages/admin/users";
import { Login } from "@/pages/login";
import { AccountsPanel } from "@/pages/panel/accounts";
import { CategoriesPanel } from "@/pages/panel/categories";
import { ControlPanel } from "@/pages/panel/control";
import { OverallReportPanel } from "@/pages/panel/overall-report";
import { ProfilePanel } from "@/pages/panel/profile";
import { ReportPanel } from "@/pages/panel/yearly-report";

import "./App.css";

const ADMIN_RESOURCES = ["dashboard", "users", "items", "accounts", "categories", "category-groups"];

const accessControlProvider = {
  can: async ({ resource }: { resource?: string }) => {
    const roles = ((await authProvider.getPermissions?.()) ?? []) as string[];
    return { can: roles.includes("ROLE_ADMIN") || !ADMIN_RESOURCES.includes(resource ?? "") };
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
  { name: "dashboard", list: "/admin/dashboard" },
  {
    name: "users",
    list: "/admin/users",
    create: "/admin/users/create",
    edit: "/admin/users/edit/:id",
    show: "/admin/users/show/:id",
    meta: { canDelete: true },
  },
  {
    name: "items",
    list: "/admin/items",
    create: "/admin/items/create",
    edit: "/admin/items/edit/:id",
    show: "/admin/items/show/:id",
    meta: { canDelete: true },
  },
  {
    name: "accounts",
    list: "/admin/accounts",
    create: "/admin/accounts/create",
    edit: "/admin/accounts/edit/:id",
    meta: { canDelete: true },
  },
  {
    name: "categories",
    list: "/admin/categories",
    create: "/admin/categories/create",
    edit: "/admin/categories/edit/:id",
  },
  {
    name: "category-groups",
    list: "/admin/category-groups",
    create: "/admin/category-groups/create",
    edit: "/admin/category-groups/edit/:id",
  },
];

/** Pushes the logged-in user's profile locale into the app locale (profile wins over browser). */
const ProfileLocaleSync = () => {
  const { data: identity } = useGetIdentity<{ locale?: string }>();
  const { lang, setLang } = useLocale();

  useEffect(() => {
    const tag = identity?.locale;
    if (tag) {
      const next = normalizeLang(tag);
      if (next !== lang) setLang(next);
    }
  }, [identity, lang, setLang]);

  return null;
};

const InnerApp = () => {
  const notificationProvider = useNotificationProvider();
  const { lang, setLang } = useLocale();
  const i18nProvider = useMemo(() => buildI18nProvider(lang, setLang), [lang, setLang]);

  return (
    <Refine
      dataProvider={panelDataProvider}
      notificationProvider={notificationProvider}
      routerProvider={routerProvider}
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
        <Route index element={<Navigate to="/login" />} />
        <Route
          path="/admin"
          element={
            <Authenticated key="admin" fallback={<CatchAllNavigate to="/login" />}>
              <CanAccess fallback={<CatchAllNavigate to="/panel" />}>
                <AppLayout>
                  <Outlet />
                </AppLayout>
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
              <AppLayout>
                <Outlet />
              </AppLayout>
            </Authenticated>
          }
        >
          <Route index element={<ControlPanel />} />
          <Route path="yearly-report" element={<ReportPanel />} />
          <Route path="overall-report" element={<OverallReportPanel />} />
          <Route path="accounts" element={<AccountsPanel />} />
          <Route path="categories" element={<CategoriesPanel />} />
          <Route path="profile" element={<ProfilePanel />} />
          <Route path="*" element={<ErrorComponent />} />
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
};

const App = () => (
  <HashRouter>
    <LocaleProvider>
      <RefineKbarProvider>
        <ThemeProvider>
          <DevtoolsProvider>
            <InnerApp />
            <Toaster />
            <DevtoolsPanel />
          </DevtoolsProvider>
        </ThemeProvider>
      </RefineKbarProvider>
    </LocaleProvider>
  </HashRouter>
);

export default App;
