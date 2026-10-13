// Builds preview.html: the README as GitHub renders it.
//
//   node scripts/preview.mjs && open preview.html
//
// Uses GitHub's public Markdown API, so the README text is sent to GitHub.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
// GitHub's own renderer gives the closest result. It allows 60 requests an
// hour without signing in, so fall back to a local renderer when it refuses.
async function render() {
  const response = await fetch("https://api.github.com/markdown", {
    method: "POST",
    headers: { Accept: "application/vnd.github+json", "Content-Type": "application/json" },
    // "markdown" renders as GitHub renders a README file; "gfm" is for
    // comments and would turn every line break into a new line.
    body: JSON.stringify({ text: readme, mode: "markdown" }),
  });
  if (response.ok) return response.text();
  console.log(`GitHub returned ${response.status}; rendering locally instead`);
  return execFileSync("npx", ["--yes", "marked@12", "--gfm"], { input: readme, encoding: "utf8" });
}

// GitHub wraps each README image in a link and switches themed images with
// its own script. Outside GitHub that wrapper stops <picture> from working,
// so unwrap it to let the browser pick the light or dark image.
const body = (await render()).replace(
  /(<picture>(?:<source[^>]*>)+)<a [^>]*>(<img[^>]*>)<\/a>/g,
  "$1$2",
);

// The stylesheet and the banner both follow the system's light or dark mode,
// as they do on GitHub; switch the system appearance to see the other one.
const page = `<!doctype html>
<meta charset="utf-8" />
<title>README preview</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.8.1/github-markdown.min.css" />
<style>
  body { margin: 0; background: #fff; }
  /* the width of the README box on a GitHub profile page */
  .markdown-body { box-sizing: border-box; max-width: 894px; margin: 32px auto; padding: 24px;
    border: 1px solid #d1d9e0; border-radius: 6px; }
  @media (prefers-color-scheme: dark) {
    body { background: #0d1117; }
    .markdown-body { border-color: #3d444d; }
  }
</style>
<article class="markdown-body">${body}</article>
`;
writeFileSync(new URL("../preview.html", import.meta.url), page);
console.log("wrote preview.html");
