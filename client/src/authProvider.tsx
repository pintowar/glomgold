import { AuthProvider } from "@pankod/refine-core";

export const authProvider: AuthProvider = {
    login: ({ username, password, remember }) => {
        if (username === "admin" && password === "admin") {
            localStorage.setItem("username", username);
            return Promise.resolve();
        }

        return Promise.reject({ message: "Invalid Login" });
    },
    logout: () => {
        localStorage.removeItem("username");
        return Promise.resolve();
    },
    checkError: () => Promise.resolve(),
    checkAuth: () =>
        localStorage.getItem("username")
            ? Promise.resolve()
            : Promise.reject(),
    getPermissions: () => Promise.resolve(["admin"]),
    getUserIdentity: () =>
            Promise.resolve({
                id: 1,
                name: "Administrator",
                avatar: "https://unsplash.com/photos/IWLOvomUmWU/download?force=true&w=640",
            }),
};