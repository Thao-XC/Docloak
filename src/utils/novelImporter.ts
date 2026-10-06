import {
  ImportedNovelPayload,
  ExtractedDocument,
  DocumentSection,
  NovelBlock,
  ChapterReviewItem,
} from "../types";

export interface NovelImportValidationResult {
  valid: boolean;
  error?: string;
  payload?: ImportedNovelPayload;
}

export interface NovelImportResult {
  document: ExtractedDocument;
  summary: string;
  importedCount: number;
  skippedCount: number;
}

/**
 * Validates the parsed JSON against the expected schema:
 * {
 *   "schemaVersion": "1.0",
 *   "book": { "title": string, "author": string|null, "language": string|null, "sourceUrl": string },
 *   "chapters": [ ... ]
 * }
 */
export function validateNovelJson(data: unknown): NovelImportValidationResult {
  if (!data || typeof data !== "object") {
    return {
      valid: false,
      error: "Invalid file format: JSON root must be an object.",
    };
  }

  const record = data as Record<string, any>;

  // Check schemaVersion === "1.0"
  if (record.schemaVersion !== "1.0") {
    return {
      valid: false,
      error: `Invalid schemaVersion: expected "1.0", but received ${
        record.schemaVersion !== undefined
          ? `"${record.schemaVersion}"`
          : "undefined (missing schemaVersion)"
      }.`,
    };
  }

  // Check chapters exists and is an array
  if (!record.chapters || !Array.isArray(record.chapters)) {
    return {
      valid: false,
      error: 'Invalid novel format: "chapters" array is missing or not a valid list.',
    };
  }

  // Check book object and title
  if (!record.book || typeof record.book !== "object") {
    return {
      valid: false,
      error: 'Invalid novel format: "book" metadata object is missing.',
    };
  }

  if (typeof record.book.title !== "string" || !record.book.title.trim()) {
    return {
      valid: false,
      error: 'Invalid novel format: "book.title" must be a non-empty string.',
    };
  }

  return {
    valid: true,
    payload: data as ImportedNovelPayload,
  };
}

/**
 * Extracts plain text string representation from a NovelBlock for search, cloaking, and word counting.
 */
export function getBlockPlainText(block: NovelBlock): string {
  if (block.type === "break") {
    return "* * *";
  }

  if (block.runs && block.runs.length > 0) {
    return block.runs.map((r) => r.text || "").join("");
  }

  return block.text || "";
}

/**
 * Pure client-side transformation from imported novel JSON to ExtractedDocument.
 * - Zero Gemini API calls
 * - Filter status === "ok"
 * - Sorted by index
 * - Formats title page, chapters as Heading 1 with page breaks
 * - Formats paragraph, heading (H2), quote, break (* * *), runs (bold/italic)
 */
