import { expect, test } from "@playwright/test";

import { adminUsers, panelAccounts, panelControl } from "./fixtures";
import { json, mockApi } from "./support/api";
import { loginViaUi, storedSession } from "./support/auth";

test.describe("Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/login");
  });

  test("common user lands on the panel in Portuguese", async ({ page }) => {
    await mockApi(page, "common", [
      { method: "GET", path: "/api/panel/accounts", reply: json(panelAccounts) },
      { method: "GET", path: "/api/panel", reply: json(panelControl) },
    ]);

    await loginViaUi(page, "donald", "123123");

    await expect(page).toHaveURL(/#\/panel$/);
    await expect(page.getByRole("link", { name: "Painel" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Relatório Anual" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Relatório Geral" })).toBeVisible();
    await expect(page.locator('[data-slot="card"]')).toHaveCount(4);

    expect(await storedSession(page)).toContain("donald");
  });

  test("admin user lands on the dashboard in English", async ({ page }) => {
    await mockApi(page, "admin", [
      { method: "GET", path: /^\/api\/users$/, reply: json(adminUsers) },
    ]);

    await loginViaUi(page, "admin", "admin");

    await expect(page).toHaveURL(/#\/admin\/dashboard$/);
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Management Info")).toBeVisible();

    expect(await storedSession(page)).toContain("ROLE_ADMIN");
  });

  test("invalid credentials keep the user on the login page and notify", async ({ page }) => {
    await mockApi(page, "common", [{ method: "POST", path: "/api/login", reply: json({}, 401) }]);

    await loginViaUi(page, "donald", "wrong");

    await expect(page.locator("[data-sonner-toast]")).toBeVisible();
    await expect(page).toHaveURL(/#\/login/);
    expect(await storedSession(page)).toBeNull();
  });
});
