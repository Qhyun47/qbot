import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const BG_R = 0x18,
  BG_G = 0x18,
  BG_B = 0x1b;
const TEXT_COLOR = "#e4e4e7";
const TAGLINE_COLOR = "#a1a1aa";

/**
 * icon-transparent.png(원본, RGB 흰 배경)를 읽어서
 * 짙은 말풍선 → 흰색, 빨간색 → 유지, 흰 배경 → #18181b로
 * 직접 블렌딩한 뒤 outputSize×outputSize 크기의 3채널(RGB) Buffer 반환.
 *
 * - 모든 픽셀 alpha=255 (투명 없음) → 합성 경계선/체커 아티팩트 없음
 * - paddingRatio: 안전 여백 비율 (maskable 전용)
 */
async function makeDarkBgRawBuffer(outputSize, paddingRatio = 0) {
  const srcPath = path.join(ROOT, "public/icons/icon-transparent.png");
  const iconSize = Math.round(outputSize * (1 - paddingRatio * 2));
  const offset = Math.floor((outputSize - iconSize) / 2);

  const { data, info } = await sharp(srcPath)
    .resize(iconSize, iconSize)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ch = info.channels; // 3(RGB) or 4(RGBA)

  // outputSize×outputSize 3채널 출력 버퍼, #18181b로 초기화
  const out = Buffer.alloc(outputSize * outputSize * 3);
  for (let i = 0; i < outputSize * outputSize; i++) {
    out[i * 3] = BG_R;
    out[i * 3 + 1] = BG_G;
    out[i * 3 + 2] = BG_B;
  }

  // 픽셀 변환 후 해당 위치에 직접 씀
  for (let row = 0; row < iconSize; row++) {
    for (let col = 0; col < iconSize; col++) {
      const si = (row * iconSize + col) * ch;
      const r = data[si],
        g = data[si + 1],
        b = data[si + 2];

      const oi = ((row + offset) * outputSize + (col + offset)) * 3;

      const isRed = r > g + 60 && r > b + 60;

      if (isRed) {
        // 흰 배경 위 빨간색: 흰색 기여분 제거 후 배경과 블렌딩
        const t = Math.max(0, Math.min(1, 1 - Math.min(g, b) / 255));
        if (t < 0.05) {
          // 거의 투명한 빨간색(연한 핑크 계열) → 배경 처리
          out[oi] = BG_R;
          out[oi + 1] = BG_G;
          out[oi + 2] = BG_B;
        } else {
          out[oi] = Math.round(r * t + BG_R * (1 - t));
          out[oi + 1] = Math.round(g * t + BG_G * (1 - t));
          out[oi + 2] = Math.round(b * t + BG_B * (1 - t));
        }
      } else {
        const luminance = r * 0.299 + g * 0.587 + b * 0.114;

        // 두 단계 임계값:
        // ① 밝기 ≥ 200 → 배경색 그대로 (그림자·안티앨리어싱 잔재 포함 완전 제거)
        // ② 밝기 ≤ 100 → 순수 흰색 (말풍선 선 코어)
        // ③ 그 사이 → 선형 블렌딩 (부드러운 안티앨리어싱 전환)
        let t;
        if (luminance >= 200) {
          out[oi] = BG_R;
          out[oi + 1] = BG_G;
          out[oi + 2] = BG_B;
          continue;
        } else if (luminance <= 100) {
          t = 1;
        } else {
          t = 1 - (luminance - 100) / (200 - 100);
        }
        out[oi] = Math.round(255 * t + BG_R * (1 - t));
        out[oi + 1] = Math.round(255 * t + BG_G * (1 - t));
        out[oi + 2] = Math.round(255 * t + BG_B * (1 - t));
      }
    }
  }

  return out; // 3채널 raw Buffer
}

// ── PWA 아이콘 생성 ───────────────────────────────────────────────────────────

const ICONS_DIR = path.join(ROOT, "public/icons");

