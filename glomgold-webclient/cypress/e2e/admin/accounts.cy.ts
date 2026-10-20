describe("Admin Accounts Tests", () => {
  const admin = { username: "admin", password: "admin" };

  const accounts = [
    { id: 1, version: 0, name: "Checking", currency: "USD", type: "CHECKING", userId: 2 },
    { id: 2, version: 0, name: "Credit Card", currency: "USD", type: "CREDIT_CARD", userId: 3 },
  ];

  beforeEach(() => {
    cy.clearLocalStorage();

    cy.intercept("POST", "/api/login", { statusCode: 200 }).as("login");
    cy.intercept("GET", "/api/auth/me", { fixture: "login/admin.user.json" });
    cy.intercept("GET", "/api/accounts*", { body: accounts, statusCode: 200 }).as("accounts");
    cy.intercept("GET", "/api/users*", { fixture: "admin/users.json", statusCode: 200 }).as("users");

    const { username, password } = admin;

    cy.visit("/#/admin/accounts");

    cy.get("#username").type(username);
    cy.get("#password").type(password);
    cy.get("button.ant-btn").click();

    // Admin login redirects to /admin (dashboard), not back to the visited page.
    cy.url().should("include", "/admin");
  });

  it("List renders account rows with user names", () => {
    cy.visit("/#/admin/accounts");
    cy.wait("@accounts");
    cy.wait("@users");

    cy.get(".ant-table-tbody tr[data-row-key]").should("have.length", 2);
    cy.get(".ant-table-tbody").should("contain", "Checking");
    cy.get(".ant-table-tbody").should("contain", "Credit Card");

    // The User column resolves userId through the user Map lookup (useMany).
    cy.get('.ant-table-tbody tr[data-row-key="1"]').should("contain", "Scrooge McDuck");
    cy.get('.ant-table-tbody tr[data-row-key="2"]').should("contain", "Donald Duck");

    cy.get(".ant-table-thead").should("contain", "Name");
    cy.get(".ant-table-thead").should("contain", "Type");
    cy.get(".ant-table-thead").should("contain", "Currency");
    cy.get(".ant-table-thead").should("contain", "User");
    cy.get(".ant-table-thead").should("contain", "Actions");
  });

  it("Create form renders fields and submits", () => {
    cy.intercept("POST", "/api/accounts", { statusCode: 201 }).as("createAccount");

    cy.visit("/#/admin/accounts/create");
    cy.wait("@users");

    cy.get("form").within(() => {
      cy.contains("label", "Name").should("exist");
      cy.contains("label", "Type").should("exist");
      cy.contains("label", "Currency").should("exist");
      cy.contains("label", "User").should("exist");
    });

    cy.get("#name").type("Vacation");
    cy.get("#currency").type("USD");
    cy.get("#userId").click();
    cy.get(".ant-select-item-option").contains("Scrooge McDuck").click();

    cy.get("button.ant-btn-primary").click();
    cy.wait("@createAccount")
      .its("request.body")
      .should("include", { name: "Vacation", currency: "USD", type: "CHECKING", userId: 2 });
  });

  it("Edit form loads existing account", () => {
    cy.intercept("GET", "/api/accounts/1", { body: accounts[0], statusCode: 200 }).as("getAccount");

    cy.visit("/#/admin/accounts/edit/1");
    cy.wait("@getAccount");

    cy.get("#name").should("have.value", "Checking");
    cy.get("#currency").should("have.value", "USD");
    cy.get("#userId").should("exist");
    cy.get("button.ant-btn-primary").should("exist");
  });
});
