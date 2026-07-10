import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const outDir = resolve(process.cwd(), "base-submission");
await mkdir(outDir, { recursive: true });

const c = {
  deep: "#0e1713",
  ink: "#17221d",
  paper: "#eef0d0",
  sand: "#d7c084",
  green: "#3f7b57",
  mint: "#9bd7b0",
  blue: "#6faec8",
  red: "#e04b38",
  cream: "#f6f1d3",
};

const esc = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const t = (x, y, value, size, fill = c.ink, weight = 900) =>
  `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(value)}</text>`;
const multiline = (x, y, text, size, fill = c.ink, weight = 900, gap = size * 1.05) =>
  `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${text
    .split("\n")
    .map((line, i) => `<tspan x="${x}" dy="${i ? gap : 0}">${esc(line)}</tspan>`)
    .join("")}</text>`;
const defs = () => `<defs>
  <filter id="soft"><feDropShadow dx="0" dy="22" stdDeviation="18" flood-color="#000" flood-opacity=".34"/></filter>
  <pattern id="grid" width="52" height="52" patternUnits="userSpaceOnUse"><path d="M52 0H0V52" fill="none" stroke="#f6f1d3" stroke-width="1" opacity=".10"/></pattern>
  <pattern id="papergrid" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M34 0H0V34" fill="none" stroke="#17221d" stroke-width="1" opacity=".08"/></pattern>
</defs>`;

function panel(x, y, w, h, title, lines, fill = c.paper) {
  return `<g filter="url(#soft)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#f6f1d3" stroke-opacity=".35" stroke-width="3"/>
    <text x="${x + 28}" y="${y + 52}" font-family="Arial" font-size="22" font-weight="950" fill="#667267" letter-spacing="3">${esc(title)}</text>
    ${multiline(x + 28, y + 110, lines, 38, c.ink, 900, 46)}
  </g>`;
}

function mapPin(x, y, place, terrain, mood, note, maker = "--", date = "--", mapColor = "#142019") {
  return `<g filter="url(#soft)">
    <rect x="${x}" y="${y}" width="1080" height="1040" fill="${mapColor}" stroke="#f6f1d3" stroke-opacity=".24" stroke-width="3"/>
    <rect x="${x}" y="${y}" width="1080" height="1040" fill="url(#grid)"/>
    <g opacity=".8">
      <ellipse cx="${x + 560}" cy="${y + 430}" rx="410" ry="235" fill="none" stroke="${c.cream}" stroke-opacity=".18" stroke-width="5"/>
      <ellipse cx="${x + 560}" cy="${y + 430}" rx="320" ry="178" fill="none" stroke="${c.cream}" stroke-opacity=".18" stroke-width="5"/>
      <ellipse cx="${x + 560}" cy="${y + 430}" rx="232" ry="126" fill="none" stroke="${c.cream}" stroke-opacity=".18" stroke-width="5"/>
      <ellipse cx="${x + 238}" cy="${y + 760}" rx="190" ry="112" fill="none" stroke="${c.sand}" stroke-opacity=".22" stroke-width="5"/>
      <ellipse cx="${x + 870}" cy="${y + 202}" rx="160" ry="96" fill="none" stroke="${c.blue}" stroke-opacity=".24" stroke-width="5"/>
    </g>
    <g transform="translate(${x + 540} ${y + 238}) rotate(-45)">
      <path d="M0 -55 C42 -55 72 -24 72 16 C72 70 0 122 0 122 C0 122 -72 70 -72 16 C-72 -24 -42 -55 0 -55Z" fill="${c.red}" stroke="${c.cream}" stroke-width="8"/>
      <circle cx="0" cy="12" r="24" fill="${c.cream}"/>
    </g>
    <g>
      <rect x="${x + 246}" y="${y + 360}" width="588" height="360" fill="${c.paper}"/>
      <rect x="${x + 246}" y="${y + 360}" width="588" height="360" fill="url(#papergrid)"/>
      <text x="${x + 288}" y="${y + 432}" font-family="Arial" font-size="24" font-weight="950" fill="#667267" letter-spacing="4">${esc(terrain.toUpperCase())} / ${esc(mood.toUpperCase())}</text>
      ${multiline(x + 288, y + 552, place, 72, c.ink, 950, 72)}
      ${multiline(x + 288, y + 670, note, 31, c.ink, 850, 38)}
    </g>
    ${panel(x + 72, y + 842, 430, 120, "MAKER", maker, "rgba(238,240,208,.15)")}
    ${panel(x + 578, y + 842, 430, 120, "DROPPED", date, "rgba(238,240,208,.15)")}
  </g>`;
}

const frame = (body) => `<svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">${defs()}
  <rect width="1284" height="2778" fill="${c.deep}"/>
  <rect width="1284" height="2778" fill="url(#grid)"/>
  <circle cx="210" cy="150" r="250" fill="${c.mint}" opacity=".18"/>
  <circle cx="1100" cy="160" r="250" fill="${c.blue}" opacity=".12"/>
  ${body}
</svg>`;
const headline = (a, b) => `${t(92, 154, "Map Pin", 62, c.cream, 950)}${multiline(96, 282, a, 82, c.cream, 950, 82)}${t(102, 438, b, 31, "rgba(246,241,211,.76)", 850)}`;

