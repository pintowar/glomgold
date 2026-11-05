import { expect, test } from "playwright-test-coverage";

import { mockApi } from "./support/api";
import { gotoHash, loginViaUi } from "./support/auth";

test.describe("Route guards", () => {
  test("common user visiting /admin is redirected to /panel", async ({ page }) => {
    await mockApi(page, "common");
    await gotoHash(page, "/admin/users");

    await loginViaUi(page, "donald", "123123");
    // The attempted admin path is kept as `?to=`, so match the hash path only.
    await expect(page).toHaveURL(/#\/panel\?to=/);

    // Authenticated revisit of an admin resource is bounced by CanAccess.
    await gotoHash(page, "/admin/users");
    await expect(page).toHaveURL(/#\/panel/);
  });

  test("admin user visiting /admin stays and the dashboard renders", async ({ page }) => {
    await mockApi(page, "admin");
    await gotoHash(page, "/admin");

    await loginViaUi(page, "admin", "admin");
    await expect(page).toHaveURL(/#\/admin\/dashboard$/);
    await expect(page.getByText("Management Info")).toBeVisible();
  });

  test("common user visiting /panel stays", async ({ page }) => {
    await mockApi(page, "common");
    await gotoHash(page, "/panel");

    await loginViaUi(page, "donald", "123123");
    await expect(page).toHaveURL(/#\/panel$/);
    await expect(page.getByRole("link", { name: "Painel" })).toBeVisible();
  });

  test("unauthenticated visit to /panel redirects to /login", async ({ page }) => {
    await mockApi(page, "common");
    await gotoHash(page, "/panel");

    await expect(page).toHaveURL(/#\/login/);
    await expect(page.locator("#username")).toBeVisible();
  });
});
