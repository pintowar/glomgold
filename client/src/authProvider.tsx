import { AuthProvider } from "@pankod/refine-core";

import { AxiosInstance } from 'axios';
import { TOKEN_KEY, API_URL } from "./constants";

export const generateAuthProvider = (axios: AxiosInstance): AuthProvider => ({
    login: async ({ username, password, remember }) => {
        const { data, status } = await axios.post('/login', { username, password});

        if (status === 200) {
            localStorage.setItem(TOKEN_KEY, data.access_token);
            axios.defaults.headers = {
                Authorization: `Bearer ${data.access_token}`,
            }
        } else {
            throw Error("Invalid Login");
        }
    },
    logout: async () => {
        localStorage.removeItem(TOKEN_KEY);
        axios.defaults.headers = {
            Authorization: '',
        }
    },
    checkError: async (error) => {
        // if (error && error.statusCode === 401) {
        //     throw Error();
        // }
    },
    checkAuth: async () => {
        const tokenKey = localStorage.getItem(TOKEN_KEY);
        if(tokenKey) {
            axios.defaults.headers = {
                Authorization: `Bearer ${tokenKey}`,
            }
        } else {
            throw Error();
        }
    },
    getPermissions: async () => ["admin"],
    getUserIdentity: async () => {
        const { data, status } = await axios.get(`${API_URL}/auth/me`);
        if (status === 200) {
            return data;
        } else {
            throw Error();
        }
    },
});
