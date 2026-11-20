import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const result = await build({
  absWorkingDir: root,
  entryPoints: ["client/main.js"],
  outdir: "dist/assets",
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  write: false,
  metafile: true,
  legalComments: "inline",
  loader: {
    ".woff": "dataurl",
    ".woff2": "dataurl",
    ".ttf": "dataurl",
    ".svg": "dataurl",
    ".png": "dataurl",
  },
});
const assets = {
  "/": {
    type: "text/html; charset=utf-8",
    content: await readFile(path.join(root, "client/index.html"), "utf8"),
  },
};
for (const file of result.outputFiles) {
  const name = path.basename(file.path);
  assets[`/assets/${name}`] = {
    type: name.endsWith(".css")
      ? "text/css; charset=utf-8"
      : "text/javascript; charset=utf-8",
    content: file.text,
  };
}
// Lazy editor CSS is emitted independently; load every CSS bundle up front.
const styles = Object.keys(assets).filter((p) => p.endsWith(".css"));
assets["/"].content = assets["/"].content.replace(
  '<link rel="stylesheet" href="/assets/main.css">',
  styles.map((p) => `<link rel="stylesheet" href="${p}">`).join(""),
);
if (
  Object.keys(result.metafile.inputs).some((p) => p.includes("@univerjs-pro/"))
)
  throw new Error("Commercial Univer dependencies are not allowed.");
await mkdir(path.join(root, "generated"), { recursive: true });
await writeFile(
  path.join(root, "generated/assets.js"),
  `// Generated; do not edit.\nexport const assets = ${JSON.stringify(assets)};\n`,
);
console.log(
  `Built ${Object.keys(assets).length} embedded assets; OSS dependency audit passed.`,
);
