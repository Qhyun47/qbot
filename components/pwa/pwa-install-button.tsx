"use client";

import { useState, useEffect } from "react";
import { Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isStandalone } from "@/lib/pwa/is-standalone";
import { IosInstallGuide } from "@/components/pwa/ios-install-guide";
import { PwaInstallGuide } from "@/components/pwa/pwa-install-guide";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallState =
  | "loading" // 환경 감지 전 초기 상태
  | "android" // Android/PC — beforeinstallprompt 발생, 네이티브 설치 가능
  | "ios-safari" // iOS Safari — 수동 가이드 필요
  | "ios-other" // iOS 비-Safari — 설치 불가
  | "fallback" // beforeinstallprompt 미발생 — 가이드 fallback
  | "installed"; // 이미 설치됨

export function PwaInstallButton() {
  const [state, setState] = useState<InstallState>("loading");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setState("installed");
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

    // 500ms 후에도 이벤트가 없으면 fallback (이미 설치됐거나 지원 안 되는 환경)
    const timer = setTimeout(() => {
      setState((prev) => (prev === "loading" ? "fallback" : prev));
    }, 500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  async function handleAndroidInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setState("installed");
    }
  }

  if (state === "loading" || state === "installed") return null;

  if (state === "android") {
    return (
      <Button variant="outline" size="sm" onClick={handleAndroidInstall}>
        <Download className="size-4" />앱 설치
      </Button>
    );
  }

  if (state === "ios-safari") {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIosGuideOpen(true)}
        >
          <Smartphone className="size-4" />
          설치 방법 보기
        </Button>
        <IosInstallGuide
          open={iosGuideOpen}
          onClose={() => setIosGuideOpen(false)}
        />
      </>
    );
  }

  if (state === "ios-other") {
    return (
      <p className="text-xs text-muted-foreground">
        iPhone에서는 <strong>Safari</strong>로 접속해야 설치할 수 있습니다.
      </p>
    );
  }

  // fallback: beforeinstallprompt 미발생 (기존 가이드 다이얼로그)
  return <PwaInstallGuide />;
}
