"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { isStandalone } from "@/lib/pwa/is-standalone";
import { IosInstallGuide } from "@/components/pwa/ios-install-guide";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const SESSION_KEY = "pwa-dismissed";

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [visible, setVisible] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const isIosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIosDevice && isSafari) {
      setIsIos(true);
      setVisible(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 shadow-lg">
      <button
        onClick={dismiss}
        className="absolute right-3 top-3 rounded p-1 text-muted-foreground hover:bg-accent"
        aria-label="배너 닫기"
      >
        <X className="h-4 w-4" />
      </button>

      {isIos ? (
        <div className="flex flex-col gap-2 pr-6">
          <p className="text-sm font-medium">홈 화면에 규봇 추가하기</p>
          <p className="text-xs text-muted-foreground">
            앱 아이콘을 홈 화면에 추가하면 더 빠르게 사용할 수 있습니다.
          </p>
          <button
            onClick={() => setGuideOpen(true)}
            className="w-fit rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            설치 방법 보기
          </button>
          <IosInstallGuide
            open={guideOpen}
            onClose={() => setGuideOpen(false)}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between pr-6">
          <div>
            <p className="text-sm font-medium">규봇 앱으로 설치</p>
            <p className="text-xs text-muted-foreground">
              홈 화면에 추가하면 더 빠르게 사용할 수 있습니다.
            </p>
          </div>
          <button
            onClick={install}
            className="ml-4 shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            홈 화면에 추가
          </button>
        </div>
      )}
    </div>
  );
}
