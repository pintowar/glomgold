// Pure session-expiry helpers for the auth provider. Kept free of browser and
// Refine imports so they stay unit-testable with plain `node --test`.

/** Leeway for clock skew between client and token issuer. */
const EXPIRY_SKEW_MS = 30_000;

/** Routes whose location is worth returning to after a re-login. */
const RETURNABLE_PREFIXES = ["/panel", "/admin"];

/**
 * Extract the HTTP status from Refine/axios error shapes:
 * axios (`error.response.status`) and Refine-wrapped (`statusCode`/`status`).
 */
export const getErrorStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== "object") return undefined;
  const err = error as Record<string, unknown>;
  const response = err["response"];
  if (response && typeof response === "object") {
    const status = (response as Record<string, unknown>)["status"];
    if (typeof status === "number") return status;
  }
  for (const key of ["statusCode", "status"] as const) {
    const status = err[key];
    if (typeof status === "number") return status;
  }
  return undefined;
};

export interface JwtUserLike {
  exp?: unknown;
}

/** True when there is no usable (unexpired) session. Missing/non-numeric `exp` counts as expired. */
export const isSessionExpired = (user: JwtUserLike | null | undefined, nowMs: number = Date.now()): boolean => {
  const exp = user?.exp;
  if (typeof exp !== "number" || !Number.isFinite(exp)) return true;
  return exp * 1000 <= nowMs + EXPIRY_SKEW_MS;
};

/**
 * Parse a HashRouter location hash (e.g. `#/panel/yearly-report?x=1`) into a
 * returnable app path, or `undefined` for login/root/unknown locations.
 */
export const getReturnToPath = (hash: string): string | undefined => {
  if (!hash.startsWith("#")) return undefined;
  const path = hash.slice(1).split("?")[0] ?? "";
  if (!RETURNABLE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return undefined;
  return path;
};

/** `/login` destination preserving the current page when it is returnable. */
export const buildLoginRedirect = (hash: string): string => {
  const to = getReturnToPath(hash);
  return to ? `/login?to=${encodeURIComponent(to)}` : "/login";
};

/** React Query retry predicate: 401s never self-heal, so fail fast into the logout redirect. */
export const shouldRetryQuery = (failureCount: number, error: unknown): boolean => {
  if (getErrorStatus(error) === 401) return false;
  return failureCount < 3;
};

/**
 * Base64url-safe JWT payload decode. Plain atob() rejects base64url payloads
 * containing `-`/`_` (and unpadded input), which silently dropped the stored
 * user and made valid sessions look expired.
 */
export const decodeJwtPayload = (token: string): Record<string, unknown> | undefined => {
  try {
    const segment = token.split(".")[1] ?? "";
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (segment.length % 4)) % 4);
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    return parsed as Record<string, unknown>;
  } catch {
    return undefined;
  }
};
