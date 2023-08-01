import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import istanbul from "vite-plugin-istanbul";

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      "/api": {
          target: "http://localhost:8080/",
          changeOrigin: true,
          secure: false,
      },
      "/login": {
          target: "http://localhost:8080/",
          changeOrigin: true,
          secure: false,
      },
    },
  },
  plugins: [
    react(),
    process.env.NODE_ENV === "production"
      ? null
      : istanbul({
        include: "src/*",
        exclude: ["node_modules", "cypress/"],
        extension: [".js", ".ts", ".jsx", ".tsx"],
        cypress: true,
        requireEnv: false,
      }),
  ]
});
