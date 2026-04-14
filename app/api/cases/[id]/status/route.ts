// 케이스 생성 상태 폴링 엔드포인트 (경량 GET)
// TODO: Task 011에서 실제 Supabase 조회 구현

import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // TODO: Task 011 — 구현 예정
  // Supabase에서 cases.status 조회 후 { caseId, status } 반환
  // 클라이언트 폴링 컴포넌트(generation-poller)가 3~5초 간격으로 호출

  return NextResponse.json({ caseId: id, status: "todo" }, { status: 200 });
}
