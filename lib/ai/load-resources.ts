import path from "path";
import fs from "fs";
import templateListJson from "@/lib/ai/resources/template-list.json";

export interface TemplateListEntry {
  templateKey: string;
  displayName: string;
}

export function loadTemplateList(): TemplateListEntry[] {
  return templateListJson as TemplateListEntry[];
}

const GUIDES_DIR = path.join(process.cwd(), "ai-docs", "guides");
const TEMPLATES_DIR = path.join(process.cwd(), "ai-docs", "templates");

export function loadSchema(templateKey: string): object {
  const schemaPath = path.join(TEMPLATES_DIR, templateKey, "schema.json");
  if (fs.existsSync(schemaPath)) {
    return JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  }
  // generic fallback
  return JSON.parse(
    fs.readFileSync(
      path.join(TEMPLATES_DIR, "_generic", "schema.json"),
      "utf-8"
    )
  );
}

export function loadTemplate(templateKey: string): object {
  const filePath = path.join(TEMPLATES_DIR, templateKey, "template.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function loadPe(templateKey: string): object | null {
  const templateData = loadTemplate(templateKey) as Record<string, unknown>;
  return (templateData.pe as object) ?? null;
}

export function loadHistory(templateKey: string): object | null {
  const templateData = loadTemplate(templateKey) as Record<string, unknown>;
  return (templateData.history as object) ?? null;
}

export function loadGuide(guideKey: string): string {
  const htmlPath = path.join(GUIDES_DIR, guideKey, "guide.html");
  if (fs.existsSync(htmlPath)) {
    return fs.readFileSync(htmlPath, "utf-8");
  }
  return "";
}

export interface Examples {
  hpi: string[];
  template: string[];
  history: string[];
  pe: string[];
}

const MAX_EXAMPLES = 10;

function matchSectionBucket(sectionName: string): keyof Examples | null {
  const name = sectionName.trim();
  if (name.startsWith("HPI")) return "hpi";
  if (name.startsWith("P.I template") || name.startsWith("P.I. template"))
    return "template";
  if (name.startsWith("History")) return "history";
  if (name.startsWith("P/E")) return "pe";
  return null;
}

export function loadExamples(templateKey: string): Examples {
  const filePath = path.join(TEMPLATES_DIR, templateKey, "examples.md");
  const empty: Examples = { hpi: [], template: [], history: [], pe: [] };

  if (!fs.existsSync(filePath)) {
    return empty;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);

  const result: Examples = { hpi: [], template: [], history: [], pe: [] };

  let caseCount = 0;
  let insideCase = false;
  let currentBucket: keyof Examples | null = null;
  let buffer: string[] = [];

  const flushSection = () => {
    if (currentBucket) {
      const text = buffer.join("\n").trim();
      if (text) {
        result[currentBucket].push(text);
      }
    }
    buffer = [];
    currentBucket = null;
  };

  for (const line of lines) {
    if (/^# Case\s+\d+/.test(line)) {
      flushSection();
      caseCount++;
      if (caseCount > MAX_EXAMPLES) {
        insideCase = false;
        break;
      }
      insideCase = true;
      continue;
    }

    if (!insideCase) continue;

    const sectionMatch = /^##\s+(.+)$/.exec(line);
    if (sectionMatch) {
      flushSection();
      currentBucket = matchSectionBucket(sectionMatch[1]);
      continue;
    }

    if (currentBucket) {
      buffer.push(line);
    }
  }
  flushSection();

  return result;
}
