"use client";

import { useEffect, useState } from "react";
import { Download, DownloadCloud, X } from "lucide-react";
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

interface CasePhotosSectionProps {
  caseId: string;
}

function triggerDownload(photo: CasePhotoWithUrl) {
  if (!photo.url) return;
  const a = document.createElement("a");
  a.href = photo.url;
  a.download = photo.file_name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function CasePhotosSection({ caseId }: CasePhotosSectionProps) {
  const [photos, setPhotos] = useState<CasePhotoWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<CasePhotoWithUrl | null>(
    null
  );

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
      setTimeout(() => triggerDownload(photo), i * 300);
    });
  };

  if (loading || photos.length === 0) return null;

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
          {photos.map((photo) => (
            <div key={photo.id} className="relative size-24 shrink-0">
              {photo.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.url}
                  alt={photo.file_name}
                  className="h-full w-full rounded-md object-cover"
                />
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
                <a
                  href={photo.url}
                  download={photo.file_name}
                  className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  aria-label="다운로드"
                >
                  <Download className="size-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

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
