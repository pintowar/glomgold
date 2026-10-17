import { SESSION_KEY } from "./constants";

/**
 * Non-sensitive session metadata mirrored from `GET /api/auth/me`.
 *
 * The credential itself lives in an HttpOnly `Secure` cookie and is never
 * readable from JavaScript; this object only carries display data (identity,
 * roles, locale) so the UI can render without a round-trip.
 */
export interface SessionUser {
  username: string;
  name: string;
  email: string;
  roles: string[];
  userId: number;
  locale: string;
  currency: string;
  symbol: string;
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

  public setSession(user: SessionUser): void {
    this.storage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  public clearSession(): void {
    this.storage.removeItem(SESSION_KEY);
  }

  public getSession(): SessionUser | null {
    try {
      const raw = this.storage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
      return parsed as SessionUser;
    } catch {
      return null;
    }
  }

  public isLoggedIn(): boolean {
    return this.getSession() !== null;
  }

  public getUserRoles(): string[] {
    return this.getSession()?.roles || [];
  }
}