const shot1 = frame(`${headline("Drop a\nplace marker.", "Terrain, mood, wallet, and time on Base.")}
  ${mapPin(102, 570, "North Market\nCorner", "Street", "Found", "A tiny marker for the corner where\nthe next useful route became obvious.")}
  ${panel(102, 1750, 500, 250, "1 PLACE", "Add place\nand note.")}
  ${panel(682, 1750, 500, 250, "2 PIN", "Save marker\non Base.")}
  ${panel(102, 2082, 1080, 290, "WHAT IT DOES", "Map Pin turns one tiny place into\na public onchain marker.")}`);

const shot2 = frame(`${headline("Choose the\nterrain.", "Pick a map feel before dropping.")}
  ${panel(102, 520, 1080, 228, "SELECTED", "Blue Coast Table / Coast / Calm")}
  ${mapPin(102, 810, "Blue Coast\nTable", "Coast", "Calm", "A quiet place pin for work that needs\nmore horizon and less noise.", "0x4265...af62", "May 20", "#10212a")}
  ${panel(102, 2018, 500, 250, "TERRAIN", "Street, Coast,\nHill, Studio.")}
  ${panel(682, 2018, 500, 250, "ACTION", "Drop pin")}`);

const shot3 = frame(`${headline("Load any\npin.", "Read a marker by ID.")}
  ${mapPin(102, 590, "Studio Stair\nLight", "Studio", "Bright", "The spot where a small draft turned\ninto a clean direction.", "0xdD8f...5c36", "May 20", "#231c18")}
  ${panel(102, 1770, 500, 258, "LOOKUP", "Enter Pin ID\nand read it.")}
  ${panel(682, 1770, 500, 258, "PROOF", "Terrain, mood,\nwallet, time.")}
  ${panel(102, 2114, 1080, 286, "PLACE RECORD", "Keep a small location memory\nvisible on Base.")}`);

const thumb = `<svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">${defs()}
  <rect width="1910" height="1000" fill="${c.deep}"/>
  <rect width="1910" height="1000" fill="url(#grid)"/>
  <circle cx="250" cy="140" r="260" fill="${c.mint}" opacity=".18"/>
  ${t(88, 166, "Map Pin", 112, c.cream, 950)}
  ${t(98, 250, "Drop a tiny place marker on Base.", 42, "rgba(246,241,211,.76)", 850)}
  ${panel(96, 390, 540, 210, "PLACE", "Terrain, mood,\nand note.")}
  ${panel(96, 655, 540, 210, "PROOF", "Wallet and time.")}
  ${mapPin(750, 24, "North Market\nCorner", "Street", "Found", "A tiny marker for the corner where\nthe next useful route became obvious.", "0x4265...af62", "May 20")}
</svg>`;

const icon = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">${defs()}
  <rect width="1024" height="1024" fill="${c.deep}"/>
  <rect width="1024" height="1024" fill="url(#grid)"/>
  <ellipse cx="512" cy="438" rx="350" ry="220" fill="none" stroke="${c.cream}" stroke-opacity=".22" stroke-width="8"/>
  <ellipse cx="512" cy="438" rx="246" ry="150" fill="none" stroke="${c.cream}" stroke-opacity=".22" stroke-width="8"/>
  <g transform="translate(512 310) rotate(-45)">
    <path d="M0 -82 C64 -82 108 -36 108 24 C108 104 0 184 0 184 C0 184 -108 104 -108 24 C-108 -36 -64 -82 0 -82Z" fill="${c.red}" stroke="${c.cream}" stroke-width="12"/>
    <circle cx="0" cy="18" r="34" fill="${c.cream}"/>
  </g>
  <text x="512" y="824" text-anchor="middle" font-family="Arial" font-size="86" font-weight="950" fill="${c.cream}">MAP PIN</text>
</svg>`;

async function writePng(name, svg, width, height) {
  await sharp(Buffer.from(svg)).resize(width, height).png({ compressionLevel: 9 }).toFile(join(outDir, name));
}

await writePng("screenshot-1.png", shot1, 1284, 2778);
await writePng("screenshot-2.png", shot2, 1284, 2778);
await writePng("screenshot-3.png", shot3, 1284, 2778);
await sharp(Buffer.from(thumb)).resize(1200, 628).jpeg({ quality: 88 }).toFile(join(outDir, "app-thumbnail.jpg"));
await sharp(Buffer.from(icon)).resize(1024, 1024).jpeg({ quality: 90 }).toFile(join(outDir, "app-icon.jpg"));
await writeFile(join(outDir, "submission-copy.md"), `# Map Pin

App Name: Map Pin
Tagline: Pin a place
Description: Drop a tiny place marker with terrain, mood, wallet, and time on Base.

Screenshots:
- screenshot-1.png: default first screen, explaining the place marker action.
- screenshot-2.png: selected state, showing terrain and mood choices.
- screenshot-3.png: result/lookup state, showing a dropped pin by ID.
`, "utf8");
await writeFile(join(outDir, "asset-manifest.json"), JSON.stringify({
  generatedAt: new Date().toISOString(),
  assets: ["app-icon.jpg", "app-thumbnail.jpg", "screenshot-1.png", "screenshot-2.png", "screenshot-3.png", "submission-copy.md"].map((name) => join(outDir, name)),
}, null, 2), "utf8");