async function writeIcon(file, outputSize, paddingRatio = 0) {
  const raw = await makeDarkBgRawBuffer(outputSize, paddingRatio);
  await sharp(raw, {
    raw: { width: outputSize, height: outputSize, channels: 3 },
  })
    .png()
    .toFile(path.join(ICONS_DIR, file));
  console.log(`✓ ${file}`);
}

await writeIcon("icon-512.png", 512);
await writeIcon("icon-192.png", 192);
await writeIcon("icon-maskable-512.png", 512, 0.12); // 안전 여백 12%
await writeIcon("apple-touch-icon.png", 180);

console.log("\n아이콘 생성 완료!\n");

// ── iOS 스플래시 생성 ─────────────────────────────────────────────────────────

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

for (const { w, h, file } of DIMENSIONS) {
  const iconSize = Math.floor(w * 0.32);
  const iconLeft = Math.floor(w / 2 - iconSize / 2);
  const iconTop = Math.floor(h * 0.35);

  const titleSize = Math.floor(w * 0.088);
  const taglineSize = Math.floor(w * 0.044);
  const titleY = Math.floor(h * 0.585) + titleSize;
  const taglineY =
    Math.floor(h * 0.585) + titleSize + Math.floor(taglineSize * 1.8);

  // 1) 스플래시 전체를 3채널 raw 버퍼로 생성 (#18181b 배경)
  const { data: iconData, info } = await sharp(
    path.join(ROOT, "public/icons/icon-transparent.png")
  )
    .resize(iconSize, iconSize)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ch = info.channels;
  const splash = Buffer.alloc(w * h * 3);

  // 배경 채우기
  for (let i = 0; i < w * h; i++) {
    splash[i * 3] = BG_R;
    splash[i * 3 + 1] = BG_G;
    splash[i * 3 + 2] = BG_B;
  }

  // 아이콘 픽셀을 스플래시 버퍼에 직접 씀
  for (let row = 0; row < iconSize; row++) {
    for (let col = 0; col < iconSize; col++) {
      const si = (row * iconSize + col) * ch;
      const r = iconData[si],
        g = iconData[si + 1],
        b = iconData[si + 2];

      const outRow = iconTop + row;
      const outCol = iconLeft + col;
      if (outRow < 0 || outRow >= h || outCol < 0 || outCol >= w) continue;

      const oi = (outRow * w + outCol) * 3;

      const isRed = r > g + 60 && r > b + 60;

      if (isRed) {
        const t = Math.max(0, Math.min(1, 1 - Math.min(g, b) / 255));
        if (t < 0.05) {
          splash[oi] = BG_R;
          splash[oi + 1] = BG_G;
          splash[oi + 2] = BG_B;
        } else {
          splash[oi] = Math.round(r * t + BG_R * (1 - t));
          splash[oi + 1] = Math.round(g * t + BG_G * (1 - t));
          splash[oi + 2] = Math.round(b * t + BG_B * (1 - t));
        }
      } else {
        const luminance = r * 0.299 + g * 0.587 + b * 0.114;
        let t;
        if (luminance >= 200) {
          splash[oi] = BG_R;
          splash[oi + 1] = BG_G;
          splash[oi + 2] = BG_B;
          continue;
        } else if (luminance <= 100) {
          t = 1;
        } else {
          t = 1 - (luminance - 100) / (200 - 100);
        }
        splash[oi] = Math.round(255 * t + BG_R * (1 - t));
        splash[oi + 1] = Math.round(255 * t + BG_G * (1 - t));
        splash[oi + 2] = Math.round(255 * t + BG_B * (1 - t));
      }
    }
  }

  // 2) 텍스트만 담은 SVG(투명 배경)를 위에 합성
  const textSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
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

  await sharp(splash, { raw: { width: w, height: h, channels: 3 } })
    .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
    .png()
    .toFile(outPath);

  console.log(`✓ ${file}`);
}

console.log("\n스플래시 이미지 생성 완료!");
