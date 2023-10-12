describe("Panel Report Tests", () => {
  describe("Report Tests", () => {
    const user = { username: "donald", password: "123123" };

    beforeEach(() => {
      cy.clearLocalStorage();
    });

    it("Report: BALANCE / 2023", () => {
      cy.intercept("POST", "/api/login", { fixture: "login/common.user.json" });
      cy.intercept("GET", "/api/panel/report?&type=BALANCE&year=2023", { fixture: "panel/report.json" }).as(
        "currentReport"
      );

      const { username, password } = user;

      cy.visit("/#/panel/report?period=2023");

      cy.get("#username").type(username);
      cy.get("#password").type(password);
      cy.get("button.ant-btn").click();

      cy.url().should("include", "/panel/report");

      cy.wait("@currentReport").then(() => {
        cy.get(`[data-row-key="1"] > :nth-child(10) a`).should("have.css", "color", "rgb(245, 34, 45)");

        cy.get(`[data-row-key="2"] > :nth-child(9) > a`).should("have.css", "color", "rgb(22, 119, 255)");

        cy.get(`[data-node-key="2"]`).click();

        cy.get("#apexchartsline").should("have.css", "height", "350px");
        cy.get("#apexchartsbar").should("have.css", "height", "350px");
      });
    });
  });
});
