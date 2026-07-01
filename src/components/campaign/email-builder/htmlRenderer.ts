import type { EmailSection, GlobalStyles, BlockData, SectionRow } from "./types";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeUrl(url: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (!["http:", "https:", "mailto:"].includes(parsed.protocol)) {
      return "";
    }
    return url;
  } catch {
    // Allow relative URLs and data URIs for images only
    if (url.startsWith("/") || url.startsWith("data:image/")) return url;
    return "";
  }
}

function renderBlockHtml(block: BlockData, globalStyles: GlobalStyles): string {
  const align = block.styles.textAlign || "left";
  const bg = block.styles.backgroundColor ? `background-color:${block.styles.backgroundColor};` : "";
  const pad = block.styles.padding && block.styles.padding !== "0" ? `padding:${block.styles.padding};` : "";
  const fs = block.styles.fontSize || globalStyles.fontSize;
  const color = block.styles.color || globalStyles.textColor;
  const br = parseInt(block.styles.borderRadius || "0") || 0;
  const bw = parseInt(block.styles.border || "0") || 0;
  const bc = block.styles.borderColor || "#dddddd";
  const borderStyle = bw > 0 ? `border:${bw}px solid ${bc};` : "";
  const radiusStyle = br > 0 ? `border-radius:${br}px;overflow:hidden;` : "";
  const fw = block.styles.fontWeight === "bold" ? "font-weight:bold;" : "";
  const fi = block.styles.fontStyle === "italic" ? "font-style:italic;" : "";

  // Split styles: when visual styles exist (bg/border/radius), padding goes on inner div
  const hasVisualStyles = bg || borderStyle || radiusStyle;
  const tdStyle = hasVisualStyles
    ? `font-size:${fs};color:${color};font-family:${globalStyles.fontFamily};text-align:${align};${fw}${fi}`
    : `${pad}font-size:${fs};color:${color};font-family:${globalStyles.fontFamily};text-align:${align};${fw}${fi}`;
  const innerStyle = hasVisualStyles ? `${bg}${borderStyle}${radiusStyle}${pad}` : "";

  function wrapContent(content: string): string {
    if (innerStyle) {
      return `<td style="${tdStyle}"><div style="${innerStyle}">${content}</div></td>`;
    }
    return `<td style="${tdStyle}">${content}</td>`;
  }

  switch (block.type) {
    case "text":
      return wrapContent(`<p style="margin:0;line-height:1.6;">${escapeHtml(block.content.text || "")}</p>`);

    case "heading": {
      const level = block.content.level || 2;
      const sizes: Record<number, string> = { 1: "28px", 2: "24px", 3: "20px", 4: "18px", 5: "16px", 6: "14px" };
      return wrapContent(`<h${level} style="margin:0;font-size:${sizes[level]};color:${globalStyles.headingColor};font-family:${globalStyles.fontFamily};">${escapeHtml(block.content.text || "")}</h${level}>`);
    }

    case "logo": {
      const logoImg = `<img src="${sanitizeUrl(block.content.src || "")}" alt="${escapeHtml(block.content.alt || "Logo")}" style="max-height:60px;height:auto;display:inline-block;" />`;
      const logoInner = block.content.href ? `<a href="${sanitizeUrl(block.content.href || "")}" style="text-decoration:none;">${logoImg}</a>` : logoImg;
      return wrapContent(logoInner);
    }

    case "image":
      return wrapContent(`<img src="${sanitizeUrl(block.content.src || "")}" alt="${escapeHtml(block.content.alt || "")}" style="max-width:100%;height:auto;display:inline-block;" />`);

    case "image-text": {
      const pos = block.content.imagePosition || "left";
      if (pos === "center") {
        return wrapContent(`<img src="${sanitizeUrl(block.content.src || "")}" alt="${escapeHtml(block.content.alt || "")}" style="max-width:100%;height:auto;display:block;margin:0 auto 8px;" /><p style="margin:0;line-height:1.6;font-family:${globalStyles.fontFamily};font-size:${fs};color:${color};">${escapeHtml(block.content.text || "")}</p>`);
      }
      const imgLeft = pos === "left";
      const imgCell = `<td style="width:50%;padding:5px;vertical-align:top;"><img src="${sanitizeUrl(block.content.src || "")}" alt="${escapeHtml(block.content.alt || "")}" style="max-width:100%;height:auto;" /></td>`;
      const textCell = `<td style="width:50%;padding:5px;vertical-align:top;font-family:${globalStyles.fontFamily};font-size:${fs};color:${color};"><p style="margin:0;line-height:1.6;">${escapeHtml(block.content.text || "")}</p></td>`;
      return wrapContent(`<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${imgLeft ? imgCell + textCell : textCell + imgCell}</tr></table>`);
    }

    case "button": {
      const btnBg = block.content.buttonColor || "#1a73e8";
      const btnColor = block.content.buttonTextColor || "#ffffff";
      const href = block.content.href || "#";
      const btnRadius = { square: 0, round: 6, pill: 999 }[block.content.buttonShape || "round"];
      return wrapContent(`<a href="${sanitizeUrl(href)}" style="display:inline-block;background:${btnBg};color:${btnColor};font-weight:600;text-decoration:none;padding:12px 24px;border-radius:${btnRadius}px;font-size:14px;font-family:${globalStyles.fontFamily};">${escapeHtml(block.content.text || "Button")}</a>`);
    }

    case "video": {
      const videoHref = block.content.href || block.content.videoUrl || "#";
      const thumb = block.content.videoThumbnail;
      const videoInner = thumb
        ? `<img src="${sanitizeUrl(thumb)}" alt="Video" style="max-width:100%;height:auto;display:block;" />`
        : `<div style="width:100%;min-height:200px;background:#000;text-align:center;line-height:200px;border-radius:4px;"><span style="color:#fff;font-size:48px;">&#9654;</span></div>`;
      return wrapContent(`<a href="${sanitizeUrl(videoHref)}" style="text-decoration:none;display:inline-block;width:100%;">${videoInner}</a>`);
    }

    case "divider": {
      const divThickness = block.content.dividerThickness || 1;
      const divColor = block.content.dividerColor || "#dddddd";
      return wrapContent(`<hr style="border:0;border-top:${divThickness}px solid ${divColor};margin:0;" />`);
    }

    case "spacer": {
      const spacerH = block.content.spacerHeight || 30;
      return `<td style="${tdStyle}height:${spacerH}px;line-height:${spacerH}px;">&nbsp;</td>`;
    }

    case "social": {
      const links = (block.content.socialLinks || [])
        .filter((l) => l.url)
        .map((l) => `<a href="${sanitizeUrl(l.url)}" style="display:inline-block;margin:0 8px;color:${globalStyles.linkColor};text-decoration:none;font-size:13px;font-family:${globalStyles.fontFamily};">${escapeHtml(l.platform)}</a>`)
        .join("");
      return wrapContent(links || "");
    }

    case "code":
      return wrapContent(block.content.html || "");

    default:
      return wrapContent("");
  }
}

