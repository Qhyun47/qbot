"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  approveServiceAccess,
  approveServiceAccessAiExcluded,
  denyServiceAccess,
  holdServiceAccess,
  updateServiceAccessStatus,
} from "@/lib/admin/user-access-actions";
import type { ServiceAccessUser } from "@/lib/admin/user-access-actions";
import type { ServiceAccessStatus } from "@/lib/supabase/types";

const STATUS_LABELS: Record<ServiceAccessStatus, string> = {
  pending: "대기 중",
  approved: "승인됨",
  ai_excluded: "AI 제외 승인",
  denied: "거절됨",
  held: "보류",
};

const STATUS_VARIANTS: Record<
  ServiceAccessStatus,
  "secondary" | "default" | "outline" | "destructive"
> = {
  pending: "secondary",
  approved: "default",
  ai_excluded: "outline",
  denied: "destructive",
  held: "secondary",
};

type PendingAction = "approve" | "ai_excluded" | "deny" | "hold" | null;

function PendingUserRow({ user }: { user: ServiceAccessUser }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const displayName = user.full_name ?? user.email ?? user.id;

  function handleApprove() {
    setPendingAction("approve");
    startTransition(async () => {
      const result = await approveServiceAccess(user.id);
      if (result.error) {
        toast.error(result.error);
        setPendingAction(null);
      } else {
        toast.success(`${displayName}님을 승인했습니다.`);
        router.refresh();
      }
    });
  }

  function handleApproveAiExcluded() {
    setPendingAction("ai_excluded");
    startTransition(async () => {
      const result = await approveServiceAccessAiExcluded(user.id);
      if (result.error) {
        toast.error(result.error);
        setPendingAction(null);
      } else {
        toast.success(`${displayName}님을 AI 제외로 승인했습니다.`);
        router.refresh();
      }
    });
  }

  function handleDeny() {
    setPendingAction("deny");
    startTransition(async () => {
      const result = await denyServiceAccess(user.id);
      if (result.error) {
        toast.error(result.error);
        setPendingAction(null);
      } else {
        toast.success(`${displayName}님을 거절했습니다.`);
        router.refresh();
      }
    });
  }

  function handleHold() {
    setPendingAction("hold");
    startTransition(async () => {
      const result = await holdServiceAccess(user.id);
      if (result.error) {
        toast.error(result.error);
        setPendingAction(null);
      } else {
        toast.success(`${displayName}님을 보류 처리했습니다.`);
        router.refresh();
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{user.full_name ?? "-"}</TableCell>
      <TableCell className="text-muted-foreground">
        {user.email ?? "-"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {user.created_at
          ? format(new Date(user.created_at), "MM/dd HH:mm", { locale: ko })
          : "-"}
      </TableCell>
      <TableCell>
        <Badge variant={STATUS_VARIANTS[user.service_access_status]}>
          {STATUS_LABELS[user.service_access_status]}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="default"
            onClick={handleApprove}
            disabled={isPending}
          >
            {pendingAction === "approve" && isPending && (
              <Loader2 className="mr-1 size-3.5 animate-spin" />
            )}
            전체 승인
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleApproveAiExcluded}
            disabled={isPending}
          >
            {pendingAction === "ai_excluded" && isPending && (
              <Loader2 className="mr-1 size-3.5 animate-spin" />
            )}
            AI 제외 승인
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDeny}
            disabled={isPending}
          >
            {pendingAction === "deny" && isPending && (
              <Loader2 className="mr-1 size-3.5 animate-spin" />
            )}
            거절
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleHold}
            disabled={isPending}
          >
            {pendingAction === "hold" && isPending && (
              <Loader2 className="mr-1 size-3.5 animate-spin" />
            )}
            보류
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function AllUserRow({ user }: { user: ServiceAccessUser }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const displayName = user.full_name ?? user.email ?? user.id;

  function handleStatusChange(status: ServiceAccessStatus) {
    startTransition(async () => {
      const result = await updateServiceAccessStatus(user.id, status);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${displayName}님의 상태를 변경했습니다.`);
        router.refresh();
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-1.5">
          {user.full_name ?? "-"}
          {user.is_admin && (
            <Badge variant="outline" className="text-xs">
              관리자
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {user.email ?? "-"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {user.created_at
          ? format(new Date(user.created_at), "MM/dd HH:mm", { locale: ko })
          : "-"}
      </TableCell>
      <TableCell>
        <Badge variant={STATUS_VARIANTS[user.service_access_status]}>
          {STATUS_LABELS[user.service_access_status]}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={user.is_admin || isPending}>
            <Button size="sm" variant="ghost" className="size-8 p-0">
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MoreHorizontal className="size-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => handleStatusChange("approved")}>
              승인
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => handleStatusChange("ai_excluded")}
            >
              AI 제외 승인
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleStatusChange("held")}>
              보류
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => handleStatusChange("denied")}
            >
              거절
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleStatusChange("pending")}>
              대기 중으로 되돌리기
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function PendingUserTable({ users }: { users: ServiceAccessUser[] }) {
  if (users.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        대기 중인 사용자가 없습니다.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>이메일</TableHead>
          <TableHead>가입일</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>처리</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <PendingUserRow key={user.id} user={user} />
        ))}
      </TableBody>
    </Table>
  );
}

export function AllUserTable({ users }: { users: ServiceAccessUser[] }) {
  if (users.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        가입된 회원이 없습니다.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>이메일</TableHead>
          <TableHead>가입일</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>처리</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <AllUserRow key={user.id} user={user} />
        ))}
      </TableBody>
    </Table>
  );
}