export function convertNovelToDocument(payload: ImportedNovelPayload): NovelImportResult {
  const { book, chapters } = payload;

  // Filter only status "ok" and sort by index
  const okChapters = chapters
    .filter((ch) => ch && ch.status === "ok")
    .sort((a, b) => (Number(a.index) || 0) - (Number(b.index) || 0));

  const skippedCount = chapters.length - okChapters.length;
  const importedCount = okChapters.length;

  // Exact required format: "<title> by <author>: X chapters imported, Y skipped (locked/failed)."
  const authorDisplay = book.author ? ` by ${book.author}` : "";
  const summary = `${book.title}${authorDisplay}: ${importedCount} chapters imported, ${skippedCount} skipped (locked/failed).`;

  let totalWords = 0;
  const sections: DocumentSection[] = [];
  const chapterReviews: ChapterReviewItem[] = [];

  for (let i = 0; i < okChapters.length; i++) {
    const ch = okChapters[i];
    const chapterTitle = ch.title || `Chapter ${ch.index ?? i + 1}`;
    const blocks: NovelBlock[] = Array.isArray(ch.blocks) ? ch.blocks : [];

    // Extract plain text paragraphs for legacy fallbacks and search
    const paragraphs: string[] = [];
    let chapterCalculatedWords = 0;

    for (const block of blocks) {
      const plain = getBlockPlainText(block);
      if (plain.trim()) {
        const words = plain.trim().split(/\s+/).filter(Boolean).length;
        chapterCalculatedWords += words;
        if (block.type !== "break") {
          paragraphs.push(plain);
        }
      }
    }

    const chapterWordCount = ch.wordCount > 0 ? ch.wordCount : chapterCalculatedWords;
    totalWords += chapterWordCount;

    // Create DocumentSection:
    // Heading 1 for chapter title, pageBreakBefore: true
    sections.push({
      heading: chapterTitle,
      disguiseHeading: `Audit Specification §${i + 1}.0 — Compliance Review`,
      level: 1, // Heading 1
      paragraphs: paragraphs.length > 0 ? paragraphs : ["(Empty chapter content)"],
      disguiseParagraphs: paragraphs.map((p) =>
        p.length > 250 ? p.slice(0, 240) + "..." : p
      ),
      blocks,
      pageBreakBefore: true,
      chapterIndex: ch.index ?? i + 1,
    });

    // Provide a clean chapter review synopsis item for the quick review panel
    const firstParagraph = paragraphs[0] || "";
    const synopsis =
      firstParagraph.length > 220
        ? firstParagraph.slice(0, 217) + "..."
        : firstParagraph || "Chapter narrative begins.";

    chapterReviews.push({
      chapterNumber: ch.index ?? i + 1,
      chapterTitle,
      disguiseChapterTitle: `Compliance Protocol §${i + 1}.0`,
      summary: synopsis,
      disguiseSummary: `System integrity review for ledger sequence ${i + 1}. No unauthorized modifications noted.`,
      fastPacedRecap: synopsis,
      disguiseFastPacedRecap: `Automated transaction verification cycle ${i + 1} passed.`,
      keyPoints: [
        `${chapterWordCount.toLocaleString()} words`,
        `${blocks.length} formatting blocks`,
      ],
    });
  }

  const readingTimeMinutes = Math.max(1, Math.round(totalWords / 220));

  let domain = "imported.novel";
  if (book.sourceUrl) {
    try {
      domain = new URL(book.sourceUrl).hostname;
    } catch {
      domain = book.sourceUrl.replace(/^https?:\/\//, "").split("/")[0] || "imported.novel";
    }
  }

  const document: ExtractedDocument = {
    title: book.title,
    disguiseTitle: `Enterprise Infrastructure & Resource Audit: Complete Volume`,
    subtitle: `${book.author ? `By ${book.author} • ` : ""}Unabridged Edition • ${importedCount} Chapters • Google Doc Professional Mode`,
    disguiseSubtitle: `Global Systems Group • Architecture Specification Rev ${importedCount}.0 • Internal Review Only`,
    author: book.author || undefined,
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    domain,
    sourceUrl: book.sourceUrl || "imported-novel.json",
    executiveSummary: `${book.title}${authorDisplay}. Complete multi-chapter compilation containing ${importedCount} chapters (${totalWords.toLocaleString()} words). Fully formatted in Google Doc Professional Mode with scene breaks, styled blockquotes, formatted runs, and page breaks.`,
    disguiseExecutiveSummary: `Technical infrastructure audit across ${importedCount} operational modules (${totalWords.toLocaleString()} data entries verified). System architecture conforms to enterprise standards with zero critical exceptions reported.`,
    readingTimeMinutes,
    wordCount: totalWords,
    extractedAt: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    sections,
    chapterReviews,
    isNovelContent: true,
    isImportedNovel: true,
    importSummary: summary,
    importedChaptersCount: importedCount,
    skippedChaptersCount: skippedCount,
    novelChapterCount: importedCount,
  };

  return {
    document,
    summary,
    importedCount,
    skippedCount,
  };
}

/**
 * Built-in sample valid novel JSON for instant one-click demonstration
 */
export const SAMPLE_NOVEL_JSON: ImportedNovelPayload = {
  schemaVersion: "1.0",
  book: {
    title: "Shadows Over the Imperial Palace",
    author: "Lin Xiu",
    language: "en",
    sourceUrl: "https://novelarchive.example.org/series/shadows-imperial-palace",
  },
  chapters: [
    {
      index: 1,
      status: "ok",
      title: "Chapter 1: The Midnight Bell",
      wordCount: 320,
      blocks: [
        {
          type: "heading",
          text: "Part I: The Lantern Gate",
        },
        {
          type: "paragraph",
          text: "The bronze clock at the Meridian Gate chimed three times through the damp winter fog. Lin Feng tightened his woolen mantle against the freezing draught whistling between the marble balustrades.",
          runs: [
            { text: "The bronze clock at the Meridian Gate " },
            { text: "chimed three times", bold: true },
            { text: " through the damp winter fog. Lin Feng tightened his woolen mantle against the freezing draught whistling between the marble balustrades." },
          ],
        },
        {
          type: "paragraph",
          text: "Behind him, the heavy cedar doors groaned on their iron hinges. A solitary figure stepped into the corridor, carrying a jade talisman that pulsed with faint, pale luminescence.\n\n\"You should not have returned to the Capital tonight,\" a quiet voice warned.",
          runs: [
            { text: "Behind him, the heavy cedar doors groaned on their iron hinges. A solitary figure stepped into the corridor, carrying a jade talisman that pulsed with faint, pale luminescence.\n\n" },
            { text: "\"You should not have returned to the Capital tonight,\"", italic: true },
            { text: " a quiet voice warned." },
          ],
        },
        {
          type: "quote",
          text: "The records of the Grand Imperial Library do not forgive those who tamper with the lineage seals. Walk with caution.",
        },
        {
          type: "break",
        },
        {
          type: "paragraph",
          text: "Dawn was still hours away, yet the shadow guards had already begun patrolling the northern courtyards. Every cobblestone seemed to whisper ancient secrets of emperors long forgotten.",
        },
      ],
    },
    {
      index: 2,
      status: "ok",
      title: "Chapter 2: Whispers in the Archive",
      wordCount: 360,
      blocks: [
        {
          type: "paragraph",
          text: "Rows of teak shelves stretched into the high darkness of the Forbidden Archives, holding centuries of dynasty chronicles. Dust motes danced in the lone beam of lantern light.",
          runs: [
            { text: "Rows of teak shelves stretched into the high darkness of the Forbidden Archives, holding centuries of dynasty chronicles. " },
            { text: "Dust motes danced in the lone beam of lantern light.", italic: true },
          ],
        },
        {
          type: "heading",
          text: "The Broken Seal",
        },
        {
          type: "paragraph",
          text: "Lin Feng carefully unrolled the scroll marked with the Vermilion Crest. The paper was crisp with age, smelling faintly of dried camphor and old cedar smoke.",
        },
        {
          type: "quote",
          text: "\"Whoever unlocks the Seventh Vault shall inherit both the throne and its eternal curse.\"",
          runs: [
            { text: "\"Whoever unlocks the Seventh Vault shall inherit both the throne and its eternal curse.\"", italic: true, bold: true },
          ],
        },
        {
          type: "break",
        },
        {
          type: "paragraph",
          text: "A sharp click echoed from the adjacent gallery. Someone had slipped past the wards.",
        },
      ],
    },
    {
      index: 3,
      status: "locked",
      title: "Chapter 3: Premium VIP Vault (Locked)",
      wordCount: 0,
      blocks: [],
    },
    {
      index: 4,
      status: "failed",
      title: "Chapter 4: Damaged Segment (Failed)",
      wordCount: 0,
      blocks: [],
    },
    {
      index: 5,
      status: "ok",
      title: "Chapter 5: The Vanguard Awakes",
      wordCount: 290,
      blocks: [
        {
          type: "paragraph",
          text: "By morning, five thousand cavalry had assembled outside the city moat, their black armor catching the cold sunrise. The courier from the northern frontier carried urgent dispatches sealed in red wax.",
        },
        {
          type: "paragraph",
          text: "General Xiao dismounted before the pavilion stairs. \"The courier brings word from the border pass. The scouts have reported unusual movements in the snowy mountains.\"",
          runs: [
            { text: "General Xiao dismounted before the pavilion stairs. " },
            { text: "\"The courier brings word from the border pass. The scouts have reported unusual movements in the snowy mountains.\"", italic: true },
          ],
        },
        {
          type: "break",
        },
        {
          type: "paragraph",
          text: "Lin Feng folded the parchment and met the general's gaze. The quiet days of peace had officially come to an end.",
          runs: [
            { text: "Lin Feng folded the parchment and met the general's gaze. " },
            { text: "The quiet days of peace had officially come to an end.", bold: true },
          ],
        },
      ],
    },
  ],
};
