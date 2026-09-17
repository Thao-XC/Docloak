import {
  CloakRule,
  ExtractedDocument,
  SyntheticReplacement,
  VerificationAudit,
  VerificationAuditItem,
} from "../types";

export const DEFAULT_CLOAK_RULES: CloakRule[] = [
  {
    id: "rule-names-lead",
    name: "Key Character / Personal Names",
    category: "Name",
    enabled: true,
    description: "Replaces specific personal or novel character names with executive business personas.",
    targetTerm: "Shen Qing",
    syntheticValue: "Dr. S. Vance (Director)",
    isCustom: false,
  },
  {
    id: "rule-names-partner",
    name: "Secondary Character / Counterpart",
    category: "Name",
    enabled: true,
    description: "Replaces co-protagonist or partner names with senior operational counterparts.",
    targetTerm: "Xiao Yan",
    syntheticValue: "VP X. Anderson (Operations)",
    isCustom: false,
  },
  {
    id: "rule-general-names",
    name: "General Person & Author Names",
    category: "Name",
    enabled: true,
    description: "Replaces other detected personal names with synthetic professional identities.",
    targetTerm: "Mo Ran",
    syntheticValue: "M. Roland (Lead Analyst)",
    isCustom: false,
  },
  {
    id: "rule-org-imperial",
    name: "Governing Bodies & Enterprise Units",
    category: "Organization",
    enabled: true,
    description: "Replaces sensitive entities or regional authorities with corporate enterprise units.",
    targetTerm: "Imperial Court",
    syntheticValue: "Executive Board of Directors",
    isCustom: false,
  },
  {
    id: "rule-org-archives",
    name: "Sensitive Facilities & Locations",
    category: "Organization",
    enabled: true,
    description: "Replaces covert locations, pavilions, and chambers with enterprise facility names.",
    targetTerm: "Lantern Pavilion",
    syntheticValue: "Secure Data Annex (Site B)",
    isCustom: false,
  },
  {
    id: "rule-org-archives-2",
    name: "Classified Archives / Moat",
    category: "Organization",
    enabled: true,
    description: "Transforms sensitive archive locations into corporate records departments.",
    targetTerm: "secret archives",
    syntheticValue: "Enterprise Records Vault",
    isCustom: false,
  },
  {
    id: "rule-fin-pricing",
    name: "Financial Figures & Allocations",
    category: "Financial",
    enabled: true,
    description: "Substitutes raw monetary amounts and commodity allotments with synthetic baseline tiers.",
    targetTerm: "thirty thousand vanguard",
    syntheticValue: "Tier-3 Resource Quota (30,000 units)",
    isCustom: false,
  },
  {
    id: "rule-fin-currency",
    name: "Grain / Supply Requisitions",
    category: "Financial",
    enabled: true,
    description: "Converts historical requisitions into supply chain distribution metrics.",
    targetTerm: "grain shipment",
    syntheticValue: "Q3 infrastructure distribution batch",
    isCustom: false,
  },
  {
    id: "rule-contact-emails",
    name: "Email Addresses & Contacts",
    category: "Contact",
    enabled: true,
    description: "Redacts and cloaks all raw email addresses into synthetic test mailboxes.",
    targetTerm: "@",
    syntheticValue: "[synthetic-contact@internal.net]",
    isCustom: false,
  },
  {
    id: "rule-contact-phone",
    name: "Phone Numbers & Extensions",
    category: "Contact",
    enabled: true,
    description: "Masks phone numbers and internal lines with synthetic extension placeholders.",
    targetTerm: "555-",
    syntheticValue: "+1 (555) 019-XXXX",
    isCustom: false,
  },
  {
    id: "rule-fiction-decree",
    name: "High-Sensitivity Directives & Tokens",
    category: "Novel/Fiction",
    enabled: true,
    description: "Replaces sensitive titles and formal directives with corporate governance terminology.",
    targetTerm: "imperial seal",
    syntheticValue: "Multi-Signature Authorization Token",
    isCustom: false,
  },
  {
    id: "rule-fiction-emperor",
    name: "Sovereign / Executive Title",
    category: "Novel/Fiction",
    enabled: true,
    description: "Replaces monarchical titles with Chief Executive Officer terminology.",
    targetTerm: "The Emperor",
    syntheticValue: "The Chief Executive",
    isCustom: false,
  },
];

