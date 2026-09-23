describe("Session Expiry", () => {
  const login = (username: string, password: string) => {
    cy.get("#username").type(username);
    cy.get("#password").type(password);
    cy.get("button.ant-btn").click();
  };

  const seedSession = (token: string, user: object) => {
    cy.visit("/#/login", {
      onBeforeLoad: (win) => {
        win.localStorage.setItem("glomgold-jwt-token", token);
        win.localStorage.setItem("glomgold-jwt-user", JSON.stringify(user));
      },
    });
  };

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("Expired token in storage redirects to /login", () => {
    seedSession("expired-token", { sub: "donald", roles: ["ROLE_USER"], exp: 1648866151 });

    cy.visit("/#/panel");

    // check() rejects the expired token, Authenticated fallback bounces to /login.
    cy.url().should("include", "/login");
    cy.get("#username").should("exist");
  });

  it("Mid-session 401 redirects to /login and re-login returns to the prior page", () => {
    seedSession("valid-token", { sub: "donald", roles: ["ROLE_USER"], exp: 1893456000 });
    cy.intercept("GET", "/api/panel*", { statusCode: 401 }).as("expiredPanel");

    cy.visit("/#/panel");
    cy.wait("@expiredPanel");

    // onError turns the 401 into logout + redirect, preserving the return page.
    cy.url().should("include", "/login");
    cy.url().should("include", "to=");
    cy.window().then((win) => {
      expect(win.localStorage.getItem("glomgold-jwt-token")).to.be.null;
    });

    // Re-login lands back on the page the user was on, not a modal.
    cy.intercept("POST", "/api/login", { fixture: "login/common.user.json" });
    cy.intercept("GET", "/api/panel*", { fixture: "panel/control-empty.json" }).as("control");
    login("donald", "123123");

    cy.url().should("include", "/#/panel");
    cy.get(".ant-layout-header").should("contain", "Panel");
  });
});
