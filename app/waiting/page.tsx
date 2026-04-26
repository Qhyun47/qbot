import { redirect } from "next/navigation";
import { getServiceAccessStatus } from "@/lib/auth/service-access";
import { LogoutButton } from "@/components/logout-button";
import { Logo } from "@/components/icons/logo";
import { Clock, XCircle } from "lucide-react";

export default async function WaitingPage() {
  const status = await getServiceAccessStatus();

  if (status === "approved" || status === "ai_excluded") {
    redirect("/dashboard");
  }

  const isDenied = status === "denied";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <Logo className="size-12" />
      {isDenied ? (
        <XCircle className="size-12 text-destructive" />
      ) : (
        <Clock className="size-12 text-muted-foreground" />
      )}
      <div className="text-center">
        <h1 className="text-xl font-semibold">
          {isDenied ? "서비스 이용이 거절되었습니다" : "승인 대기 중"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isDenied
            ? "서비스 이용이 거절되었습니다. 문의가 필요하시면 관리자에게 연락해 주세요."
            : "관리자의 승인을 기다리고 있습니다. 승인 후 서비스를 이용하실 수 있습니다."}
        </p>
      </div>
      <LogoutButton />
    </div>
  );
}
