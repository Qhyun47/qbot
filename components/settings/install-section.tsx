"use client";

import { useState, useEffect } from "react";
import { Smartphone, CheckCircle2 } from "lucide-react";
import { isStandalone } from "@/lib/pwa/is-standalone";
import { IosInstallGuide } from "@/components/pwa/ios-install-guide";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallState =
  | "standalone" // 이미 설치됨
  | "ios-safari" // iOS Safari — 수동 설치 가능
  | "ios-other" // iOS 비Safari — 설치 불가
  | "android" // Android Chrome — 네이티브 프롬프트 가능
  | "hidden"; // 데스크탑 등 — 섹션 미표시

export function InstallSection() {
  const [state, setState] = useState<InstallState>("hidden");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setState("standalone");
      return;
    }

    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

    if (isIos) {
      setState(isSafari ? "ios-safari" : "ios-other");
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState("android");
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleAndroidInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setState("standalone");
  }

  if (state === "hidden") return null;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold">앱 설치</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          규봇을 홈 화면에 추가하면 앱처럼 빠르게 실행할 수 있습니다.
        </p>
      </div>

      {state === "standalone" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-green-500" />
          앱이 이미 설치되어 있습니다.
        </div>
      )}

      {state === "ios-safari" && (
        <>
          <button
            onClick={() => setGuideOpen(true)}
            className="flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            <Smartphone className="size-4" />
            설치 방법 보기
          </button>
          <IosInstallGuide
            open={guideOpen}
            onClose={() => setGuideOpen(false)}
          />
        </>
      )}

      {state === "ios-other" && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
          <Smartphone className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-amber-800 dark:text-amber-300">
            iPhone에서는 <strong>Safari 브라우저</strong>에서 접속해야 앱을
            설치할 수 있습니다.
          </p>
        </div>
      )}

      {state === "android" && (
        <button
          onClick={handleAndroidInstall}
          className="flex w-fit items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Smartphone className="size-4" />홈 화면에 추가
        </button>
      )}
    </div>
  );
}
