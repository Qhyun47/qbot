"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "admin_pending_alert_dismissed_at";

interface AdminPendingAlertProps {
  count: number;
}

export function AdminPendingAlert({ count }: AdminPendingAlertProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 오늘 이미 닫은 경우 미표시 (하루 단위로 초기화)
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      const dismissedDate = new Date(dismissed).toDateString();
      const today = new Date().toDateString();
      if (dismissedDate === today) return;
    }
    setVisible(true);
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, new Date().toISOString());
    setVisible(false);
  }

  if (!visible || count === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm dark:border-yellow-800 dark:bg-yellow-950">
      <Users className="size-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
      <p className="flex-1 text-yellow-800 dark:text-yellow-200">
        새로운 AI 사용 신청이 <span className="font-semibold">{count}건</span>{" "}
        있습니다.
      </p>
      <Button
        asChild
        size="sm"
        variant="outline"
        className="border-yellow-300 bg-white text-yellow-800 hover:bg-yellow-100 dark:border-yellow-700 dark:bg-transparent dark:text-yellow-200"
      >
        <Link href="/admin/users">처리하기</Link>
      </Button>
      <button
        onClick={handleDismiss}
        className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400"
        aria-label="알림 닫기"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
