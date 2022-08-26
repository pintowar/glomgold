import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import istanbul from "vite-plugin-istanbul";

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        // https://github.com/vitejs/vite/discussions/7335#discussioncomment-3373379
        alias: {
            "antd/lib": "antd/es",
        },
    },
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
    ],
});