"use client";

import { useState, useEffect } from "react";
import {
  Smartphone,
  Monitor,
  CheckCircle2,
  Share2,
  PlusSquare,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Download,
  MoreHorizontal,
} from "lucide-react";
import { isStandalone } from "@/lib/pwa/is-standalone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallState =
  | "standalone"
  | "ios-safari"
  | "ios-other"
  | "android"
  | "pc"
  | "loading";

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isSafariBrowser() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

function isDesktop() {
  return !/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

const IOS_STEPS = [
  {
    icon: Share2,
    title: "공유 버튼(□↑)을 탭하세요",
    description: "Safari 화면 하단 가운데에 있는 네모+위화살표 아이콘입니다.",
  },
  {
    icon: PlusSquare,
    title: "'홈 화면에 추가'를 탭하세요",
    description: "공유 메뉴를 아래로 스크롤해서 찾아 탭합니다.",
  },
  {
    icon: CheckCircle,
    title: "오른쪽 상단 '추가'를 탭하세요",
    description: "이름을 확인하고 추가하면 홈 화면에 규봇 아이콘이 생깁니다.",
  },
];

const ANDROID_MANUAL_STEPS = [
  {
    icon: Download,
    title: "하단에 배너가 나타나면 탭하세요",
    description:
      "Chrome에서 규봇 페이지를 열면 '홈 화면에 추가' 배너가 자동으로 나타날 수 있습니다.",
  },
  {
    icon: MoreHorizontal,
    title: "배너가 없으면 우측 상단 ⋮ 메뉴를 탭하세요",
    description: "Chrome 주소창 오른쪽 ⋮ 버튼 → '홈 화면에 추가'를 선택합니다.",
  },
  {
    icon: CheckCircle,
    title: "'추가' 또는 '설치'를 탭하세요",
    description: "확인 창에서 추가를 탭하면 홈 화면에 규봇 아이콘이 생깁니다.",
  },
];

const PC_MANUAL_STEPS = [
  {
    icon: Download,
    title: "주소창 오른쪽 설치 아이콘을 클릭하세요",
    description:
      "Chrome/Edge 주소창 맨 오른쪽에 모니터 모양 아이콘이 보이면 클릭합니다.",
  },
  {
    icon: MoreHorizontal,
    title: "아이콘이 없으면 우측 상단 메뉴(⋮ / ⋯)를 클릭하세요",
    description:
      "Chrome은 ⋮, Edge는 ⋯ → '앱 설치' 또는 '규봇 설치'를 선택합니다.",
  },
  {
    icon: CheckCircle,
    title: "'설치'를 클릭하세요",
    description: "설치 완료 후 바탕화면과 시작 메뉴에 규봇 아이콘이 생깁니다.",
  },
];

function StepList({
  steps,
}: {
  steps: { icon: React.ElementType; title: string; description: string }[];
}) {
  return (
    <ol className="flex flex-col gap-4">
      {steps.map(({ icon: Icon, title, description }, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {i + 1}
          </span>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              {title}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ManualGuideToggle({
  steps,
}: {
  steps: { icon: React.ElementType; title: string; description: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-md border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent"
      >
        <span>버튼이 작동하지 않으면?</span>
        {open ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
      </button>
      {open && (
        <div className="border-t px-3 py-4">
          <StepList steps={steps} />
        </div>
      )}
    </div>
  );
}

export function InstallSection() {
  const [state, setState] = useState<InstallState>("loading");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) {
      setState("standalone");
      return;
    }

    if (isIosDevice()) {
      setState(isSafariBrowser() ? "ios-safari" : "ios-other");
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState(isDesktop() ? "pc" : "android");
    };
    window.addEventListener("beforeinstallprompt", handler);

    // 이벤트가 발생하지 않으면(Firefox 등) 수동 가이드만 표시
    const fallbackTimer = setTimeout(() => {
      setState((prev) =>
        prev === "loading" ? (isDesktop() ? "pc" : "android") : prev
      );
    }, 800);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(fallbackTimer);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setState("standalone");
  }

  if (state === "loading") return null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">앱 설치</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          규봇을 홈 화면에 추가하면 앱처럼 빠르게 실행할 수 있습니다.
        </p>
      </div>

      {/* 이미 설치됨 */}
      {state === "standalone" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-green-500" />
          앱이 이미 설치되어 있습니다.
        </div>
      )}

      {/* Android — 원클릭 + 수동 가이드 */}
      {state === "android" && (
        <div className="flex flex-col gap-3">
          {deferredPrompt ? (
            <Button onClick={handleInstall} className="w-fit gap-2">
              <Smartphone className="size-4" />홈 화면에 추가
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              아래 방법으로 직접 설치하세요.
            </p>
          )}
          <ManualGuideToggle steps={ANDROID_MANUAL_STEPS} />
        </div>
      )}

      {/* PC — 원클릭 + 수동 가이드 */}
      {state === "pc" && (
        <div className="flex flex-col gap-3">
          {deferredPrompt ? (
            <Button onClick={handleInstall} className="w-fit gap-2">
              <Monitor className="size-4" />
              앱으로 설치
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              아래 방법으로 직접 설치하세요.
            </p>
          )}
          <ManualGuideToggle steps={PC_MANUAL_STEPS} />
        </div>
      )}

      {/* iOS Safari — 수동 가이드 직접 표시 */}
      {state === "ios-safari" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            아이폰/아이패드에서는 아래 순서로 설치해 주세요.
          </p>
          <div className={cn("rounded-md border px-3 py-4")}>
            <StepList steps={IOS_STEPS} />
          </div>
        </div>
      )}

      {/* iOS 비Safari */}
      {state === "ios-other" && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
          <Smartphone className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-amber-800 dark:text-amber-300">
            iPhone에서는 <strong>Safari 브라우저</strong>에서 접속해야 앱을
            설치할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
