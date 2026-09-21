describe("Panel Profile Tests", () => {
  const user = { username: "donald", password: "123123" };
  const profile = {
    name: "Donald Duck",
    email: "donald@glomgold.com",
    locale: "pt_BR",
    timezone: "America/Fortaleza",
  };

  beforeEach(() => {
    cy.clearLocalStorage();

    cy.intercept("POST", "/api/login", { fixture: "login/common.user.json", statusCode: 200 }).as("login");
    // Control panel is the post-login landing page for common users (authProvider redirectTo "/panel").
    cy.intercept("GET", "/api/panel*", { fixture: "panel/control-empty.json", statusCode: 200 }).as("control");
    cy.intercept("GET", "/api/panel/profile", { body: profile, statusCode: 200 }).as("profile");
    // useLabelValueOptions expects plain string arrays, mapped to { label, value } pairs.
    cy.intercept("GET", "/api/panel/locales", { body: ["en_US", "pt_BR"], statusCode: 200 }).as("locales");
    cy.intercept("GET", "/api/panel/timezones", { body: ["UTC", "America/Fortaleza"], statusCode: 200 }).as(
      "timezones"
    );

    const { username, password } = user;

    cy.visit("/#/panel/profile");

    cy.get("#username").type(username);
    cy.get("#password").type(password);
    cy.get("button.ant-btn").click();

    // Common-user login redirects to /panel (control index), not back to /panel/profile.
    cy.url().should("include", "/#/panel");

    cy.visit("/#/panel/profile");
    cy.wait("@profile");
  });

  it("Renders both profile cards with initial values", () => {
    cy.wait("@locales");
    cy.wait("@timezones");

    cy.contains("Profile Information").should("exist");
    cy.contains("Change Password").should("exist");

    cy.get('form[name="profile-form"]').within(() => {
      cy.contains("label", "Name").should("exist");
      cy.contains("label", "E-mail").should("exist");
      cy.contains("label", "Locale").should("exist");
      cy.contains("label", "Timezone").should("exist");
    });

    cy.get('form[name="user-form"]').within(() => {
      cy.contains("label", "Actual Password").should("exist");
      cy.contains("label", "New Password").should("exist");
    });

    // Profile GET response populates the info form (antd prefixes input ids with the form name).
    cy.get("#profile-form_name").should("have.value", profile.name);
    cy.get("#profile-form_email").should("have.value", profile.email);
  });

  it("Saves profile info", () => {
    cy.intercept("PATCH", "/api/panel/profile", { statusCode: 200 }).as("updateProfile");

    // Ensure the GET-loaded values are in the form before editing, so required validation passes.
    cy.get("#profile-form_email").should("have.value", profile.email);

    const newName = "Donald Fauntleroy Duck";
    cy.get("#profile-form_name").type(`{selectall}{backspace}${newName}`);

    cy.get('form[name="profile-form"]').within(() => {
      cy.contains("button", "Save").click();
    });

    cy.wait("@updateProfile").its("request.body").should("include", { name: newName });
    cy.get(".ant-notification-notice").should("contain", "Profile updated.");
  });

  it("Changing password logs the user out", () => {
    cy.intercept("POST", "/api/panel/profile/password", { statusCode: 200 }).as("changePassword");

    cy.get("#user-form_actualPassword").type("123123");
    cy.get("#user-form_newPassword").type("newpass123");

    cy.get('form[name="user-form"]').within(() => {
      cy.contains("button", "Change").click();
    });

    cy.wait("@changePassword")
      .its("request.body")
      .should("deep.equal", { passwords: { actualPassword: "123123", newPassword: "newpass123" } });

    // Password card logs out on success (onSuccess: () => logout()), which redirects to /login.
    cy.url().should("include", "/login");
    cy.get("#username").should("exist");
  });
});
