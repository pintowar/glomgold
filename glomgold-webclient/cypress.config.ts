import { defineConfig } from 'cypress'
import registerCodeCoverageTasks from '@cypress/code-coverage/task';

export default defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    }
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      registerCodeCoverageTasks(on, config);
      return config;
    },
    baseUrl: 'http://localhost:3000',
  },
})
