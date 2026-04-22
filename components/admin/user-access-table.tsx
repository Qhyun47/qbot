"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { approveAiAccess, denyAiAccess } from "@/lib/admin/user-access-actions";
import type { AiAccessUser } from "@/lib/admin/user-access-actions";

const STATUS_LABELS = {
  none: "미신청",
  pending: "심사 중",
  approved: "승인됨",
  denied: "거부됨",
} as const;

const STATUS_VARIANTS = {
  none: "outline",
  pending: "secondary",
  approved: "default",
  denied: "destructive",
} as const;

interface UserAccessTableProps {
  users: AiAccessUser[];
  showAll?: boolean;
}

function UserRow({ user }: { user: AiAccessUser }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      const result = await approveAiAccess(user.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${user.ai_access_name ?? user.email}님을 승인했습니다.`);
        router.refresh();
      }
    });
  }

  function handleDeny() {
    startTransition(async () => {
      const result = await denyAiAccess(user.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${user.ai_access_name ?? user.email}님을 거부했습니다.`);
        router.refresh();
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        {user.ai_access_name ?? "-"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {user.email ?? "-"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {user.ai_access_requested_at
          ? format(new Date(user.ai_access_requested_at), "MM/dd HH:mm", {
              locale: ko,
            })
          : "-"}
      </TableCell>
      <TableCell>
        <Badge variant={STATUS_VARIANTS[user.ai_access_status]}>
          {STATUS_LABELS[user.ai_access_status]}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {user.ai_access_status !== "approved" && (
            <Button
              size="sm"
              variant="default"
              onClick={handleApprove}
              disabled={isPending}
            >
              승인
            </Button>
          )}
          {user.ai_access_status !== "denied" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeny}
              disabled={isPending}
            >
              거부
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function UserAccessTable({
  users,
  showAll = false,
}: UserAccessTableProps) {
  if (users.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {showAll ? "신청 이력이 없습니다." : "대기 중인 신청이 없습니다."}
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>이메일</TableHead>
          <TableHead>신청일</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>처리</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </TableBody>
    </Table>
  );
}
