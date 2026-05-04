"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { Play, Pause, Loader2, Mic } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Recording, TranscriptSegment } from "@/lib/supabase/types";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

interface RecordingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
}

export function RecordingSheet({
  open,
  onOpenChange,
  caseId,
}: RecordingSheetProps) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Recording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(-1);

  const audioRef = useRef<HTMLAudioElement>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const fetchRecordings = useCallback(async () => {
    const res = await fetch(`/api/cases/${caseId}/recordings`);
    if (!res.ok) return;
    const data: Recording[] = await res.json();
    setRecordings(data);
    return data;
  }, [caseId]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchRecordings().finally(() => setLoading(false));
  }, [open, fetchRecordings]);

  // pending/processing 녹음이 있으면 5초마다 폴링
  useEffect(() => {
    const hasPending = recordings.some(
      (r) =>
        r.transcript_status === "pending" ||
        r.transcript_status === "processing"
    );

    if (hasPending && open) {
      pollCountRef.current = 0;
      pollRef.current = setInterval(() => {
        pollCountRef.current += 1;
        // 최대 60회(5분) 폴링 후 강제 중단
        if (pollCountRef.current > 60) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          return;
        }
        fetchRecordings().then((data) => {
          if (!data) return;
          const stillPending = data.some(
            (r) =>
              r.transcript_status === "pending" ||
              r.transcript_status === "processing"
          );
          if (!stillPending && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          // 현재 선택된 녹음 업데이트
          setSelected((prev) => {
            if (!prev) return prev;
            return data.find((r) => r.id === prev.id) ?? prev;
          });
        });
      }, 5000);
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [recordings, open, fetchRecordings]);

  // 오디오 이벤트 핸들러
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    setCurrentTime(t);

    const segments = getSegments(selected);
    const idx = segments.findIndex((s) => s.start <= t && t < s.end);
    setActiveSegmentIndex(idx);
  };

  useEffect(() => {
    if (activeSegmentIndex >= 0 && segmentRefs.current[activeSegmentIndex]) {
      segmentRefs.current[activeSegmentIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeSegmentIndex]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
  };

  function getSegments(recording: Recording | null): TranscriptSegment[] {
    if (!recording?.transcript) return [];
    return recording.transcript as unknown as TranscriptSegment[];
  }

  const segments = getSegments(selected);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>녹음 목록</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* 녹음 목록 */}
          <div className="shrink-0 border-b">
            {loading && (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && recordings.length === 0 && (
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                <Mic className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  녹음이 없습니다.
                </p>
              </div>
            )}
            {recordings.map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => {
                  setSelected(rec);
                  setCurrentTime(0);
                  setIsPlaying(false);
                  setActiveSegmentIndex(-1);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50",
                  selected?.id === rec.id && "bg-muted"
                )}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {format(new Date(rec.created_at), "MM/dd HH:mm")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {rec.duration_seconds != null
                      ? formatTime(rec.duration_seconds)
                      : "--:--"}
                  </span>
                </div>
                {(rec.transcript_status === "pending" ||
                  rec.transcript_status === "processing") && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    변환 중...
                  </div>
                )}
                {rec.transcript_status === "failed" && (
                  <span className="text-xs text-destructive">변환 실패</span>
                )}
              </button>
            ))}
          </div>

          {/* 선택된 녹음 플레이어 + 대화록 */}
          {selected && (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* 오디오 플레이어 */}
              <div className="shrink-0 border-b px-4 py-3">
                <audio
                  ref={audioRef}
                  src={selected.url ?? undefined}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={() => {
                    const d = audioRef.current?.duration;
                    setDuration(
                      isFinite(d ?? NaN)
                        ? (d ?? 0)
                        : (selected?.duration_seconds ?? 0)
                    );
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePlayPause}
                    className="shrink-0"
                  >
                    {isPlaying ? (
                      <Pause className="size-4" />
                    ) : (
                      <Play className="size-4" />
                    )}
                  </Button>
                  <input
                    type="range"
                    min={0}
                    max={duration || 1}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1"
                  />
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>

              {/* 대화록 */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {selected.transcript_status === "done" &&
                  segments.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {segments.map((seg, i) => (
                        <div
                          key={i}
                          ref={(el) => {
                            segmentRefs.current[i] = el;
                          }}
                          onClick={() => {
                            if (audioRef.current) {
                              audioRef.current.currentTime = seg.start;
                            }
                          }}
                          className={cn(
                            "cursor-pointer rounded-md border-l-2 px-3 py-1.5 transition-colors",
                            i === activeSegmentIndex
                              ? "border-primary bg-primary/10"
                              : "border-transparent hover:bg-muted/50"
                          )}
                        >
                          <span className="mr-2 text-xs tabular-nums text-muted-foreground">
                            [{formatTime(Math.floor(seg.start))}]
                          </span>
                          <span className="text-sm">{seg.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                {selected.transcript_status === "done" &&
                  segments.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      대화록이 없습니다.
                    </p>
                  )}
                {(selected.transcript_status === "pending" ||
                  selected.transcript_status === "processing") && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    변환 중입니다...
                  </div>
                )}
                {selected.transcript_status === "failed" && (
                  <p className="text-sm text-destructive">
                    변환에 실패했습니다.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
