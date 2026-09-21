describe("Admin Users Tests", () => {
  const admin = { username: "admin", password: "admin" };

  beforeEach(() => {
    cy.clearLocalStorage();

    cy.intercept("POST", "/api/login", { fixture: "login/admin.user.json", statusCode: 200 }).as("login");
    cy.intercept("GET", "/api/users*", { fixture: "admin/users.json", statusCode: 200 }).as("users");
    cy.intercept("GET", "/api/management/info*", { fixture: "admin/info.json", statusCode: 200 }).as("dashboardInfo");

    const { username, password } = admin;

    cy.visit("/#/admin/users");

    cy.get("#username").type(username);
    cy.get("#password").type(password);
    cy.get("button.ant-btn").click();

    // Admin login redirects to /admin (dashboard), not back to the visited page.
    cy.url().should("include", "/admin");
    cy.wait("@dashboardInfo");
  });

  it("List renders user rows", () => {
    cy.visit("/#/admin/users");
    cy.wait("@users");

    cy.get(".ant-table-tbody tr[data-row-key]").should("have.length", 3);
    cy.get(".ant-table-tbody").should("contain", "Scrooge McDuck");
    cy.get(".ant-table-tbody").should("contain", "donald");

    cy.get(".ant-table-thead").should("contain", "Username");
    cy.get(".ant-table-thead").should("contain", "E-mail");
    cy.get(".ant-table-thead").should("contain", "Actions");

    // ResourceActions renders exactly two buttons per row: Edit + Delete.
    cy.get('.ant-table-tbody tr[data-row-key="1"]').within(() => {
      cy.get("button").should("have.length", 2);
    });
  });

  it("Create form renders fields and submits", () => {
    cy.intercept("GET", "/api/users/locales", { body: ["en_US"], statusCode: 200 }).as("locales");
    cy.intercept("GET", "/api/users/timezones", { body: ["UTC"], statusCode: 200 }).as("timezones");
    cy.intercept("POST", "/api/users", { statusCode: 201 }).as("createUser");

    cy.visit("/#/admin/users/create");
    cy.wait("@locales");
    cy.wait("@timezones");

    cy.get("form").within(() => {
      cy.contains("label", "Name").should("exist");
      cy.contains("label", "Username").should("exist");
      cy.contains("label", "E-mail").should("exist");
      cy.contains("label", "Locale").should("exist");
      cy.contains("label", "Timezone").should("exist");
    });

    cy.get("#name").type("Huey Duck");
    cy.get("#username").type("huey");
    cy.get("#email").type("huey@glomgold.com");

    cy.get("button.ant-btn-primary").click();
    cy.wait("@createUser").its("request.body").should("include", { username: "huey" });
  });

  it("Edit form loads existing user", () => {
    cy.intercept("GET", "/api/users/locales", { body: ["en_US"], statusCode: 200 }).as("locales");
    cy.intercept("GET", "/api/users/timezones", { body: ["UTC"], statusCode: 200 }).as("timezones");
    cy.intercept("GET", "/api/users/2", {
      body: {
        id: 2,
        version: 0,
        username: "scrooge",
        name: "Scrooge McDuck",
        email: "scrooge@glomgold.com",
        enabled: true,
        admin: false,
        locale: "en_US",
        timezone: "UTC",
      },
      statusCode: 200,
    }).as("getUser");

    cy.visit("/#/admin/users/edit/2");
    cy.wait("@getUser");

    cy.get("#name").should("have.value", "Scrooge McDuck");
    cy.get("#username").should("have.value", "scrooge");
    cy.get("#email").should("have.value", "scrooge@glomgold.com");
    cy.get("button.ant-btn-primary").should("exist");
  });

  it("Show renders user fields", () => {
    cy.intercept("GET", "/api/users/3", {
      body: {
        id: 3,
        version: 0,
        username: "donald",
        name: "Donald Duck",
        email: "donald@glomgold.com",
        enabled: true,
        admin: false,
        locale: "pt_BR",
        timezone: "America/Fortaleza",
      },
      statusCode: 200,
    }).as("showUser");

    cy.visit("/#/admin/users/show/3");
    cy.wait("@showUser");

    cy.contains("h5", "Username").should("exist");
    cy.contains("h5", "E-Mail").should("exist");
    cy.contains("Donald Duck").should("exist");
    cy.contains("donald@glomgold.com").should("exist");
  });
});
