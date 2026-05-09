import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SwRegister } from "@/components/pwa/sw-register";
import { cookies } from "next/headers";
import "./globals.css";

const defaultUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "규봇",
  description: "문진은 폰에서, 확인은 컴퓨터로 - ER AI 어시스턴트",
  openGraph: {
    title: "규봇",
    description: "문진은 폰에서, 확인은 컴퓨터로 - ER AI 어시스턴트",
    siteName: "규봇",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "규봇",
    description: "문진은 폰에서, 확인은 컴퓨터로 - ER AI 어시스턴트",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "규봇",
    startupImage: [
      {
        url: "/splash/splash-1320x2868.png",
        media:
          "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/splash-1206x2622.png",
        media:
          "(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/splash-1290x2796.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/splash-1179x2556.png",
        media:
          "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/splash-1170x2532.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/splash-1125x2436.png",
        media:
          "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/splash-828x1792.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/splash-750x1334.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  icons: {
    icon: [
      // 라이트모드: 원본 투명 아이콘 (짙은 말풍선)
      {
        url: "/icons/icon-512-transparent.png",
        sizes: "512x512",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      // 다크모드: 흰 말풍선 + 짙은 배경 (부유하는 밝은 배경 방지)
      {
        url: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
  themeColor: "#18181b",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 쿠키 기반 기기 타입 감지: 미들웨어(proxy.ts)가 UA로 쿠키 설정 → SSR에서 data-view 주입
  const cookieStore = await cookies();
  const deviceTypeCookie = cookieStore.get("x-device-type")?.value;
  const dataView = deviceTypeCookie === "desktop" ? "desktop" : undefined;

  // PWA 바로가기 등 새로고침 진입 시 Supabase 조회 전에 글자 크기를 즉시 적용
  const mobileFontSizeCookie = cookieStore.get("mobile-font-size")?.value;
  const mobileFontSize = mobileFontSizeCookie
    ? parseInt(mobileFontSizeCookie, 10)
    : null;

  return (
    <html lang="ko" data-view={dataView} suppressHydrationWarning>
      <head>
        {mobileFontSize && (
          <script
            dangerouslySetInnerHTML={{
              __html: `document.documentElement.style.setProperty('--mobile-font-size','${mobileFontSize}px');`,
            }}
          />
        )}
      </head>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SwRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
