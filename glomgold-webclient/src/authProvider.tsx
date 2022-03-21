import { AuthProvider } from "@pankod/refine-core";

import { AxiosInstance } from 'axios';
import { LocalStorage } from "LocalStorage";
import { API_URL } from "./constants";

export const generateAuthProvider = (axios: AxiosInstance): AuthProvider => {

    const storage = LocalStorage.getInstance()

    axios.interceptors.request.use(config => {
        const tokenKey = storage.getToken()
        if(tokenKey) {
            if (!config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${tokenKey}`;
            } else {
                config.headers.Authorization = '';
            }
        }
        return config
    }, error => {
        return Promise.reject(error);
    })

    axios.interceptors.response.use(response => {
        return response
    }, error => {
        if (401 === error.response.status) {
            storage.clearUser()
            window.location.href = '/login'
            return Promise.reject(error);
        } else {
            return Promise.reject(error);
        }
    })

    return ({
        login: async ({ username, password }) => {
            const { data, status } = await axios.post('/login', { username, password });
            if (status === 200) {
                storage.setUser(data)
                const redirectPath = data.roles.includes('ROLE_ADMIN') ? '/' : '/panel'
                return Promise.resolve(redirectPath)
            } else {
                return Promise.reject()
            }
        },
        logout: async () => {
            storage.clearUser()
        },
        checkError: async (error) => {
            if (error && error.statusCode === 401) {
                throw Error();
            }
        },
        checkAuth: async (params: any) => {
            if(storage.getToken().length == 0) {
                throw Error("No token found!");
            }
        },
        getPermissions: async () => {
            return storage.getUserRoles()
        },
        getUserIdentity: async () => {
            return storage.getUser()
        },
    });
}
