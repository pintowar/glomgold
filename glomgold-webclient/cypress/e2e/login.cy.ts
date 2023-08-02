describe("Login Tests", () => {
  describe("Successful Login", () => {
    const user = { username: "donald", password: "123123" };

    beforeEach(() => {
      cy.clearLocalStorage();
    });

    it("Common User Login", () => {
      cy.intercept("POST", "/login", { fixture: "login/common.user.json" });
      cy.intercept("GET", "/api/panel*", { fixture: "panel/control.json" });

      const { username, password } = user;

      cy.visit("/");

      cy.get("#username").type(username);
      cy.get("#password").type(password);
      cy.get("button.ant-btn").click();

      cy.url().should("include", "/panel");
      cy.get(".ant-layout-header").contains("Panel");
      cy.get(".ant-layout-header").contains("Report");

      cy.get(".ant-card").should("have.length", 4);

      cy.getLocalStorage("glomgold-jwt-user").should("exist");
      cy.getLocalStorage("glomgold-jwt-token").should("exist");
    });

    it("Admin User Login", () => {
      cy.intercept("POST", "/login", { fixture: "login/admin.user.json" });
      cy.intercept("GET", "/api/users*", { fixture: "admin/users.json" });
      cy.intercept("GET", "/management/info*", { fixture: "admin/info.json" });

      const { username, password } = user;

      cy.visit("/");

      cy.get("#username").type(username);
      cy.get("#password").type(password);
      cy.get("button.ant-btn").click();

      cy.url().should("not.include", "/panel");
      cy.get(".ant-layout-sider").should("exist");

      cy.getLocalStorage("glomgold-jwt-user").should("exist");
      cy.getLocalStorage("glomgold-jwt-token").should("exist");
    });
  });

  describe("Failed Login", () => {
    const user = { username: "donald", password: "123123" };

    beforeEach(() => {
      cy.clearLocalStorage();
    });

    it("Common User Login", () => {
      cy.intercept("POST", "/login", { statusCode: 401 });

      const { username, password } = user;

      cy.visit("/");

      cy.get("#username").type(username);
      cy.get("#password").type(password);
      cy.get("button.ant-btn").click();

      cy.get(".ant-notification-notice").should("exist");
    });
  });
});
