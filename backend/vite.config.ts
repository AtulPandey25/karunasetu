import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "server",
      fileName: "index",
      formats: ["es"],
    },
    outDir: "../dist/backend",
    target: "node22",
    ssr: true,
    rollupOptions: {
      external: [
        "fs",
        "path",
        "url",
        "http",
        "https",
        "os",
        "crypto",
        "stream",
        "util",
        "events",
        "buffer",
        "querystring",
        "child_process",
        "express",
        "cors",
        "mongoose",
        "jsonwebtoken",
        "bcryptjs",
        "multer",
        "cloudinary",
        "dotenv",
      ],
      output: {
        format: "es",
        entryFileNames: "[name].mjs",
      },
    },
    minify: false,
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@routes": path.resolve(__dirname, "./src/routes"),
      "@controllers": path.resolve(__dirname, "./src/controllers"),
      "@models": path.resolve(__dirname, "./src/models"),
      "@middleware": path.resolve(__dirname, "./src/middleware"),
      "@types": path.resolve(__dirname, "./src/types"),
    },
  },
});
