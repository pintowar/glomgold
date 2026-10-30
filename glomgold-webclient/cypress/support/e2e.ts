// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";

// Categories and groups are loaded by the panel and by item forms. Specs that do not
// stub them would otherwise hit the real API unauthenticated, and a 401 clears the
// session and bounces the test back to /login.
beforeEach(() => {
  cy.intercept("GET", /\/api\/(panel\/)?category-groups.*/, { statusCode: 200, body: [] });
  cy.intercept("GET", /\/api\/(panel\/)?categories.*/, { statusCode: 200, body: [] });
});

// Alternatively you can use CommonJS syntax:
// require('./commands')
