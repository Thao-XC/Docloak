import { ExtractedDocument, NovelBlock } from "../types";

function renderBlockToHtml(block: NovelBlock): string {
  if (block.type === "break") {
    return `<p style="text-align: center; margin: 24px 0; font-family: Georgia, serif; font-size: 14pt; letter-spacing: 0.5em; color: #5f6368;">* * *</p>`;
  }

  let innerHtml = "";
  if (block.runs && block.runs.length > 0) {
    innerHtml = block.runs
      .map((r) => {
        let text = escapeHtml(r.text || "").replace(/\n/g, "<br/>");
        if (r.bold) text = `<strong>${text}</strong>`;
        if (r.italic) text = `<em>${text}</em>`;
        return text;
      })
      .join("");
  } else {
    innerHtml = escapeHtml(block.text || "").replace(/\n/g, "<br/>");
  }

  if (block.type === "heading") {
    return `<h2 style="font-size: 14pt; font-weight: bold; color: #202124; margin-top: 24px; margin-bottom: 8px;">${innerHtml}</h2>`;
  }
  if (block.type === "quote") {
    return `<blockquote style="border-left: 3px solid #1a73e8; margin: 16px 0; padding: 10px 18px; background-color: #f8f9fa; color: #494c4e; font-style: italic;">${innerHtml}</blockquote>`;
  }
  // Default paragraph
  return `<p style="margin-top: 0; margin-bottom: 12px; text-align: justify; line-height: 1.6;">${innerHtml}</p>`;
}

/**
 * Builds standard Google Docs compatible HTML with styling
 */
