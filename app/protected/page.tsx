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
    <div className="flex flex-col gap-4 p-6 rounded-lg border bg-card w-full max-w-sm">
      <div className="flex items-center gap-4">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="프로필 이미지"
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-semibold text-muted-foreground">
            {(claims.email as string)?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div>
          <p className="font-semibold text-lg">
            {profile.full_name ?? "이름 없음"}
          </p>
          <p className="text-sm text-muted-foreground">{claims.email as string}</p>
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
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          인증된 사용자만 볼 수 있는 페이지입니다.
        </div>
      </div>
      <div className="flex flex-col gap-4 items-start">
        <h2 className="font-bold text-2xl">내 프로필</h2>
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
