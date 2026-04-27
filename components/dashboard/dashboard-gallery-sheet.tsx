"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  DownloadCloud,
  ImagePlus,
  Loader2,
  RotateCcw,
  RotateCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { DashboardPhoto } from "@/lib/supabase/types";

type DashboardPhotoWithUrl = DashboardPhoto & { url: string | null };

interface DashboardGallerySheetProps {
  children: React.ReactNode;
}

async function triggerDownload(photo: DashboardPhotoWithUrl) {
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

export function DashboardGallerySheet({
  children,
}: DashboardGallerySheetProps) {
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState<DashboardPhotoWithUrl[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [deleteTarget, setDeleteTarget] =
    useState<DashboardPhotoWithUrl | null>(null);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [savingPhotoId, setSavingPhotoId] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const viewingPhoto = viewingIndex !== null ? photos[viewingIndex] : null;

  useEffect(() => {
    setRotation(0);
    setIsDownloading(false);
  }, [viewingIndex]);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/photos");
      if (res.ok) setPhotos(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) fetchPhotos();
  };

  const handleFileSelect = async (file: File) => {
    setUploadingCount((c) => c + 1);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/dashboard/photos", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.autoDeleted) {
          toast("가장 오래된 사진이 자동 삭제되었습니다.");
        }
        await fetchPhotos();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "업로드에 실패했습니다.");
      }
    } finally {
      setUploadingCount((c) => c - 1);
    }
  };

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

  const uploadRotatedBlob = async (
    photo: DashboardPhotoWithUrl,
    blob: Blob
  ) => {
    const formData = new FormData();
    formData.append(
      "file",
      new File([blob], photo.file_name, { type: "image/jpeg" })
    );
    await fetch(`/api/dashboard/photos/${photo.id}`, {
      method: "PATCH",
      body: formData,
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/dashboard/photos/${deleteTarget.id}`, {
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

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <div className="flex items-center justify-between pr-2">
              <DrawerTitle>사진 갤러리</DrawerTitle>
              {!loading && photos.length >= 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden gap-1.5 text-xs text-muted-foreground is-desktop:flex"
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
          </DrawerHeader>

          <div className="flex min-h-[55vh] flex-col gap-4 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <p className="text-xs text-muted-foreground">
              사진은 업로드 후 12시간이 지나면 자동으로 삭제됩니다.
            </p>

            {/* 썸네일 그리드 */}
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                불러오는 중...
              </div>
            ) : photos.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                저장된 사진이 없습니다.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {photos.map((photo, idx) => (
                  <div key={photo.id} className="relative aspect-square">
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
                          className="h-full w-full rounded object-cover"
                        />
                      </button>
                    ) : (
                      <div className="h-full w-full rounded bg-muted" />
                    )}
                    {savingPhotoId === photo.id && (
                      <div className="absolute inset-0 flex items-center justify-center rounded bg-black/40">
                        <Loader2 className="size-6 animate-spin text-white" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(photo)}
                      className="absolute right-0.5 top-0.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      aria-label="삭제"
                    >
                      <X className="size-3.5" />
                    </button>
                    {photo.url && (
                      <button
                        type="button"
                        onClick={() => triggerDownload(photo)}
                        disabled={savingPhotoId === photo.id}
                        className="absolute bottom-0.5 right-0.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-60"
                        aria-label="다운로드"
                      >
                        <Download className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 업로드 버튼 — 모바일 전용 */}
            <div className="flex flex-col gap-4 is-desktop:hidden">
              <div className="h-px bg-border" />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:hidden"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="mr-2 size-4" />
                  카메라
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => albumInputRef.current?.click()}
                >
                  <ImagePlus className="mr-2 size-4" />
                  갤러리
                </Button>
              </div>
            </div>

            {uploadingCount > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                {uploadingCount > 1
                  ? `${uploadingCount}개 업로드 중...`
                  : "업로드 중..."}
              </p>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* 카메라 input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = "";
        }}
      />
      {/* 앨범 input */}
      <input
        ref={albumInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = "";
        }}
      />

      {/* 라이트박스 뷰어 */}
      <Dialog
        open={viewingIndex !== null}
        onOpenChange={async (open) => {
          if (open) return;
          const photoToSave = viewingPhoto;
          const rotationToSave = normalizedRotation;
          const imgEl = imgRef.current;

          setViewingIndex(null);
          setRotation(0);

          if (rotationToSave !== 0 && photoToSave && imgEl) {
            let blob: Blob | null = null;
            try {
              blob = await createRotatedBlob(imgEl, rotationToSave);
            } catch {
              // Canvas 오류 시 저장 생략
            }
            if (blob) {
              setSavingPhotoId(photoToSave.id);
              try {
                await uploadRotatedBlob(photoToSave, blob);
                const res = await fetch("/api/dashboard/photos");
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
