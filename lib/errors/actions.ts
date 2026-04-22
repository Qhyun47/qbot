"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function submitErrorLog(payload: {
  pageUrl: string;
  errorMessage: string;
  stackTrace?: string;
}): Promise<void> {
  try {
    const supabase = await createClient();
    const headersList = await headers();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("error_logs").insert({
      user_id: user?.id ?? null,
      page_url: payload.pageUrl,
      error_message: payload.errorMessage.slice(0, 2000),
      stack_trace: payload.stackTrace?.slice(0, 5000) ?? null,
      user_agent: headersList.get("user-agent")?.slice(0, 500) ?? null,
    });
  } catch {
    // 에러 로그 전송 실패가 추가 에러를 유발하면 안 됨
  }
}
