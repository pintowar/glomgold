import { expect, test } from "playwright-test-coverage";

import { adminUsers } from "../fixtures";
import { json } from "../support/api";
import { gotoHash, signedIn } from "../support/auth";

const scrooge = {
  id: 2,
  version: 0,
  username: "scrooge",
  name: "Scrooge McDuck",
  email: "scrooge@glomgold.com",
  enabled: true,
  admin: false,
  locale: "en_US",
  timezone: "UTC",
};

test.describe("Admin users", () => {
  test.beforeEach(async ({ page }) => {
    await signedIn(page, "admin", [
      { method: "GET", path: "/api/users", reply: json(adminUsers) },
      { method: "GET", path: "/api/users/locales", reply: json(["en_US"]) },
      { method: "GET", path: "/api/users/timezones", reply: json(["UTC"]) },
      { method: "GET", path: "/api/users/2", reply: json(scrooge) },
      { method: "POST", path: "/api/users", reply: json({ ...scrooge, id: 4 }, 201) },
    ]);
  });

  test("list renders user rows", async ({ page }) => {
    await gotoHash(page, "/admin/users");

    await expect(page.locator("#data-table tbody tr[data-row-id]")).toHaveCount(3);
    await expect(page.locator("#data-table tbody")).toContainText("Scrooge McDuck");
    await expect(page.locator("#data-table tbody")).toContainText("donald");

    await expect(page.getByRole("columnheader", { name: "Username" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "E-mail" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Action" })).toBeVisible();

    // ResourceActions renders exactly two actions per row: an edit link and a delete button.
    const firstRow = page.locator('[data-row-id="1"]');
    await expect(firstRow.getByRole("link", { name: "Edit" })).toBeVisible();
    await expect(firstRow.getByRole("button", { name: "Delete" })).toBeVisible();
  });

  test("create form renders fields and submits", async ({ page }) => {
    await gotoHash(page, "/admin/users/create");

    await expect(page.getByLabel("Name", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Username", { exact: true })).toBeVisible();
    await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Locale", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Timezone", { exact: true })).toBeVisible();

    await page.getByLabel("Name", { exact: true }).fill("Huey Duck");
    await page.getByLabel("Username", { exact: true }).fill("huey");
    await page.getByLabel("E-mail", { exact: true }).fill("huey@glomgold.com");

    const createRequest = page.waitForRequest(
      (request) => request.method() === "POST" && new URL(request.url()).pathname === "/api/users",
    );
    await page.getByRole("button", { name: "Save" }).click();

    expect((await createRequest).postDataJSON()).toMatchObject({
      name: "Huey Duck",
      username: "huey",
      email: "huey@glomgold.com",
    });
  });

  test("edit form loads existing user", async ({ page }) => {
    await gotoHash(page, "/admin/users/edit/2");

    await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Scrooge McDuck");
    await expect(page.getByLabel("Username", { exact: true })).toHaveValue("scrooge");
    await expect(page.getByLabel("E-mail", { exact: true })).toHaveValue("scrooge@glomgold.com");
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  });
});
