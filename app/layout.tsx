import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SwRegister } from "@/components/pwa/sw-register";
import { cookies } from "next/headers";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "규봇",
  description: "응급실 인턴을 위한 AI 차팅 어시스턴트",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "규봇",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  interactiveWidget: "resizes-content",
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
