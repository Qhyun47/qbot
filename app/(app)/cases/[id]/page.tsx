// 케이스 결과 페이지 — TODO: Task 007에서 실제 UI 구현
// 베드번호 배지 + 생성 상태 폴링 + HPI 편집 + 상용구 편집 + 복사 버튼

export default async function CaseResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // TODO: Task 007에서 실제 데이터 패칭에 사용
  void id;

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">케이스 결과</h1>
      <p className="mt-2 text-muted-foreground">
        TODO: Task 007에서 구현 예정 (베드번호 배지 + HPI + 상용구 + 복사)
      </p>
    </div>
  );
}
