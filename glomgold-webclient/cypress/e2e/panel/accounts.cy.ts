describe("Panel Accounts Tests", () => {
  const user = { username: "donald", password: "123123" };

  const accounts = [
    { id: 1, version: 0, name: "Conta Corrente", currency: "BRL", type: "CHECKING", userId: 3 },
    { id: 2, version: 0, name: "Cartão de Crédito", currency: "BRL", type: "CREDIT_CARD", userId: 3 },
  ];

  const signIn = () => {
    cy.visit("/#/panel/accounts");

    cy.get("#username").type(user.username);
    cy.get("#password").type(user.password);
    cy.get("button.ant-btn").click();

    cy.visit("/#/panel/accounts");
    cy.wait("@accounts");
  };

  beforeEach(() => {
    cy.clearLocalStorage();

    cy.intercept("POST", "/api/login", { statusCode: 200 });
    cy.intercept("GET", "/api/auth/me", { fixture: "login/common.user.json" });
    cy.intercept("GET", /\/api\/panel\/accounts$/, { body: accounts, statusCode: 200 }).as("accounts");
  });

  it("Lists the user accounts", () => {
    signIn();

    cy.get("[data-cy='accounts-panel'] .ant-table-tbody tr[data-row-key]").should("have.length", 2);
    cy.get("[data-cy='accounts-panel'] .ant-table-tbody").should("contain", "Conta Corrente");
    cy.get("[data-cy='accounts-panel'] .ant-table-tbody").should("contain", "Cartão de Crédito");
  });

  it("Creates an account", () => {
    cy.intercept("POST", /\/api\/panel\/accounts$/, { statusCode: 200, body: { id: 3 } }).as("createAccount");

    signIn();

    cy.get("[data-cy='new-account']").click();
    cy.get("[data-cy='account-name']").type("Poupança");
    cy.get("div.ant-modal-footer button.ant-btn-primary").click();

    cy.wait("@createAccount").its("request.body").should("deep.equal", {
      name: "Poupança",
      currency: "",
      type: "CHECKING",
    });
  });

  it("Removes an account", () => {
    cy.intercept("DELETE", /\/api\/panel\/accounts\/1$/, { statusCode: 200 }).as("removeAccount");

    signIn();

    cy.get(".ant-table-tbody tr[data-row-key='1'] [data-cy='remove-account']").click();
    cy.get("div.ant-popover-inner button.ant-btn-primary").click();

    cy.wait("@removeAccount");
  });
});
