// ER Scribe 앱 전용 공통 레이아웃
// TODO: Task 004 — AppNavbar 컴포넌트로 헤더 교체

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center border-b px-4">
        {/* TODO: Task 004 — 공통 네비바 컴포넌트로 교체 */}
        <span className="text-sm font-semibold">ER Scribe</span>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
