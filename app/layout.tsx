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
      {
        url: "/icons/icon-192-transparent.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512-transparent.png",
        sizes: "512x512",
        type: "image/png",
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
  // 쿠키 기반 기기 타입 감지: SSR 단계에서 data-view 속성 주입
  // 첫 방문(쿠키 없음)은 인라인 스크립트의 pointer:fine 폴백이 처리
  const cookieStore = await cookies();
  const deviceTypeCookie = cookieStore.get("x-device-type")?.value;
  const dataView = deviceTypeCookie === "desktop" ? "desktop" : undefined;

  return (
    <html lang="ko" data-view={dataView} suppressHydrationWarning>
      <head>
        {/*
          기기 타입 감지: CSS 적용 전 동기 실행으로 FOUC 방지
          우선순위: ① localStorage 수동 오버라이드 → ② 서버 쿠키(x-device-type) → ③ pointer:fine fallback
          서버가 쿠키 기반으로 data-view를 이미 설정한 경우, localStorage 오버라이드만 처리
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('er-view-mode');if(s==='mobile'){document.documentElement.removeAttribute('data-view');return;}if(s==='desktop'){document.documentElement.setAttribute('data-view','desktop');return;}var c=document.cookie.split(';').reduce(function(a,p){var k=p.trim().split('=');a[k[0]]=k[1];return a;},{});if(c['x-device-type']==='desktop'){document.documentElement.setAttribute('data-view','desktop');}else if(!c['x-device-type']&&window.matchMedia('(hover: hover) and (pointer: fine)').matches){document.documentElement.setAttribute('data-view','desktop');}}catch(e){}})();`,
          }}
        />
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
