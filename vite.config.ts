import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    minify: "terser",
    terserOptions: {
      format: {
        comments: false,
      },
    },
    lib: {
      entry: "src/index.ts",
      name: "TokioEventLoader",
      fileName: (format) =>
        format === "cjs" ? "index.cjs" : `index.${format}.js`,
      formats: ["es", "umd", "cjs"],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outDirs: "dist/types",
    }),
  ],
});
