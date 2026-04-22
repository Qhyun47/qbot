import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getIsAdmin } from "@/lib/auth/is-admin";
import {
  getPendingUsers,
  getAllAiUsers,
} from "@/lib/admin/user-access-actions";
import { UserAccessTable } from "@/components/admin/user-access-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function UserAccessContent() {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const [pendingUsers, allUsers] = await Promise.all([
    getPendingUsers(),
    getAllAiUsers(),
  ]);

  return (
    <div className="p-4">
      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            대기 중
            {pendingUsers.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                {pendingUsers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">전체 이력</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <UserAccessTable users={pendingUsers} />
        </TabsContent>
        <TabsContent value="all">
          <UserAccessTable users={allUsers} showAll />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="border-b px-4 py-3">
        <h1 className="text-sm font-semibold">사용자 AI 권한 관리</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          AI 차팅 사용 신청을 검토하고 승인하거나 거부합니다.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        }
      >
        <UserAccessContent />
      </Suspense>
    </div>
  );
}
