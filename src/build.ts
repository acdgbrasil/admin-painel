// ─── Client Build Script ─────────────────────────────────────
// Bundles presenter/main.ts → public/app.js
// Explicitly sets jsxImportSource so Bun.build resolves @kitajs/html
// instead of defaulting to react/jsx-runtime.

const result = await Bun.build({
  entrypoints: ["src/presenter/main.ts"],
  outdir: "public",
  target: "browser",
  minify: process.env["NODE_ENV"] === "production",
  sourcemap: process.env["NODE_ENV"] !== "production" ? "inline" : "none",
  naming: "app.js",
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env["NODE_ENV"] ?? "development"),
  },
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log("Client build complete → public/app.js");
