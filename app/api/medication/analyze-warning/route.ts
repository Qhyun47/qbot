import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateMedAnalysisText } from "@/lib/medication/gemini-free-client";

const SYSTEM_INSTRUCTION =
  "당신은 임상 약사입니다. 제공된 약물 목록에서 수술/시술 전 중단이 필요한 항혈소판제·항응고제 성분을 식별하여 마크다운 리스트로 반환하세요. 발견 안 되면 '확인된 항혈전제 없음'으로 답변.";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const body = await req.json();
  const { medList, caseId } = body as { medList: string; caseId?: string };

  let result: string;
  try {
    result = await generateMedAnalysisText(
      "다음은 환자의 현재 약물 목록입니다:\n" + medList,
      SYSTEM_INSTRUCTION
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("GEMINI_FREE_API_KEY")) {
      return NextResponse.json(
        { error: "서버 설정 오류 (관리자 문의)" },
        { status: 500 }
      );
    }
    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      return NextResponse.json(
        { error: "일일 분석 한도 초과. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  if (caseId) {
    await supabase
      .from("case_results")
      .update({
        antithrombotic_check: result,
        antithrombotic_at: new Date().toISOString(),
      })
      .eq("case_id", caseId);
  }

  return NextResponse.json({ result });
}
