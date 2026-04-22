import "server-only";
import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();

export type GuideStatus = {
  key: string;
  exists: boolean;
};

export type TemplateStatus = {
  key: string;
  exists: boolean;
  peFieldCount: number;
  historyFieldCount: number;
  peOutputExample: string;
  historyOutputExample: string;
  mainOutputExample: string;
};

export type CcResourceItem = {
  cc: string;
  aliasOf?: string;
  guideKeys: string[];
  templateKeys: string[];
  guides: GuideStatus[];
  templates: TemplateStatus[];
  aliasedBy: string[];
};

export type GuideItem = {
  key: string;
  displayName: string;
  content: string;
  linkedCcs: string[];
};

export type TemplateItem = {
  key: string;
  displayName: string;
  exists: boolean;
  linkedCcs: string[];
  peFieldCount: number;
  historyFieldCount: number;
  peOutputExample: string;
  historyOutputExample: string;
  mainOutputExample: string;
};

export type ResourceOverviewData = {
  items: CcResourceItem[];
  guideItems: GuideItem[];
  templateItems: TemplateItem[];
  pendingMatches: string[];
  stats: {
    totalCc: number;
    withGuide: number;
    withTemplate: number;
    aliasCount: number;
  };
};

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parsePendingMatches(content: string): string[] {
  const afterSection = content.split("## 미매칭 항목")[1] ?? "";
  if (afterSection.includes("(현재 없음)")) return [];
  const matches = afterSection.match(/^### (.+)$/gm);
  return matches?.map((h) => h.replace("### ", "").trim()) ?? [];
}

export async function buildResourceOverview(): Promise<ResourceOverviewData> {
  const [ccListRaw, pendingRaw, guideListRaw, templateListRaw] =
    await Promise.all([
      fs.readFile(path.join(ROOT, "lib/ai/resources/cc-list.json"), "utf-8"),
      fs.readFile(path.join(ROOT, "ai-docs/pending-matches.md"), "utf-8"),
      fs.readFile(path.join(ROOT, "lib/ai/resources/guide-list.json"), "utf-8"),
      fs.readFile(
        path.join(ROOT, "lib/ai/resources/template-list.json"),
        "utf-8"
      ),
    ]);

  const guideList = JSON.parse(guideListRaw) as {
    guideKey: string;
    displayName: string;
  }[];
  const templateList = JSON.parse(templateListRaw) as {
    templateKey: string;
    displayName: string;
  }[];

  const guideDisplayMap = Object.fromEntries(
    guideList.map((g) => [g.guideKey, g.displayName])
  );
  const templateDisplayMap = Object.fromEntries(
    templateList.map((t) => [t.templateKey, t.displayName])
  );

  const ccList = JSON.parse(ccListRaw) as {
    cc: string;
    guideKeys: string[];
    templateKeys: string[];
    aliasOf?: string;
  }[];

  const reverseAliasMap: Record<string, string[]> = {};
  for (const entry of ccList) {
    if (entry.aliasOf) {
      reverseAliasMap[entry.aliasOf] = [
        ...(reverseAliasMap[entry.aliasOf] ?? []),
        entry.cc,
      ];
    }
  }

  const items = await Promise.all(
    ccList.map(async (entry) => {
      const guides = await Promise.all(
        entry.guideKeys.map(async (key) => ({
          key,
          exists: await fileExists(
            path.join(ROOT, "ai-docs/cc", key, "guide.md")
          ),
        }))
      );

      const templates = await Promise.all(
        entry.templateKeys.map(async (key) => {
          const tplPath = path.join(ROOT, "ai-docs/cc", key, "template.json");
          const exists = await fileExists(tplPath);
          if (!exists) {
            return {
              key,
              exists: false,
              peFieldCount: 0,
              historyFieldCount: 0,
              peOutputExample: "",
              historyOutputExample: "",
              mainOutputExample: "",
            };
          }
          const json = JSON.parse(await fs.readFile(tplPath, "utf-8"));
          return {
            key,
            exists: true,
            peFieldCount: (json.pe?.fields?.length as number) ?? 0,
            historyFieldCount: (json.history?.fields?.length as number) ?? 0,
            peOutputExample: (json.pe?.output_example as string) ?? "",
            historyOutputExample:
              (json.history?.output_example as string) ?? "",
            mainOutputExample: (json.output_example as string) ?? "",
          };
        })
      );

      return {
        cc: entry.cc,
        aliasOf: entry.aliasOf,
        guideKeys: entry.guideKeys,
        templateKeys: entry.templateKeys,
        guides,
        templates,
        aliasedBy: reverseAliasMap[entry.cc] ?? [],
      };
    })
  );

  const pendingMatches = parsePendingMatches(pendingRaw);

  // guide key → 연결된 C.C. 이름 역방향 맵
  const guideToCcs: Record<string, string[]> = {};
  const templateToCcs: Record<string, string[]> = {};
  for (const entry of ccList) {
    if (entry.aliasOf) continue;
    for (const gk of entry.guideKeys) {
      guideToCcs[gk] = [...(guideToCcs[gk] ?? []), entry.cc];
    }
    for (const tk of entry.templateKeys) {
      templateToCcs[tk] = [...(templateToCcs[tk] ?? []), entry.cc];
    }
  }

  // 고유 guide key 목록 (중복 제거)
  const allGuideKeys = [...new Set(ccList.flatMap((e) => e.guideKeys))];
  const guideItems = await Promise.all(
    allGuideKeys.map(async (key) => {
      const guidePath = path.join(ROOT, "ai-docs/cc", key, "guide.md");
      let content = "";
      try {
        content = await fs.readFile(guidePath, "utf-8");
      } catch {
        content = "";
      }
      return {
        key,
        displayName: guideDisplayMap[key] ?? key,
        content,
        linkedCcs: guideToCcs[key] ?? [],
      };
    })
  );

  // 고유 template key 목록 (중복 제거)
  const allTemplateKeys = [...new Set(ccList.flatMap((e) => e.templateKeys))];
  const templateItems = await Promise.all(
    allTemplateKeys.map(async (key) => {
      const tplPath = path.join(ROOT, "ai-docs/cc", key, "template.json");
      const exists = await fileExists(tplPath);
      if (!exists) {
        return {
          key,
          displayName: templateDisplayMap[key] ?? key,
          exists: false,
          linkedCcs: templateToCcs[key] ?? [],
          peFieldCount: 0,
          historyFieldCount: 0,
          peOutputExample: "",
          historyOutputExample: "",
          mainOutputExample: "",
        };
      }
      const json = JSON.parse(await fs.readFile(tplPath, "utf-8"));
      return {
        key,
        displayName: templateDisplayMap[key] ?? key,
        exists: true,
        linkedCcs: templateToCcs[key] ?? [],
        peFieldCount: (json.pe?.fields?.length as number) ?? 0,
        historyFieldCount: (json.history?.fields?.length as number) ?? 0,
        peOutputExample: (json.pe?.output_example as string) ?? "",
        historyOutputExample: (json.history?.output_example as string) ?? "",
        mainOutputExample: (json.output_example as string) ?? "",
      };
    })
  );

  const topLevel = items.filter((i) => !i.aliasOf);
  const stats = {
    totalCc: topLevel.length,
    withGuide: topLevel.filter((i) => i.guides.some((g) => g.exists)).length,
    withTemplate: topLevel.filter((i) => i.templates.some((t) => t.exists))
      .length,
    aliasCount: items.filter((i) => i.aliasOf).length,
  };

  return { items, guideItems, templateItems, pendingMatches, stats };
}
