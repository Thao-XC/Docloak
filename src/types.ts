export interface NovelRun {
  text: string;
  italic?: boolean;
  bold?: boolean;
}

export interface NovelBlock {
  type: "paragraph" | "heading" | "quote" | "break";
  text?: string;
  runs?: NovelRun[];
}

export interface NovelChapter {
  index: number;
  status: "ok" | "locked" | "empty" | "failed";
  title: string;
  wordCount: number;
  blocks: NovelBlock[];
}

export interface NovelBookMetadata {
  title: string;
  author: string | null;
  language: string | null;
  sourceUrl: string;
}

export interface ImportedNovelPayload {
  schemaVersion: "1.0" | string;
  book: NovelBookMetadata;
  chapters: NovelChapter[];
}

export interface DocumentSection {
  heading: string;
  disguiseHeading?: string;
  level: number;
  paragraphs: string[];
  disguiseParagraphs?: string[];
  bulletPoints?: string[];
  callout?: string;
  isSensitive?: boolean;
  confidentialClassification?: string;
  pageBreakBefore?: boolean;
  chapterIndex?: number;
  blocks?: NovelBlock[];
}

export type CloakCategory = "Name" | "Organization" | "Financial" | "Contact" | "Identifier" | "Novel/Fiction" | "Custom";

export interface SyntheticReplacement {
  id: string;
  original: string;
  synthetic: string;
  category: CloakCategory;
  count: number;
  ruleId?: string;
}

export interface VerificationAuditItem {
  id: string;
  category: string;
  status: "pass" | "warn" | "fail";
  title: string;
  detail: string;
  metric?: string;
}

export interface VerificationAudit {
  safetyScore: number; // 0 - 100
  isSafe: boolean;
  zeroImagesConfirmed: boolean;
  scriptsStripped: boolean;
  piiMaskedCount: number;
  unmaskedRisksCount: number;
  items: VerificationAuditItem[];
  verifiedAt: string;
}

export interface CloakRule {
  id: string;
  name: string;
  category: CloakCategory;
  enabled: boolean;
  description: string;
  targetTerm?: string;
  syntheticValue: string;
  isCustom?: boolean;
}

export interface ChapterReviewItem {
  chapterNumber?: number | string;
  chapterTitle: string;
  disguiseChapterTitle?: string;
  summary: string;
  disguiseSummary?: string;
  keyPoints?: string[];
  disguiseKeyPoints?: string[];
  fastPacedRecap?: string; // 2x speed "film review" style storyline recap
  disguiseFastPacedRecap?: string; // 2x speed high-velocity corporate briefing
  cliffhanger?: string; // Major plot twist / emotional turning point
  isSensitive?: boolean; // True for 18+ / intimate / sensitive narrative content
  confidentialClassification?: string; // e.g. "CONFIDENTIAL INFORMATION // RESTRICTED ACCESS"
}

export interface NovelResumeInfo {
  mode: "toc" | "sequential";
  hasMore: boolean;
  /** Send this URL (+ chapterStart / numberOffset) to continue after the last loaded chapter. */
  url?: string;
  chapterStart?: number;
  numberOffset?: number;
  firstChapterNumber: number;
  lastChapterNumber: number;
  totalChaptersFound?: number;
  failedChapters?: Array<{ chapterNumber: number; title: string; url: string }>;
  /** Chapters the site only shows to logged-in subscribers/members. */
  lockedChapters?: Array<{ chapterNumber: number; title: string; url: string }>;
  originalUrl?: string;
}

export interface ExtractedDocument {
  title: string;
  disguiseTitle?: string;
  subtitle?: string;
  disguiseSubtitle?: string;
  author?: string;
  date?: string;
  domain?: string;
  sourceUrl: string;
  executiveSummary?: string;
  disguiseExecutiveSummary?: string;
  readingTimeMinutes: number;
  wordCount: number;
  extractedAt: string;
  sections: DocumentSection[];
  chapterReviews?: ChapterReviewItem[];
  fullMarkdown?: string;
  fullHtml?: string;
  isNovelContent?: boolean;
  isImportedNovel?: boolean;
  importSummary?: string;
  importedChaptersCount?: number;
  skippedChaptersCount?: number;
  isCrawledSite?: boolean;
  isCrawledNovel?: boolean;
  novelChapterCount?: number;
  crawledPagesCount?: number;
  crawledUrls?: string[];
  novelResume?: NovelResumeInfo;
  syntheticReplacements?: SyntheticReplacement[];
  verificationAudit?: VerificationAudit;
}

export type DocStylePreset = "google-doc" | "executive" | "minimalist" | "workplace-disguise";
export type DisguiseTemplate = "corporate-audit" | "tech-spec" | "financial-review" | "legal-memo";
export type FontFamily = "Arial" | "Roboto" | "Georgia" | "Times New Roman";
export type LineSpacing = "1.0" | "1.15" | "1.5" | "2.0";
export type FontSize = "10pt" | "11pt" | "12pt" | "14pt";
export type CloakTab = "preview" | "rules" | "verify";

export interface CrawlFilterOptions {
  crawlMode?: boolean;
  novelMode?: boolean;
  singlePageOnly?: boolean;
  maxPages?: number;
  maxChapters?: number;
  excludePatterns?: string[];
  includePatterns?: string[];
  strictPathOnly?: boolean;
  selectedUrls?: string[];
  chapterStart?: number;
  chapterEnd?: number;
}

export interface DiscoveredPageItem {
  id: string;
  url: string;
  title: string;
  chapterNumber?: number;
  isNotice?: boolean;
  selected: boolean;
}
