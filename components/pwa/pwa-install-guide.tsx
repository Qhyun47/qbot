"use client";

import { useState } from "react";
import {
  Share2,
  PlusSquare,
  CheckCircle,
  Smartphone,
  Monitor,
  MoreHorizontal,
  Download,
  ExternalLink,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LucideIcon } from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
  tip?: string;
}

const IOS_STEPS: Step[] = [
  {
    icon: ExternalLink,
    title: "Safari 앱으로 접속하세요",
    description:
      "카카오톡, 인스타그램 등 앱 안에서 링크를 열었다면, 반드시 Safari로 다시 열어야 합니다. Chrome 등 다른 브라우저도 안 됩니다.",
    tip: "화면 하단 또는 우측 하단의 'Safari로 열기' 버튼을 탭하면 바로 이동할 수 있습니다.",
  },
  {
    icon: Share2,
    title: "화면 하단 공유 버튼(□↑)을 탭하세요",
    description:
      "Safari 화면 아래 가운데에 있는 아이콘입니다. 네모 위에 위쪽 화살표가 그려져 있습니다.",
  },
  {
    icon: PlusSquare,
    title: "'홈 화면에 추가'를 탭하세요",
    description:
      "공유 메뉴가 펼쳐지면 아이콘 목록을 왼쪽으로 밀거나, 아래 목록을 스크롤해서 '홈 화면에 추가'를 찾아 탭합니다.",
  },
  {
    icon: CheckCircle,
    title: "오른쪽 상단 '추가'를 탭하세요",
    description:
      "앱 이름 '규봇'이 맞는지 확인하고 오른쪽 상단의 추가 버튼을 탭합니다. 홈 화면에 규봇 아이콘이 생깁니다!",
  },
];

const ANDROID_STEPS: Step[] = [
  {
    icon: ExternalLink,
    title: "Chrome 앱으로 접속하세요",
    description:
      "카카오톡, 인스타그램 등 앱 안에서 링크를 열었다면, Chrome 앱으로 다시 열어야 합니다.",
    tip: "앱 내 브라우저 우측 상단의 '외부 브라우저로 열기' 또는 '⋮ → Chrome으로 열기'를 탭하세요.",
  },
  {
    icon: Download,
    title: "자동으로 나타나는 설치 버튼을 탭하세요",
    description:
      "Chrome에서 규봇 페이지를 열면 화면 하단에 '홈 화면에 추가' 배너가 자동으로 나타날 수 있습니다. 나타나면 바로 탭하세요.",
  },
  {
    icon: MoreHorizontal,
    title: "버튼이 안 보이면 우측 상단 메뉴(⋮)를 탭하세요",
    description:
      "Chrome 주소창 오른쪽 끝의 ⋮ 버튼을 탭한 뒤, 메뉴에서 '홈 화면에 추가'를 선택합니다.",
  },
  {
    icon: CheckCircle,
    title: "'추가' 또는 '설치'를 탭하세요",
    description:
      "확인 창이 나타나면 추가 또는 설치를 탭합니다. 홈 화면에 규봇 아이콘이 생깁니다!",
  },
];

const PC_STEPS: Step[] = [
  {
    icon: Monitor,
    title: "Chrome 또는 Edge 브라우저로 접속하세요",
    description:
      "Google Chrome이나 Microsoft Edge 브라우저를 사용해야 합니다. Internet Explorer, Firefox에서는 설치가 지원되지 않습니다.",
  },
  {
    icon: Download,
    title: "주소창 오른쪽의 설치 아이콘을 클릭하세요",
    description:
      "주소창 맨 오른쪽에 컴퓨터 모니터 모양의 아이콘이 보이면 클릭하세요. 설치 준비가 되었다는 표시입니다.",
  },
  {
    icon: MoreHorizontal,
    title: "아이콘이 없다면 우측 상단 메뉴(⋯)를 클릭하세요",
    description:
      "Chrome은 주소창 오른쪽 ⋮, Edge는 ⋯ 버튼을 클릭한 뒤 '앱 설치' 또는 '규봇 설치'를 선택합니다.",
  },
  {
    icon: CheckCircle,
    title: "'설치' 버튼을 클릭하세요",
    description:
      "설치 확인 팝업에서 설치를 클릭합니다. 완료되면 바탕화면과 시작 메뉴에 규봇 아이콘이 생깁니다!",
  },
];

function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="flex flex-col gap-5 py-2">
      {steps.map(({ icon: Icon, title, description, tip }, i) => (
        <li key={i} className="flex items-start gap-4">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {i + 1}
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              {title}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
            {tip && (
              <div className="mt-1 flex items-start gap-1.5 rounded-md bg-amber-50 px-2.5 py-2 dark:bg-amber-950/40">
                <Info className="mt-0.5 size-3 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {tip}
                </p>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function PwaInstallGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Download className="size-4" />앱 설치 방법
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>규봇 앱 설치하기</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            규봇을 홈 화면에 설치하면 앱처럼 빠르게 실행할 수 있습니다. 아래에서
            기기에 맞는 방법을 선택하세요.
          </p>

          <Tabs defaultValue="ios">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ios">
                <Smartphone className="mr-1.5 size-3.5" />
                아이폰
              </TabsTrigger>
              <TabsTrigger value="android">
                <Smartphone className="mr-1.5 size-3.5" />
                안드로이드
              </TabsTrigger>
              <TabsTrigger value="pc">
                <Monitor className="mr-1.5 size-3.5" />
                PC
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ios">
              <StepList steps={IOS_STEPS} />
            </TabsContent>

            <TabsContent value="android">
              <StepList steps={ANDROID_STEPS} />
            </TabsContent>

            <TabsContent value="pc">
              <StepList steps={PC_STEPS} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
