import type { Page, Request, Route } from "@playwright/test";

import { adminInfo, adminSession, commonSession } from "../fixtures";

export type UserKind = "admin" | "common";

export const sessionFor = (user: UserKind) => (user === "admin" ? adminSession : commonSession);

type MockReply =
  | { status?: number; body?: unknown }
  | ((route: Route, request: Request) => Promise<void> | void);

export interface ApiRoute {
  method?: string;
  /** Exact request pathname, or a pattern tested against it. */
  path: string | RegExp;
  reply: MockReply;
}

export const json = (body: unknown, status = 200): MockReply => ({ status, body });

const matches = ({ method, path }: ApiRoute, requestMethod: string, url: URL) =>
  (!method || method === requestMethod) &&
  (path instanceof RegExp ? path.test(url.pathname) : url.pathname === path);

/**
 * Stubs every `/api/**` call so the suite never needs a backend (or cookies).
 * Overrides win over defaults; unknown calls answer an empty list so a missing
 * stub surfaces as a visible assertion failure instead of a 401 logout.
 */
export const mockApi = async (page: Page, user: UserKind = "admin", overrides: ApiRoute[] = []) => {
  const defaults: ApiRoute[] = [
    { method: "GET", path: "/api/auth/me", reply: json(sessionFor(user)) },
    { method: "POST", path: "/api/login", reply: json({}) },
    { method: "GET", path: /^\/api\/(panel\/)?categories$/, reply: json([]) },
    { method: "GET", path: /^\/api\/(panel\/)?category-groups$/, reply: json([]) },
    { method: "GET", path: "/api/management/info", reply: json(adminInfo) },
  ];

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const found = [...overrides, ...defaults].find((candidate) => matches(candidate, request.method(), url));
    const reply = found?.reply ?? (request.method() === "GET" ? json([]) : json({}));

    if (typeof reply === "function") {
      await reply(route, request);
      return;
    }

    await route.fulfill({
      status: reply.status ?? 200,
      contentType: "application/json",
      body: JSON.stringify(reply.body ?? {}),
    });
  });
};
