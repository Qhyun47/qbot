"use client";

import { useState, useEffect } from "react";
import { Maximize2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { isStandalone } from "@/lib/pwa/is-standalone";
import { updateFullscreenMode } from "@/lib/settings/actions";

function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

interface FullscreenSectionProps {
  defaultFullscreenMode: boolean;
}

export function FullscreenSection({
  defaultFullscreenMode,
}: FullscreenSectionProps) {
  const [enabled, setEnabled] = useState(defaultFullscreenMode);
  const [mounted, setMounted] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setMounted(true);
    setStandalone(isStandalone());
    setIsIos(isIosDevice());
  }, []);

  async function handleToggle(value: boolean) {
    setEnabled(value);

    // requestFullscreen은 user gesture 직후 동기적으로 시작해야 함 (await 이전)
    if (!isIos && document.fullscreenEnabled) {
      if (value && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (!value && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }

    try {
      await updateFullscreenMode(value);
    } catch {
      setEnabled(!value);
      toast.error("저장에 실패했습니다.");
    }
  }

  // 마운트 전에는 토글 비활성화 상태로 렌더
  const isDisabled = !mounted || !standalone;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">전체화면 모드</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          시스템 상단바(시계·배터리·알림 영역)를 숨기고 화면 전체를 사용합니다.
        </p>
      </div>

      {/* 미설치 안내 (standalone이 아닐 때) */}
      {mounted && !standalone && (
        <div className="flex items-start gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          <Smartphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-muted-foreground">
            앱을 홈 화면에 설치한 후 사용할 수 있는 기능입니다.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p
            className={
              isDisabled
                ? "text-sm text-muted-foreground/50"
                : "text-sm font-medium"
            }
          >
            전체화면 모드 사용
          </p>
          {mounted && standalone && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              앱 화면을 처음 탭할 때 자동으로 전체화면으로 전환됩니다.
            </p>
          )}
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={isDisabled}
          aria-label="전체화면 모드 사용"
        />
      </div>

      {/* iOS 안내 (iOS PWA + 토글 켜진 상태) */}
      {mounted && standalone && isIos && enabled && (
        <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-800 dark:bg-blue-950">
          <Maximize2 className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-blue-800 dark:text-blue-300">
            iOS에서는 상태바가 완전히 사라지지 않고 앱 화면 위에 투명하게
            겹쳐집니다. 그 아래 콘텐츠가 가려지지 않도록 자동 보정됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