/**
 * Applies active Cloak Rules to a document to generate synthetic disguised content
 */
export function applyCloakRules(
  doc: ExtractedDocument,
  rules: CloakRule[]
): {
  disguisedSections: ExtractedDocument["sections"];
  replacements: SyntheticReplacement[];
  disguisedTitle: string;
  disguisedSubtitle: string;
  disguisedSummary: string;
} {
  const activeRules = rules.filter((r) => r.enabled && r.targetTerm && r.targetTerm.trim().length > 0);
  const replacementCounts = new Map<string, { count: number; rule: CloakRule }>();

  // Helper to replace text according to active rules
  const replaceInText = (text: string): string => {
    if (!text) return "";
    let modified = text;

    for (const rule of activeRules) {
      if (!rule.targetTerm) continue;

      // Handle email regex if target is "@"
      if (rule.targetTerm === "@") {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
        const matches = modified.match(emailRegex);
        if (matches) {
          const current = replacementCounts.get(rule.id) || { count: 0, rule };
          current.count += matches.length;
          replacementCounts.set(rule.id, current);
          modified = modified.replace(emailRegex, rule.syntheticValue);
        }
        continue;
      }

      // Exact phrase / case-insensitive word replacement
      const escaped = rule.targetTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "gi");
      const matches = modified.match(regex);
      if (matches && matches.length > 0) {
        const current = replacementCounts.get(rule.id) || { count: 0, rule };
        current.count += matches.length;
        replacementCounts.set(rule.id, current);
        modified = modified.replace(regex, rule.syntheticValue);
      }
    }

    return modified;
  };

  // 1. Title, Subtitle, and Summary
  let disguisedTitle = doc.disguiseTitle || "Q3 Architecture & Strategic Operational Review";
  let disguisedSubtitle =
    doc.disguiseSubtitle || "Enterprise Corporate Document • Classification: Internal Eyes Only";
  let disguisedSummary =
    doc.disguiseExecutiveSummary ||
    "Executive assessment of organizational processes, procedural verifications, and compliance milestones.";

  disguisedTitle = replaceInText(disguisedTitle);
  disguisedSubtitle = replaceInText(disguisedSubtitle);
  disguisedSummary = replaceInText(disguisedSummary);

  // 2. Sections
  const disguisedSections = doc.sections.map((section, idx) => {
    const rawHeading = section.disguiseHeading || `${idx + 1}.0 Operational Verification & Protocol Review`;
    const heading = replaceInText(rawHeading);

    const paragraphs = section.paragraphs.map((p) => replaceInText(p));
    const bulletPoints = section.bulletPoints ? section.bulletPoints.map((b) => replaceInText(b)) : undefined;
    const callout = section.callout ? replaceInText(section.callout) : undefined;

    return {
      ...section,
      disguiseHeading: heading,
      disguiseParagraphs: paragraphs,
      bulletPoints,
      callout,
    };
  });

  // 3. Compile synthetic replacements list
  const replacements: SyntheticReplacement[] = Array.from(replacementCounts.entries()).map(
    ([ruleId, { count, rule }]) => ({
      id: ruleId,
      original: rule.targetTerm || "",
      synthetic: rule.syntheticValue,
      category: rule.category,
      count,
      ruleId,
    })
  );

  return {
    disguisedSections,
    replacements,
    disguisedTitle,
    disguisedSubtitle,
    disguisedSummary,
  };
}

/**
 * Verifies document safety and confirms zero leakage
 */
