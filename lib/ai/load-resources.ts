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

export function loadHpiHints(templateKey: string): string | null {
  const templateData = loadTemplate(templateKey) as Record<string, unknown>;
  return (templateData.hpi_hints as string) ?? null;
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

export function loadExamples(templateKey: string): Examples {
  const filePath = path.join(TEMPLATES_DIR, templateKey, "examples.md");
  const empty: Examples = { hpi: [], template: [], history: [], pe: [] };

  if (!fs.existsSync(filePath)) {
    return empty;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);

  const result: Examples = { hpi: [], template: [], history: [], pe: [] };
  const bucketOrder: (keyof Examples)[] = ["hpi", "template", "history", "pe"];

  let caseCount = 0;
  let insideCase = false;
  let insideBlock = false;
  let blockIndex = 0;
  let buffer: string[] = [];

  const flushBlock = () => {
    if (insideBlock && blockIndex < bucketOrder.length) {
      const text = buffer.join("\n").trim();
      if (text) {
        result[bucketOrder[blockIndex]].push(text);
      }
    }
    buffer = [];
  };

  for (const line of lines) {
    if (/^###\s+\d+\./.test(line)) {
      if (insideBlock) {
        flushBlock();
        insideBlock = false;
      }
      caseCount++;
      if (caseCount > MAX_EXAMPLES) {
        insideCase = false;
        break;
      }
      insideCase = true;
      blockIndex = 0;
      continue;
    }

    if (!insideCase) continue;

    if (/^```/.test(line)) {
      if (!insideBlock) {
        insideBlock = true;
        buffer = [];
      } else {
        flushBlock();
        insideBlock = false;
        blockIndex++;
      }
      continue;
    }

    if (insideBlock) {
      buffer.push(line);
    }
  }

  if (insideBlock) {
    flushBlock();
  }

  return result;
}
