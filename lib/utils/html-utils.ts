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

function processGuideHtml(html: string): string {
  return stripBackgroundColors(stripHtmlWrapper(html)).trim();
}

export { processGuideHtml, stripHtmlWrapper, stripBackgroundColors };