export function buildDocumentHtml(
  doc: ExtractedDocument,
  fontFamily: string = "Arial",
  fontSize: string = "11pt",
  isDisguised: boolean = false,
  paragraphIndent: boolean = false
): string {
  const fontCss =
    fontFamily === "Georgia"
      ? "font-family: Georgia, serif;"
      : fontFamily === "Times New Roman"
      ? "font-family: 'Times New Roman', serif;"
      : fontFamily === "Roboto"
      ? "font-family: 'Roboto', sans-serif;"
      : "font-family: Arial, Helvetica, sans-serif;";

  const activeTitle = isDisguised && doc.disguiseTitle ? doc.disguiseTitle : doc.title;
  const activeSubtitle = isDisguised && doc.disguiseSubtitle ? doc.disguiseSubtitle : doc.subtitle;
  const activeSummary = isDisguised && doc.disguiseExecutiveSummary ? doc.disguiseExecutiveSummary : doc.executiveSummary;
  const indentCss = paragraphIndent ? "text-indent: 0.5in;" : "";

  return `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>${escapeHtml(activeTitle)}</title>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
  @page WordSection1 {
    size: 8.5in 11.0in;
    margin: 1.0in 1.0in 1.0in 1.0in;
    mso-header-margin: 0.5in;
    mso-footer-margin: 0.5in;
  }
  div.WordSection1 {
    page: WordSection1;
  }
  body {
    ${fontCss}
    font-size: ${fontSize};
    line-height: 1.5;
    color: #202124;
    max-width: 800px;
    margin: 40px auto;
    padding: 20px;
  }
  h1 {
    font-size: 22pt;
    font-weight: 400;
    color: #1a73e8;
    margin-top: 0;
    margin-bottom: 8px;
    line-height: 1.2;
  }
  .byline {
    font-size: 10pt;
    color: #5f6368;
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 1px solid #dadce0;
  }
  .summary-box {
    background-color: #f1f3f4;
    border-left: 4px solid #1a73e8;
    padding: 12px 16px;
    margin-bottom: 24px;
    font-style: italic;
    color: #3c4043;
  }
  h2 {
    font-size: 14pt;
    font-weight: 500;
    color: #202124;
    margin-top: 24px;
    margin-bottom: 10px;
    border-bottom: 1px solid #e8eaed;
    padding-bottom: 4px;
  }
  p {
    margin-top: 0;
    margin-bottom: 12px;
    text-align: justify;
    ${indentCss}
  }
  ul, ol {
    margin-top: 6px;
    margin-bottom: 14px;
    padding-left: 28px;
  }
  li {
    margin-bottom: 6px;
  }
  blockquote {
    border-left: 3px solid #1a73e8;
    margin: 16px 0;
    padding: 8px 16px;
    background-color: #f8f9fa;
    color: #494c4e;
  }
  .footer {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid #dadce0;
    font-size: 9pt;
    color: #70757a;
  }
</style>
</head>
<body>
<div class="WordSection1">
  ${
    doc.isImportedNovel
      ? `
    <!-- Novel Title Page -->
    <div class="title-page" style="page-break-after: always; text-align: center; padding: 120px 20px 80px 20px;">
      <h1 style="font-size: 32pt; font-weight: bold; color: #1a73e8; margin-bottom: 24px; line-height: 1.2;">${escapeHtml(activeTitle)}</h1>
      ${doc.author ? `<p style="font-size: 16pt; color: #5f6368; margin-top: 16px; margin-bottom: 32px;">By <strong>${escapeHtml(doc.author)}</strong></p>` : ""}
      <p style="font-size: 11pt; color: #80868b; margin-top: 48px; font-family: monospace;">Google Doc Professional Edition • ${doc.sections.length} Chapters</p>
    </div>
  `
      : `
    <h1>${escapeHtml(activeTitle)}</h1>
    <div class="byline">
      ${
        isDisguised
          ? `<span>${escapeHtml(activeSubtitle || "Enterprise Corporate Document • Internal Eyes Only")}</span>`
          : `
        ${doc.author ? `<span>By <strong>${escapeHtml(doc.author)}</strong></span> • ` : ""}
        ${doc.date ? `<span>Published: ${escapeHtml(doc.date)}</span> • ` : ""}
        ${doc.domain ? `<span>Source: ${escapeHtml(doc.domain)}</span>` : ""}
      `
      }
    </div>

    ${
      activeSummary
        ? `<div class="summary-box">
            <strong>${isDisguised ? "Executive Brief:" : "Executive Summary:"}</strong> ${escapeHtml(activeSummary)}
          </div>`
        : ""
    }
  `
  }

  ${doc.sections
    .map((sec, sIdx) => {
      const heading = isDisguised && sec.disguiseHeading ? sec.disguiseHeading : sec.heading;
      const paras = isDisguised && sec.disguiseParagraphs ? sec.disguiseParagraphs : sec.paragraphs;
      const isNewPage = doc.isImportedNovel || sec.pageBreakBefore || sIdx > 0;
      const pageBreakStyle = isNewPage ? "page-break-before: always; margin-top: 36px;" : "";

      if (sec.blocks && sec.blocks.length > 0 && !isDisguised) {
        return `
    <div class="chapter-container" style="${pageBreakStyle}">
      <h1 style="font-size: 20pt; font-weight: bold; color: #202124; margin-top: 0; margin-bottom: 16px; border-bottom: 2px solid #dadce0; padding-bottom: 8px;">${escapeHtml(heading)}</h1>
      ${sec.blocks.map(renderBlockToHtml).join("")}
    </div>
        `;
      }

      return `
    <div class="section-container" style="${pageBreakStyle}">
      <h2>${escapeHtml(heading)}</h2>
      ${paras.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
      ${
        sec.bulletPoints && sec.bulletPoints.length > 0
          ? `<ul>${sec.bulletPoints.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`
          : ""
      }
      ${sec.callout ? `<blockquote>${escapeHtml(sec.callout)}</blockquote>` : ""}
    </div>
  `;
    })
    .join("")}

  <div class="footer">
    ${
      isDisguised
        ? "Document classification: Highly Confidential Corporate Review. Formatted for Google Docs."
        : `Document formatted in Google Doc Professional Mode • ${doc.sections.length} Chapters • ${escapeHtml(doc.extractedAt)}.`
    }
  </div>
</div>
</body>
</html>
  `.trim();
}

/**
 * Copies formatted Rich Text into clipboard so pasting in Google Docs (docs.google.com)
 * preserves formatting (H1, H2, fonts, bolding, blockquotes, bullets).
 */
export async function copyForGoogleDocs(
  doc: ExtractedDocument,
  fontFamily = "Arial",
  isDisguised: boolean = false,
  paragraphIndent: boolean = false
): Promise<boolean> {
  const htmlContent = buildDocumentHtml(doc, fontFamily, "11pt", isDisguised, paragraphIndent);
  const activeTitle = isDisguised && doc.disguiseTitle ? doc.disguiseTitle : doc.title;
  const plainText =
    `${activeTitle}\n\n` +
    (isDisguised && doc.disguiseExecutiveSummary ? `${doc.disguiseExecutiveSummary}\n\n` : `${doc.executiveSummary || ""}\n\n`) +
    doc.sections
      .map(
        (s) =>
          `${isDisguised && s.disguiseHeading ? s.disguiseHeading : s.heading}\n${s.paragraphs.join("\n\n")}`
      )
      .join("\n\n");

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const htmlBlob = new Blob([htmlContent], { type: "text/html" });
      const textBlob = new Blob([plainText], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": textBlob,
        }),
      ]);
      return true;
    } else {
      await navigator.clipboard.writeText(plainText);
      return true;
    }
  } catch (err) {
    console.warn("ClipboardItem write failed, falling back to writeText:", err);
    try {
      await navigator.clipboard.writeText(plainText);
      return true;
    } catch (fallbackErr) {
      console.error("Clipboard copy failed:", fallbackErr);
      return false;
    }
  }
}

