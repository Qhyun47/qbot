"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Mic, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRecorder } from "@/hooks/use-recorder";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export interface RecordingButtonHandle {
  isRecording: boolean;
  stopAndUpload: () => Promise<void>;
}

interface RecordingButtonProps {
  caseId: string | null;
  onUploadComplete?: (recordingId: string) => void;
  autoStartSignal?: boolean;
}

export const RecordingButton = forwardRef<
  RecordingButtonHandle,
  RecordingButtonProps
>(function RecordingButton({ caseId, onUploadComplete, autoStartSignal }, ref) {
  const { isRecording, elapsedSeconds, startRecording, stopRecording, error } =
    useRecorder();
  const [isUploading, setIsUploading] = useState(false);
  const isFirstSignalRef = useRef(true);
  const elapsedSecondsRef = useRef(elapsedSeconds);
  elapsedSecondsRef.current = elapsedSeconds;

  const performUpload = useCallback(
    async (blob: Blob, seconds: number) => {
      if (!caseId) return;
      setIsUploading(true);
      try {
        const ext = blob.type.includes("mp4") ? "mp4" : "webm";
        const formData = new FormData();
        formData.append("file", blob, `recording.${ext}`);
        formData.append("duration_seconds", String(seconds));

        const res = await fetch(`/api/cases/${caseId}/recordings`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "업로드에 실패했습니다.");
        }

        const recording = await res.json();
        onUploadComplete?.(recording.id);
        toast.success("녹음이 저장되었습니다.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "업로드에 실패했습니다."
        );
      } finally {
        setIsUploading(false);
      }
    },
    [caseId, onUploadComplete]
  );

  useImperativeHandle(
    ref,
    () => ({
      get isRecording() {
        return isRecording;
      },
      stopAndUpload: async () => {
        if (!isRecording || !caseId) return;
        const blob = await stopRecording();
        if (!blob) return;
        await performUpload(blob, elapsedSecondsRef.current);
      },
    }),
    [isRecording, caseId, stopRecording, performUpload]
  );

  useEffect(() => {
    if (isFirstSignalRef.current) {
      isFirstSignalRef.current = false;
      return;
    }
    if (!isRecording && !isUploading) {
      startRecording().then(() => {
        if (error) toast.error(error);
      });
    }
    // autoStartSignal 변경 시만 트리거
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartSignal]);

  async function handleClick() {
    if (!caseId) {
      toast.error("케이스가 생성된 후 녹음할 수 있습니다.");
      return;
    }

    if (isUploading) return;

    if (isRecording) {
      const blob = await stopRecording();
      if (!blob) return;
      await performUpload(blob, elapsedSecondsRef.current);
    } else {
      await startRecording();
      if (error) toast.error(error);
    }
  }

  if (isUploading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="size-5 animate-spin" />
      </Button>
    );
  }

  if (isRecording) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className="w-auto gap-1.5 px-2"
        aria-label="녹음 중지"
      >
        <span className="size-2 shrink-0 animate-pulse rounded-full bg-foreground" />
        <span className="text-xs font-medium tabular-nums">
          {formatTime(elapsedSeconds)}
        </span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label="녹음 시작"
      className={cn(!caseId && "opacity-50")}
    >
      <Mic className="size-5" />
    </Button>
  );
});
