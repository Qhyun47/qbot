import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

const ROOT = path.join(__dirname, "..");
const ICONS_DIR = path.join(ROOT, "public/icons");
const SPLASH_DIR = path.join(ROOT, "public/splash");

// 아이콘 내용 (배경 없이 — icon.svg 내부 요소만)
const ICON_CONTENT = `
  <path fill="#ffffff" d="
    M 116 83
    H 396
    Q 448 83 448 135
    V 301
    Q 448 353 396 353
    H 218
    L 106 415
    L 131 353
    H 116
    Q 64 353 64 301
    V 135
    Q 64 83 116 83
    Z
  "/>
  <rect x="122" y="145" width="192" height="26" rx="13" fill="#e4e4e7"/>
  <rect x="122" y="198" width="248" height="26" rx="13" fill="#e4e4e7"/>
  <rect x="122" y="251" width="170" height="26" rx="13" fill="#e4e4e7"/>
  <circle cx="402" cy="339" r="68" fill="#18181b"/>
  <circle cx="402" cy="339" r="58" fill="#e5534b"/>
  <rect x="362" y="323" width="80" height="32" rx="8" fill="#ffffff"/>
  <rect x="386" y="299" width="32" height="80" rx="8" fill="#ffffff"/>
`;

function makeIconSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#18181b"/>
  ${ICON_CONTENT}
</svg>`;
}

function makeMaskableSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#18181b"/>
  <g transform="translate(33, 33) scale(0.87)">
    ${ICON_CONTENT}
  </g>
</svg>`;
}

function makeSplashSvg(width: number, height: number): string {
  const iconSize = Math.round(width * 0.28);
  const scale = iconSize / 512;
  const tx = width / 2 - 256 * scale;
  const ty = height / 2 - 256 * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#18181b"/>
  <g transform="translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) scale(${scale.toFixed(4)})">
    ${ICON_CONTENT}
  </g>
</svg>`;
}

const SPLASH_CONFIGS = [
  {
    width: 1290,
    height: 2796,
    label: "iPhone 14/15/16 Plus, Pro Max",
  },
  {
    width: 1179,
    height: 2556,
    label: "iPhone 14/15/16, Pro",
  },
  {
    width: 1170,
    height: 2532,
    label: "iPhone 12, 13 시리즈",
  },
  {
    width: 1125,
    height: 2436,
    label: "iPhone X, XS, 11 Pro",
  },
  {
    width: 828,
    height: 1792,
    label: "iPhone XR, 11",
  },
  {
    width: 750,
    height: 1334,
    label: "iPhone SE 2/3세대",
  },
];

async function generateIcons() {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
  fs.mkdirSync(SPLASH_DIR, { recursive: true });

  const iconSvg = Buffer.from(makeIconSvg());
  const maskableSvg = Buffer.from(makeMaskableSvg());

  const iconJobs = [
    { svg: iconSvg, size: 192, file: "icon-192.png" },
    { svg: iconSvg, size: 512, file: "icon-512.png" },
    { svg: maskableSvg, size: 512, file: "icon-maskable-512.png" },
    { svg: iconSvg, size: 180, file: "apple-touch-icon.png" },
  ];

  for (const { svg, size, file } of iconJobs) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(ICONS_DIR, file));
    console.log(`✓ icons/${file} (${size}×${size})`);
  }

  for (const { width, height, label } of SPLASH_CONFIGS) {
    const splashSvg = Buffer.from(makeSplashSvg(width, height));
    const file = `splash-${width}x${height}.png`;
    await sharp(splashSvg)
      .png({ compressionLevel: 9 })
      .toFile(path.join(SPLASH_DIR, file));
    console.log(`✓ splash/${file} — ${label}`);
  }

  console.log("\n모든 아이콘 및 스플래시 이미지 생성 완료.");
}

generateIcons().catch((err) => {
  console.error("생성 실패:", err);
  process.exit(1);
});
