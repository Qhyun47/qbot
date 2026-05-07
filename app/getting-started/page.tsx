"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isStandalone } from "@/lib/pwa/is-standalone";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { Logo } from "@/components/icons/logo";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function GettingStartedPage() {
  const router = useRouter();

  useEffect(() => {
    // 이미 앱으로 설치된 상태라면 바로 이메일 확인 페이지로 이동
    if (isStandalone()) {
      router.replace("/auth/sign-up-success");
    }
  }, [router]);

  function handleSkip() {
    router.push("/auth/sign-up-success");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-3">
        <Logo className="size-14" />
        <div className="text-center">
          <h1 className="text-xl font-bold">회원가입이 완료되었습니다!</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            규봇을 더 편리하게 사용하는 방법이 있습니다
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-base font-semibold">앱으로 설치해보세요</h2>
            <p className="text-sm text-muted-foreground">
              홈 화면에 규봇을 설치하면 언제든지 앱처럼 빠르게 실행할 수
              있습니다. 관리자 승인 대기 중에도 설치를 미리 해두세요.
            </p>
          </div>

          {/* 설치의 장점 */}
          <ul className="flex flex-col gap-2">
            {[
              "앱 아이콘으로 바로 실행",
              "전체 화면으로 더 넓게 사용",
              "로딩 속도가 더 빠름",
            ].map((benefit) => (
              <li
                key={benefit}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle className="size-4 shrink-0 text-green-500" />
                {benefit}
              </li>
            ))}
          </ul>

          <PwaInstallButton
            buttonSize="default"
            buttonVariant="default"
            className="w-full"
          />
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleSkip}
        className="text-muted-foreground"
      >
        나중에 설치할게요 →
      </Button>
    </main>
  );
}
