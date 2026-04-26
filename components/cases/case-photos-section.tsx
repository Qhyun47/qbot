"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  DownloadCloud,
  Loader2,
  RotateCcw,
  RotateCw,
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
  const raw = await res.blob();
  const blob = new Blob([raw], { type: "application/octet-stream" });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = photo.file_name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

function createRotatedBlob(
  imgEl: HTMLImageElement,
  deg: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const swapped = deg % 180 !== 0;
    canvas.width = swapped ? imgEl.naturalHeight : imgEl.naturalWidth;
    canvas.height = swapped ? imgEl.naturalWidth : imgEl.naturalHeight;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.drawImage(imgEl, -imgEl.naturalWidth / 2, -imgEl.naturalHeight / 2);
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob 실패"));
      },
      "image/jpeg",
      0.92
    );
  });
}

export function CasePhotosSection({ caseId }: CasePhotosSectionProps) {
  const [photos, setPhotos] = useState<CasePhotoWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<CasePhotoWithUrl | null>(
    null
  );
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [savingPhotoId, setSavingPhotoId] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setRotation(0);
    setIsDownloading(false);
  }, [viewingIndex]);

  useEffect(() => {
    fetch(`/api/cases/${caseId}/photos`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setPhotos)
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, [caseId]);

  const normalizedRotation = ((rotation % 360) + 360) % 360;

  const handleLightboxDownload = async () => {
    if (!viewingPhoto?.url || isDownloading) return;
    setIsDownloading(true);
    try {
      if (normalizedRotation !== 0 && imgRef.current) {
        const raw = await createRotatedBlob(imgRef.current, normalizedRotation);
        const blob = new Blob([raw], { type: "application/octet-stream" });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = viewingPhoto.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } else {
        await triggerDownload(viewingPhoto);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const uploadRotatedBlob = async (photo: CasePhotoWithUrl, blob: Blob) => {
    const formData = new FormData();
    formData.append(
      "file",
      new File([blob], photo.file_name, { type: "image/jpeg" })
    );
    await fetch(`/api/cases/${caseId}/photos/${photo.id}`, {
      method: "PATCH",
      body: formData,
    });
  };

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

  if (!loading && photos.length === 0) return null;

  const viewingPhoto = viewingIndex !== null ? photos[viewingIndex] : null;

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            첨부 사진
          </h2>
          {!loading && photos.length >= 2 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={handleDownloadAll}
              disabled={savingPhotoId !== null}
            >
              {savingPhotoId !== null ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <DownloadCloud className="size-3.5" />
              )}
              모두 다운로드
            </Button>
          )}
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            불러오는 중...
          </div>
        ) : (
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
                {savingPhotoId === photo.id && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40">
                    <Loader2 className="size-6 animate-spin text-white" />
                  </div>
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
                    disabled={savingPhotoId === photo.id}
                    className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-60"
                    aria-label="다운로드"
                  >
                    {savingPhotoId === photo.id ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Download className="size-3" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 사진 뷰어 */}
      <Dialog
        open={viewingIndex !== null}
        onOpenChange={async (open) => {
          if (open) return;
          const photoToSave = viewingPhoto;
          const rotationToSave = normalizedRotation;
          const imgEl = imgRef.current;

          // 팝업 즉시 닫기
          setViewingIndex(null);
          setRotation(0);

          // 회전이 있으면 백그라운드 저장
          if (rotationToSave !== 0 && photoToSave && imgEl) {
            let blob: Blob | null = null;
            try {
              blob = await createRotatedBlob(imgEl, rotationToSave);
            } catch {
              // Canvas 오류 시 저장 생략하고 그냥 닫힘
            }
            if (blob) {
              setSavingPhotoId(photoToSave.id);
              try {
                await uploadRotatedBlob(photoToSave, blob);
                const res = await fetch(`/api/cases/${caseId}/photos`);
                if (res.ok) setPhotos(await res.json());
              } finally {
                setSavingPhotoId(null);
              }
            }
          }
        }}
      >
        <DialogContent className="flex max-h-[90vh] max-w-[90vw] flex-col gap-3 p-4">
          {viewingPhoto && (
            <>
              <div className="flex items-center justify-between pr-8">
                <span className="text-sm text-muted-foreground">
                  {(viewingIndex ?? 0) + 1} / {photos.length}
                </span>
                <button
                  type="button"
                  onClick={handleLightboxDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                  aria-label="다운로드"
                >
                  {isDownloading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  다운로드
                </button>
              </div>
              <div className="relative flex flex-1 items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={viewingPhoto.url ?? ""}
                  alt={viewingPhoto.file_name}
                  crossOrigin="anonymous"
                  className="max-h-[75vh] max-w-full rounded-md object-contain transition-transform duration-200"
                  style={{ transform: `rotate(${rotation}deg)` }}
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
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRotation((r) => r - 90)}
                  className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="반시계 방향 회전"
                >
                  <RotateCcw className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => r + 90)}
                  className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="시계 방향 회전"
                >
                  <RotateCw className="size-4" />
                </button>
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
