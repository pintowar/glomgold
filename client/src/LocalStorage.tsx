import { TOKEN_KEY, USER_KEY } from "./constants";

export class LocalStorage {
    private static instance: LocalStorage;
    private readonly storage: Storage;

    private constructor() {
        this.storage = window.localStorage;
    }

    /**
     * The static method that controls the access to the singleton instance.
     *
     * This implementation let you subclass the Singleton class while keeping
     * just one instance of each subclass around.
     */
    public static getInstance(): LocalStorage {
        if (!LocalStorage.instance) {
            LocalStorage.instance = new LocalStorage();
        }

        return LocalStorage.instance;
    }

    public setUser(data: any) : void {
        localStorage.setItem(TOKEN_KEY, data.access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(data));
    }

    public clearUser() : void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    public getToken() : string {
        return localStorage.getItem(TOKEN_KEY) || ''
    }

    public getUser() : any {
        return JSON.parse(localStorage.getItem(USER_KEY) || '{}')
    }

    public getUserRoles() : string[] {
        return this.getUser().roles || []
    }
}