function renderRowHtml(row: SectionRow, globalStyles: GlobalStyles): string {
  if (row.blocks.length === 0) return "";

  const widthPct = Math.floor(100 / row.columns);
  const cells = row.blocks.map((block) => {
    const cellHtml = renderBlockHtml(block, globalStyles);
    return row.columns > 1
      ? cellHtml.replace("<td ", `<td width="${widthPct}%" `)
      : cellHtml;
  }).join("\n");

  return `<tr>${cells}</tr>`;
}

function renderSectionHtml(section: EmailSection, globalStyles: GlobalStyles): string {
  const sectionBg = section.styles.backgroundColor === "transparent" ? "" : (section.styles.backgroundColor || "");
  const rawPad = parseInt(section.styles.padding || "0") || 0;
  const sectionPad = rawPad > 0 ? `${rawPad}px` : "0";

  const rowsHtml = section.rows
    .map((row) => renderRowHtml(row, globalStyles))
    .filter(Boolean)
    .join("\n");

  if (!rowsHtml) return "";

  const bgStyle = sectionBg ? `background-color:${sectionBg};` : "";
  return `<!-- ${section.label.toUpperCase()} -->
<tr>
  <td style="padding:${sectionPad};${bgStyle}">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${rowsHtml}
    </table>
  </td>
</tr>`;
}

/** True if the string looks like a complete HTML document (not a fragment). */
export function isFullHtmlDocument(html: string): boolean {
  return /<!doctype html|<html[\s>]/i.test(html || "");
}

/**
 * If the template is a single "code" block containing a full HTML document
 * (i.e. the user pasted a complete email), return that document untouched so
 * it is rendered/sent exactly as provided. Otherwise null.
 */
export function customDocumentHtml(sections: EmailSection[]): string | null {
  const blocks = sections.flatMap((s) => s.rows.flatMap((r) => r.blocks));
  if (blocks.length === 1 && blocks[0].type === "code") {
    const html = blocks[0].content.html || "";
    if (isFullHtmlDocument(html)) return html;
  }
  return null;
}

/** Email body HTML — gray bg with centered white card containing all sections.
 *  Used for preview modal and dangerouslySetInnerHTML rendering. */
export function renderPreviewHtml(
  sections: EmailSection[],
  globalStyles: GlobalStyles,
): string {
  const custom = customDocumentHtml(sections);
  if (custom) return custom;

  const sectionsHtml = sections
    .map((s) => renderSectionHtml(s, globalStyles))
    .filter(Boolean)
    .join("\n\n");

  return `<div style="font-family:${globalStyles.fontFamily};font-size:${globalStyles.fontSize};margin:0;padding:0;background:${globalStyles.backgroundColor};">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${globalStyles.backgroundColor};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="${globalStyles.contentWidth}" cellpadding="0" cellspacing="0" border="0" style="max-width:${globalStyles.contentWidth};width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
${sectionsHtml}
        </table>
      </td>
    </tr>
  </table>
</div>`;
}

/** Full HTML document — for Code tab export, DB storage, and actual email sending.
 *  Same gray bg + centered white card structure. */
export function renderFullHtml(
  sections: EmailSection[],
  globalStyles: GlobalStyles,
  subject: string,
  preheader: string,
): string {
  const custom = customDocumentHtml(sections);
  if (custom) return custom;

  const sectionsHtml = sections
    .map((s) => renderSectionHtml(s, globalStyles))
    .filter(Boolean)
    .join("\n\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
  <!--[if mso]>
  <style>table{border-collapse:collapse;}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${globalStyles.backgroundColor};font-family:${globalStyles.fontFamily};font-size:${globalStyles.fontSize};color:${globalStyles.textColor};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${globalStyles.backgroundColor};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="${globalStyles.contentWidth}" cellpadding="0" cellspacing="0" border="0" style="max-width:${globalStyles.contentWidth};width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
${sectionsHtml}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
