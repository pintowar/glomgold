import { expect, test } from "playwright-test-coverage";

import { json } from "../support/api";
import { gotoHash, signedIn } from "../support/auth";

const profile = {
  name: "Donald Duck",
  email: "donald@glomgold.com",
  locale: "pt_BR",
  timezone: "America/Fortaleza",
};

test.describe("Panel profile", () => {
  test.beforeEach(async ({ page }) => {
    await signedIn(page, "common", [
      { method: "GET", path: "/api/panel/profile", reply: json(profile) },
      { method: "GET", path: "/api/panel/locales", reply: json(["en_US", "pt_BR"]) },
      { method: "GET", path: "/api/panel/timezones", reply: json(["UTC", "America/Fortaleza"]) },
      { method: "PATCH", path: "/api/panel/profile", reply: json({}) },
      { method: "POST", path: "/api/panel/profile/password", reply: json({}) },
      { method: "POST", path: "/api/logout", reply: json({}) },
    ]);

    await gotoHash(page, "/panel/profile");
  });

  test("renders both profile cards with initial values", async ({ page }) => {
    await expect(page.getByText("Informações do Perfil")).toBeVisible();
    await expect(page.getByText("Alterar Senha")).toBeVisible();

    await expect(page.getByLabel("Nome", { exact: true })).toHaveValue(profile.name);
    await expect(page.getByLabel("E-mail", { exact: true })).toHaveValue(profile.email);
    await expect(page.getByLabel("Idioma", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Fuso horário", { exact: true })).toBeVisible();

    await expect(page.getByLabel("Senha Atual", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Nova Senha", { exact: true })).toBeVisible();
  });

  test("saves profile info", async ({ page }) => {
    const nameInput = page.getByLabel("Nome", { exact: true });
    // The GET response calls reset(); wait for it before typing or the edit is overwritten.
    await expect(nameInput).toHaveValue(profile.name);

    const newName = "Donald Fauntleroy Duck";
    await nameInput.fill(newName);

    const updateRequest = page.waitForRequest(
      (request) => request.method() === "PATCH" && new URL(request.url()).pathname === "/api/panel/profile",
    );
    await page.getByRole("button", { name: "Salvar" }).click();

    expect((await updateRequest).postDataJSON()).toMatchObject({ name: newName });
    await expect(page.locator("[data-sonner-toast]")).toContainText("Perfil atualizado.");
  });

  test("changing the password logs the user out", async ({ page }) => {
    await page.getByLabel("Senha Atual", { exact: true }).fill("123123");
    await page.getByLabel("Nova Senha", { exact: true }).fill("newpass123");

    const changeRequest = page.waitForRequest(
      (request) =>
        request.method() === "POST" && new URL(request.url()).pathname === "/api/panel/profile/password",
    );
    await page.getByRole("button", { name: "Alterar" }).click();

    expect((await changeRequest).postDataJSON()).toEqual({
      actualPassword: "123123",
      newPassword: "newpass123",
    });

    // The password card logs out on success, which redirects to /login.
    await expect(page).toHaveURL(/#\/login/);
    await expect(page.locator("#username")).toBeVisible();
  });
});
