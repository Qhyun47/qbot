import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const alt = "규봇";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const iconBuffer = readFileSync(
    join(process.cwd(), "public/icons/icon-512.png")
  );
  const iconBase64 = `data:image/png;base64,${iconBuffer.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        background: "#09090b",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
      }}
    >
      <img
        src={iconBase64}
        width={160}
        height={160}
        style={{ borderRadius: 36 }}
      />
      <div
        style={{
          color: "white",
          fontSize: 80,
          fontWeight: 700,
          letterSpacing: "-2px",
        }}
      >
        규봇
      </div>
      <div
        style={{
          color: "#a1a1aa",
          fontSize: 34,
        }}
      >
        문진은 폰에서, 확인은 컴퓨터로 - ER AI 어시스턴트
      </div>
    </div>,
    { ...size }
  );
}
