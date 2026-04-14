import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
import { Suspense } from "react";
import type { Profile } from "@/lib/supabase/types";

async function ProfileCard() {
  const supabase = await createClient();
  const { data, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !data?.claims) {
    redirect("/auth/login");
  }

  const claims = data.claims;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", claims.sub)
    .single<Profile>();

  if (error) {
    return (
      <p className="text-sm text-muted-foreground">
        프로필을 불러올 수 없습니다.
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border bg-card p-6">
      <div className="flex items-center gap-4">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="프로필 이미지"
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl font-semibold text-muted-foreground">
            {(claims.email as string)?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div>
          <p className="text-lg font-semibold">
            {profile.full_name ?? "이름 없음"}
          </p>
          <p className="text-sm text-muted-foreground">
            {claims.email as string}
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        가입일: {new Date(profile.created_at).toLocaleDateString("ko-KR")}
      </p>
    </div>
  );
}

export default function ProtectedPage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-12">
      <div className="w-full">
        <div className="flex items-center gap-3 rounded-md bg-accent p-3 px-5 text-sm text-foreground">
          <InfoIcon size="16" strokeWidth={2} />
          인증된 사용자만 볼 수 있는 페이지입니다.
        </div>
      </div>
      <div className="flex flex-col items-start gap-4">
        <h2 className="text-2xl font-bold">내 프로필</h2>
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          }
        >
          <ProfileCard />
        </Suspense>
      </div>
    </div>
  );
}
