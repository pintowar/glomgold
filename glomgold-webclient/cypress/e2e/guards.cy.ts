describe("Route Guard Tests", () => {
  const commonUser = { username: "donald", password: "123123" };
  const adminUser = { username: "admin", password: "admin" };

  const login = (user: { username: string; password: string }) => {
    cy.get("#username").type(user.username);
    cy.get("#password").type(user.password);
    cy.get("button.ant-btn").click();
  };

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("Common user visiting /admin is redirected to /panel", () => {
    cy.intercept("POST", "/api/login", { fixture: "login/common.user.json", statusCode: 200 });
    cy.intercept("GET", "/api/panel*", { fixture: "panel/control-empty.json", statusCode: 200 }).as("control");

    cy.visit("/#/admin/users");
    login(commonUser);

    // authProvider sends common users to /panel on login (not back to the visited admin page).
    cy.url().should("include", "/#/panel");

    // Authenticated revisit of an admin resource is bounced to /panel by the CanAccess fallback in App.tsx.
    cy.visit("/#/admin/users");
    cy.url().should("include", "/#/panel");
    cy.url().should("not.include", "/admin/users");
  });

  it("Admin user visiting /admin stays and dashboard renders", () => {
    cy.intercept("POST", "/api/login", { fixture: "login/admin.user.json", statusCode: 200 });
    cy.intercept("GET", "/api/users*", { fixture: "admin/users.json", statusCode: 200 }).as("users");
    cy.intercept("GET", "/api/management/info*", { fixture: "admin/info.json", statusCode: 200 }).as("dashboardInfo");

    cy.visit("/#/admin");
    login(adminUser);

    // authProvider sends admins to /admin, whose index navigates to the dashboard resource.
    cy.url().should("include", "/admin");
    cy.wait("@dashboardInfo");
    cy.contains("Management Info").should("exist");
  });

  it("Common user visiting /panel stays", () => {
    cy.intercept("POST", "/api/login", { fixture: "login/common.user.json", statusCode: 200 });
    cy.intercept("GET", "/api/panel*", { fixture: "panel/control-empty.json", statusCode: 200 }).as("control");

    cy.visit("/#/panel");
    login(commonUser);

    cy.url().should("include", "/#/panel");
    cy.get(".ant-layout-header").should("contain", "Panel");
  });

  it("Unauthenticated visit to /panel redirects to /login", () => {
    cy.visit("/#/panel");

    // Authenticated fallback in App.tsx sends anonymous users to /login.
    cy.url().should("include", "/login");
    cy.get("#username").should("exist");
  });
});
