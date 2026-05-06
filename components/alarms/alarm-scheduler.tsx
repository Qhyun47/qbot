"use client";

import { useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { fireAlarm, confirmAlarm } from "@/lib/alarms/actions";
import type { Alarm } from "@/lib/supabase/types";

interface Props {
  initialAlarms: Alarm[];
}

async function requestNotificationPermission() {
  if (typeof Notification === "undefined") return;

  // iOS PWA 미설치 안내
  const isIos = /iPhone|iPad/.test(navigator.userAgent);
  const isStandalone = (navigator as Navigator & { standalone?: boolean })
    .standalone;
  if (isIos && !isStandalone) {
    toast.warning("홈 화면에 추가 후 알림을 받을 수 있습니다");
    return;
  }

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  } else if (Notification.permission === "denied") {
    toast.warning("알림 권한을 허용해주세요");
  }
}

export function requestAlarmNotificationPermission() {
  return requestNotificationPermission();
}

export function AlarmScheduler({ initialAlarms }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const showNotification = useCallback((alarm: Alarm) => {
    if (
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    )
      return;

    const prefix =
      alarm.bed_zone && alarm.bed_number != null
        ? `[${alarm.bed_zone}${String(alarm.bed_number).padStart(2, "0")}] `
        : "";

    new Notification(`${prefix}${alarm.title}`, {
      body: "알람",
      data: { alarmId: alarm.id },
      icon: "/icon-192x192.png",
    });
  }, []);

  // 30초 폴링: scheduled_at이 지난 미확인 알람 발동
  useEffect(() => {
    const alarms = initialAlarms;

    async function checkAndFire() {
      const now = new Date();
      const due = alarms.filter(
        (a) => !a.is_confirmed && new Date(a.scheduled_at) <= now
      );
      for (const alarm of due) {
        showNotification(alarm);
        await fireAlarm(alarm.id).catch(() => null);
      }
    }

    checkAndFire();
    const id = setInterval(checkAndFire, 30_000);
    return () => clearInterval(id);
  }, [initialAlarms, showNotification]);

  // SW → 앱 ALARM_CONFIRMED 메시지 수신
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handler = (event: MessageEvent) => {
      if (event.data?.type === "ALARM_CONFIRMED" && event.data?.alarmId) {
        confirmAlarm(event.data.alarmId).catch(() => null);
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  // URL ?confirmAlarm=id 처리
  useEffect(() => {
    const alarmId = searchParams.get("confirmAlarm");
    if (!alarmId) return;

    confirmAlarm(alarmId).catch(() => null);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("confirmAlarm");
    const next = params.size > 0 ? `?${params.toString()}` : "";
    router.replace(`/dashboard${next}`);
  }, [searchParams, router]);

  return null;
}
