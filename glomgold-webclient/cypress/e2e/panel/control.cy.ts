describe("Panel Tests", () => {
  describe("Panel Widgets", () => {
    const user = { username: "donald", password: "123123" };
    const previous = "2023-08";
    const period = "2023-09";

    beforeEach(() => {
      cy.clearLocalStorage();

      cy.intercept("POST", "/api/login", { statusCode: 200 });
      cy.intercept("GET", "/api/auth/me", { fixture: "login/common.user.json" });
      cy.intercept("GET", /\/api\/panel\/accounts$/, { fixture: "panel/accounts.json", statusCode: 200 }).as(
        "panelAccounts"
      );
      cy.intercept("GET", new RegExp(`/api/panel\\?.*period=${period}`), {
        fixture: "panel/control.json",
        statusCode: 200,
      }).as("currentPeriod");
      cy.intercept("GET", new RegExp(`/api/panel\\?.*period=${previous}`), {
        fixture: "panel/control-empty.json",
        statusCode: 200,
      }).as("previousPeriod");

      const { username, password } = user;

      cy.visit(`/#/panel?period=${period}`);

      cy.get("#username").type(username);
      cy.get("#password").type(password);
      cy.get("button.ant-btn").click();

      cy.url().should("include", "/#/panel");
      cy.wait("@currentPeriod");
    });

    it("Period Navigation", () => {
      cy.get("[data-testid='navigate-left']").should("exist").click();
      cy.wait("@previousPeriod");

      cy.get("[data-testid='navigate-right']").should("exist").click();
      cy.wait("@currentPeriod");
    });

    it("Account Filter", () => {
      // Default selection is the first account (id asc).
      cy.get("[data-testid='account-filter']").should("contain", "Conta Corrente");

      cy.intercept("GET", /\/api\/panel\?.*accountId=2/, {
        fixture: "panel/control-empty.json",
        statusCode: 200,
      }).as("creditCardPeriod");

      cy.get("[data-testid='account-filter']").click();
      cy.get(".ant-select-item-option").contains("Cartão de Crédito").click();
      cy.wait("@creditCardPeriod");
    });

    it("Period Summary", () => {
      cy.get("[data-testid='period-summary-card']").within(() => {
        cy.get("#rc-tabs-1-tab-balance").click();
        cy.get("[data-testid='monthly-value']").then(($items) => {
          expect($items).to.contain("500,00");
        });
        cy.get("[data-testid='monthly-diff']").then(($items) => {
          expect($items).to.contain("-87,78");
        });

        cy.get("#rc-tabs-1-tab-expense").click();
        cy.get("[data-testid='monthly-value']").then(($items) => {
          expect($items).to.contain("10.500,00");
        });
        cy.get("[data-testid='monthly-diff']").then(($items) => {
          expect($items).to.contain("32,70");
        });

        cy.get("#rc-tabs-1-tab-income").click();
        cy.get("[data-testid='monthly-value']").then(($items) => {
          expect($items).to.contain("11.000,00");
        });
        cy.get("[data-testid='monthly-diff']").then(($items) => {
          expect($items).to.contain("-8,33");
        });
      });

      cy.get("[data-testid='navigate-left']").click();
      cy.wait("@previousPeriod");

      cy.get("[data-testid='period-summary-card']").within(() => {
        cy.get("#rc-tabs-1-tab-balance").click();
        cy.get("[data-testid='monthly-value']").then(($items) => {
          expect($items).to.contain("0,00");
        });
        cy.get("[data-testid='monthly-diff']").then(($items) => {
          expect($items).to.contain("0,00");
        });
      });
    });

    describe("Month Items", () => {
      it("Add Item", () => {
        const itemDesc = "Gym";
        const itemValue = 45;

        cy.intercept("GET", `/api/panel/item-complete?&description=${encodeURI(itemDesc)}`, {
          fixture: "panel/item-complete.json",
          statusCode: 200,
        }).as("itemComplete");
        cy.intercept("POST", "/api/panel/add-item", { statusCode: 200 }).as("addItem");

        cy.get("[data-testid='month-items-card']").within(() => {
          cy.get("[data-testid='description']").type(itemDesc);
          cy.get("[data-testid='value']").type(`${itemValue}`);
          cy.wait("@itemComplete");

          cy.get("[data-testid='add-item']").click();
          cy.wait("@addItem").its("request.body").should("deep.equal", {
            period: period,
            description: itemDesc,
            value: itemValue,
            itemType: "EXPENSE",
            accountId: 1,
            categoryId: null,
          });
        });
      });

      it("Edit Item", () => {
        cy.intercept("PATCH", "/api/panel/edit-item/57", { statusCode: 200 }).as("editItem");

        cy.get("[data-testid='month-items-card']").within(() => {
          cy.get(".panel-edit:first").click();

          cy.get("td #description").type("{selectall}{backspace}Workout");
          cy.get("td #value").type("{selectall}{backspace}150");

          cy.get(".panel-confirm:first").should("exist").click();
          cy.wait("@editItem");
          cy.wait("@currentPeriod");
        });
      });

      it("Delete Item", () => {
        cy.intercept("DELETE", "/api/panel/remove-item/57", { statusCode: 200 }).as("deleteItem");

        cy.get("[data-testid='month-items-card']").within(() => {
          cy.get(".panel-delete:first").should("exist").click({ force: true });
        });

        cy.get("div.ant-popover-inner button.ant-btn-primary").should("exist").click();
        cy.wait("@deleteItem");
        cy.wait("@currentPeriod");
      });

      it("Delete Items", () => {
        cy.intercept("DELETE", `/api/panel/remove-items/${period}?ids=57,58`, { statusCode: 200 }).as("removeItems");

        cy.get("[data-testid='month-items-card']").within(() => {
          cy.get(".ant-checkbox-input:nth(1)").click();
          cy.get(".ant-checkbox-input:nth(2)").click();

          cy.get("[data-testid='delete-selected']").click();
        });

        cy.get(".ant-popconfirm-buttons > .ant-btn-primary").should("exist").click();

        cy.wait("@removeItems");
      });

      it("Replicate Items", () => {
        cy.intercept("POST", `/api/panel/copy-items`, { statusCode: 200 }).as("copyItems");

        cy.get("[data-testid='month-items-card']").within(() => {
          cy.get(".ant-checkbox-input:nth(1)").click();
          cy.get(".ant-checkbox-input:nth(2)").click();

          cy.get("[data-testid='replicate-month']").click();
        });

        cy.wait("@copyItems")
          .its("request.body")
          .should("deep.equal", [
            {
              period: "2023-09",
              description: "Gym",
              itemType: "EXPENSE",
              value: 100,
              accountId: 1,
              categoryId: null,
            },
            {
              period: "2023-09",
              description: "Condominium",
              itemType: "EXPENSE",
              value: 4000,
              accountId: 1,
              categoryId: null,
            },
          ]);
      });
    });
  });
});
