// Pure helpers for the auth provider. Kept free of browser and Refine imports
// so they stay unit-testable with plain `node --test`.

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
