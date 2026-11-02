import type { AuthProvider } from "@refinedev/core";

import { buildLoginRedirect, getErrorStatus } from "./authUtils";
import { jsonRequest, request } from "./http";
import { LocalStorage, type SessionUser } from "./session";
import { getStoredLang } from "../i18n/locale";
import { translateKey } from "../i18n/translations";

const storage = LocalStorage.getInstance();

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    try {
      // Credentials are exchanged for an HttpOnly cookie; nothing is stored here.
      await request("/api/login", jsonRequest("POST", { username, password }));
      const data = await request<SessionUser>("/api/auth/me");
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
      await request("/api/logout", jsonRequest("POST", {}));
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
