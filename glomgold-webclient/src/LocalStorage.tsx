import { TOKEN_KEY, USER_KEY } from "./constants";

interface StorageUser {
  sub: string;
  symbol: string;
  nbf: number;
  roles: string[];
  iss: string;
  currency: string;
  exp: number;
  locale: string;
  iat: number;
  userId: number;
}

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

  public setUser(access_token: string): void {
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem(USER_KEY, atob(access_token.split(".")[1]));
  }

  public clearUser(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  public getToken(): string {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  public getUser(): StorageUser {
    return JSON.parse(localStorage.getItem(USER_KEY) || "{}");
  }

  public isLoggedIn(): boolean {
    return Object.keys(this.getUser()).length !== 0;
  }

  public getUserRoles(): string[] {
    return this.getUser().roles || [];
  }
}
