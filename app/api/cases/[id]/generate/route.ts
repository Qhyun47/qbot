// AI 차팅 생성 API 엔드포인트
// TODO: Task 011에서 실제 AI 파이프라인 구현 (normalize → HPI → template)

import { NextResponse } from "next/server";

// TODO: Task 011 — next.config.ts의 cacheComponents 설정과 호환성 확인 후
// 아래 두 설정을 복원할 것 (Vercel Pro 플랜에서 Gemini 3회 호출 대비 60초 한도)
// export const runtime = "nodejs";
// export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // TODO: Task 011 — 구현 예정
  // 1. cases.status = 'generating' 업데이트
  // 2. normalize → generate-hpi → generate-template 순차 호출
  // 3. case_results insert, cases.current_result_id 업데이트
  // 4. cases.status = 'completed' 업데이트

  return NextResponse.json({ caseId: id, status: "todo" }, { status: 200 });
}