/**
 * Generates and downloads a Word / Google Docs compatible (.doc) file
 */
export function downloadGoogleDocFile(
  doc: ExtractedDocument,
  fontFamily = "Arial",
  isDisguised = false,
  paragraphIndent = false
) {
  const html = buildDocumentHtml(doc, fontFamily, "11pt", isDisguised, paragraphIndent);
  const blob = new Blob(["\ufeff" + html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const baseTitle = (isDisguised && doc.disguiseTitle ? doc.disguiseTitle : doc.title) || "document";
  const cleanTitle = baseTitle.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
  link.href = url;
  link.download = `${cleanTitle}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads document as clean Markdown file
 */
export function downloadMarkdownFile(doc: ExtractedDocument) {
  const md = doc.fullMarkdown || `# ${doc.title}\n\n${doc.sections.map(s => `## ${s.heading}\n\n${s.paragraphs.join("\n\n")}`).join("\n\n")}`;
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const cleanTitle = (doc.title || "document").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
  link.href = url;
  link.download = `${cleanTitle}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads document as clean plain text (.txt) file
 */
export function downloadTextFile(doc: ExtractedDocument, isDisguised = false) {
  const title = isDisguised && doc.disguiseTitle ? doc.disguiseTitle : doc.title;
  const subtitle = isDisguised && doc.disguiseSubtitle ? doc.disguiseSubtitle : doc.subtitle;
  const summary = isDisguised && doc.disguiseExecutiveSummary ? doc.disguiseExecutiveSummary : doc.executiveSummary;

  let text = `${title}\n`;
  if (subtitle) text += `${subtitle}\n`;
  text += `\n${"=".repeat(60)}\n\n`;
  if (summary) text += `EXECUTIVE SUMMARY:\n${summary}\n\n`;

  doc.sections.forEach((sec, idx) => {
    const heading = isDisguised && sec.disguiseHeading ? sec.disguiseHeading : sec.heading;
    text += `${heading.toUpperCase()}\n${"-".repeat(heading.length)}\n`;
    const paras = isDisguised && sec.disguiseParagraphs ? sec.disguiseParagraphs : sec.paragraphs;
    paras.forEach((p) => {
      text += `${p}\n\n`;
    });
    if (sec.bulletPoints && sec.bulletPoints.length > 0) {
      sec.bulletPoints.forEach((b) => {
        text += `• ${b}\n`;
      });
      text += "\n";
    }
  });

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const cleanTitle = (title || "document").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
  link.href = url;
  link.download = `${cleanTitle}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers native high-resolution print dialog which allows saving as PDF
 */
export function printAsPdf() {
  window.print();
}

function escapeHtml(text?: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
