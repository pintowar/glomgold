describe("Panel Tests", () => {
  describe("Panel Widgets", () => {
    const user = { username: "donald", password: "123123" };

    beforeEach(() => {
      cy.clearLocalStorage();

      cy.intercept("POST", "/api/login", { fixture: "login/common.user.json" });
      cy.intercept("GET", "/api/panel?&period=2023-09", { fixture: "panel/control.json" }).as("currentPeriod");
      cy.intercept("GET", "/api/panel?&period=2023-08", { fixture: "panel/control-empty.json" }).as("previousPeriod");
    });

    it("Period Navigation", () => {
      const { username, password } = user;

      cy.visit("/#/panel?period=2023-09");

      cy.get("#username").type(username);
      cy.get("#password").type(password);
      cy.get("button.ant-btn").click();

      cy.url().should("include", "/#/panel");

      cy.get("[data-testid='navigate-left']").click();
      cy.wait("@previousPeriod");

      cy.get("[data-testid='navigate-right']").click();
      cy.wait("@currentPeriod");
    });

    it("Period Summary", () => {
      const { username, password } = user;

      cy.visit("/#/panel?period=2023-09");

      cy.get("#username").type(username);
      cy.get("#password").type(password);
      cy.get("button.ant-btn").click();

      cy.url().should("include", "/#/panel");

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
      const period = "2023-09";

      beforeEach(() => {
        const { username, password } = user;

        cy.visit(`/#/panel?period=${period}`);

        cy.get("#username").type(username);
        cy.get("#password").type(password);
        cy.get("button.ant-btn").click();

        cy.url().should("include", "/#/panel");
      });

      it("Add Item", () => {
        const itemDesc = "Gym";
        const itemValue = 45;

        cy.intercept("GET", `/api/panel/item-complete?&description=${encodeURI(itemDesc)}`, {
          fixture: "panel/item-complete.json",
        }).as("itemComplete");
        cy.intercept("POST", "/api/panel/add-item").as("addItem");

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
          });
        });
      });

      it("Edit/Delete Item", () => {
        cy.intercept("PATCH", "/api/panel/edit-item/57").as("editItem");
        cy.intercept("DELETE", "/api/panel/remove-item/57").as("deleteItem");

        cy.get("[data-testid='month-items-card']").within(() => {
          cy.get(".anticon-edit:first").click();

          cy.get("td #description").type("{selectall}{backspace}Workout");
          cy.get("td #value").type("{selectall}{backspace}150");

          cy.get(".anticon-check:first").click();
          cy.wait("@editItem");

          cy.get(".anticon-delete:first").click();
        });

        cy.get("div.ant-popover-inner button.ant-btn-primary").should("exist").click();

        cy.wait("@deleteItem");
      });

      it("Delete Items", () => {
        cy.intercept("DELETE", `/api/panel/remove-items/${period}?ids=57,58`).as("removeItems");

        cy.get("[data-testid='month-items-card']").within(() => {
          cy.get(".ant-checkbox-input:nth(1)").click();
          cy.get(".ant-checkbox-input:nth(2)").click();

          cy.get("[data-testid='delete-selected']").click();
        });

        cy.get("div.ant-modal-content button.ant-btn-primary").should("exist").click();

        cy.wait("@removeItems");
      });

      it("Replicate Items", () => {
        cy.intercept("POST", `/api/panel/copy-items`).as("copyItems");

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
            },
            {
              period: "2023-09",
              description: "Condominium",
              itemType: "EXPENSE",
              value: 4000,
            },
          ]);
      });
    });
  });
});
