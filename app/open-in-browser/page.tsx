"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ExternalLink, Copy, Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/logo";

type Platform = "android" | "ios" | "unknown";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "unknown";
}

function OpenInBrowserContent() {
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("from") ?? window.location.origin;

  const [platform, setPlatform] = useState<Platform>("unknown");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  function handleAndroidOpen() {
    // kakaotalk:// 스킴으로 현재 URL을 Chrome에서 강제로 열기
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(fromUrl)}`;
  }

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(fromUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // 클립보드 접근 실패 시 아무것도 하지 않음
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-3">
        <Logo className="size-14" />
        <h1 className="text-xl font-bold">규봇</h1>
      </div>

      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-base font-semibold">
              앱 설치를 위해 외부 브라우저에서 열어주세요
            </h2>
            <p className="text-sm text-muted-foreground">
              카카오톡 안에서는 규봇 앱을 설치할 수 없습니다.
              {platform === "android" &&
                " 아래 버튼으로 Chrome에서 바로 열 수 있습니다."}
              {platform === "ios" && " 아래 방법으로 Safari에서 열어주세요."}
            </p>
          </div>

          {platform === "android" && (
            <div className="flex flex-col gap-3">
              <Button onClick={handleAndroidOpen} className="w-full gap-2">
                <ExternalLink className="size-4" />
                Chrome에서 열기
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                버튼이 작동하지 않으면, 우측 상단 ⋮ 메뉴 →{" "}
                <strong>다른 브라우저로 열기</strong>를 탭하세요.
              </p>
            </div>
          )}

          {platform === "ios" && (
            <div className="flex flex-col gap-4">
              {/* 방법 1: Safari로 열기 버튼 안내 */}
              <div className="rounded-lg bg-muted/60 p-4">
                <p className="mb-2 text-sm font-medium">
                  방법 1 — Safari로 열기 버튼
                </p>
                <ol className="flex flex-col gap-1.5">
                  {[
                    "화면 하단의 'Safari로 열기' 버튼을 탭하세요",
                    "Safari가 열리면 규봇이 자동으로 표시됩니다",
                  ].map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* 방법 2: 클립보드 복사 */}
              <div className="rounded-lg bg-muted/60 p-4">
                <p className="mb-2 text-sm font-medium">
                  방법 2 — 직접 Safari 열기
                </p>
                <ol className="flex flex-col gap-2">
                  {[
                    "아래 버튼으로 주소를 복사하세요",
                    "Safari 앱을 직접 여세요",
                    "주소창을 길게 탭 → '붙여넣기 및 이동'을 탭하세요",
                  ].map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <Button
                  variant="outline"
                  className="mt-3 w-full gap-2"
                  onClick={handleCopyUrl}
                >
                  {copied ? (
                    <>
                      <Check className="size-4 text-green-500" />
                      복사 완료!
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      규봇 주소 복사하기
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {platform === "unknown" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-4">
                <Smartphone className="size-5 shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  카카오톡 우측 상단 ⋮ 메뉴 →{" "}
                  <strong>다른 브라우저로 열기</strong>를 탭해주세요.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleCopyUrl}
              >
                {copied ? (
                  <>
                    <Check className="size-4 text-green-500" />
                    복사 완료!
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    규봇 주소 복사하기
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <p className="max-w-xs text-center text-xs text-muted-foreground">
        외부 브라우저(Chrome / Safari)에서 열면 규봇 앱을 설치하고 정상적으로
        이용할 수 있습니다.
      </p>
    </main>
  );
}

export default function OpenInBrowserPage() {
  return (
    <Suspense fallback={null}>
      <OpenInBrowserContent />
    </Suspense>
  );
}
