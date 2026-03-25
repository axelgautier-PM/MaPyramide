/**
 * Génère icon-192.png et icon-512.png pour la PWA
 * Design : fond gradient violet #7B74FF → #5249D6, 5 rectangles blancs empilés
 * Usage : node scripts/generate-icons.mjs
 */

import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

function iconSvg(size) {
  const r = Math.round(size * 0.22); // rayon des coins iOS
  const pad = Math.round(size * 0.14);
  const inner = size - pad * 2;

  // 5 rectangles empilés — proportions calquées sur PyramidAppIcon
  const rects = [
    { xRatio: 0,    yRatio: 0.80, wRatio: 1,    hRatio: 0.20, opac: 0.28 },
    { xRatio: 0.11, yRatio: 0.56, wRatio: 0.78, hRatio: 0.20, opac: 0.44 },
    { xRatio: 0.22, yRatio: 0.34, wRatio: 0.57, hRatio: 0.19, opac: 0.63 },
    { xRatio: 0.31, yRatio: 0.14, wRatio: 0.40, hRatio: 0.17, opac: 0.82 },
    { xRatio: 0.42, yRatio: 0.00, wRatio: 0.16, hRatio: 0.13, opac: 1.00 },
  ];

  const rx = Math.round(inner * 0.1);

  const rectsSvg = rects.map(({ xRatio, yRatio, wRatio, hRatio, opac }) => {
    const x = pad + Math.round(inner * xRatio);
    const y = pad + Math.round(inner * yRatio);
    const w = Math.round(inner * wRatio);
    const h = Math.round(inner * hRatio);
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="white" opacity="${opac}"/>`;
  }).join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${size}" y2="${size}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#7B74FF"/>
      <stop offset="100%" stop-color="#5249D6"/>
    </linearGradient>
    <clipPath id="clip">
      <rect width="${size}" height="${size}" rx="${r}"/>
    </clipPath>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>
  <g clip-path="url(#clip)">
  ${rectsSvg}
  </g>
</svg>`;
}

async function generate(size, filename) {
  const svg = Buffer.from(iconSvg(size));
  const out = resolve(outDir, filename);
  await sharp(svg).png().toFile(out);
  console.log(`✓ ${filename} (${size}×${size})`);
}

await generate(192, "icon-192.png");
await generate(512, "icon-512.png");
await generate(180, "apple-touch-icon.png"); // iOS home screen
console.log("Done — icons générés dans public/icons/");
