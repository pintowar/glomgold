describe("Session Expiry", () => {
  const login = (username: string, password: string) => {
    cy.get("#username").type(username);
    cy.get("#password").type(password);
    cy.get("button.ant-btn").click();
  };

  // The credential is an HttpOnly cookie validated by the server; the client
  // only mirrors non-sensitive session metadata. Seeding it simulates a browser
  // that still looks logged-in while the cookie is gone or expired server-side.
  const seedSession = (user: object) => {
    cy.visit("/#/login", {
      onBeforeLoad: (win) => {
        win.localStorage.setItem("glomgold-session", JSON.stringify(user));
      },
    });
  };

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("Stale session metadata is rejected by the server and redirects to /login", () => {
    seedSession({ username: "donald", roles: ["ROLE_USER"] });
    cy.intercept("GET", /\/api\/panel\/accounts$/, { statusCode: 401 });
    cy.intercept("GET", /\/api\/panel(\\?|$)/, { statusCode: 401 }).as("expiredPanel");

    cy.visit("/#/panel");
    cy.wait("@expiredPanel");

    // check() is presence-based; the server 401 is what ends the session.
    cy.url().should("include", "/login");
    cy.get("#username").should("exist");
  });

  it("Mid-session 401 redirects to /login and re-login returns to the prior page", () => {
    seedSession({ username: "donald", roles: ["ROLE_USER"] });
    cy.intercept("GET", /\/api\/panel\/accounts$/, { statusCode: 401 });
    cy.intercept("GET", /\/api\/panel(\\?|$)/, { statusCode: 401 }).as("expiredPanel");

    cy.visit("/#/panel");
    cy.wait("@expiredPanel");

    // onError turns the 401 into logout + redirect, preserving the return page.
    cy.url().should("include", "/login");
    cy.url().should("include", "to=");
    cy.window().then((win) => {
      expect(win.localStorage.getItem("glomgold-session")).to.be.null;
    });

    // Re-login lands back on the page the user was on, not a modal.
    cy.intercept("POST", "/api/login", { statusCode: 200 });
    cy.intercept("GET", "/api/auth/me", { fixture: "login/common.user.json" });
    cy.intercept("GET", /\/api\/panel\/accounts$/, { fixture: "panel/accounts.json" });
    cy.intercept("GET", "/api/panel/accounts", { fixture: "panel/accounts.json" });
    cy.intercept("GET", /\/api\/panel(\\?|$)/, { fixture: "panel/control-empty.json" }).as("control");
    cy.intercept("GET", "/api/panel", { fixture: "panel/control-empty.json" });
    login("donald", "123123");

    cy.url().should("include", "/#/panel");
    cy.get(".ant-layout-header").should("contain", "Painel");
  });
});
