import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import istanbul from "vite-plugin-istanbul";

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8080/",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    process.env.VITE_COVERAGE &&
      istanbul({
        include: "src/**/*.{ts,tsx}",
        exclude: ["node_modules", "e2e/**", "src/**/*.test.ts", "src/**/*.spec.ts"],
        extension: [".ts", ".tsx"],
        forceBuildInstrument: true,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
