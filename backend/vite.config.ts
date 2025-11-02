import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  // This is the fix. It replaces `process.env.NODE_ENV` with a string literal
  // during the build, allowing dead code elimination to remove the `dotenv` import.
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  build: {
    outDir: "../dist/backend",
    target: "node22",
    ssr: {
      // This is the fix. By default, Vite externalizes all dependencies in SSR mode.
      // Setting `noExternal: true` forces Vite to bundle all dependencies
      // into the output file, which is what we need for a portable deployment.
      noExternal: true,
    },
    rollupOptions: {
      input: path.resolve(__dirname, "src/index.ts"),
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
