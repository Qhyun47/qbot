import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateMedAnalysisText } from "@/lib/medication/gemini-free-client";

export const maxDuration = 30;

const SYSTEM_INSTRUCTION =
  "당신은 임상 의사입니다. 제공된 약물 목록과 사용자가 명시한 기저질환을 종합하여 추가 가능성 있는 기저질환을 마크다운으로 분석하세요. 사용자 명시 기저질환과 약물의 정합성·설명되지 않는 약물도 함께 분석.";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const body = await req.json();
  const { medList, knownDisease, caseId } = body as {
    medList: string;
    knownDisease?: string;
    caseId?: string;
  };

  const prompt =
    "다음은 환자의 현재 약물 목록입니다:\n" +
    medList +
    (knownDisease ? "\n\n환자가 밝힌 기저질환: " + knownDisease : "");

  let result: string;
  try {
    result = await generateMedAnalysisText(prompt, SYSTEM_INSTRUCTION);
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
        underlying_disease: result,
        underlying_disease_at: new Date().toISOString(),
      })
      .eq("case_id", caseId);
  }

  return NextResponse.json({ result });
}
