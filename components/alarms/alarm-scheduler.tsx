"use client";

import { useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { fireAlarm } from "@/lib/alarms/actions";
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
  const firingIds = useRef<Set<string>>(new Set());

  const showNotification = useCallback(async (alarm: Alarm) => {
    if (
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    )
      return;

    const prefix =
      alarm.bed_zone && alarm.bed_number != null
        ? `[${alarm.bed_zone}${String(alarm.bed_number).padStart(2, "0")}] `
        : "";

    const options: NotificationOptions = {
      body: "알람",
      data: { alarmId: alarm.id },
      icon: "/icon-192x192.png",
    };

    // SW를 통해 알림을 생성해야 notificationclick 이벤트가 정상 동작함
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready.catch(() => null);
      if (reg) {
        reg.showNotification(`${prefix}${alarm.title}`, options);
        return;
      }
    }
    new Notification(`${prefix}${alarm.title}`, options);
  }, []);

  // 30초 폴링: scheduled_at이 지난 미확인 알람 발동 (이미 울린 알람은 건너뜀)
  useEffect(() => {
    const alarms = initialAlarms;

    async function checkAndFire() {
      const now = new Date();
      const due = alarms.filter((a) => {
        if (a.is_confirmed) return false;
        if (new Date(a.scheduled_at) > now) return false;
        // last_fired_at이 scheduled_at 이후면 이미 울린 것 — 재발화 방지
        if (
          a.last_fired_at &&
          new Date(a.last_fired_at) >= new Date(a.scheduled_at)
        )
          return false;
        return true;
      });
      for (const alarm of due) {
        if (firingIds.current.has(alarm.id)) continue;
        firingIds.current.add(alarm.id);
        try {
          await showNotification(alarm).catch(() => null);
          await fireAlarm(alarm.id).catch(() => null);
        } finally {
          firingIds.current.delete(alarm.id);
        }
      }
    }

    checkAndFire();
    const id = setInterval(checkAndFire, 30_000);
    return () => clearInterval(id);
  }, [initialAlarms, showNotification]);

  return null;
}
