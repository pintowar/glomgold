import { AuthProvider } from "@refinedev/core";

import axios, { AxiosInstance } from "axios";
import { LocalStorage, type SessionUser } from "./LocalStorage";
import { buildLoginRedirect, getErrorStatus } from "./authUtils.ts";
import { getStoredLang } from "./i18n/locale";
import { translateKey } from "./i18n/translations";

const generateAxiosInstance = (storage: LocalStorage): AxiosInstance => {
  const axiosCli = axios.create({ withCredentials: true });

  axiosCli.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        storage.clearSession();
      }
      return Promise.reject(error);
    }
  );

  return axiosCli;
};

const storage = LocalStorage.getInstance();

export const axiosInstance: AxiosInstance = generateAxiosInstance(storage);

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    try {
      // Credentials are exchanged for an HttpOnly cookie; nothing is stored here.
      await axiosInstance.post("/api/login", { username, password });
      const { data } = await axiosInstance.get<SessionUser>("/api/auth/me");
      storage.setSession(data);
      return {
        success: true,
        redirectTo: (data.roles ?? []).includes("ROLE_ADMIN") ? "/admin" : "/panel",
      };
    } catch {
      storage.clearSession();
      return {
        success: false,
        error: {
          name: "LoginError",
          message: translateKey(getStoredLang(), "pages.login.invalidCredentials"),
        },
      };
    }
  },
  logout: async () => {
    try {
      // Ask the server to clear the auth cookie; the response body is empty.
      await axiosInstance.post("/api/logout", {});
    } catch {
      // Ignore server errors: drop the client session regardless.
    } finally {
      storage.clearSession();
    }
    return {
      success: true,
      redirectTo: "/login",
    };
  },
  check: async () => {
    if (storage.isLoggedIn()) {
      return {
        authenticated: true,
      };
    }

    return {
      authenticated: false,
      redirectTo: "/login",
    };
  },
  getPermissions: async () => {
    return storage.getUserRoles();
  },
  getIdentity: async () => {
    return storage.getSession();
  },
  onError: async (error) => {
    if (getErrorStatus(error) === 401) {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      storage.clearSession();
      return {
        logout: true,
        redirectTo: buildLoginRedirect(hash),
        error,
      };
    }
    return { error };
  },
};
