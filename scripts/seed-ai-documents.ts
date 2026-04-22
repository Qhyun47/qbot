/**
 * ai-docs/ 폴더의 파일들을 ai_documents 테이블에 초기 삽입하는 스크립트.
 * 실행: npx tsx --env-file=.env.local scripts/seed-ai-documents.ts
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const AI_DOCS_DIR = path.join(process.cwd(), "ai-docs");

// 편집 불가 파일 목록 (구조적 파일)
const READONLY_PATHS = new Set([
  "cc/_generic/schema",
  "cc/chest-pain/schema",
  "cc/dyspnea/schema",
  "cc/hemoptysis/schema",
  "cc/abdominal-pain/schema",
  "cc/gi-bleeding/schema",
]);

function collectFiles(
  dir: string,
  baseDir: string
): Array<{ docPath: string; docType: "md" | "json"; content: string }> {
  const results: Array<{
    docPath: string;
    docType: "md" | "json";
    content: string;
  }> = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).slice(1);
      if (ext !== "md" && ext !== "json") continue;

      const relativePath = path.relative(baseDir, fullPath);
      const docPath = relativePath
        .replace(/\\/g, "/")
        .replace(/\.(md|json)$/, "");
      const content = fs.readFileSync(fullPath, "utf-8");
      results.push({ docPath, docType: ext as "md" | "json", content });
    }
  }
  return results;
}

async function main() {
  const files = collectFiles(AI_DOCS_DIR, AI_DOCS_DIR);
  console.log(`총 ${files.length}개 파일 발견\n`);

  for (const file of files) {
    const isEditable = !READONLY_PATHS.has(file.docPath);
    const { error } = await supabase.from("ai_documents").upsert(
      {
        doc_path: file.docPath,
        doc_type: file.docType,
        content: file.content,
        is_editable: isEditable,
        version: 1,
        synced_at: new Date().toISOString(),
        updated_by: "admin",
      },
      { onConflict: "doc_path", ignoreDuplicates: true }
    );

    if (error) {
      console.error(`❌ 실패: ${file.docPath} — ${error.message}`);
    } else {
      console.log(
        `✅ ${file.docPath} (${isEditable ? "편집 가능" : "🔒 읽기 전용"})`
      );
    }
  }

  console.log("\n초기 데이터 삽입 완료");
}

main().catch(console.error);
