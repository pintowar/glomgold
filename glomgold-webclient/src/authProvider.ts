import { AuthProvider } from "@refinedev/core";

import axios, { AxiosHeaders, AxiosInstance } from "axios";
import { LocalStorage } from "./LocalStorage";
import { buildLoginRedirect, decodeJwtPayload, getErrorStatus, isSessionExpired } from "./authUtils.ts";

const generateAxiosInstance = (storage: LocalStorage): AxiosInstance => {
  const axiosCli = axios.create();

  axiosCli.interceptors.request.use(
    (config) => {
      const tokenKey = storage.getToken();
      if (tokenKey) {
        const headers = AxiosHeaders.from(config.headers ?? {});
        if (!headers.getAuthorization()) {
          headers.setAuthorization(`Bearer ${tokenKey}`);
        } else {
          headers.setAuthorization("");
        }
        config.headers = headers;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axiosCli.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        storage.clearUser();
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
      const { data } = await axios.post("/api/login", { username, password });
      storage.setUser(data.access_token);
      return {
        success: true,
        redirectTo: data.roles.includes("ROLE_ADMIN") ? "/admin" : "/panel",
      };
    } catch {
      return {
        success: false,
        error: { name: "LoginError", message: "Invalid username or password" },
      };
    }
  },
  logout: async () => {
    storage.clearUser();
    return {
      success: true,
      redirectTo: "/login",
    };
  },
  check: async () => {
    const token = storage.getToken();
    if (token.length > 0 && !isSessionExpired(decodeJwtPayload(token) ?? storage.getUser())) {
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
    return storage.getUser();
  },
  onError: async (error) => {
    if (getErrorStatus(error) === 401) {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      return {
        logout: true,
        redirectTo: buildLoginRedirect(hash),
        error,
      };
    }
    return { error };
  },
};
