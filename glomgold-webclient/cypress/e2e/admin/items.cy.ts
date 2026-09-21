describe("Admin Items Tests", () => {
  const admin = { username: "admin", password: "admin" };

  const items = [
    {
      id: 1,
      version: 0,
      description: "Gym",
      value: 100,
      itemType: "EXPENSE",
      currency: "USD",
      year: 2023,
      month: 9,
      userId: 2,
    },
    {
      id: 2,
      version: 0,
      description: "Salary",
      value: 11000,
      itemType: "INCOME",
      currency: "USD",
      year: 2023,
      month: 9,
      userId: 3,
    },
  ];

  beforeEach(() => {
    cy.clearLocalStorage();

    cy.intercept("POST", "/api/login", { fixture: "login/admin.user.json", statusCode: 200 }).as("login");
    cy.intercept("GET", "/api/items*", { body: items, statusCode: 200 }).as("items");
    cy.intercept("GET", "/api/users*", { fixture: "admin/users.json", statusCode: 200 }).as("users");
    cy.intercept("GET", "/api/management/info*", { fixture: "admin/info.json", statusCode: 200 }).as("dashboardInfo");

    const { username, password } = admin;

    cy.visit("/#/admin/items");

    cy.get("#username").type(username);
    cy.get("#password").type(password);
    cy.get("button.ant-btn").click();

    // Admin login redirects to /admin (dashboard), not back to the visited page.
    cy.url().should("include", "/admin");
    cy.wait("@dashboardInfo");
  });

  it("List renders items with user names", () => {
    cy.visit("/#/admin/items");
    cy.wait("@items");
    cy.wait("@users");

    cy.get(".ant-table-tbody tr[data-row-key]").should("have.length", 2);
    cy.get(".ant-table-tbody").should("contain", "Gym");
    cy.get(".ant-table-tbody").should("contain", "Salary");

    // The User column resolves userId through the user Map lookup (useMany),
    // so rows must show names ("Scrooge McDuck") rather than raw ids.
    cy.get('.ant-table-tbody tr[data-row-key="1"]').should("contain", "Scrooge McDuck");
    cy.get('.ant-table-tbody tr[data-row-key="2"]').should("contain", "Donald Duck");

    cy.get(".ant-table-thead").should("contain", "Description");
    cy.get(".ant-table-thead").should("contain", "User");
    cy.get(".ant-table-thead").should("contain", "Actions");
  });

  it("Edit form loads item with user Select", () => {
    cy.intercept("GET", "/api/items/1", { body: items[0], statusCode: 200 }).as("getItem");

    cy.visit("/#/admin/items/edit/1");
    cy.wait("@getItem");

    cy.get("#description").should("have.value", "Gym");
    cy.get("#value").should("have.value", "100");

    cy.get("form").within(() => {
      cy.contains("label", "Type").should("exist");
      cy.contains("label", "Description").should("exist");
      cy.contains("label", "Value").should("exist");
      cy.contains("label", "User").should("exist");
    });

    // User field is an antd Select bound to Form.Item name="userId".
    cy.get("#userId").should("exist");
    cy.get("button.ant-btn-primary").should("exist");
  });

  it("Show renders item fields", () => {
    cy.intercept("GET", "/api/items/1", { body: items[0], statusCode: 200 }).as("showItem");
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
    }).as("showItemUser");

    cy.visit("/#/admin/items/show/1");
    cy.wait("@showItem");
    cy.wait("@showItemUser");

    cy.contains("h5", "Description").should("exist");
    cy.contains("h5", "User").should("exist");
    cy.contains("Gym").should("exist");
    cy.contains("Scrooge McDuck").should("exist");
  });
});
