module.exports = {
  e2e: {
    specPattern: "cypress/integration/**/*.ts",
    supportFile: "cypress/support/index.js",
    setupNodeEvents(on, config) {
      return require("./cypress/plugins/index.js")(on, config) || config
    },
  },
}
