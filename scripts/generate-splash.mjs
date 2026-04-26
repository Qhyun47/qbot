import sharp from "sharp";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const BG = "#18181b";
const TEXT_COLOR = "#ffffff";
const TAGLINE_COLOR = "#71717a";

const DIMENSIONS = [
  { w: 1290, h: 2796, file: "splash-1290x2796.png" },
  { w: 1179, h: 2556, file: "splash-1179x2556.png" },
  { w: 1170, h: 2532, file: "splash-1170x2532.png" },
  { w: 1125, h: 2436, file: "splash-1125x2436.png" },
  { w: 828, h: 1792, file: "splash-828x1792.png" },
  { w: 750, h: 1334, file: "splash-750x1334.png" },
];

const iconSrc = path.join(ROOT, "public/icons/icon.svg");

for (const { w, h, file } of DIMENSIONS) {
  const iconSize = Math.floor(w * 0.32);
  const iconTop = Math.floor(h * 0.35);
  const iconLeft = Math.floor((w - iconSize) / 2);

  const titleSize = Math.floor(w * 0.088);
  const taglineSize = Math.floor(w * 0.044);
  const titleY = Math.floor(h * 0.585) + titleSize;
  const taglineY =
    Math.floor(h * 0.585) + titleSize + Math.floor(taglineSize * 1.8);

  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" fill="${BG}"/>
    <text
      x="${w / 2}" y="${titleY}"
      text-anchor="middle"
      font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif"
      font-weight="800"
      font-size="${titleSize}"
      fill="${TEXT_COLOR}"
      letter-spacing="${Math.floor(w * 0.006)}"
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

  const iconBuf = await sharp(iconSrc)
    .resize(iconSize, iconSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  const outPath = path.join(ROOT, "public/splash", file);
  await sharp(Buffer.from(bg))
    .composite([{ input: iconBuf, top: iconTop, left: iconLeft }])
    .png()
    .toFile(outPath);

  console.log(`✓ ${file}`);
}

console.log("\n스플래시 이미지 생성 완료!");
