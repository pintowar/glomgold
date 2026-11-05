import type { Page } from "@playwright/test";

import { mockApi, sessionFor, type ApiRoute, type UserKind } from "./api";

const SESSION_KEY = "glomgold-session";

/** Signs in by seeding the metadata the client keeps in localStorage; `/api/auth/me` is stubbed too. */
export const signedIn = async (page: Page, user: UserKind = "admin", overrides: ApiRoute[] = []) => {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [SESSION_KEY, JSON.stringify(sessionFor(user))] as const,
  );
  await mockApi(page, user, overrides);
};

/** HashRouter: the router state lives after `#`, so paths are visited as `/#/panel`. */
export const gotoHash = (page: Page, path: string) => page.goto(`/#${path}`);

export const loginViaUi = async (page: Page, username: string, password: string) => {
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  // Locale-proof: the submit label is translated ("Sign in" / "Entrar").
  await page.locator("form button[type=submit]").click();
};

export const storedSession = (page: Page) =>
  page.evaluate((key) => window.localStorage.getItem(key), SESSION_KEY);
