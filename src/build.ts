// ─── Client Build Script ─────────────────────────────────────
// Bundles presenter/main.ts → public/app.js

const result = await Bun.build({
  entrypoints: ["src/presenter/main.ts"],
  outdir: "public",
  target: "browser",
  minify: process.env["NODE_ENV"] === "production",
  sourcemap: process.env["NODE_ENV"] !== "production" ? "inline" : "none",
  naming: "app.js",
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log("Client build complete → public/app.js");
