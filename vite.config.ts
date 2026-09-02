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
      fileName: (format) => `index.${format}.js`,
      formats: ["es", "umd"],
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
