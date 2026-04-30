import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CasePhoto } from "@/lib/supabase/types";

type CasePhotoGroup = {
  caseId: string;
  bedZone: string;
  bedNumber: number | null;
  cc: string | null;
  photos: (CasePhoto & { url: string | null })[];
};

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: photos, error } = await supabase
    .from("case_photos")
    .select("*, cases!inner(id, bed_zone, bed_number, cc)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!photos || photos.length === 0) {
    return NextResponse.json([]);
  }

  // Signed URL 배치 생성
  const storagePaths = photos.map((p) => p.storage_path);
  const { data: signedData } = await supabase.storage
    .from("case-photos")
    .createSignedUrls(storagePaths, 3600);

  const urlMap = (signedData ?? []).reduce<Record<string, string>>(
    (acc, item) => {
      if (item.signedUrl && item.path) acc[item.path] = item.signedUrl;
      return acc;
    },
    {}
  );

  // 케이스별 그룹핑
  const groupMap = new Map<string, CasePhotoGroup>();
  for (const photo of photos) {
    const { cases, ...photoRow } = photo as typeof photo & {
      cases: {
        id: string;
        bed_zone: string;
        bed_number: number | null;
        cc: string | null;
      };
    };
    const caseId = cases.id;

    if (!groupMap.has(caseId)) {
      groupMap.set(caseId, {
        caseId,
        bedZone: cases.bed_zone,
        bedNumber: cases.bed_number,
        cc: cases.cc,
        photos: [],
      });
    }

    groupMap.get(caseId)!.photos.push({
      ...photoRow,
      url: urlMap[photo.storage_path] ?? null,
    });
  }

  // bed_zone → bed_number 오름차순 정렬
  const groups = Array.from(groupMap.values()).sort((a, b) => {
    if (a.bedZone !== b.bedZone) return a.bedZone.localeCompare(b.bedZone);
    return (a.bedNumber ?? 0) - (b.bedNumber ?? 0);
  });

  return NextResponse.json(groups);
}
