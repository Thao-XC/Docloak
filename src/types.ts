export interface DocumentSection {
  heading: string;
  disguiseHeading?: string;
  level: number;
  paragraphs: string[];
  disguiseParagraphs?: string[];
  bulletPoints?: string[];
  callout?: string;
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
  fullMarkdown?: string;
  fullHtml?: string;
  isNovelContent?: boolean;
  syntheticReplacements?: SyntheticReplacement[];
  verificationAudit?: VerificationAudit;
}

export type DocStylePreset = "google-doc" | "executive" | "minimalist" | "workplace-disguise";
export type DisguiseTemplate = "corporate-audit" | "tech-spec" | "financial-review" | "legal-memo";
export type FontFamily = "Arial" | "Roboto" | "Georgia" | "Times New Roman";
export type LineSpacing = "1.0" | "1.15" | "1.5" | "2.0";
export type FontSize = "10pt" | "11pt" | "12pt" | "14pt";
export type CloakTab = "preview" | "rules" | "verify";
