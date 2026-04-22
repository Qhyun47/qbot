import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="size-8 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-semibold">페이지를 찾을 수 없습니다</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          요청하신 페이지가 존재하지 않거나 삭제되었습니다.
        </p>
      </div>

      <Button asChild>
        <Link href="/">홈으로 이동</Link>
      </Button>
    </div>
  );
}
