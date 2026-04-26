"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
import type { CasePhoto } from "@/lib/supabase/types";

type CasePhotoWithUrl = CasePhoto & { url: string | null };

interface PhotoBottomSheetProps {
  caseId: string | null;
}

export function PhotoBottomSheet({ caseId }: PhotoBottomSheetProps) {
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState<CasePhotoWithUrl[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<CasePhotoWithUrl | null>(
    null
  );
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/photos`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) fetchPhotos();
  };

  const handleFileSelect = async (file: File) => {
    if (!caseId) return;
    setUploadingCount((c) => c + 1);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/cases/${caseId}/photos`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        await fetchPhotos();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "업로드에 실패했습니다.");
      }
    } finally {
      setUploadingCount((c) => c - 1);
    }
  };

  const handleDelete = async () => {
    if (!caseId || !deleteTarget) return;
    const res = await fetch(`/api/cases/${caseId}/photos/${deleteTarget.id}`, {
      method: "DELETE",
    });
    setDeleteTarget(null);
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    }
  };

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="사진 첨부"
          >
            <Camera className="size-5" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>사진 첨부</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-4 px-4 pb-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {/* 사진 썸네일 그리드 */}
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                불러오는 중...
              </p>
            ) : photos.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                첨부된 사진이 없습니다.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square">
                    {photo.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.url}
                        alt={photo.file_name}
                        className="h-full w-full rounded object-cover"
                      />
                    ) : (
                      <div className="h-full w-full rounded bg-muted" />
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(photo)}
                      className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
                      aria-label="삭제"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="h-px bg-border" />

            {/* 업로드 버튼 */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={!caseId}
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="mr-2 size-4" />
                카메라
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={!caseId}
                onClick={() => albumInputRef.current?.click()}
              >
                <ImagePlus className="mr-2 size-4" />
                갤러리
              </Button>
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
