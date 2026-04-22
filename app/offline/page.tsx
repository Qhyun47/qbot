import { WifiOff } from "lucide-react";
import { RetryButton } from "./retry-button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <WifiOff className="h-16 w-16 text-muted-foreground" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">네트워크 연결이 필요합니다</h1>
        <p className="text-muted-foreground">
          인터넷 연결을 확인한 후 다시 시도해 주세요.
        </p>
      </div>
      <RetryButton />
    </div>
  );
}
