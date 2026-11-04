import { expect, test } from "@playwright/test";

import { panelAccounts, panelControl } from "./fixtures";
import { json } from "./support/api";
import { gotoHash, loginViaUi, signedIn, storedSession } from "./support/auth";

test.describe("Session expiry", () => {
  // The credential is an HttpOnly cookie validated by the server; the client only
  // mirrors non-sensitive metadata. Seeding it simulates a browser that still looks
  // logged-in while the cookie is gone or expired server-side.
  test("stale session metadata is rejected by the server and redirects to /login", async ({ page }) => {
    await signedIn(page, "common", [
      { method: "GET", path: "/api/panel/accounts", reply: json(panelAccounts) },
      { method: "GET", path: "/api/panel", reply: json({ message: "Unauthorized" }, 401) },
    ]);

    await gotoHash(page, "/panel");

    await expect(page).toHaveURL(/#\/login/);
    await expect(page.locator("#username")).toBeVisible();
    expect(await storedSession(page)).toBeNull();
  });

  test("mid-session 401 redirects to /login and re-login returns to the panel", async ({ page }) => {
    let expired = true;

    await signedIn(page, "common", [
      { method: "GET", path: "/api/panel/accounts", reply: json(panelAccounts) },
      {
        method: "GET",
        path: "/api/panel",
        reply: (route) =>
          expired
            ? route.fulfill({ status: 401, json: { message: "Unauthorized" } })
            : route.fulfill({ status: 200, json: panelControl }),
      },
      { method: "POST", path: "/api/logout", reply: json({}) },
    ]);

    await gotoHash(page, "/panel");

    // onError turns the 401 into logout + redirect, preserving the return page.
    await expect(page).toHaveURL(/#\/login\?to=/);
    expect(await storedSession(page)).toBeNull();

    expired = false;
    await loginViaUi(page, "donald", "123123");

    await expect(page).toHaveURL(/#\/panel/);
    await expect(page.getByRole("link", { name: "Painel" })).toBeVisible();
  });
});
