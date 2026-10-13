// Builds the profile from the text below: the card images in assets/ (a dark
// and a light version of each) and README.md, which arranges them.
//
// To change the wording or links, edit NAME, LINES and `strip`, then run:
//
//   node scripts/build-assets.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const themes = {
  dark: { bg: "#0f0f0f", border: "#252525", text: "#e8e8e8", muted: "#9c9c9c", link: "#7aa2f7" },
  light: { bg: "#fcfcfb", border: "#e4e4e2", text: "#17181a", muted: "#5b5d61", link: "#0645ad" },
};

// JetBrains Mono where the visitor has it, otherwise their system monospace.
const FONT = `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
const WIDTH = 880;
const assets = new URL("../assets/", import.meta.url);
mkdirSync(assets, { recursive: true });

const NAME = "Aaron Minhas";
const LINES = [
  "Final-year software engineering student in Sydney, focused on infrastructure and reliability.",
  "I run a homelab, self-host what I can, and I'm learning infrastructure-as-code and cloud.",
];

// The profile is one card, drawn as a stack of images so that each link can
// be its own clickable piece: the top holds the name and intro, and the strip
// along the bottom holds the links. The images meet edge to edge, so the
// card's border is split between them.
const LEFT = 24;
const STRIP_HEIGHT = 46;

// Top of the card: the name, with a band of the link colour drifting through
// it as on aaronminhas.com, and the intro beneath.
function hero(c) {
  const height = 58 + LINES.length * 21 + 6;
  const nameWidth = NAME.length * 26 * 0.6;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-label="${NAME}. ${LINES.join(" ")}">
  <defs>
    <linearGradient id="sweep" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="120" y2="0">
      <stop offset="0" stop-color="${c.text}"/>
      <stop offset="0.5" stop-color="${c.link}"/>
      <stop offset="1" stop-color="${c.text}"/>
      <animateTransform attributeName="gradientTransform" type="translate" from="${LEFT - 150} 0" to="${Math.round(LEFT + nameWidth + 30)} 0" dur="5s" repeatCount="indefinite"/>
    </linearGradient>
  </defs>
  <path d="M0.5 ${height}V8.5a8 8 0 0 1 8 -8H${WIDTH - 8.5}a8 8 0 0 1 8 8V${height}" fill="${c.bg}" stroke="${c.border}"/>
  <g font-family='${FONT}'>
    <text x="${LEFT}" y="40" font-size="26" font-weight="600" fill="url(#sweep)">${NAME}</text>
${LINES.map((line, index) => `    <text x="${LEFT}" y="${68 + index * 21}" font-size="13.5" fill="${c.muted}">${line.replace("'", "&#8217;")}</text>`).join("\n")}
  </g>
</svg>
`;
}

// The links along the bottom of the card, left to right. Each is a separate
// image; `width` is its share of the card's 880 units, and the last one is an
// empty filler that closes the card's corner.
const links = [
  { file: "site", label: "aaronminhas.com", href: "https://aaronminhas.com", primary: true },
  { file: "email", label: "email", href: "mailto:contact@aaronminhas.com" },
  { file: "linkedin", label: "linkedin", href: "https://linkedin.com/in/aaronminhas" },
];
// each link is as wide as its label needs
for (const link of links) {
  link.width = Math.round((link.label.length + 2) * 12.5 * 0.6 + (link.primary ? LEFT : 10) + 24);
}
const strip = [
  ...links,
  { file: "end", label: "", width: WIDTH - links.reduce((sum, link) => sum + link.width, 0) },
];

function stripCell(c, cell, index) {
  const h = STRIP_HEIGHT;
  const first = index === 0;
  const last = index === strip.length - 1;
  // bottom edge, plus the card's left or right side and rounded corner
  let outline = `M0 ${h - 0.5}H${cell.width}`;
  if (first) outline = `M0.5 0V${h - 8.5}a8 8 0 0 0 8 8H${cell.width}`;
  if (last) outline = `M0 ${h - 0.5}H${cell.width - 8.5}a8 8 0 0 0 8 -8V0`;
  const x = first ? LEFT : 10;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cell.width} ${h}" role="img" aria-label="${cell.label}">
  <path d="${first ? `M0 0V${h - 8}a8 8 0 0 0 8 8H${cell.width}V0Z` : last ? `M0 0V${h}H${cell.width - 8}a8 8 0 0 0 8 -8V0Z` : `M0 0H${cell.width}V${h}H0Z`}" fill="${c.bg}"/>
  <path d="${outline}" fill="none" stroke="${c.border}"/>
  ${cell.label ? `<text x="${x}" y="24" font-family='${FONT}' font-size="12.5" font-weight="500" fill="${cell.primary ? c.link : c.text}">${cell.label} ↗</text>` : ""}
</svg>
`;
}

for (const [name, colours] of Object.entries(themes)) {
  writeFileSync(new URL(`hero-${name}.svg`, assets), hero(colours));
  strip.forEach((cell, index) => {
    writeFileSync(new URL(`strip-${cell.file}-${name}.svg`, assets), stripCell(colours, cell, index));
  });
}

// README.md: the top of the card, then the strip of links on one line with no
// gaps, so the pieces join into a single card.
const picture = (file, width, alt) =>
  `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/${file}-dark.svg">` +
  `<img src="assets/${file}-light.svg" width="${width}" align="top" alt="${alt}"></picture>`;
const share = (cell, trim = 0) => `${((cell.width / WIDTH) * 100 - trim).toFixed(3)}%`;
const row = strip
  .map((cell) =>
    cell.href
      ? `<a href="${cell.href}">${picture(`strip-${cell.file}`, share(cell), cell.label)}</a>`
      : // a hair narrower, so rounding can never push it onto a new line
        picture(`strip-${cell.file}`, share(cell, 0.05), ""),
  )
  .join("");
writeFileSync(
  new URL("../README.md", import.meta.url),
  `<p>${picture("hero", "100%", `${NAME}. ${LINES.join(" ")}`)}<br>${row}</p>\n`,
);
console.log("wrote assets/ and README.md");
