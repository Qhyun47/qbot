"use client";

import { Share2, PlusSquare, CheckCircle, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface IosInstallGuideProps {
  open: boolean;
  onClose: () => void;
}

function isSafariBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

const STEPS = [
  {
    icon: Share2,
    title: "공유 버튼을 탭하세요",
    description: "Safari 하단 또는 주소창 옆의 □↑ 아이콘",
  },
  {
    icon: PlusSquare,
    title: "'홈 화면에 추가'를 탭하세요",
    description: "공유 시트를 아래로 스크롤해서 찾으세요",
  },
  {
    icon: CheckCircle,
    title: "오른쪽 상단 '추가'를 탭하세요",
    description: "이름을 확인한 뒤 추가하면 완료됩니다",
  },
];

export function IosInstallGuide({ open, onClose }: IosInstallGuideProps) {
  const isSafari = isSafariBrowser();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isSafari ? "홈 화면에 추가하기" : "Safari에서 열어주세요"}
          </DialogTitle>
        </DialogHeader>

        {isSafari ? (
          <ol className="flex flex-col gap-5 py-2">
            {STEPS.map(({ icon: Icon, title, description }, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
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
        ) : (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <Smartphone className="size-10 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                iPhone/iPad에서는 Safari 앱을 사용해주세요
              </p>
              <p className="text-xs text-muted-foreground">
                Chrome 등 다른 브라우저에서는 홈 화면 추가가 지원되지 않습니다.
                Safari를 열고 현재 주소를 입력해 다시 접속하세요.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
