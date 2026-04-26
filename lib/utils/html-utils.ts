function stripHtmlWrapper(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>/i, "")
    .replace(/<!DOCTYPE[^>]*>/i, "")
    .replace(/<html[^>]*>/i, "")
    .replace(/<\/html>/i, "")
    .replace(/<body[^>]*>/i, "")
    .replace(/<\/body>/i, "")
    .trim();
}

function removeBackgroundFromStyleContent(styleContent: string): string {
  // 세미콜론으로 개별 선언을 분리하여 처리
  const declarations = styleContent.split(";");
  const filtered = declarations.filter((decl) => {
    const prop = decl.split(":")[0].trim().toLowerCase();
    // background-color, background shorthand 제거 (background-image 등 개별 속성은 유지)
    if (prop === "background-color") return false;
    if (prop === "background") return false;
    return true;
  });
  return filtered.join(";").replace(/;+$/, "").trim();
}

function stripBackgroundColors(html: string): string {
  let result = html.replace(
    /(<[^>]+\bstyle\s*=\s*)(["'])([^"']*)\2/gi,
    (_match, prefix, quote, styleContent) => {
      const cleaned = removeBackgroundFromStyleContent(styleContent);
      if (!cleaned) return "";
      return `${prefix}${quote}${cleaned}${quote}`;
    }
  );
  // 빈 style 속성 제거
  result = result.replace(/\s*style\s*=\s*["']\s*["']/gi, "");
  return result;
}

// HWP→HTML 변환 시 font-weight:"bold" 처럼 CSS 값에 따옴표가 붙는 버그를 수정
function fixQuotedCssValues(html: string): string {
  return html.replace(
    /\b(font-weight|font-style|text-decoration|font-variant)\s*:\s*"([^"]+)"/gi,
    "$1:$2"
  );
}

function processGuideHtml(html: string): string {
  return fixQuotedCssValues(
    stripBackgroundColors(stripHtmlWrapper(html))
  ).trim();
}

// HTML에서 로컬 파일 경로를 가진 img src의 파일명 목록 반환 (data URL, http URL 제외)
function extractImgFilenames(html: string): string[] {
  const matches = [
    ...html.matchAll(/<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi),
  ];
  const filenames = new Set<string>();
  for (const match of matches) {
    const src = match[1];
    if (src.startsWith("data:") || /^https?:\/\//i.test(src)) continue;
    const filename = src.split(/[/\\]/).pop();
    if (filename) filenames.add(filename);
  }
  return [...filenames];
}

// Canvas API로 이미지를 maxPx 이하로 리사이즈 후 base64 data URL 반환 (클라이언트 전용)
async function resizeImageToBase64(
  file: File,
  maxPx: number = 1200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width: w, height: h } = img;
      if (w > maxPx || h > maxPx) {
        if (w >= h) {
          h = Math.round((h * maxPx) / w);
          w = maxPx;
        } else {
          w = Math.round((w * maxPx) / h);
          h = maxPx;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL(file.type || "image/jpeg", 0.9));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`${file.name} 이미지 로드 실패`));
    };
    img.src = url;
  });
}

// HTML의 img src 로컬 경로를 imageMap(파일명 → base64)으로 교체
function replaceImgSrcs(html: string, imageMap: Map<string, string>): string {
  return html.replace(
    /<img([^>]*)src\s*=\s*(["'])([^"']+)\2([^>]*)>/gi,
    (_match, before, quote, src, after) => {
      const filename = src.split(/[/\\]/).pop() ?? "";
      const base64 = imageMap.get(filename);
      if (base64) return `<img${before}src=${quote}${base64}${quote}${after}>`;
      return _match;
    }
  );
}

export {
  processGuideHtml,
  stripHtmlWrapper,
  stripBackgroundColors,
  extractImgFilenames,
  resizeImageToBase64,
  replaceImgSrcs,
};
