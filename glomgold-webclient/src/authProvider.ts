import { AuthBindings } from "@refinedev/core";

import axios, { AxiosInstance } from "axios";
import { LocalStorage } from "./LocalStorage";

const generateAxiosInstance = (storage: LocalStorage): AxiosInstance => {
  const axiosCli = axios.create();

  axiosCli.interceptors.request.use(
      (config) => {
          const tokenKey = storage.getToken();
          if (tokenKey) {
              if (!config?.headers?.Authorization) {
                  config.headers.Authorization = `Bearer ${tokenKey}`;
              } else {
                  config.headers.Authorization = "";
              }
          }
          return config;
      },
      (error) => {
          return Promise.reject(error);
      }
  );

  axiosCli.interceptors.response.use(
      (response) => {
          return response;
      },
      (error) => {
          if (401 === error.response.status) {
              storage.clearUser();
          }
          return Promise.reject(error);
      }
  );

  return axiosCli;
};

const storage = LocalStorage.getInstance();

export const axiosInstance: AxiosInstance = generateAxiosInstance(storage);

export const authProvider: AuthBindings = {
  login: async ({ username, password }) => {
    const { data, status } = await axios.post("/login", { username, password });
    if (status === 200) {
        storage.setUser(data.access_token);
        const redirectPath = data.roles.includes("ROLE_ADMIN") ? "/admin" : "/panel";
        return {
          success: true,
          redirectTo: redirectPath,
        };
    } else {
        return {
          success: false,
          error: {
            name: "LoginError",
            message: "Invalid username or password",
          },
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
    if (storage.getToken().length > 0) {
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
    console.error(error);
    return { error };
  },
};
