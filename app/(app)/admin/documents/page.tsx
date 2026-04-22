import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getIsAdmin } from "@/lib/auth/is-admin";
import { getDocuments } from "@/lib/admin/document-actions";
import { DocumentManager } from "@/components/admin/document-manager";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 관리자 체크 + 문서 목록 로드를 담당하는 내부 async 컴포넌트.
 * Suspense로 감싸 non-blocking 렌더링을 지원합니다.
 */
async function DocumentManagerSection() {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const documents = await getDocuments();
  return <DocumentManager initialDocuments={documents} />;
}

/**
 * 관리자 전용 AI 문서 관리 페이지.
 * 실제 권한 체크와 데이터 로드는 Suspense 내부의 async 컴포넌트에서 처리합니다.
 */
export default function AdminDocumentsPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="border-b px-4 py-3">
        <h1 className="text-sm font-semibold">AI 문서 관리</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          프롬프트, 템플릿, 스키마, 가이드라인 등 AI 리소스 파일을 관리합니다.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex flex-1 gap-0">
            <div className="w-[280px] border-r p-3">
              <Skeleton className="mb-2 h-4 w-20" />
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="mb-1.5 h-5 w-full" />
              ))}
            </div>
            <div className="flex flex-1 items-center justify-center">
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
        }
      >
        <DocumentManagerSection />
      </Suspense>
    </div>
  );
}
