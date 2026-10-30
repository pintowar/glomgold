describe("Login Tests", () => {
  describe("Successful Login", () => {
    const user = { username: "donald", password: "123123" };

    beforeEach(() => {
      cy.clearLocalStorage();
    });

    it("Common User Login", () => {
      // POST returns an empty 200 (the JWT is set as an HttpOnly cookie);
      // the SPA then reads non-sensitive metadata from /api/auth/me.
      cy.intercept("POST", "/api/login", { statusCode: 200 });
      cy.intercept("GET", "/api/auth/me", { fixture: "login/common.user.json" });
      cy.intercept("GET", /\/api\/panel\/accounts$/, { fixture: "panel/accounts.json" });
      cy.intercept("GET", "/api/panel*", { fixture: "panel/control.json" });

      const { username, password } = user;

      cy.visit("/");

      cy.get("#username").type(username);
      cy.get("#password").type(password);
      cy.get("button.ant-btn").click();

      cy.url().should("include", "/panel");
      cy.get(".ant-layout-header").contains("Painel");
      cy.get(".ant-layout-header").contains("Relatórios");

      // Reports live in a submenu, so the entries only render once it is opened.
      cy.get(".ant-layout-header .ant-menu-submenu-title").contains("Relatórios").trigger("mouseover");
      cy.get(".ant-menu-submenu-popup")
        .should("be.visible")
        .and("contain", "Relatório Anual")
        .and("contain", "Relatório Geral");

      cy.get(".ant-card").should("have.length", 4);

      // Only non-sensitive session metadata is stored; the credential itself
      // lives in an HttpOnly cookie the browser attaches automatically.
      cy.getLocalStorage("glomgold-session").should("exist");
    });

    it("Admin User Login", () => {
      cy.intercept("POST", "/api/login", { statusCode: 200 });
      cy.intercept("GET", "/api/auth/me", { fixture: "login/admin.user.json" });
      cy.intercept("GET", "/api/users*", { fixture: "admin/users.json" });
      cy.intercept("GET", "/api/management/info*", { fixture: "admin/info.json" });

      const { username, password } = user;

      cy.visit("/");

      cy.get("#username").type(username);
      cy.get("#password").type(password);
      cy.get("button.ant-btn").click();

      cy.url().should("not.include", "/panel");
      cy.get(".ant-layout-sider").should("exist");

      cy.getLocalStorage("glomgold-session").should("exist");
    });
  });

  describe("Failed Login", () => {
    const user = { username: "donald", password: "123123" };

    beforeEach(() => {
      cy.clearLocalStorage();
    });

    it("Common User Login", () => {
      cy.intercept("POST", "/api/login", { statusCode: 401 });

      const { username, password } = user;

      cy.visit("/");

      cy.get("#username").type(username);
      cy.get("#password").type(password);
      cy.get("button.ant-btn").click();

      cy.get(".ant-notification-notice").should("exist");
    });
  });
});
