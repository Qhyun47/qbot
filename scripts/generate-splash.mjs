import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const BG = "#18181b";
const TEXT_COLOR = "#e4e4e7";
const TAGLINE_COLOR = "#a1a1aa";

// 아이콘 요소 — components/icons/logo.tsx와 동일한 SVG (100×100 viewBox 기준)
// 투명 PNG 합성 없이 스플래시 SVG에 직접 삽입하여 흰 테두리 artifact 방지
const ICON_CONTENT = `
  <path
    d="M8 11 Q8 4 15 4 L70 4 Q78 4 78 11 L78 57 Q78 65 70 65 L31 65 L18 81 L18 65 Q8 65 8 57 Z"
    stroke="#ffffff"
    stroke-width="5.5"
    stroke-linejoin="round"
    stroke-linecap="round"
    fill="none"
  />
  <line x1="22" y1="28" x2="64" y2="28" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
  <line x1="22" y1="44" x2="50" y2="44" stroke="#E8473F" stroke-width="5" stroke-linecap="round"/>
  <line x1="78" y1="62" x2="78" y2="86" stroke="#E8473F" stroke-width="7" stroke-linecap="round"/>
  <line x1="66" y1="74" x2="90" y2="74" stroke="#E8473F" stroke-width="7" stroke-linecap="round"/>
`;

const DIMENSIONS = [
  { w: 1320, h: 2868, file: "splash-1320x2868.png" }, // iPhone 16 Pro Max
  { w: 1206, h: 2622, file: "splash-1206x2622.png" }, // iPhone 16 Pro
  { w: 1290, h: 2796, file: "splash-1290x2796.png" }, // iPhone 14/15/16 Plus/Pro Max
  { w: 1179, h: 2556, file: "splash-1179x2556.png" }, // iPhone 14/15/16 Pro
  { w: 1170, h: 2532, file: "splash-1170x2532.png" }, // iPhone 14
  { w: 1125, h: 2436, file: "splash-1125x2436.png" }, // iPhone 12/13 Pro
  { w: 828, h: 1792, file: "splash-828x1792.png" }, // iPhone XR/11
  { w: 750, h: 1334, file: "splash-750x1334.png" }, // iPhone SE
];

// ── 커스텀 스플래시 PNG (iOS apple-touch-startup-image) ──────────────────────
for (const { w, h, file } of DIMENSIONS) {
  const iconSize = Math.floor(w * 0.32);
  const scale = iconSize / 100; // 100×100 viewBox 기준
  const iconLeft = w / 2 - 50 * scale;
  const iconTop = Math.floor(h * 0.35);

  const titleSize = Math.floor(w * 0.088);
  const taglineSize = Math.floor(w * 0.044);
  const titleY = Math.floor(h * 0.585) + titleSize;
  const taglineY =
    Math.floor(h * 0.585) + titleSize + Math.floor(taglineSize * 1.8);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" fill="${BG}"/>
    <g transform="translate(${iconLeft.toFixed(2)}, ${iconTop.toFixed(2)}) scale(${scale.toFixed(4)})">
      ${ICON_CONTENT}
    </g>
    <text
      x="${w / 2}" y="${titleY}"
      text-anchor="middle"
      font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif"
      font-weight="200"
      font-size="${titleSize}"
      fill="${TEXT_COLOR}"
      letter-spacing="${Math.floor(w * 0.018)}"
    >규봇</text>
    <text
      x="${w / 2}" y="${taglineY}"
      text-anchor="middle"
      font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif"
      font-weight="400"
      font-size="${taglineSize}"
      fill="${TAGLINE_COLOR}"
      letter-spacing="${Math.floor(w * 0.002)}"
    >ER AI 어시스턴트</text>
  </svg>`;

  const outPath = path.join(ROOT, "public/splash", file);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`✓ ${file}`);
}

console.log("\n스플래시 이미지 생성 완료!");

// ── PWA 아이콘 재생성 ────────────────────────────────────────────────────────
const iconSrc = path.join(ROOT, "public/icons/icon.svg");
const maskableSrc = path.join(ROOT, "public/icons/icon-maskable.svg");

await sharp(iconSrc)
  .resize(192, 192)
  .png()
  .toFile(path.join(ROOT, "public/icons/icon-192.png"));
await sharp(iconSrc)
  .resize(512, 512)
  .png()
  .toFile(path.join(ROOT, "public/icons/icon-512.png"));
console.log("✓ icon-192.png, icon-512.png 재생성 완료");

await sharp(maskableSrc)
  .resize(512, 512)
  .png()
  .toFile(path.join(ROOT, "public/icons/icon-maskable-512.png"));
console.log("✓ icon-maskable-512.png 재생성 완료");

await sharp(iconSrc)
  .resize(180, 180)
  .png()
  .toFile(path.join(ROOT, "public/icons/apple-touch-icon.png"));
console.log("✓ apple-touch-icon.png 재생성 완료");