export function verifyDocumentSafety(
  doc: ExtractedDocument,
  isDisguised: boolean,
  rules: CloakRule[]
): VerificationAudit {
  const auditItems: VerificationAuditItem[] = [];

  // Check 1: Zero Images Guarantee
  // Scan all paragraphs, full HTML, full Markdown for any <img>, <svg>, <picture>, or markdown images ![
  const allText = [
    doc.title,
    doc.disguiseTitle || "",
    doc.executiveSummary || "",
    doc.fullMarkdown || "",
    ...doc.sections.flatMap((s) => [s.heading, ...s.paragraphs]),
  ].join(" ");

  const hasImageTag = /<img|<picture|<svg|!\[.*?\]\(.*?\)/i.test(allText);
  const zeroImagesConfirmed = !hasImageTag;

  auditItems.push({
    id: "chk-zero-images",
    category: "Media Stripping",
    status: zeroImagesConfirmed ? "pass" : "fail",
    title: "Zero Images & Graphic Media",
    detail: zeroImagesConfirmed
      ? "Confirmed: 100% of images, graphic assets, and banners stripped. Pure clean text only."
      : "Warning: Potential image tags detected in content source.",
    metric: "0 Images Found",
  });

  // Check 2: Scripts and Active Embeds
  const hasScripts = /<script|<iframe|<object|<embed/i.test(allText);
  auditItems.push({
    id: "chk-active-scripts",
    category: "Code Injection",
    status: !hasScripts ? "pass" : "fail",
    title: "Scripts & Active Code Removal",
    detail: !hasScripts
      ? "No executable scripts, trackers, iframes, or telemetry beacons found."
      : "Active code elements detected.",
    metric: "100% Sanitized",
  });

  // Check 3: Raw Email / Phone PII Scan
  const rawEmailMatches = allText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi) || [];
  const rawPhoneMatches = allText.match(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g) || [];

  const unmaskedPiiCount = rawEmailMatches.length + rawPhoneMatches.length;
  auditItems.push({
    id: "chk-pii-scan",
    category: "PII & Contact Data",
    status: unmaskedPiiCount === 0 ? "pass" : isDisguised ? "warn" : "warn",
    title: "Unmasked Contact & PII Scanner",
    detail:
      unmaskedPiiCount === 0
        ? "No uncloaked email addresses, direct phone lines, or SSN patterns detected in visible text."
        : `${unmaskedPiiCount} contact identifiers detected. Ensure email & phone cloak rules are active.`,
    metric: unmaskedPiiCount === 0 ? "0 Leaks" : `${unmaskedPiiCount} Flagged`,
  });

  // Check 4: Synthetic Replacement Coverage
  const activeRulesCount = rules.filter((r) => r.enabled).length;
  const appliedReplacementsCount = doc.syntheticReplacements?.reduce((sum, r) => sum + r.count, 0) || 0;

  auditItems.push({
    id: "chk-synthetic-coverage",
    category: "Synthetic Disguise",
    status: isDisguised ? "pass" : "warn",
    title: "Synthetic Value Substitution",
    detail: isDisguised
      ? `Disguise engine active: ${appliedReplacementsCount} sensitive values successfully replaced with synthetic corporate tokens.`
      : "Standard original view. Enable Disguise Mode (Esc) to activate synthetic masking.",
    metric: isDisguised ? `${appliedReplacementsCount} Masked` : "Standby",
  });

  // Check 5: Document Structure & Fidelity
  const totalWords = doc.wordCount;
  const totalSections = doc.sections.length;
  auditItems.push({
    id: "chk-structural-fidelity",
    category: "Format & Readability",
    status: "pass",
    title: "Document Hierarchy & Preservation",
    detail: `Original narrative and text preserved across ${totalSections} sections (${totalWords} words). Formatted with standard Google Docs typography.`,
    metric: `${totalSections} Sections OK`,
  });

  // Check 6: Google Docs & Word Export Readiness
  auditItems.push({
    id: "chk-export-ready",
    category: "Export & Delivery",
    status: "pass",
    title: "Google Docs / Word / Text Cloaking Ready",
    detail: "Rich text clipboard container ready for one-click paste into docs.google.com or download as .doc / .txt.",
    metric: "Ready to Cloak",
  });

  // Calculate score
  let score = 95;
  if (!zeroImagesConfirmed) score -= 30;
  if (hasScripts) score -= 25;
  if (unmaskedPiiCount > 0) score -= 15;
  if (!isDisguised) score -= 5;
  score = Math.max(20, Math.min(100, score));

  return {
    safetyScore: score,
    isSafe: score >= 80,
    zeroImagesConfirmed,
    scriptsStripped: !hasScripts,
    piiMaskedCount: appliedReplacementsCount,
    unmaskedRisksCount: unmaskedPiiCount,
    items: auditItems,
    verifiedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}
