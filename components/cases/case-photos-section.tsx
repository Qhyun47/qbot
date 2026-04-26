"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  DownloadCloud,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { CasePhoto } from "@/lib/supabase/types";

type CasePhotoWithUrl = CasePhoto & { url: string | null };

interface CasePhotosSectionProps {
  caseId: string;
}

async function triggerDownload(photo: CasePhotoWithUrl) {
  if (!photo.url) return;
  const res = await fetch(photo.url);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = photo.file_name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

export function CasePhotosSection({ caseId }: CasePhotosSectionProps) {
  const [photos, setPhotos] = useState<CasePhotoWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<CasePhotoWithUrl | null>(
    null
  );
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/cases/${caseId}/photos`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setPhotos)
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, [caseId]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/cases/${caseId}/photos/${deleteTarget.id}`, {
      method: "DELETE",
    });
    setDeleteTarget(null);
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    }
  };

  const handleDownloadAll = () => {
    photos.forEach((photo, i) => {
      setTimeout(() => triggerDownload(photo), i * 500);
    });
  };

  const showPrev = useCallback(() => {
    setViewingIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  }, []);

  const showNext = useCallback(() => {
    setViewingIndex((i) => (i !== null && i < photos.length - 1 ? i + 1 : i));
  }, [photos.length]);

  useEffect(() => {
    if (viewingIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewingIndex, showPrev, showNext]);

  if (loading || photos.length === 0) return null;

  const viewingPhoto = viewingIndex !== null ? photos[viewingIndex] : null;

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            첨부 사진
          </h2>
          {photos.length >= 2 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={handleDownloadAll}
            >
              <DownloadCloud className="size-3.5" />
              모두 다운로드
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="relative size-24 shrink-0">
              {photo.url ? (
                <button
                  type="button"
                  className="h-full w-full"
                  onClick={() => setViewingIndex(idx)}
                  aria-label="사진 확대"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.file_name}
                    className="h-full w-full rounded-md object-cover"
                  />
                </button>
              ) : (
                <div className="h-full w-full rounded-md bg-muted" />
              )}
              <button
                type="button"
                onClick={() => setDeleteTarget(photo)}
                className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label="삭제"
              >
                <X className="size-3" />
              </button>
              {photo.url && (
                <button
                  type="button"
                  onClick={() => triggerDownload(photo)}
                  className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  aria-label="다운로드"
                >
                  <Download className="size-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 사진 뷰어 */}
      <Dialog
        open={viewingIndex !== null}
        onOpenChange={(open) => {
          if (!open) setViewingIndex(null);
        }}
      >
        <DialogContent className="flex max-h-[90vh] max-w-[90vw] flex-col gap-3 p-4">
          {viewingPhoto && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {(viewingIndex ?? 0) + 1} / {photos.length}
                </span>
                <button
                  type="button"
                  onClick={() => triggerDownload(viewingPhoto)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  aria-label="다운로드"
                >
                  <Download className="size-4" />
                  다운로드
                </button>
              </div>
              <div className="relative flex flex-1 items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewingPhoto.url ?? ""}
                  alt={viewingPhoto.file_name}
                  className="max-h-[75vh] max-w-full rounded-md object-contain"
                />
                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPrev}
                      disabled={(viewingIndex ?? 0) === 0}
                      className="absolute left-2 flex size-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
                      aria-label="이전 사진"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={showNext}
                      disabled={(viewingIndex ?? 0) === photos.length - 1}
                      className="absolute right-2 flex size-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
                      aria-label="다음 사진"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>사진 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 사진을 삭제하면 복구할 수 없습니다. 삭제하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
