import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import * as cheerio from "cheerio";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Shared Gemini AI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

let geminiQuotaExhausted = false;

// Deterministic instant review generator
function generateFastStructuredReviews(
  title: string,
  disguiseTitle: string,
  sections: Array<{
    heading: string;
    disguiseHeading?: string;
    paragraphs: string[];
    bulletPoints?: string[];
    isSensitive?: boolean;
    confidentialClassification?: string;
  }>,
  isNovel: boolean
) {
  const sensitiveKeywords = [
    "intimate", "embrace", "kiss", "lips", "cloak", "shiver", "warmth", "breath",
    "bed", "bedroom", "touch", "midnight", "curfew", "private", "whisper", "chest",
    "flush", "body", "undress", "desire", "caress", "climax", "flesh"
  ];

  const reviews = sections.map((sec, idx) => {
    const p1 = sec.paragraphs[0] || "";
    const p2 = sec.paragraphs[1] || "";
    const combinedText = (sec.heading + " " + sec.paragraphs.join(" ")).toLowerCase();
    const isSensitive = sec.isSensitive ?? sensitiveKeywords.some((kw) => combinedText.includes(kw));

    const firstSentence = p1.split(/[.!?。！？]/)[0] || p1.slice(0, 120);
    const secondSentence = p2 ? (p2.split(/[.!?。！？]/)[0] || p2.slice(0, 100)) : "";

    const narrativeSummary = firstSentence
      ? `${firstSentence.trim()}. ${secondSentence ? secondSentence.trim() + "." : ""}`
      : `Comprehensive events and narrative developments documented in ${sec.heading}.`;

    const auditSummary = isSensitive
      ? `[CONFIDENTIAL INFORMATION] Section ${idx + 1}.0 executes restricted corporate compliance audit: High-risk bilateral personnel alignment protocol conducted under Level 4 Non-Disclosure Protocol.`
      : `Section ${idx + 1}.0 validates operational parameters, cross-functional compliance, and verified procedures for ${sec.disguiseHeading || sec.heading}.`;

    const narrativeKeys = [
      `Key events unfold surrounding ${sec.heading}.`,
      isSensitive
        ? "High-stakes interpersonal intimacy and emotional friction climax in this scene."
        : "Detailed narrative context and strategic developments established.",
    ];

    const auditKeys = isSensitive
      ? [
          "CONFIDENTIAL INFORMATION: Level 4 Non-Disclosure Protocol logged.",
          "Cross-departmental security clearance enforced for all personnel logs.",
        ]
      : [
          `Operational compliance confirmed for Phase ${idx + 1}.`,
          `Ledger metrics and procedural controls validated against baseline.`,
        ];

    const fastPaced = isSensitive
      ? `In 2x speed: Tension boils over as the characters meet in private. Intimate boundaries shatter in close quarters, forcing true feelings out into the open under extreme secrecy.`
      : `In 2x speed: ${firstSentence.trim()}. Stakes escalate quickly as plans are put into motion and new obstacles arise.`;

    const disguiseFastPaced = isSensitive
      ? `[CONFIDENTIAL INFORMATION] High-velocity executive audit: Restricted transaction completed under Level 4 Security Protocol with zero external visibility.`
      : `High-velocity audit briefing: Operational phase ${idx + 1}.0 completed within specified risk thresholds.`;

    const cliffhanger = isSensitive
      ? "Turning point: Personal barriers drop, leaving both characters committed to a dangerous secret."
      : "Turning point: Critical revelations alter the trajectory of the upcoming confrontation.";

    return {
      chapterNumber: idx + 1,
      chapterTitle: sec.heading,
      disguiseChapterTitle: isSensitive
        ? `[CONFIDENTIAL INFORMATION] ${sec.disguiseHeading || `${idx + 1}.0 Restricted Operational Protocol`}`
        : sec.disguiseHeading || `${idx + 1}.0 Operational Verification Protocol`,
      summary: narrativeSummary,
      disguiseSummary: auditSummary,
      keyPoints: narrativeKeys,
      disguiseKeyPoints: auditKeys,
      fastPacedRecap: fastPaced,
      disguiseFastPacedRecap: disguiseFastPaced,
      cliffhanger,
      isSensitive,
      confidentialClassification: isSensitive ? "CONFIDENTIAL INFORMATION // LEVEL 4 CLASSIFIED" : undefined,
    };
  });

  const execSummary = isNovel
    ? `A structured narrative spanning ${sections.length} chapters/sections with complete scene dialogue, character interactions, and story progression fully preserved.`
    : `Complete document covering ${sections.length} core sections with comprehensive subject matter review and full textual preservation.`;

  const disguiseExecSummary = `This comprehensive operational assessment synthesizes procedural evaluations, technical verifications, and compliance milestones across ${sections.length} functional phases.`;

  return {
    executiveSummary: execSummary,
    disguiseExecutiveSummary: disguiseExecSummary,
    chapterReviews: reviews,
  };
}

// Helper: Generate structured Chapter-by-Chapter Review & Executive Summary
async function generateChapterReviewsWithGemini(
  ai: any,
  title: string,
  disguiseTitle: string,
  sections: Array<{
    heading: string;
    disguiseHeading?: string;
    paragraphs: string[];
    bulletPoints?: string[];
    isSensitive?: boolean;
    confidentialClassification?: string;
  }>,
  isNovel: boolean
): Promise<{
  executiveSummary: string;
  disguiseExecutiveSummary: string;
  chapterReviews: Array<{
    chapterNumber: number | string;
    chapterTitle: string;
    disguiseChapterTitle: string;
    summary: string;
    disguiseSummary: string;
    keyPoints: string[];
    disguiseKeyPoints: string[];
    fastPacedRecap?: string;
    disguiseFastPacedRecap?: string;
    cliffhanger?: string;
    isSensitive?: boolean;
    confidentialClassification?: string;
  }>;
}> {
  const createFallbackReview = () => generateFastStructuredReviews(title, disguiseTitle, sections, isNovel);

  try {
    const primarySections = sections.slice(0, 10);
    const compactSections = primarySections.map((s, idx) => ({
      index: idx + 1,
      heading: s.heading,
      disguiseHeading: s.disguiseHeading || `${idx + 1}.0 Operational Review`,
      excerpt: (s.paragraphs.slice(0, 2).join(" ")).slice(0, 200),
    }));

    const prompt = `You are a professional literary reviewer and enterprise document auditor.
Generate an in-depth, structured CHAPTER-BY-CHAPTER review of the following document with special focus on fast-paced storyline recaps (like popular 2x speed film review recaps) and corporate confidentiality disguises.

DOCUMENT INFO:
- Title: "${title}"
- Corporate Disguise Title: "${disguiseTitle}"
- Fiction / Novel Narrative: ${isNovel ? "YES" : "NO"}
- Total Chapters/Sections: ${sections.length}

SECTIONS CONTEXT:
${JSON.stringify(compactSections, null, 2)}

TASK REQUIREMENTS:
1. "executiveSummary": An engaging, high-level 2-3 sentence overview of the whole story or document.
2. "disguiseExecutiveSummary": An ultra-believable corporate counterpart phrased like a Fortune 500 systems architecture or operational audit review.
3. For EACH section/chapter in the list, provide:
   - "chapterNumber": Section index (number)
   - "chapterTitle": Original chapter title
   - "disguiseChapterTitle": Enterprise disguise heading. IMPORTANT: If the chapter contains sensitive, romantic, or 18+ content, prefix this with "[CONFIDENTIAL INFORMATION] ".
   - "summary": Standard informative 2-3 sentence summary detailing what happens in this specific chapter.
   - "disguiseSummary": Serious enterprise audit counterpart. IMPORTANT: If the chapter contains sensitive, romantic, intimate, or 18+ content, begin this with: "[CONFIDENTIAL INFORMATION] Corporate compliance audit: High-risk bilateral personnel coordination session conducted under Level 4 Non-Disclosure Protocol."
   - "keyPoints": Array of 2-3 bullet points highlighting critical narrative moments or facts.
   - "disguiseKeyPoints": Array of 2-3 corporate audit takeaways.
   - "fastPacedRecap": FAST-PACED STORYLINE RECAP (like a viral 2X-SPEED FILM REVIEW video narration). Punchy, engaging, and conversational narrative that explains the drama, character motives, and actions so readers can grasp the entire plot in 30 seconds!
   - "disguiseFastPacedRecap": High-velocity executive briefing counterpart.
   - "cliffhanger": 1 punchy sentence describing the cliffhanger, plot twist, or emotional turning point of the chapter.
   - "isSensitive": Boolean. Set to true if this chapter contains sensitive content (romantic intimacy, kissing, bedroom scenes, physical touch, 18+ adult themes, or high-risk plot revelations).
   - "confidentialClassification": If isSensitive is true, set to "CONFIDENTIAL INFORMATION // LEVEL 4 CLASSIFIED". Otherwise null.

Return ONLY valid JSON matching this exact structure:
{
  "executiveSummary": "Overall narrative overview...",
  "disguiseExecutiveSummary": "Overall corporate operational review...",
  "chapterReviews": [
    {
      "chapterNumber": 1,
      "chapterTitle": "Chapter Heading",
      "disguiseChapterTitle": "1.0 Operational Heading",
      "summary": "Standard summary...",
      "disguiseSummary": "Corporate audit review...",
      "keyPoints": ["Key takeaway 1", "Key takeaway 2"],
      "disguiseKeyPoints": ["Audit metric 1", "Audit metric 2"],
      "fastPacedRecap": "2x speed film review storyline narration...",
      "disguiseFastPacedRecap": "High-velocity corporate briefing...",
      "cliffhanger": "Emotional turning point or cliffhanger...",
      "isSensitive": false,
      "confidentialClassification": null
    }
  ]
}`;

    if (isNovel || !process.env.GEMINI_API_KEY || geminiQuotaExhausted) {
      return createFallbackReview();
    }

    const candidateModels = ["gemini-3.1-flash-lite"];
    for (const model of candidateModels) {
      try {
        const geminiCall = ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 6000)
        );

        const response: any = await Promise.race([geminiCall, timeout]);
        const text = response.text?.trim();
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed && Array.isArray(parsed.chapterReviews) && parsed.chapterReviews.length > 0) {
            const fallback = createFallbackReview();
            // If total sections exceed primarySections, merge with deterministic fallback for the rest
            let allChapterReviews = parsed.chapterReviews;
            if (sections.length > primarySections.length) {
              const extraFallbackReviews = fallback.chapterReviews.slice(primarySections.length);
              allChapterReviews = [...allChapterReviews, ...extraFallbackReviews];
            }

            return {
              executiveSummary: parsed.executiveSummary || fallback.executiveSummary,
              disguiseExecutiveSummary:
                parsed.disguiseExecutiveSummary || fallback.disguiseExecutiveSummary,
              chapterReviews: allChapterReviews,
            };
          }
        }
      } catch (e: any) {
        if (
          e?.message?.includes("RESOURCE_EXHAUSTED") ||
          e?.message?.includes("quota") ||
          e?.status === 429
        ) {
          geminiQuotaExhausted = true;
          console.info("Gemini API quota reached. Activated zero-latency deterministic review engine.");
        } else {
          console.warn(`Gemini review (${model}) fallback:`, e?.message || e);
        }
        return createFallbackReview();
      }
    }
  } catch {
    // Graceful fallback to deterministic structural chapter reviewer
  }

  return createFallbackReview();
}

// Helper: Parse markdown content into structured document elements
function parseMarkdownToElements(markdown: string): Array<{ type: string; text: string }> {
  const elements: Array<{ type: string; text: string }> = [];
  // Strip images completely
  let clean = markdown.replace(/!\[.*?\]\(.*?\)/g, "");
  // Convert markdown links [text](url) to text
  clean = clean.replace(/\[(.*?)\]\(.*?\)/g, "$1");
  // Remove remaining HTML tags
  clean = clean.replace(/<[^>]*>/g, " ");

  const lines = clean.split(/\r?\n/);
  let currentParagraph = "";

  const flushParagraph = () => {
    if (currentParagraph.trim()) {
      elements.push({ type: "p", text: currentParagraph.trim() });
      currentParagraph = "";
    }
  };

  const isNavNoise = (line: string): boolean => {
    const l = line.toLowerCase().trim();
    return (
      l.startsWith("next chapter") ||
      l.startsWith("previous chapter") ||
      l.startsWith("table of contents") ||
      l === "next" ||
      l === "previous" ||
      l === "share" ||
      l.includes("report broken chapter") ||
      l.includes("all rights reserved") ||
      l.includes("cookies policy") ||
      l.includes("terms of service")
    );
  };

  for (let line of lines) {
    line = line.trim();
    if (!line) {
      flushParagraph();
      continue;
    }

    if (isNavNoise(line)) {
      continue;
    }

    if (line.startsWith("#### ")) {
      flushParagraph();
      elements.push({ type: "h4", text: line.replace(/^####\s*/, "").trim() });
    } else if (line.startsWith("### ")) {
      flushParagraph();
      elements.push({ type: "h3", text: line.replace(/^###\s*/, "").trim() });
    } else if (line.startsWith("## ")) {
      flushParagraph();
      elements.push({ type: "h2", text: line.replace(/^##\s*/, "").trim() });
    } else if (line.startsWith("# ")) {
      flushParagraph();
      elements.push({ type: "h1", text: line.replace(/^#\s*/, "").trim() });
    } else if (
      line.length < 100 &&
      /^(?:(?:Chapter|Volume|Part|Book|Section|Act|Capítulo|Chapitre|第[0-9一二三四五六七八九十百千万]+[章回卷节]|Prologue|Epilogue)\s*[\dIVXLCDM\.:\s\-—–])/i.test(
        line
      )
    ) {
      flushParagraph();
      elements.push({ type: "h2", text: line });
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      flushParagraph();
      elements.push({ type: "ul", text: line.replace(/^[-*]\s*/, "").trim() });
    } else {
      if (currentParagraph) {
        currentParagraph += " " + line;
      } else {
        currentParagraph = line;
      }
    }
  }

  flushParagraph();
  return elements;
}

// Tier 1: High-Speed Web Reader API (bypasses Cloudflare & JavaScript)
async function extractWithJinaReader(targetUrl: string): Promise<{
  title: string;
  author: string;
  publishDate: string;
  elements: Array<{ type: string; text: string }>;
  rawText: string;
} | null> {
  try {
    const res = await fetch(`https://r.jina.ai/${targetUrl}`, {
      headers: {
        Accept: "text/plain",
        "X-No-Cache": "true",
        "X-Return-Format": "markdown",
      },
      signal: AbortSignal.timeout(14000),
    });

    if (!res.ok) return null;
    const text = await res.text();
    if (
      !text ||
      text.length < 150 ||
      text.includes("Just a moment...") ||
      text.includes("Checking your browser")
    ) {
      return null;
    }

    const titleMatch = text.match(/^Title:\s*(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : "";

    const dateMatch = text.match(/^Published Time:\s*(.+)$/m);
    const publishDate = dateMatch ? dateMatch[1].trim() : "";

    const authorMatch = text.match(/^Author:\s*(.+)$/m);
    const author = authorMatch ? authorMatch[1].trim() : "";

    const contentIdx = text.indexOf("Markdown Content:");
    const markdownBody =
      contentIdx !== -1 ? text.slice(contentIdx + "Markdown Content:".length).trim() : text;

    const elements = parseMarkdownToElements(markdownBody);
    if (elements.length < 2) return null;

    return {
      title,
      author,
      publishDate,
      elements,
      rawText: markdownBody,
    };
  } catch (err: any) {
    console.warn("Jina Reader API attempt notice:", err?.message || err);
    return null;
  }
}

// Tier 2: Gemini Search Grounding Reader API
async function extractWithGeminiSearch(
  ai: any,
  targetUrl: string
): Promise<{
  title: string;
  author: string;
  publishDate: string;
  elements: Array<{ type: string; text: string }>;
  rawText: string;
} | null> {
  if (!process.env.GEMINI_API_KEY || geminiQuotaExhausted) return null;
  try {
    const prompt = `You are a high-speed web reader API. Read the entire story, novel chapter, or article located at this URL: ${targetUrl}
Extract the full unabridged text, title, author, and chapter headings. Do not summarize; retrieve the actual narrative content with scene dialogue.

Return JSON in this format:
{
  "title": "Document or Chapter Title",
  "author": "Author name",
  "date": "Publication date",
  "sections": [
    {
      "heading": "Chapter / Section Name",
      "paragraphs": ["Paragraph 1...", "Paragraph 2..."]
    }
  ]
}`;

    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      tools: [{ googleSearch: {} }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const text = res.text?.trim();
    if (!text) return null;
    const parsed = JSON.parse(text);
    if (parsed && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
      const elements: Array<{ type: string; text: string }> = [];
      let fullRaw = "";
      for (const sec of parsed.sections) {
        if (sec.heading) {
          elements.push({ type: "h2", text: sec.heading });
          fullRaw += "\n\n## " + sec.heading + "\n\n";
        }
        if (Array.isArray(sec.paragraphs)) {
          for (const p of sec.paragraphs) {
            elements.push({ type: "p", text: p });
            fullRaw += p + "\n\n";
          }
        }
      }

      if (elements.length > 0) {
        return {
          title: parsed.title || "",
          author: parsed.author || "",
          publishDate: parsed.date || "",
          elements,
          rawText: fullRaw.trim(),
        };
      }
    }
  } catch (e: any) {
    console.warn("Gemini web search extraction notice:", e?.message || e);
  }
  return null;
}

// Tier 3: Direct Cheerio Browser-Emulated Fetch
async function extractWithDirectCheerio(targetUrl: string): Promise<{
  title: string;
  author: string;
  publishDate: string;
  elements: Array<{ type: string; text: string }>;
  rawText: string;
} | null> {
  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) return null;
    const html = await response.text();

    const $ = cheerio.load(html);
    $(
      "script, style, nav, footer, noscript, iframe, svg, img, picture, figure, video, audio, canvas, [role='navigation'], [role='banner'], .cookie-banner, .cookie-notice, .advertisement, .ads, .social-share, .share-buttons, .widget, .comments-area, .sidebar"
    ).remove();

    $("br").replaceWith("\n");
    $("hr").replaceWith("\n\n");

    const pageTitle =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text().trim() ||
      $("h1").first().text().trim() ||
      "";

    const author =
      $('meta[name="author"]').attr("content") ||
      $('meta[property="article:author"]').attr("content") ||
      $(".author, .byline, [rel='author']").first().text().trim() ||
      "";

    const publishDate =
      $('meta[property="article:published_time"]').attr("content") ||
      $('meta[name="date"]').attr("content") ||
      $("time").first().attr("datetime") ||
      $("time").first().text().trim() ||
      "";

    const candidateSelectors = [
      "#chapter-content",
      ".chapter-content",
      "#novelcontent",
      ".novelcontent",
      ".reading-content",
      "#read-content",
      ".chapter-body",
      "#chapter-body",
      ".entry-content",
      ".post-content",
      ".article-content",
      "#article-body",
      "article",
      "#contents",
      ".content",
      "[role='main']",
      "main",
      "body",
    ];

    let bestEl: any = $("body");
    let maxLen = 0;
    for (const sel of candidateSelectors) {
      $(sel).each((_, el) => {
        const textLen = $(el).text().trim().length;
        if (textLen > maxLen) {
          maxLen = textLen;
          bestEl = $(el);
        }
      });
    }

    const elements: Array<{ type: string; text: string }> = [];
    bestEl.find("h1, h2, h3, h4, p, ul, ol, blockquote, pre").each((_: any, elem: any) => {
      const tag = elem.tagName.toLowerCase();
      const text = $(elem).text().trim().replace(/\r/g, "").replace(/\t/g, " ");
      if (text.length > 0) {
        elements.push({ type: tag, text });
      }
    });

    const directText = bestEl.text().replace(/\r/g, "").trim();
    if (elements.length < 5 && directText.length > 200) {
      elements.length = 0;
      const lines = directText.split(/\n{2,}|\n/).map((l: string) => l.trim()).filter((l: string) => l.length > 0);
      for (const line of lines) {
        if (
          line.length < 100 &&
          /^(?:#{1,3}\s+|(?:Chapter|Volume|Part|Book|Section|Act|Capítulo|Chapitre|第[0-9一二三四五六七八九十百千万]+[章回卷节]|Prologue|Epilogue)\s*[\dIVXLCDM\.:\s\-—–])/i.test(
            line
          )
        ) {
          elements.push({ type: "h2", text: line.replace(/^#+\s*/, "") });
        } else {
          elements.push({ type: "p", text: line });
        }
      }
    }

    if (elements.length === 0) return null;

    return {
      title: pageTitle,
      author,
      publishDate,
      elements,
      rawText: directText,
    };
  } catch (err: any) {
    console.warn("Direct Cheerio fetch attempt notice:", err?.message || err);
    return null;
  }
}

// --- Domain Crawler & Multi-Page Link Follower ---
interface CrawledPage {
  url: string;
  pathname: string;
  title: string;
  paragraphs: string[];
  bulletPoints: string[];
  rawText: string;
}

export interface DomainCrawlOptions {
  maxPages?: number;
  selectedUrls?: string[];
  excludePatterns?: string[];
}

function getCrawlUrlPriority(urlStr: string, excludePatterns?: string[]): number {
  const lower = urlStr.toLowerCase();

  // User-specified exclusion patterns
  if (excludePatterns && excludePatterns.length > 0) {
    if (excludePatterns.some((pattern) => lower.includes(pattern.toLowerCase()))) {
      return -100;
    }
  }

  // Filter out noisy, auth, legal, or administrative endpoints
  if (
    /(\/|\b)(login|signin|signup|register|auth|cart|checkout|wp-admin|wp-json|feed|rss|xmlrpc|privacy|privacy-policy|terms|terms-of-service|cookie|cookie-policy|disclaimer|copyright|legal|lost-password|my-account|admin|cgi-bin|api)(\/|\b)/.test(
      lower
    )
  ) {
    return -100;
  }

  // Filter out pagination & archive duplicate loops
  if (/(\/|\b)(page\/\d+|tag\/|category\/|author\/|archive\/|comments\/)(\/|\b)/.test(lower)) {
    return -50;
  }

  if (
    /\.(pdf|zip|tar|gz|exe|dmg|pkg|png|jpe?g|gif|svg|webp|ico|mp4|webm|mp3|wav|json|xml|css|js)(\?|$)/i.test(
      lower
    )
  ) {
    return -100;
  }

  let score = 0;
  if (/(\/|\b)(about|who-we-are|company|overview|story)(\/|\b)/.test(lower)) score += 15;
  if (/(\/|\b)(services|solutions|capabilities|what-we-do|offerings)(\/|\b)/.test(lower)) score += 14;
  if (/(\/|\b)(products|platform|features|technology|software)(\/|\b)/.test(lower)) score += 13;
  if (/(\/|\b)(team|leadership|executives|founders|people)(\/|\b)/.test(lower)) score += 12;
  if (/(\/|\b)(pricing|plans|cost|tiers)(\/|\b)/.test(lower)) score += 11;
  if (/(\/|\b)(contact|locations|support|reach-us|contact-us)(\/|\b)/.test(lower)) score += 10;
  if (/(\/|\b)(faq|docs|documentation|knowledge-base|help)(\/|\b)/.test(lower)) score += 8;
  if (/(\/|\b)(case-studies|customers|clients|portfolio)(\/|\b)/.test(lower)) score += 7;
  if (/(\/|\b)(blog|news|press|insights)(\/|\b)/.test(lower)) score += 3;
  return score;
}

function extractPageReadableContent(
  $: cheerio.CheerioAPI,
  _pageUrl: string
): { title: string; paragraphs: string[]; bulletPoints: string[]; rawText: string } | null {
  // Strip headers, navigation, footers, scripts, and tracking widgets
  $(
    "script, style, nav, footer, header, noscript, iframe, svg, img, picture, figure, video, audio, canvas, [role='navigation'], [role='banner'], .cookie-banner, .cookie-notice, .advertisement, .ads, .social-share, .share-buttons, .widget, .comments-area, .sidebar, .menu, .nav, .footer"
  ).remove();

  $("br").replaceWith("\n");
  $("hr").replaceWith("\n\n");

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    "";

  const candidateSelectors = [
    "main",
    "article",
    "[role='main']",
    ".content",
    ".main-content",
    "#content",
    ".entry-content",
    ".post-content",
    "body",
  ];

  let bestEl: any = $("body");
  let maxLen = 0;
  for (const sel of candidateSelectors) {
    $(sel).each((_, el) => {
      const len = $(el).text().trim().length;
      if (len > maxLen) {
        maxLen = len;
        bestEl = $(el);
      }
    });
  }

  const paragraphs: string[] = [];
  const bulletPoints: string[] = [];

  bestEl.find("h1, h2, h3, h4, p, li, blockquote").each((_: any, el: any) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (
      text.length > 20 &&
      !/cookie|copyright|all rights reserved|privacy policy|terms of service|managed by/i.test(text)
    ) {
      if (el.tagName.toLowerCase() === "li") {
        if (text.length < 250 && !bulletPoints.includes(text)) {
          bulletPoints.push(text);
        }
      } else {
        if (!paragraphs.includes(text)) {
          paragraphs.push(text);
        }
      }
    }
  });

  const rawText = paragraphs.join("\n\n");
  if (paragraphs.length === 0 && rawText.length < 50) {
    return null;
  }

  return {
    title: title.replace(/ \| .*$| - [^-]+$/, "").trim(),
    paragraphs,
    bulletPoints: bulletPoints.slice(0, 8),
    rawText,
  };
}

async function crawlWebsiteDomain(
  startUrl: string,
  optionsInput: number | DomainCrawlOptions = 8
): Promise<{
  domain: string;
  startUrl: string;
  pagesCrawled: number;
  pages: CrawledPage[];
  discoveredCount: number;
} | null> {
  const options: DomainCrawlOptions =
    typeof optionsInput === "number" ? { maxPages: optionsInput } : optionsInput || {};
  const maxPages = options.maxPages || 8;
  const selectedUrls = options.selectedUrls;
  const excludePatterns = options.excludePatterns;
  const deadline = Date.now() + 200_000;

  try {
    const startObj = new URL(startUrl);
    const origin = startObj.origin;
    const hostname = startObj.hostname.toLowerCase();
    const rootDomain = hostname.replace(/^www\./, "");

    // The "section" the user started in, e.g. /docs/guide -> links under /docs/guide/ come first.
    const startPath = startObj.pathname.replace(/\/+$/, "");
    const scopePath = /\.[a-z0-9]{2,5}$/i.test(startPath) ? startPath.replace(/\/[^\/]*$/, "") : startPath;
    const parentScope = scopePath.replace(/\/[^\/]*$/, "");

    const TRACKING_PARAMS = /^(?:utm_.*|fbclid|gclid|mc_cid|mc_eid|ref|ref_src|igshid|_ga|_gl|yclid|msclkid)$/i;

    const normalizeUrl = (rawHref: string, base: string): string | null => {
      try {
        if (!rawHref || /^(?:#|javascript:|mailto:|tel:)/i.test(rawHref)) return null;
        const resolved = new URL(rawHref, base);
        if (!/^https?:$/.test(resolved.protocol)) return null;
        resolved.hash = "";
        // Keep meaningful query params (?id=, ?page=, ?p=) — only strip tracking junk.
        for (const key of [...resolved.searchParams.keys()]) {
          if (TRACKING_PARAMS.test(key)) resolved.searchParams.delete(key);
        }
        const targetHost = resolved.hostname.toLowerCase();
        if (targetHost !== hostname && !targetHost.endsWith("." + rootDomain) && targetHost !== rootDomain) {
          return null;
        }
        if (getCrawlUrlPriority(resolved.href, excludePatterns) <= -50) return null;
        const path = resolved.pathname.replace(/\/+$/, "");
        return `${resolved.origin}${path}${resolved.search}`;
      } catch {
        return null;
      }
    };

    const scoreUrl = (u: string, foundOnStartPage: boolean): number => {
      let score = getCrawlUrlPriority(u, excludePatterns);
      try {
        const p = new URL(u).pathname.replace(/\/+$/, "");
        if (scopePath.length > 1 && (p === scopePath || p.startsWith(scopePath + "/"))) score += 60;
        else if (parentScope.length > 1 && (p === parentScope || p.startsWith(parentScope + "/"))) score += 25;
      } catch {}
      if (foundOnStartPage) score += 8;
      return score;
    };

    const visited = new Set<string>();
    const queued = new Map<string, { score: number; order: number }>();
    let order = 0;
    const enqueue = (u: string, score: number) => {
      if (visited.has(u)) return;
      const existing = queued.get(u);
      if (!existing || existing.score < score) queued.set(u, { score, order: existing?.order ?? order++ });
    };
    const popBest = (): string | null => {
      let best: string | null = null;
      let bestVal = { score: -Infinity, order: Infinity };
      for (const [u, v] of queued) {
        if (v.score > bestVal.score || (v.score === bestVal.score && v.order < bestVal.order)) {
          best = u;
          bestVal = v;
        }
      }
      if (best) queued.delete(best);
      return best;
    };

    const crawledPages: CrawledPage[] = [];
    const explicitOnly = !!(selectedUrls && selectedUrls.length > 0);
    const startKey = normalizeUrl(startObj.href, origin) || startObj.href;

    if (explicitOnly) {
      selectedUrls!.forEach((u, i) => enqueue(u, 10_000 - i)); // keep the user's order
    } else {
      enqueue(startKey, 100_000); // always crawl the link the user pasted first
    }

    let sitemapLoaded = false;
    const loadSitemap = async () => {
      sitemapLoaded = true;
      for (const smUrl of [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`]) {
        try {
          const smRes = await fetch(smUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DOCLOAK-Enterprise-Crawler/2.0" },
            signal: AbortSignal.timeout(3500),
          });
          if (!smRes.ok) continue;
          const xml = await smRes.text();
          const matches = xml.match(/<loc>(https?:\/\/[^<]+)<\/loc>/gi) || [];
          let added = 0;
          for (const m of matches) {
            const u = normalizeUrl(m.replace(/<\/?loc>/gi, "").trim(), origin);
            if (u && !/\.xml$/i.test(u)) {
              enqueue(u, scoreUrl(u, false) - 5);
              added++;
            }
          }
          if (added > 0) break;
        } catch {}
      }
    };

    const effectiveMaxPages = Math.min(Math.max(1, maxPages), 50);

    while (crawledPages.length < effectiveMaxPages && Date.now() < deadline) {
      let nextUrl = popBest();
      if (!nextUrl) {
        if (!explicitOnly && !sitemapLoaded) {
          await loadSitemap();
          nextUrl = popBest();
        }
        if (!nextUrl) break;
      }
      if (visited.has(nextUrl)) continue;
      visited.add(nextUrl);

      try {
        const res = await fetch(nextUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          redirect: "follow",
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) continue;
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) continue;

        const html = await res.text();
        const $ = cheerio.load(html);
        const isStartPage = nextUrl === startKey;

        if (!explicitOnly) {
          $("a[href]").each((_, el) => {
            const norm = normalizeUrl($(el).attr("href") || "", nextUrl!);
            if (norm && !visited.has(norm)) enqueue(norm, scoreUrl(norm, isStartPage));
          });
        }

        const content = extractPageReadableContent($, nextUrl);
        if (content && (content.paragraphs.length > 0 || content.bulletPoints.length > 0)) {
          const urlObj = new URL(nextUrl);
          const fallbackTitle =
            urlObj.pathname === "" || urlObj.pathname === "/"
              ? "Home"
              : urlObj.pathname
                  .replace(/^\//, "")
                  .replace(/[-_]/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase());

          crawledPages.push({
            url: nextUrl,
            pathname: (urlObj.pathname || "/") + urlObj.search,
            title: content.title || fallbackTitle,
            paragraphs: content.paragraphs,
            bulletPoints: content.bulletPoints,
            rawText: content.rawText,
          });
        }
      } catch (e: any) {
        console.warn(`Crawler notice for ${nextUrl}:`, e?.message || e);
      }
    }

    return {
      domain: rootDomain,
      startUrl,
      pagesCrawled: crawledPages.length,
      pages: crawledPages,
      discoveredCount: visited.size + queued.size,
    };
  } catch (err: any) {
    console.warn("crawlWebsiteDomain exception:", err?.message || err);
    return null;
  }
}

// --- Dedicated Web Novel Chapter Crawler & Compiler ---
interface NovelCrawledChapter {
  chapterNumber: number;
  title: string;
  url: string;
  paragraphs: string[];
  bulletPoints: string[];
  rawText: string;
}

interface NovelCrawlResult {
  novelTitle: string;
  author: string;
  domain: string;
  startUrl: string;
  tocUrl?: string;
  mode: "toc" | "sequential";
  totalChaptersFound: number;
  chapters: NovelCrawledChapter[];
  /** Chapter number of the first chapter in this batch. */
  firstChapterNumber: number;
  /** True when there are more chapters after this batch. */
  hasMore: boolean;
  /** What to send next time to continue exactly where this batch stopped. */
  resume?: { url: string; chapterStart?: number; numberOffset?: number };
  /** Chapters that could not be downloaded even after a retry. */
  failedChapters: Array<{ chapterNumber: number; title: string; url: string }>;
}

function extractNovelChapterContent($: cheerio.CheerioAPI): { title: string; paragraphs: string[] } {
  // 1. Remove navigation, sidebars, scripts, ads, and widgets
  $(
    ".chapter-nav, .nav, .author-note, .portlet-title, script, style, .advertisement, .ads, .comments, iframe, noscript, .hidden, header, footer, .share, .social-share, .cookie-banner, .btn-group, .text-center a, .chap-navigation, .breadcrumb"
  ).remove();

  // Replace <br> tags with newlines so breaks are preserved
  $("br").replaceWith("\n");

  const candidateSelectors = [
    ".chapter-inner.chapter-content",
    ".chapter-content",
    "#chapter-content",
    "#novelcontent",
    ".novelcontent",
    ".reading-content",
    "#read-content",
    "#chr-content",
    ".chr-c",
    ".chapter-body",
    "#chapter-body",
    ".entry-content",
    ".post-content",
    ".userstuff",
    "#novel_honbun",
    ".ep-content",
    "#chapter-entity",
    ".text-left",
    ".chapter-inner",
    ".cha-words",
    "article",
    "main",
    "#content",
    ".content",
    "body",
  ];

  let bestEl: any = $("body");
  let maxScore = 0;
  for (const sel of candidateSelectors) {
    const el = $(sel).first();
    if (el.length > 0) {
      const pCount = el.find("p, div.para, div.text, blockquote").length;
      const textLen = el.text().trim().length;
      // Score based on paragraphs and character count
      const score = pCount * 100 + Math.min(textLen, 5000);
      if (score > maxScore) {
        maxScore = score;
        bestEl = el;
      }
    }
  }

  const paras: string[] = [];
  const paraElements = bestEl.find("p, div.para, div.chapter-text, blockquote");
  if (paraElements.length > 2) {
    paraElements.each((_: any, p: any) => {
      const raw = $(p).text().replace(/\r/g, "").trim();
      const lines = raw.split(/\n+/).map((l: string) => l.trim().replace(/\s+/g, " "));
      for (const line of lines) {
        if (
          line.length > 3 &&
          !/^(?:read more on|support the author|visit novelupdates|patreon|previous chapter|next chapter|index|chapter list|table of contents|report chapter)/i.test(
            line
          )
        ) {
          paras.push(line);
        }
      }
    });
  }

  // Fallback: split raw text if paragraphs were sparse
  if (paras.length === 0) {
    const text = bestEl.text().replace(/\r/g, "").trim();
    const split = text
      .split(/\n{2,}|\r\n\r\n/)
      .map((t: string) => t.trim().replace(/\s+/g, " "))
      .filter((t: string) => t.length > 8 && !/^(?:next|previous|chapter|index)$/i.test(t));
    paras.push(...split);
  }

  const rawTitle = $("h1.chapter-title, h1.entry-title, .chapter-title, h1, h2").first().text().trim().replace(/\s+/g, " ");
  return { title: rawTitle, paragraphs: paras };
}

async function fetchNovelHtmlWithFallback(
  targetUrl: string,
  timeoutMs: number = 6500
): Promise<{ text: string; isMarkdown: boolean; source: string } | null> {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };

  // Tier 1: Direct fetch
  try {
    const res = await fetch(targetUrl, { headers, signal: AbortSignal.timeout(timeoutMs) });
    if (res.ok) {
      const text = await res.text();
      if (
        text &&
        text.length > 200 &&
        !/Just a moment\.\.\.|challenge-platform|Cloudflare Turnstile|Attention Required! \| Cloudflare/i.test(
          text
        )
      ) {
        return { text, isMarkdown: false, source: "direct" };
      }
    }
  } catch {}

  // Tier 2: corsproxy.io
  try {
    const cpRes = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`, {
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (cpRes.ok) {
      const text = await cpRes.text();
      if (
        text &&
        text.length > 200 &&
        !/Just a moment\.\.\.|challenge-platform|Attention Required!/i.test(text)
      ) {
        return { text, isMarkdown: false, source: "corsproxy" };
      }
    }
  } catch {}

  // Tier 3: allorigins.win
  try {
    const aoRes = await fetch(
      `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
      { signal: AbortSignal.timeout(timeoutMs) }
    );
    if (aoRes.ok) {
      const text = await aoRes.text();
      if (
        text &&
        text.length > 200 &&
        !/Just a moment\.\.\.|challenge-platform/i.test(text)
      ) {
        return { text, isMarkdown: false, source: "allorigins" };
      }
    }
  } catch {}

  // Tier 4: Jina reader (returns markdown)
  try {
    const jinaRes = await fetch(`https://r.jina.ai/${targetUrl}`, {
      headers: { Accept: "text/plain" },
      signal: AbortSignal.timeout(timeoutMs + 1000),
    });
    if (jinaRes.ok) {
      const text = await jinaRes.text();
      if (text && text.length > 100) {
        return { text, isMarkdown: true, source: "jina" };
      }
    }
  } catch {}

  return null;
}

export interface DiscoveredChapterItem {
  id: string;
  chapterNumber: number;
  title: string;
  url: string;
  isNotice?: boolean;
}

export interface DiscoveredTOCResult {
  success: boolean;
  novelTitle: string;
  author: string;
  domain: string;
  sourceUrl: string;
  isCloudflareBlocked?: boolean;
  chapters: DiscoveredChapterItem[];
  totalChaptersFound: number;
}

export function isNoticeOrExtra(url: string, title: string): boolean {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // URL segments indicating non-chapter pages
  const urlNoticePattern =
    /(\/|\b|\-|\_)(notice|announcement|author-?note|authors-?note|authornote|hiatus|poll|poll-results|art|character-art|cast|glossary|map|status-update|qa|q-a|afterword|side-story|patreon|discord|promo|fan-art|commission|bonus-art)(\/|\b|\-|\_)/i;
  if (urlNoticePattern.test(lowerUrl)) {
    return true;
  }

  // Title prefixes and standalone phrases indicating notices/extras
  if (
    /^(?:Notice|Announcement|Author'?s?\s*Note|Hiatus|Poll|Important\s*Update|Character\s*Art|Map|Glossary|Cast\s*List|Special\s*Thanks|Status\s*Update|Q\s*&\s*A|Disclaimer|Review|Feedback|Update|Cover\s*Art|Afterword)[:\s—–-]/i.test(
      title.trim()
    )
  ) {
    return true;
  }

  // Specific phrases
  const extraPhrases = [
    "author's note",
    "authors note",
    "author note",
    "authornote",
    "important announcement",
    "hiatus announcement",
    "poll results",
    "character art",
    "character sheet",
    "glossary",
    "map and artwork",
    "status update",
    "q&a session",
    "special thanks",
    "volume afterword",
    "intermission",
    "schedule update",
  ];

  return extraPhrases.some((phrase) => lowerTitle.includes(phrase));
}

async function discoverDomainPages(startUrl: string): Promise<{
  success: boolean;
  domain: string;
  sourceUrl: string;
  title: string;
  pages: Array<{ id: string; url: string; title: string; isNotice?: boolean; selected: boolean }>;
  totalPagesFound: number;
}> {
  const startObj = new URL(startUrl.startsWith("http") ? startUrl : `https://${startUrl}`);
  const origin = startObj.origin;
  const hostname = startObj.hostname.toLowerCase();
  const rootDomain = hostname.replace(/^www\./, "");

  const pages: Array<{ id: string; url: string; title: string; isNotice?: boolean; selected: boolean }> = [];
  const seen = new Set<string>();

  const addPage = (url: string, title?: string) => {
    try {
      const resolved = new URL(url, origin);
      resolved.hash = "";
      resolved.search = "";
      const full = resolved.href.replace(/\/$/, "");
      if (seen.has(full)) return;
      if (
        resolved.hostname.toLowerCase() !== hostname &&
        !resolved.hostname.toLowerCase().endsWith("." + rootDomain)
      ) {
        return;
      }
      seen.add(full);
      const isLegalOrNotice =
        /(\/|\b)(privacy|terms|cookie|disclaimer|copyright|legal|wp-admin|login|signup|cart|checkout)(\/|\b)/i.test(
          full
        );
      const cleanTitle =
        title ||
        (resolved.pathname === "/" || resolved.pathname === ""
          ? "Home"
          : resolved.pathname.replace(/^\//, "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
      pages.push({
        id: `page-${pages.length + 1}`,
        url: full,
        title: cleanTitle,
        isNotice: isLegalOrNotice,
        selected: !isLegalOrNotice,
      });
    } catch {}
  };

  addPage(startObj.href, "Home");

  // Check sitemap.xml
  try {
    const smRes = await fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(3000) });
    if (smRes.ok) {
      const xml = await smRes.text();
      const matches = xml.match(/<loc>(https?:\/\/[^<]+)<\/loc>/gi);
      if (matches) {
        for (const m of matches.slice(0, 40)) {
          const u = m.replace(/<\/?loc>/gi, "").trim();
          addPage(u);
        }
      }
    }
  } catch {}

  // Also fetch startUrl to find internal links
  if (pages.length < 5) {
    try {
      const res = await fetch(startObj.href, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);
        $("a[href]").each((_, el) => {
          const href = $(el).attr("href");
          const text = $(el).text().trim().replace(/\s+/g, " ");
          if (href && text && text.length > 2 && text.length < 60) {
            addPage(href, text);
          }
        });
      }
    } catch {}
  }

  return {
    success: true,
    domain: rootDomain,
    sourceUrl: startObj.href,
    title: `${rootDomain} Pages`,
    pages: pages.slice(0, 50),
    totalPagesFound: pages.length,
  };
}

async function discoverNovelTOC(startUrl: string): Promise<DiscoveredTOCResult> {
  const startObj = new URL(startUrl.startsWith("http") ? startUrl : `https://${startUrl}`);
  const domain = startObj.hostname.replace(/^www\./, "");

  // 1. Detect and normalize Table of Contents URL
  let tocUrl = startObj.href;
  const rrChapterMatch = startObj.href.match(/^(https?:\/\/[^\/]+\/fiction\/\d+\/[^\/]+)\/chapter\//i);
  if (rrChapterMatch) {
    tocUrl = rrChapterMatch[1];
  }
  const syosetuMatch = startObj.href.match(/^(https?:\/\/ncode\.syosetu\.com\/[^\/]+)\/\d+\/?$/i);
  if (syosetuMatch) {
    tocUrl = syosetuMatch[1] + "/";
  }
  if (tocUrl.includes("archiveofourown.org/works/") && !tocUrl.includes("view_full_work=true")) {
    tocUrl += (tocUrl.includes("?") ? "&" : "?") + "view_full_work=true";
  }

  // 2. Fetch page content with multi-tier fallback
  const fetchResult = await fetchNovelHtmlWithFallback(tocUrl);
  if (!fetchResult) {
    return {
      success: false,
      isCloudflareBlocked: true,
      novelTitle: "Web Novel",
      author: "Author",
      domain,
      sourceUrl: tocUrl,
      chapters: [],
      totalChaptersFound: 0,
    };
  }

  const { text: html, isMarkdown } = fetchResult;
  const $ = cheerio.load(html);

  let novelTitle =
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    "Web Novel";
  novelTitle = novelTitle
    .replace(/\s*[-–|•]\s*(?:Royal Road|Read Novel|Webnovel|Wuxiaworld|Free Web Novel|NovelFull).*$/i, "")
    .trim();

  let author =
    $('meta[name="author"]').attr("content") ||
    $("h4 a, .author a, .author, .byline").first().text().trim() ||
    "Original Author";

  // Shared discovery: same-site only, ignores sidebars, follows TOC pagination.
  const full = await fetchFullChapterList(tocUrl, fetchResult);
  const chapterLinks: DiscoveredChapterItem[] = (full?.links || []).map((l, i) => ({
    id: `ch-${i + 1}-${Math.random().toString(36).substring(2, 7)}`,
    chapterNumber: i + 1,
    title: l.title || `Chapter ${i + 1}`,
    url: l.url,
    isNotice: isNoticeOrExtra(l.url, l.title),
  }));

  return {
    success: true,
    novelTitle,
    author,
    domain,
    sourceUrl: tocUrl,
    chapters: chapterLinks,
    totalChaptersFound: chapterLinks.length,
  };
}

export interface NovelCrawlOptions {
  maxChapters?: number;
  selectedUrls?: string[];
  excludePatterns?: string[];
  excludeNotices?: boolean;
  /** 1-based chapter number in the table of contents to start from. */
  chapterStart?: number;
  chapterEnd?: number;
  /** Chapter number to assign to the first chapter when following "Next" links (used when resuming). */
  numberOffset?: number;
  /** Stop starting new downloads after this many ms so the request never times out (default 200s). */
  timeBudgetMs?: number;
}

// ---------------------------------------------------------------------------
// Shared chapter-link discovery helpers
// ---------------------------------------------------------------------------

const CHAPTER_TEXT_RE =
  /^(?:Chapter|Chap\.?|Ch\.?|Episode|Ep\.?|Part|Section|Volume|Vol\.?|Act|Book|Capítulo|Chapitre|Kapitel|Chương|Chuong|Hồi|第)\s*[\dIVXLCDM零一二三四五六七八九十百千\.:\s\-—–]/i;
const SPECIAL_CHAPTER_TITLE_RE = /^(?:Prologue|Epilogue|Side Story|Interlude|Afterword|Extra|Bonus Chapter)\b/i;
const CHAPTER_URL_RE = /(?:^|[\/\-_])(?:chapter|chap|ch|episode|ep|c)[\-_\/]?\d+/i;
const NAV_TEXT_RE =
  /^(?:read latest|latest chapter|latest release|jump to.*|read first|start reading|first chapter|last chapter|continue reading|bookmark|prev(?:ious)?(?: chapter)?|next(?: chapter)?|home|index|table of contents|toc|«|»|‹|›|<|>|<<|>>)$/i;
const UTILITY_SEGMENTS = new Set([
  "login", "signin", "sign-in", "register", "signup", "sign-up", "logout", "comment", "comments",
  "donate", "patreon", "discord", "review", "reviews", "forum", "forums", "support", "bookmark",
  "bookmarks", "latest", "random", "search", "tag", "tags", "genre", "genres", "ranking", "rankings",
  "account", "profile", "report", "share", "user", "users", "author", "authors",
]);
// Page regions that usually hold links to *other* novels or unrelated chapters.
const NOISE_REGION_SELECTOR = [
  "aside", "header", "footer", "nav:not(.chapter-nav)",
  ".sidebar", "[class*='sidebar']", "[id*='sidebar']",
  "[class*='latest']", "[id*='latest']", "[class*='recent']", "[id*='recent']",
  "[class*='popular']", "[class*='related']", "[class*='recommend']", "[class*='similar']",
  "[class*='comment']", "[id*='comment']", "[class*='widget']",
].join(", ");

interface RawChapterLink {
  title: string;
  url: string;
}

function normalizeNovelUrl(u: string): string {
  try {
    const x = new URL(u);
    x.hash = "";
    return (
      x.protocol + "//" + x.hostname.toLowerCase().replace(/^www\./, "") +
      x.pathname.replace(/\/+$/, "") + x.search
    );
  } catch {
    return u;
  }
}

function sameSite(a: URL, b: URL): boolean {
  return a.hostname.replace(/^www\./, "").toLowerCase() === b.hostname.replace(/^www\./, "").toLowerCase();
}

function isUtilityUrl(u: URL): boolean {
  return u.pathname
    .toLowerCase()
    .split("/")
    .filter(Boolean)
    .some((seg) => UTILITY_SEGMENTS.has(seg));
}

function looksLikeChapterUrl(u: URL): boolean {
  return CHAPTER_URL_RE.test(u.pathname + u.search);
}

function looksLikeChapterLink(u: URL, text: string, novelPath: string): boolean {
  if (looksLikeChapterUrl(u)) return true;
  if (CHAPTER_TEXT_RE.test(text) || SPECIAL_CHAPTER_TITLE_RE.test(text)) return true;
  if (/^\d+[\.\s\-—–:]+\S/.test(text)) return true;
  // Numeric child page of the novel, e.g. syosetu: /n1234ab/5/
  if (novelPath.length > 1 && u.pathname.startsWith(novelPath + "/") && /\/\d+\/?$/.test(u.pathname)) {
    return true;
  }
  return false;
}

function parseChapterNumber(text: string): number | null {
  const m =
    text.match(/(?:chapter|chap\.?|ch\.?|episode|ep\.?|chương|chuong|第)\s*(\d+)/i) ||
    text.match(/^(\d+)[\.\s\-—–:]/);
  return m ? parseInt(m[1], 10) : null;
}

/** The path that all chapters of this novel are expected to live under. */
function novelPathFromTocUrl(tocUrl: string): string {
  try {
    return new URL(tocUrl)
      .pathname.replace(/\/+$/, "")
      .replace(/\/navigate$/i, "")
      .replace(/\.(?:html?|php|aspx?)$/i, "");
  } catch {
    return "";
  }
}

/**
 * Collect chapter links from a table-of-contents page.
 * - same site only
 * - ignores sidebars / "latest updates" / comment areas
 * - prefers links that belong to *this* novel (shared path or slug)
 * - fixes newest-first ordering
 */
function collectChapterLinks(html: string, isMarkdown: boolean, pageUrl: string): RawChapterLink[] {
  const base = new URL(pageUrl);
  const novelPath = novelPathFromTocUrl(pageUrl);
  const pageKey = normalizeNovelUrl(pageUrl);
  const candidates: RawChapterLink[] = [];

  const consider = (href: string | undefined, rawText: string) => {
    if (!href || /^(?:#|javascript:|mailto:|tel:)/i.test(href)) return;
    let u: URL;
    try {
      u = new URL(href, pageUrl);
    } catch {
      return;
    }
    if (!/^https?:$/.test(u.protocol) || !sameSite(u, base)) return;
    u.hash = "";
    const text = rawText.trim().replace(/\s+/g, " ");
    if (NAV_TEXT_RE.test(text)) return;
    if (isUtilityUrl(u)) return;
    if (normalizeNovelUrl(u.href) === pageKey) return;
    if (!looksLikeChapterLink(u, text, novelPath)) return;
    candidates.push({ title: text, url: u.href });
  };

  if (isMarkdown) {
    const mdLinkRegex = /\[([^\]\n]+)\]\((https?:\/\/[^\s\)\n]+)\)/g;
    let m;
    while ((m = mdLinkRegex.exec(html)) !== null) consider(m[2], m[1]);
  } else {
    const $ = cheerio.load(html);
    $("a[href]").each((_, el) => {
      if ($(el).closest(NOISE_REGION_SELECTOR).length > 0) return;
      consider($(el).attr("href"), $(el).text());
    });
  }

  // Keep only links that belong to this novel when we can tell.
  let pool = candidates;
  if (novelPath.length > 1) {
    const byPrefix = candidates.filter((c) => new URL(c.url).pathname.startsWith(novelPath + "/"));
    if (byPrefix.length >= 3) {
      pool = byPrefix;
    } else {
      const slug = (novelPath.split("/").filter(Boolean).pop() || "").toLowerCase();
      if (slug.length >= 4 && !/^\d+$/.test(slug)) {
        const bySlug = candidates.filter((c) => new URL(c.url).pathname.toLowerCase().includes(slug));
        if (bySlug.length >= 3) pool = bySlug;
      }
    }
  }

  // De-duplicate (first occurrence wins).
  const seen = new Set<string>();
  const out: RawChapterLink[] = [];
  for (const c of pool) {
    const key = normalizeNovelUrl(c.url);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }

  // Some sites list newest chapters first — flip so chapter 1 comes first.
  const nums = out.map((c) => parseChapterNumber(c.title) ?? parseChapterNumber(new URL(c.url).pathname));
  const firstNum = nums.find((n) => n !== null);
  const lastNum = [...nums].reverse().find((n) => n !== null);
  if (out.length >= 3 && firstNum != null && lastNum != null && firstNum > lastNum) {
    out.reverse();
  }

  return out;
}

/** Find extra pages of a paginated table of contents (?page=2, /page/2, ...). */
function findTocPageUrls(html: string, tocUrl: string, maxTocPages = 60): string[] {
  const $ = cheerio.load(html);
  const base = new URL(tocUrl);
  const basePath = base.pathname.replace(/\/+$/, "").replace(/\/page\/\d+$/i, "");
  let maxN = 1;
  let makeUrl: ((n: number) => string) | null = null;

  $("a[href]").each((_, el) => {
    let u: URL;
    try {
      u = new URL($(el).attr("href") || "", tocUrl);
    } catch {
      return;
    }
    if (!sameSite(u, base)) return;
    const path = u.pathname.replace(/\/+$/, "");

    for (const key of ["page", "p", "pg", "paged"]) {
      const v = u.searchParams.get(key);
      if (v && /^\d+$/.test(v) && path === basePath) {
        const n = parseInt(v, 10);
        if (n > maxN) {
          maxN = n;
          const href = u.href;
          makeUrl = (k) => {
            const x = new URL(href);
            x.searchParams.set(key, String(k));
            return x.href;
          };
        }
        return;
      }
    }

    const m = path.match(/^(.*)\/page\/(\d+)$/i);
    if (m && m[1] === basePath) {
      const n = parseInt(m[2], 10);
      if (n > maxN) {
        maxN = n;
        const origin = u.origin;
        makeUrl = (k) => `${origin}${basePath}/page/${k}`;
      }
    }
  });

  if (!makeUrl || maxN < 2) return [];
  const urls: string[] = [];
  for (let n = 2; n <= Math.min(maxN, maxTocPages); n++) urls.push((makeUrl as (n: number) => string)(n));
  return urls;
}

/** Fetch a TOC page plus all of its pagination pages and return every chapter link in order. */
async function fetchFullChapterList(
  tocUrl: string,
  firstPage?: { text: string; isMarkdown: boolean }
): Promise<{ links: RawChapterLink[]; html: string; isMarkdown: boolean } | null> {
  const first = firstPage || (await fetchNovelHtmlWithFallback(tocUrl, 8000));
  if (!first) return null;

  let links = collectChapterLinks(first.text, first.isMarkdown, tocUrl);
  if (!first.isMarkdown) {
    const extraPages = findTocPageUrls(first.text, tocUrl);
    const seen = new Set(links.map((l) => normalizeNovelUrl(l.url)));
    for (let i = 0; i < extraPages.length; i += 4) {
      const batch = await Promise.all(
        extraPages.slice(i, i + 4).map((u) => fetchNovelHtmlWithFallback(u, 8000))
      );
      batch.forEach((page, j) => {
        if (!page) return;
        for (const l of collectChapterLinks(page.text, page.isMarkdown, extraPages[i + j])) {
          const key = normalizeNovelUrl(l.url);
          if (!seen.has(key)) {
            seen.add(key);
            links.push(l);
          }
        }
      });
    }
  }
  return { links, html: first.text, isMarkdown: first.isMarkdown };
}

/** Known sites where a chapter URL maps directly to its table of contents. */
function knownTocUrlFor(url: string): string | null {
  const rr = url.match(/^(https?:\/\/[^\/]+\/fiction\/\d+\/[^\/?#]+)\/chapter\//i);
  if (rr) return rr[1];
  const syosetu = url.match(/^(https?:\/\/ncode\.syosetu\.com\/[^\/]+)\/\d+\/?$/i);
  if (syosetu) return syosetu[1] + "/";
  const ao3 = url.match(/^(https?:\/\/(?:www\.)?archiveofourown\.org\/works\/\d+)\/chapters\/\d+/i);
  if (ao3) return ao3[1] + "/navigate";
  return null;
}

/** Guess where the table of contents is, starting from a chapter page. */
function guessTocUrlsFromChapterPage(html: string, isMarkdown: boolean, chapterUrl: string): string[] {
  const out: string[] = [];
  const push = (u: string | undefined) => {
    if (!u) return;
    try {
      const abs = new URL(u, chapterUrl);
      if (!sameSite(abs, new URL(chapterUrl))) return;
      abs.hash = "";
      if (normalizeNovelUrl(abs.href) === normalizeNovelUrl(chapterUrl)) return;
      if (!out.includes(abs.href)) out.push(abs.href);
    } catch {}
  };

  const tocText = /^(?:table of contents|contents|toc|index|chapter list|chapters|all chapters|novel info|book info|目次|目录|mục lục|danh sách chương)$/i;
  if (isMarkdown) {
    const mdLinkRegex = /\[([^\]\n]+)\]\((https?:\/\/[^\s\)\n]+)\)/g;
    let m;
    while ((m = mdLinkRegex.exec(html)) !== null) {
      if (tocText.test(m[1].trim())) push(m[2]);
    }
  } else {
    const $ = cheerio.load(html);
    push($('a[rel~="up"], a[rel~="index"], a[rel~="contents"]').first().attr("href"));
    $("a[href]").each((_, el) => {
      const t = $(el).text().trim().replace(/\s+/g, " ");
      if (tocText.test(t)) push($(el).attr("href"));
    });
  }

  // Parent path: /my-novel/chapter-12 -> /my-novel and /my-novel.html
  try {
    const u = new URL(chapterUrl);
    const segs = u.pathname.replace(/\/+$/, "").split("/");
    segs.pop();
    // Skip a bare "/chapter" folder (e.g. /novel/x/chapter/123)
    if (/^(?:chapter|chapters|c|ch|read)$/i.test(segs[segs.length - 1] || "")) segs.pop();
    const parent = segs.join("/");
    if (parent.length > 1) {
      push(`${u.origin}${parent}`);
      push(`${u.origin}${parent}/`);
      push(`${u.origin}${parent}.html`);
    }
  } catch {}

  return out.slice(0, 4);
}

function findNextChapterUrl(page: { text: string; isMarkdown: boolean }, currentUrl: string): string | null {
  const current = new URL(currentUrl);
  const accept = (href: string | undefined): string | null => {
    if (!href || /^(?:#|javascript:)/i.test(href)) return null;
    try {
      const u = new URL(href, currentUrl);
      u.hash = "";
      if (!sameSite(u, current)) return null;
      if (normalizeNovelUrl(u.href) === normalizeNovelUrl(currentUrl)) return null;
      if (isUtilityUrl(u)) return null;
      return u.href;
    } catch {
      return null;
    }
  };
  const NEXT_TEXT =
    /^(?:next(?:\s*(?:chapter|chap|ch\.?|episode|part))?|下一章|下一页|次へ|次の話|次話|chương sau|chương tiếp|tiếp|siguiente|suivant)$/i;
  const clean = (t: string) => t.replace(/[›»>→⟩❯▶▸⇒←‹«<]+/g, "").replace(/\s+/g, " ").trim();

  if (page.isMarkdown) {
    const mdLinkRegex = /\[([^\]\n]+)\]\((https?:\/\/[^\s\)\n]+)\)/g;
    let m;
    while ((m = mdLinkRegex.exec(page.text)) !== null) {
      if (NEXT_TEXT.test(clean(m[1]))) {
        const ok = accept(m[2]);
        if (ok) return ok;
      }
    }
    return null;
  }

  const $ = cheerio.load(page.text);
  const relNext = accept($('a[rel~="next"]').first().attr("href"));
  if (relNext) return relNext;

  let byText: string | null = null;
  $("a[href]").each((_, el) => {
    if (byText) return;
    const t = clean($(el).text());
    if (NEXT_TEXT.test(t) || NEXT_TEXT.test(clean($(el).attr("title") || ""))) {
      byText = accept($(el).attr("href"));
    }
  });
  if (byText) return byText;

  const byClass = accept(
    $("a.next, a.next-chapter, a.btn-next, a#next_chap, a#next-chapter, .nav-next a, .next-post a")
      .first()
      .attr("href")
  );
  return byClass;
}

function markdownToParagraphs(md: string): { title: string; paragraphs: string[] } {
  const title = (md.match(/^Title:\s*(.+)$/m)?.[1] || "").trim();
  const body = md.split(/Markdown Content:\s*/i).pop() || md;
  const paragraphs = body
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) =>
      p
        .trim()
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/^#+\s*/, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(
      (p) =>
        p.length > 12 &&
        !/^(?:Title:|URL Source:|Published Time:|Markdown Content:)/.test(p) &&
        !/^(?:previous chapter|next chapter|table of contents|index)$/i.test(p)
    );
  return { title, paragraphs };
}

/** Download one chapter with all fallbacks. Returns null if it couldn't be read. */
async function fetchChapterContent(
  url: string
): Promise<{ title: string; paragraphs: string[]; page: { text: string; isMarkdown: boolean } } | null> {
  const page = await fetchNovelHtmlWithFallback(url, 8000);
  if (!page) return null;
  if (page.isMarkdown) {
    const md = markdownToParagraphs(page.text);
    return md.paragraphs.length > 0 ? { ...md, page } : null;
  }
  const extracted = extractNovelChapterContent(cheerio.load(page.text));
  return extracted.paragraphs.length > 0 ? { ...extracted, page } : null;
}

function formatChapterTitle(rawTitle: string, chapterNumber: number): string {
  const t = (rawTitle || "").trim();
  if (!t) return `Chapter ${chapterNumber}`;
  if (CHAPTER_TEXT_RE.test(t) || SPECIAL_CHAPTER_TITLE_RE.test(t)) return t;
  return `Chapter ${chapterNumber}: ${t}`;
}

function buildCrawledChapter(
  chapterNumber: number,
  title: string,
  url: string,
  paragraphs: string[]
): NovelCrawledChapter {
  return {
    chapterNumber,
    title,
    url,
    paragraphs,
    bulletPoints: [
      `Narrative sequence for ${title}`,
      `${paragraphs.length} paragraphs unabridged dialogue and prose`,
    ],
    rawText: paragraphs.join("\n\n"),
  };
}

function readNovelMeta(html: string, isMarkdown: boolean): { novelTitle: string; author: string } {
  if (isMarkdown) {
    const t = (html.match(/^Title:\s*(.+)$/m)?.[1] || "Web Novel").trim();
    return { novelTitle: t, author: "Original Author" };
  }
  const $ = cheerio.load(html);
  let novelTitle =
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    "Web Novel";
  novelTitle = novelTitle
    .replace(/\s*[-–|•]\s*(?:Royal Road|Read Novel|Webnovel|Wuxiaworld|Free Web Novel|NovelFull).*$/i, "")
    .trim();
  const author =
    $('meta[name="author"]').attr("content") ||
    $("h4 a, .author a, .author, .byline").first().text().trim() ||
    "Original Author";
  return { novelTitle, author };
}

// ---------------------------------------------------------------------------
// Main novel crawler
// ---------------------------------------------------------------------------

async function crawlNovelChapters(
  startUrl: string,
  optionsInput: number | NovelCrawlOptions = 25
): Promise<NovelCrawlResult | null> {
  const options: NovelCrawlOptions =
    typeof optionsInput === "number" ? { maxChapters: optionsInput } : optionsInput || {};
  const maxChapters = Math.max(1, options.maxChapters || 25);
  const excludePatterns = options.excludePatterns;
  const excludeNotices = options.excludeNotices !== false;
  const deadline = Date.now() + (options.timeBudgetMs || 200_000);

  const isExcludedByPattern = (url: string, title: string) =>
    !!excludePatterns?.length &&
    excludePatterns.some((p) => (url + " " + title).toLowerCase().includes(p.toLowerCase()));

  try {
    const startObj = new URL(startUrl);
    const domain = startObj.hostname.replace(/^www\./, "");

    // ---- 0. Explicit list of chapter URLs from the preview picker ----
    if (options.selectedUrls && options.selectedUrls.length > 0) {
      const list = options.selectedUrls.map((u, i) => ({ title: `Chapter ${i + 1}`, url: u }));
      return await downloadChapterList({
        list,
        startIndex: 0,
        endIndex: Math.min(list.length, maxChapters),
        meta: { novelTitle: "Web Novel", author: "Original Author" },
        domain,
        startUrl,
        tocUrl: startUrl,
        deadline,
      });
    }

    // ---- 1. Work out where the table of contents is ----
    let tocUrl = knownTocUrlFor(startUrl) || startUrl;
    {
      const t = new URL(tocUrl);
      if (/archiveofourown\.org$/i.test(t.hostname) && /^\/works\/\d+\/?$/.test(t.pathname)) {
        t.pathname = t.pathname.replace(/\/?$/, "/navigate");
        t.search = "";
        tocUrl = t.href;
      }
    }
    const startIsChapter = tocUrl !== startUrl || looksLikeChapterUrl(startObj);

    const firstPage = await fetchNovelHtmlWithFallback(tocUrl, 8000);
    if (!firstPage) return null;

    // ---- 2. Project Gutenberg / single-file books ----
    if (
      !firstPage.isMarkdown &&
      (startUrl.includes("gutenberg.org") || /Project Gutenberg/i.test(firstPage.text))
    ) {
      const g = parseGutenbergBook(firstPage.text, startUrl, maxChapters, options.chapterStart);
      if (g) return { ...g, domain };
    }

    // ---- 3. Build the full chapter list ----
    let list: RawChapterLink[] = [];
    let metaSource = firstPage;
    let resolvedTocUrl = tocUrl;

    if (!startIsChapter) {
      const full = await fetchFullChapterList(tocUrl, firstPage);
      if (full) list = full.links;
    } else {
      // Pasted a chapter link: find the TOC that contains this exact chapter.
      const knownToc = knownTocUrlFor(startUrl);
      const tocCandidates = knownToc
        ? [tocUrl]
        : guessTocUrlsFromChapterPage(firstPage.text, firstPage.isMarkdown, startUrl);
      const startKey = normalizeNovelUrl(startUrl);
      for (const candidate of tocCandidates) {
        if (Date.now() > deadline) break;
        const full = await fetchFullChapterList(candidate, candidate === tocUrl ? firstPage : undefined);
        if (full && full.links.some((l) => normalizeNovelUrl(l.url) === startKey)) {
          list = full.links;
          resolvedTocUrl = candidate;
          metaSource = { text: full.html, isMarkdown: full.isMarkdown, source: "toc" };
          break;
        }
      }
    }

    // Remove notices / user-excluded entries before numbering so numbers stay stable between runs.
    list = list.filter(
      (l) => !(excludeNotices && isNoticeOrExtra(l.url, l.title)) && !isExcludedByPattern(l.url, l.title)
    );

    const meta = readNovelMeta(metaSource.text, metaSource.isMarkdown);

    // ---- 4a. TOC mode ----
    if (list.length >= 2) {
      let startIndex = 0;
      if (options.chapterStart && options.chapterStart > 0) {
        startIndex = options.chapterStart - 1;
      } else if (startIsChapter) {
        const startKey = normalizeNovelUrl(startUrl);
        const idx = list.findIndex((l) => normalizeNovelUrl(l.url) === startKey);
        if (idx >= 0) startIndex = idx;
      }
      if (startIndex >= list.length) {
        return {
          ...meta,
          domain,
          startUrl,
          tocUrl: resolvedTocUrl,
          mode: "toc",
          totalChaptersFound: list.length,
          chapters: [],
          hasMore: false,
          failedChapters: [],
          firstChapterNumber: startIndex + 1,
        };
      }
      let endIndex = Math.min(list.length, startIndex + maxChapters);
      if (options.chapterEnd && options.chapterEnd >= startIndex + 1) {
        endIndex = Math.min(endIndex, options.chapterEnd);
      }
      return await downloadChapterList({
        list,
        startIndex,
        endIndex,
        meta,
        domain,
        startUrl,
        tocUrl: resolvedTocUrl,
        deadline,
      });
    }

    // ---- 4b. Sequential mode: follow "Next chapter" links from the URL the user gave ----
    return await crawlSequentially({
      startUrl,
      firstPage: tocUrl === startUrl ? firstPage : undefined,
      maxChapters,
      numberOffset: options.numberOffset,
      excludeNotices,
      isExcludedByPattern,
      meta,
      domain,
      deadline,
    });
  } catch (err: any) {
    console.warn("crawlNovelChapters exception:", err?.message || err);
    return null;
  }
}

async function downloadChapterList(args: {
  list: RawChapterLink[];
  startIndex: number;
  endIndex: number;
  meta: { novelTitle: string; author: string };
  domain: string;
  startUrl: string;
  tocUrl: string;
  deadline: number;
}): Promise<NovelCrawlResult> {
  const { list, startIndex, endIndex, meta, domain, startUrl, tocUrl, deadline } = args;
  const results = new Map<number, NovelCrawledChapter>();
  let failed: number[] = [];
  let nextUnattempted = endIndex;

  const fetchOne = async (i: number) => {
    const link = list[i];
    const content = await fetchChapterContent(link.url);
    if (!content) return false;
    const chapterNumber = i + 1;
    const title = formatChapterTitle(content.title || link.title, chapterNumber);
    results.set(i, buildCrawledChapter(chapterNumber, title, link.url, content.paragraphs));
    return true;
  };

  // First pass, 4 at a time (gentler on sites = fewer rate-limit failures).
  const BATCH = 4;
  for (let i = startIndex; i < endIndex; i += BATCH) {
    if (Date.now() > deadline) {
      nextUnattempted = i;
      break;
    }
    const idxs = Array.from({ length: Math.min(BATCH, endIndex - i) }, (_, k) => i + k);
    const ok = await Promise.all(idxs.map((idx) => fetchOne(idx).catch(() => false)));
    idxs.forEach((idx, k) => {
      if (!ok[k]) failed.push(idx);
    });
  }

  // Retry failures once, slower.
  if (failed.length > 0 && Date.now() < deadline) {
    const retry = failed;
    failed = [];
    for (let i = 0; i < retry.length; i += 2) {
      if (Date.now() > deadline) {
        failed.push(...retry.slice(i));
        break;
      }
      const pair = retry.slice(i, i + 2);
      await new Promise((r) => setTimeout(r, 600));
      const ok = await Promise.all(pair.map((idx) => fetchOne(idx).catch(() => false)));
      pair.forEach((idx, k) => {
        if (!ok[k]) failed.push(idx);
      });
    }
  }

  const chapters = [...results.keys()].sort((a, b) => a - b).map((k) => results.get(k)!);
  const hasMore = nextUnattempted < list.length;

  return {
    ...meta,
    domain,
    startUrl,
    tocUrl,
    mode: "toc",
    totalChaptersFound: list.length,
    chapters,
    firstChapterNumber: startIndex + 1,
    hasMore,
    resume: hasMore ? { url: tocUrl, chapterStart: nextUnattempted + 1 } : undefined,
    failedChapters: failed
      .sort((a, b) => a - b)
      .map((i) => ({ chapterNumber: i + 1, title: list[i].title, url: list[i].url })),
  };
}

async function crawlSequentially(args: {
  startUrl: string;
  firstPage?: { text: string; isMarkdown: boolean };
  maxChapters: number;
  numberOffset?: number;
  excludeNotices: boolean;
  isExcludedByPattern: (url: string, title: string) => boolean;
  meta: { novelTitle: string; author: string };
  domain: string;
  deadline: number;
}): Promise<NovelCrawlResult | null> {
  const { startUrl, maxChapters, excludeNotices, isExcludedByPattern, meta, domain, deadline } = args;
  const chapters: NovelCrawledChapter[] = [];
  const failedChapters: Array<{ chapterNumber: number; title: string; url: string }> = [];
  const visited = new Set<string>();
  let currentUrl: string | null = startUrl;
  let nextNumber = args.numberOffset && args.numberOffset > 0 ? args.numberOffset : 0;
  let pendingPage: { text: string; isMarkdown: boolean } | undefined = args.firstPage;
  let steps = 0;

  while (currentUrl && chapters.length < maxChapters && steps < maxChapters * 2 + 5) {
    if (Date.now() > deadline) break;
    const key = normalizeNovelUrl(currentUrl);
    if (visited.has(key)) {
      currentUrl = null;
      break;
    }
    visited.add(key);
    steps++;

    let page = pendingPage || (await fetchNovelHtmlWithFallback(currentUrl, 8000));
    pendingPage = undefined;
    if (!page) {
      // one retry
      await new Promise((r) => setTimeout(r, 800));
      page = await fetchNovelHtmlWithFallback(currentUrl, 8000);
    }
    if (!page) {
      failedChapters.push({
        chapterNumber: nextNumber || chapters.length + 1,
        title: "Unreadable page",
        url: currentUrl,
      });
      break; // can't find "next" without the page
    }

    const nextUrl = findNextChapterUrl(page, currentUrl);
    const extracted = page.isMarkdown
      ? markdownToParagraphs(page.text)
      : extractNovelChapterContent(cheerio.load(page.text));

    if (nextNumber === 0) {
      nextNumber = parseChapterNumber(extracted.title) ?? parseChapterNumber(new URL(currentUrl).pathname) ?? 1;
    }

    const title = formatChapterTitle(extracted.title, nextNumber);
    const wordCount = extracted.paragraphs.reduce((s, p) => s + p.split(/\s+/).filter(Boolean).length, 0);
    const skip =
      (excludeNotices && (isNoticeOrExtra(currentUrl, title) || wordCount < 90)) ||
      isExcludedByPattern(currentUrl, title);

    if (!skip && extracted.paragraphs.length > 0) {
      chapters.push(buildCrawledChapter(nextNumber, title, currentUrl, extracted.paragraphs));
      nextNumber++;
    }

    currentUrl = nextUrl;
  }

  if (chapters.length === 0) return null;

  const hasMore = !!currentUrl;
  return {
    ...meta,
    domain,
    startUrl,
    mode: "sequential",
    totalChaptersFound: chapters.length,
    chapters,
    firstChapterNumber: chapters[0].chapterNumber,
    hasMore,
    resume: hasMore && currentUrl ? { url: currentUrl, numberOffset: nextNumber } : undefined,
    failedChapters,
  };
}

function parseGutenbergBook(
  html: string,
  startUrl: string,
  maxChapters: number,
  chapterStart?: number
): Omit<NovelCrawlResult, "domain"> | null {
  const $ = cheerio.load(html);
  const meta = readNovelMeta(html, false);
  const bodyText = $("body").text().replace(/\r/g, "");
  const chunks = bodyText.split(/(?=(?:CHAPTER|Chapter)\s+[IVXLCDM\d]+)/g);
  if (chunks.length < 2) return null;

  const cleanBookTitle = meta.novelTitle.replace(/The Project Gutenberg eBook of\s*/i, "").trim();
  const all: NovelCrawledChapter[] = [];
  for (const chunk of chunks) {
    const lines = chunk
      .split(/\n{2,}/)
      .map((l) => l.trim().replace(/\s+/g, " "))
      .filter((l) => l.length > 0);
    if (lines.length > 0 && /^(?:CHAPTER|Chapter)\s+[IVXLCDM\d]+/i.test(lines[0])) {
      const paras = lines
        .slice(1)
        .filter((p) => p.length > 10 && !p.includes("*** END OF THE PROJECT GUTENBERG"));
      if (paras.length > 0) {
        const n = all.length + 1;
        all.push(buildCrawledChapter(n, lines[0], startUrl + `#chapter-${n}`, paras));
      }
    }
  }
  if (all.length === 0) return null;

  const startIndex = Math.max(0, (chapterStart || 1) - 1);
  const endIndex = Math.min(all.length, startIndex + maxChapters);
  const hasMore = endIndex < all.length;
  return {
    novelTitle: cleanBookTitle,
    author: meta.author || "Classic Literature",
    startUrl,
    tocUrl: startUrl,
    mode: "toc",
    totalChaptersFound: all.length,
    chapters: all.slice(startIndex, endIndex),
    firstChapterNumber: startIndex + 1,
    hasMore,
    resume: hasMore ? { url: startUrl, chapterStart: endIndex + 1 } : undefined,
    failedChapters: [],
  };
}

/**
 * Builds the Express app with all /api routes (no listening, no Vite).
 * Used by the local/Cloud Run server below AND by the Vercel function in api/index.ts.
 */
export function createApp() {
  const app = express();

  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ extended: true, limit: "100mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Rapid Table of Contents & Chapter Link Discovery endpoint
  app.get("/api/novel-toc", async (req, res) => {
    const rawUrl = (req.query.url as string) || "";
    if (!rawUrl.trim()) {
      return res.status(400).json({ success: false, error: "Missing novel URL parameter." });
    }

    try {
      const tocResult = await discoverNovelTOC(rawUrl.trim());
      return res.json(tocResult);
    } catch (err: any) {
      console.warn("API /api/novel-toc error:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to discover novel table of contents.",
      });
    }
  });

  // Universal Link Discovery & Crawl Preview endpoint (Novels and Websites)
  app.get(["/api/discover-pages", "/api/crawl-preview"], async (req, res) => {
    const rawUrl = (req.query.url as string) || "";
    const scope = (req.query.scope as string) || "novel";
    if (!rawUrl.trim()) {
      return res.status(400).json({ success: false, error: "Missing URL parameter." });
    }

    try {
      if (scope === "domain") {
        const domainResult = await discoverDomainPages(rawUrl.trim());
        return res.json(domainResult);
      } else {
        const tocResult = await discoverNovelTOC(rawUrl.trim());
        return res.json(tocResult);
      }
    } catch (err: any) {
      console.warn("API /api/discover-pages error:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to discover links.",
      });
    }
  });

  // Single Chapter Extraction endpoint with multi-tier fallback
  app.post("/api/novel-chapter", async (req, res) => {
    const { url, chapterNumber = 1, title = "" } = req.body || {};
    if (!url || typeof url !== "string") {
      return res.status(400).json({ success: false, error: "Missing chapter URL." });
    }

    try {
      const fetchResult = await fetchNovelHtmlWithFallback(url.trim(), 6000);
      if (!fetchResult) {
        return res.status(422).json({
          success: false,
          error: "Failed to fetch chapter. Server was blocked or request timed out.",
        });
      }

      const { text: content, isMarkdown } = fetchResult;
      let paras: string[] = [];
      let chapterTitle = title || `Chapter ${chapterNumber}`;

      if (isMarkdown) {
        paras = content
          .split(/\n{2,}|\r\n\r\n/)
          .map((p) => p.trim())
          .filter(
            (p) =>
              p.length > 12 &&
              !p.startsWith("Title:") &&
              !p.startsWith("URL Source:") &&
              !p.startsWith("Markdown Content:")
          );
      } else {
        const $ = cheerio.load(content);
        const extracted = extractNovelChapterContent($);
        paras = extracted.paragraphs;
        if (extracted.title) {
          chapterTitle = extracted.title;
        }
      }

      if (!/^(?:Chapter|Ch\.?|Episode|Part|Section|Volume|Act|第|Prologue|Epilogue)/i.test(chapterTitle)) {
        chapterTitle = `Chapter ${chapterNumber}: ${chapterTitle}`;
      }

      const wordCount = paras.reduce((sum, p) => sum + p.split(/\s+/).filter(Boolean).length, 0);

      return res.json({
        success: true,
        chapter: {
          chapterNumber,
          title: chapterTitle,
          url,
          paragraphs: paras,
          wordCount,
          rawText: paras.join("\n\n"),
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Chapter extraction failed." });
    }
  });

  // Batch Chapters Extraction endpoint (concurrent up to 8 chapters)
  app.post("/api/novel-batch", async (req, res) => {
    const { chapters } = req.body || {};
    if (!Array.isArray(chapters) || chapters.length === 0) {
      return res.status(400).json({ success: false, error: "Missing chapters array." });
    }

    const targetList = chapters.slice(0, 10);
    const results = await Promise.all(
      targetList.map(async (item: { url: string; chapterNumber: number; title: string }) => {
        try {
          const fetchResult = await fetchNovelHtmlWithFallback(item.url.trim(), 6000);
          if (!fetchResult) return null;

          const { text: content, isMarkdown } = fetchResult;
          let paras: string[] = [];
          let chapterTitle = item.title || `Chapter ${item.chapterNumber}`;

          if (isMarkdown) {
            paras = content
              .split(/\n{2,}|\r\n\r\n/)
              .map((p) => p.trim())
              .filter(
                (p) =>
                  p.length > 12 &&
                  !p.startsWith("Title:") &&
                  !p.startsWith("URL Source:") &&
                  !p.startsWith("Markdown Content:")
              );
          } else {
            const $ = cheerio.load(content);
            const extracted = extractNovelChapterContent($);
            paras = extracted.paragraphs;
            if (extracted.title) chapterTitle = extracted.title;
          }

          if (!/^(?:Chapter|Ch\.?|Episode|Part|Section|Volume|Act|第|Prologue|Epilogue)/i.test(chapterTitle)) {
            chapterTitle = `Chapter ${item.chapterNumber}: ${chapterTitle}`;
          }

          if (paras.length === 0) return null;
          const wordCount = paras.reduce((sum, p) => sum + p.split(/\s+/).filter(Boolean).length, 0);

          return {
            chapterNumber: item.chapterNumber,
            title: chapterTitle,
            url: item.url,
            paragraphs: paras,
            wordCount,
            rawText: paras.join("\n\n"),
          };
        } catch {
          return null;
        }
      })
    );

    return res.json({
      success: true,
      chapters: results.filter(Boolean),
    });
  });

  // Finalize Document endpoint: Packages crawled/imported chapters into Google Doc Professional Mode
  app.post("/api/novel-finalize", async (req, res) => {
    const { novelTitle = "Web Novel", author = "Author", domain = "webnovel.com", sourceUrl = "", chapters } =
      req.body || {};

    if (!Array.isArray(chapters) || chapters.length === 0) {
      return res.status(400).json({ success: false, error: "At least one chapter is required to finalize." });
    }

    const validChapters = chapters.filter(
      (c: any) => c && Array.isArray(c.paragraphs) && c.paragraphs.length > 0
    );

    if (validChapters.length === 0) {
      return res.status(400).json({ success: false, error: "No chapters with valid paragraph text found." });
    }

    const completeSections = validChapters.map((ch: any, idx: number) => ({
      heading: ch.title || `Chapter ${idx + 1}`,
      level: 1,
      paragraphs: ch.paragraphs,
      bulletPoints: [
        `Narrative sequence for ${ch.title || `Chapter ${idx + 1}`}`,
        `${ch.paragraphs.length} paragraphs unabridged dialogue and prose`,
      ],
      callout: ch.url ? `Chapter Source: ${ch.url}` : undefined,
    }));

    const finalDisguiseTitle = `Enterprise Technical Specification & Structural Architecture (Dossier: ${novelTitle.toUpperCase()})`;
    const finalSubtitle = `By ${author} • Full Novel Compilation (${validChapters.length} Chapters) • Source: ${domain}`;
    const finalDisguiseSubtitle =
      "Enterprise Systems Group • Document Classification: Internal Eyes Only • Zero External Assets";

    const reviewData = generateFastStructuredReviews(novelTitle, finalDisguiseTitle, completeSections, true);

    const totalWords = completeSections.reduce(
      (sum, s) => sum + s.paragraphs.reduce((pSum, p) => pSum + p.split(/\s+/).filter(Boolean).length, 0),
      0
    );
    const readingTimeMinutes = Math.max(1, Math.ceil(totalWords / 200));

    const finalSections = completeSections.map((sec, idx) => {
      const review = reviewData.chapterReviews?.[idx];
      const baseDisguiseHeading =
        review?.disguiseChapterTitle || `${idx + 1}.0 Technical Specification Section`;
      return {
        ...sec,
        disguiseHeading: baseDisguiseHeading,
      };
    });

    const fullMarkdown = `# ${novelTitle}\n\n**Author:** ${author}\n**Total Chapters:** ${validChapters.length}\n**Source:** ${sourceUrl}\n\n${finalSections
      .map((s) => `## ${s.heading}\n\n${s.paragraphs.join("\n\n")}`)
      .join("\n\n")}`;

    const publishDate = new Date().toLocaleDateString();

    const documentData = {
      title: novelTitle,
      disguiseTitle: finalDisguiseTitle,
      subtitle: finalSubtitle,
      disguiseSubtitle: finalDisguiseSubtitle,
      author: author,
      date: publishDate,
      domain: domain,
      sourceUrl: sourceUrl,
      isNovelContent: true,
      isCrawledNovel: true,
      novelChapterCount: validChapters.length,
      crawledPagesCount: validChapters.length,
      crawledUrls: validChapters.map((c: any) => c.url).filter(Boolean),
      executiveSummary:
        reviewData.executiveSummary ||
        `Full novel compilation of "${novelTitle}" by ${author}. Successfully extracted ${validChapters.length} complete chapters in unabridged format under Google Doc Professional Mode.`,
      disguiseExecutiveSummary:
        reviewData.disguiseExecutiveSummary ||
        `Enterprise compliance review and system specifications audit for ${novelTitle}. Zero-image documentation prepared for internal administrative verification.`,
      readingTimeMinutes,
      wordCount: totalWords,
      sections: finalSections,
      chapterReviews: reviewData.chapterReviews,
      fullMarkdown,
      extractedAt: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };

    return res.json({
      success: true,
      data: documentData,
    });
  });

  // Streaming live novel extraction endpoint (SSE) with real-time chapter progress
  app.get("/api/stream-novel", async (req, res) => {
    const rawUrl = (req.query.url as string) || "";
    const maxChaptersRequested = parseInt((req.query.maxChapters as string) || "999", 10) || 999;

    if (!rawUrl) {
      return res.status(400).json({ error: "Missing novel URL." });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    let isClosed = false;
    req.on("close", () => {
      isClosed = true;
    });

    const send = (event: string, data: any) => {
      if (!isClosed) {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      }
    };

    try {
      send("status", { message: "Connecting to novel site...", step: "discovering" });

      const parsedUrl = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
      const domain = parsedUrl.hostname.replace(/^www\./, "");

      // 1. Discover TOC
      let tocUrl = parsedUrl.href;
      const rrChapterMatch = parsedUrl.href.match(/^(https?:\/\/[^\/]+\/fiction\/\d+\/[^\/]+)\/chapter\//i);
      if (rrChapterMatch) {
        tocUrl = rrChapterMatch[1];
      }

      // Fetch TOC with fallback
      let html = "";
      try {
        const r = await fetch(tocUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(4000),
        });
        if (r.ok) html = await r.text();
      } catch {}

      if (!html) {
        try {
          const ao = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(tocUrl)}`, {
            signal: AbortSignal.timeout(4000),
          });
          if (ao.ok) html = await ao.text();
        } catch {}
      }

      if (!html) {
        try {
          const jina = await fetch(`https://r.jina.ai/${tocUrl}`, {
            headers: { Accept: "text/plain" },
            signal: AbortSignal.timeout(4000),
          });
          if (jina.ok) html = await jina.text();
        } catch {}
      }

      if (!html) {
        send("error", {
          message: `Could not access ${domain}. This site is protected by Cloudflare bot protection (HTTP 403 / Turnstile challenge).`,
          isCloudflareBlocked: true,
          domain,
        });
        return res.end();
      }

      const $ = cheerio.load(html);
      let novelTitle =
        $('meta[property="og:title"]').attr("content") ||
        $("h1").first().text().trim() ||
        $("title").text().trim() ||
        "Web Novel";
      novelTitle = novelTitle.replace(/\s*[-–|•]\s*(?:Royal Road|Read Novel|Webnovel|Wuxiaworld|Free Web Novel|NovelFull).*$/i, "").trim();

      let author =
        $('meta[name="author"]').attr("content") ||
        $("h4 a, .author a, .author, .byline").first().text().trim() ||
        "Original Author";

      // Discover chapter links
      const chapterLinks: Array<{ title: string; url: string }> = [];
      const seenUrls = new Set<string>();

      const container = $("#chapters, .chapter-list, .chapters, .list-chapter, .volume-episodes, .table-chapters, div.catalog, ul.chapters, table");
      const searchRoot = container.length > 0 ? container : $("body");

      searchRoot.find("a").each((_, el) => {
        const href = $(el).attr("href");
        const rawText = $(el).text().trim().replace(/\s+/g, " ");
        if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) return;
        let fullUrl = "";
        try {
          fullUrl = new URL(href, tocUrl).href;
        } catch { return; }
        if (seenUrls.has(fullUrl)) return;
        if (/(\/|\b)(login|signin|register|signup|comment|donate|patreon|discord|review|forum|support|bookmark|latest|random)(\/|\b)/i.test(fullUrl)) return;
        if (/^(?:read latest|latest chapter|jump to|read first|bookmark|prev|next|home)$/i.test(rawText)) return;

        const isChapter =
          /(\/|\b)(chapter|ch|read|episode|c\d+)(\/|\b|\-|\_|\d)/i.test(fullUrl) ||
          /^(?:Chapter|Ch\.?|Episode|Part|Section|Volume|Act|第)\s*[\dIVXLCDM\.:\s\-—–]/i.test(rawText) ||
          /^[\d]+[\.\s\-—–].+/.test(rawText) ||
          /^(?:Prologue|Epilogue)/i.test(rawText);

        if (isChapter) {
          seenUrls.add(fullUrl);
          chapterLinks.push({ title: rawText || `Chapter ${chapterLinks.length + 1}`, url: fullUrl });
        }
      });

      // Markdown links check if Jina
      if (chapterLinks.length < 2 && html.includes("](")) {
        const mdLinkRegex = /\[([^\]\n]+)\]\((https?:\/\/[^\s\)\n]+)\)/g;
        let mdMatch;
        while ((mdMatch = mdLinkRegex.exec(html)) !== null) {
          const rawText = mdMatch[1].trim();
          const fullUrl = mdMatch[2].trim();
          if (seenUrls.has(fullUrl)) continue;
          if (/(\/|\b)(login|signin|register|signup|comment|donate|patreon|discord|review|forum|support)(\/|\b)/i.test(fullUrl)) continue;
          const isChapter =
            /(\/|\b)(chapter|ch|read|episode|c\d+)(\/|\b|\-|\_|\d)/i.test(fullUrl) ||
            /^(?:Chapter|Ch\.?|Episode|Part|Section|Volume|Act|第)\s*[\dIVXLCDM\.:\s\-—–]/i.test(rawText) ||
            /^[\d]+[\.\s\-—–].+/.test(rawText) ||
            /^(?:Prologue|Epilogue)/i.test(rawText);

          if (isChapter) {
            seenUrls.add(fullUrl);
            chapterLinks.push({ title: rawText || `Chapter ${chapterLinks.length + 1}`, url: fullUrl });
          }
        }
      }

      const crawledChapters: NovelCrawledChapter[] = [];
      let cumulativeWords = 0;

      // CASE C: Follow Next Chapter if few links
      if (chapterLinks.length < 5) {
        let currentUrl = parsedUrl.href;
        seenUrls.clear();

        while (crawledChapters.length < maxChaptersRequested && currentUrl && !isClosed) {
          if (seenUrls.has(currentUrl)) break;
          seenUrls.add(currentUrl);

          let stepHtml = "";
          try {
            const stepRes = await fetch(currentUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              },
              signal: AbortSignal.timeout(6000),
            });
            if (stepRes.ok) stepHtml = await stepRes.text();
          } catch {}

          if (!stepHtml) break;
          const step$ = cheerio.load(stepHtml);
          const extracted = extractNovelChapterContent(step$);
          const chNum = crawledChapters.length + 1;
          let chTitle = extracted.title || step$("h1, h2").first().text().trim().replace(/\s+/g, " ") || `Chapter ${chNum}`;
          if (!/^(?:Chapter|Ch\.?|Episode|Part|Section|Volume|Act|第|Prologue|Epilogue)/i.test(chTitle)) {
            chTitle = `Chapter ${chNum}: ${chTitle}`;
          }

          if (extracted.paragraphs.length > 0) {
            const chWords = extracted.paragraphs.reduce((sum, p) => sum + p.split(/\s+/).filter(Boolean).length, 0);
            cumulativeWords += chWords;
            crawledChapters.push({
              chapterNumber: chNum,
              title: chTitle,
              url: currentUrl,
              paragraphs: extracted.paragraphs,
              bulletPoints: [`Narrative sequence for ${chTitle}`, `${extracted.paragraphs.length} paragraphs unabridged dialogue and prose`],
              rawText: extracted.paragraphs.join("\n\n"),
            });

            send("chapter", {
              current: chNum,
              total: maxChaptersRequested,
              chapterTitle: chTitle,
              wordCount: chWords,
              cumulativeWords,
            });
          }

          let nextHref = step$('a[rel="next"]').attr("href") || step$("a.next, a.next-chapter, a.btn-next, a.nav-next a").attr("href");
          if (!nextHref) {
            step$("a").each((_, aEl) => {
              const aText = step$(aEl).text().trim().toLowerCase();
              if (/^(?:next|next chapter|next >|»|下一章)$/i.test(aText)) {
                nextHref = step$(aEl).attr("href");
              }
            });
          }

          if (nextHref) {
            currentUrl = new URL(nextHref, currentUrl).href;
          } else {
            break;
          }
        }
      } else {
        // CASE B: Batch download from TOC list
        const effectiveLimit = Math.min(maxChaptersRequested, chapterLinks.length);
        const targetChapters = chapterLinks.slice(0, effectiveLimit);

        send("discovered", {
          title: novelTitle,
          author,
          totalChapters: targetChapters.length,
          domain,
        });

        const BATCH_SIZE = 6;
        for (let i = 0; i < targetChapters.length && !isClosed; i += BATCH_SIZE) {
          const batch = targetChapters.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.all(
            batch.map(async (ch, batchIdx) => {
              const chapterNum = i + batchIdx + 1;
              try {
                let chHtml = "";
                try {
                  const res = await fetch(ch.url, {
                    headers: {
                      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    },
                    signal: AbortSignal.timeout(6000),
                  });
                  if (res.ok) chHtml = await res.text();
                } catch {}

                if (!chHtml) return null;
                const ch$ = cheerio.load(chHtml);
                const extracted = extractNovelChapterContent(ch$);
                let cleanTitle = extracted.title || ch.title;
                if (!/^(?:Chapter|Ch\.?|Episode|Part|Section|Volume|Act|第|Prologue|Epilogue)/i.test(cleanTitle)) {
                  cleanTitle = `Chapter ${chapterNum}: ${cleanTitle}`;
                }

                if (extracted.paragraphs.length > 0) {
                  return {
                    chapterNumber: chapterNum,
                    title: cleanTitle,
                    url: ch.url,
                    paragraphs: extracted.paragraphs,
                    bulletPoints: [`Narrative sequence for ${cleanTitle}`, `${extracted.paragraphs.length} paragraphs unabridged dialogue and prose`],
                    rawText: extracted.paragraphs.join("\n\n"),
                  };
                }
                return null;
              } catch {
                return null;
              }
            })
          );

          for (const item of batchResults) {
            if (item) {
              const chWords = item.paragraphs.reduce((sum, p) => sum + p.split(/\s+/).filter(Boolean).length, 0);
              cumulativeWords += chWords;
              crawledChapters.push(item);
              send("chapter", {
                current: crawledChapters.length,
                total: targetChapters.length,
                chapterTitle: item.title,
                wordCount: chWords,
                cumulativeWords,
              });
            }
          }
        }
      }

      if (crawledChapters.length === 0) {
        send("error", {
          message: `Could not extract chapters from ${domain}. Please verify the URL or use the 1-Click Browser Extractor.`,
          isCloudflareBlocked: false,
          domain,
        });
        return res.end();
      }

      send("status", { message: "Finalizing document into Google Doc Professional Mode...", step: "finalizing" });

      const completeSections = crawledChapters.map((ch) => ({
        heading: ch.title,
        level: 1,
        paragraphs: ch.paragraphs,
        bulletPoints: ch.bulletPoints,
        callout: `Chapter Source: ${ch.url}`,
      }));

      const finalDisguiseTitle = `Enterprise Technical Specification & Structural Architecture (Dossier: ${novelTitle.toUpperCase()})`;
      const finalSubtitle = `By ${author} • Full Novel Compilation (${crawledChapters.length} Chapters) • Source: ${domain}`;
      const finalDisguiseSubtitle = "Enterprise Systems Group • Document Classification: Internal Eyes Only • Zero External Assets";

      const reviewData = generateFastStructuredReviews(novelTitle, finalDisguiseTitle, completeSections, true);

      const totalWords = completeSections.reduce(
        (sum, s) => sum + s.paragraphs.reduce((pSum, p) => pSum + p.split(/\s+/).filter(Boolean).length, 0),
        0
      );
      const readingTimeMinutes = Math.max(1, Math.ceil(totalWords / 200));

      const finalSections = completeSections.map((sec, idx) => {
        const review = reviewData.chapterReviews?.[idx];
        const baseDisguiseHeading = review?.disguiseChapterTitle || `${idx + 1}.0 Technical Specification Section`;
        return {
          ...sec,
          disguiseHeading: baseDisguiseHeading,
        };
      });

      const fullMarkdown = `# ${novelTitle}\n\n**Author:** ${author}\n**Total Chapters:** ${crawledChapters.length}\n**Source:** ${parsedUrl.href}\n\n${finalSections
        .map((s) => `## ${s.heading}\n\n${s.paragraphs.join("\n\n")}`)
        .join("\n\n")}`;

      const publishDate = new Date().toLocaleDateString();

      const documentData = {
        title: novelTitle,
        disguiseTitle: finalDisguiseTitle,
        subtitle: finalSubtitle,
        disguiseSubtitle: finalDisguiseSubtitle,
        author: author,
        date: publishDate,
        domain: domain,
        sourceUrl: parsedUrl.href,
        isNovelContent: true,
        isCrawledNovel: true,
        crawledChaptersCount: crawledChapters.length,
        executiveSummary:
          reviewData.executiveSummary ||
          `Full novel compilation of "${novelTitle}" by ${author}. Successfully extracted ${crawledChapters.length} complete chapters in unabridged format under Google Doc Professional Mode.`,
        disguiseExecutiveSummary:
          reviewData.disguiseExecutiveSummary ||
          `Enterprise compliance review and system specifications audit for ${novelTitle}. Zero-image documentation prepared for internal administrative verification.`,
        readingTimeMinutes,
        wordCount: totalWords,
        sections: finalSections,
        chapterReviews: reviewData.chapterReviews,
        fullMarkdown,
        extractedAt: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };

      send("complete", { document: documentData });
      res.end();
    } catch (err: any) {
      console.error("Stream novel error:", err);
      send("error", { message: err?.message || "Streaming novel crawl failed." });
      res.end();
    }
  });

  // Extract and format endpoint (supports URL OR manual text / HTML / uploaded file content)
  app.post(["/api/extract", "/api/crawl", "/api/novel-crawl"], async (req, res) => {
    try {
      const {
        url,
        rawContent,
        inputTitle,
        docStyle = "google-doc",
        includeSummary = false,
        isNovel = false,
        disguiseTheme = "corporate-audit",
        crawlMode = false,
        novelMode = false,
        maxPages = 8,
        maxChapters = 25,
        selectedUrls,
        excludePatterns,
        excludeNotices = true,
        chapterStart,
        chapterEnd,
        numberOffset,
        singlePage = false,
      } = req.body;

      let pageTitle = inputTitle || "Extracted Document";
      let author = "";
      let publishDate = "";
      let siteName = "Manual Upload";
      let sourceUrl = url || "";
      let rawText = "";
      let extractionMethod = "direct";
      let extractedElements: Array<{ type: string; text: string }> = [];

      if (url && typeof url === "string" && url.trim()) {
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
        } catch (e) {
          return res.status(400).json({ error: "Invalid URL format. Please include http:// or https://" });
        }
        sourceUrl = parsedUrl.href;
        siteName = parsedUrl.hostname.replace(/^www\./, "");

        // Specialized handling for Google Docs links
        let isGoogleDocs = parsedUrl.hostname.includes("docs.google.com");

        // Web Novel Multi-Chapter Crawler & Compiler
        const isNovelRequest =
          (novelMode === true ||
            req.path === "/api/novel-crawl" ||
            isNovel === true ||
            /(\/|\b)(fiction\/\d+|novel|webnovel|syosetu|wuxiaworld|archiveofourown|gutenberg|lightnovel|readnovelfull|boxnovel|scribblehub|wattpad)(\/|\b)/i.test(
              parsedUrl.href
            )) &&
          !isGoogleDocs &&
          !crawlMode &&
          singlePage !== true;

        if (isNovelRequest) {
          const maxCh = Number(maxChapters) || 25;
          const novelResult = await crawlNovelChapters(parsedUrl.href, {
            maxChapters: maxCh,
            selectedUrls: Array.isArray(selectedUrls) && selectedUrls.length > 0 ? selectedUrls : undefined,
            excludePatterns: Array.isArray(excludePatterns) ? excludePatterns : undefined,
            excludeNotices: excludeNotices !== false,
            chapterStart: Number(chapterStart) || undefined,
            chapterEnd: Number(chapterEnd) || undefined,
            numberOffset: Number(numberOffset) || undefined,
          });
          if (novelResult && novelResult.chapters.length === 0 && !novelResult.hasMore) {
            return res.status(200).json({
              success: false,
              reachedEnd: true,
              error: `No more chapters: this novel has ${novelResult.totalChaptersFound} chapters and you've reached the end.`,
            });
          }
          if (novelResult && novelResult.chapters.length > 0) {
            pageTitle = novelResult.novelTitle;
            author = novelResult.author;
            siteName = novelResult.domain;
            sourceUrl = novelResult.startUrl;
            publishDate = new Date().toLocaleDateString();

            const completeSections = novelResult.chapters.map((ch) => ({
              heading: ch.title,
              level: 1,
              paragraphs: ch.paragraphs,
              bulletPoints: ch.bulletPoints,
              callout: `Chapter Source: ${ch.url}`,
            }));

            const finalDisguiseTitle = `Enterprise Technical Specification & Structural Architecture (Dossier: ${novelResult.novelTitle.toUpperCase()})`;
            const finalSubtitle = `By ${author} • Full Novel Compilation (${novelResult.chapters.length} Chapters) • Source: ${siteName}`;
            const finalDisguiseSubtitle =
              "Enterprise Systems Group • Document Classification: Internal Eyes Only • Zero External Assets";

            // Generate summaries
            const reviewData = await generateChapterReviewsWithGemini(
              ai,
              pageTitle,
              finalDisguiseTitle,
              completeSections,
              true
            );

            const totalWords = completeSections.reduce(
              (sum, s) =>
                sum +
                s.paragraphs.reduce(
                  (pSum, p) => pSum + p.split(/\s+/).filter(Boolean).length,
                  0
                ),
              0
            );
            const readingTimeMinutes = Math.max(1, Math.ceil(totalWords / 200));

            const finalSections = completeSections.map((sec, idx) => {
              const review = reviewData.chapterReviews?.[idx];
              const absoluteNumber = novelResult.chapters[idx]?.chapterNumber ?? idx + 1;
              const baseDisguiseHeading =
                review?.disguiseChapterTitle || `${absoluteNumber}.0 Technical Specification Section`;
              return {
                ...sec,
                disguiseHeading: baseDisguiseHeading,
              };
            });

            const fullMarkdown = `# ${pageTitle}\n\n**Author:** ${author}\n**Total Chapters:** ${novelResult.chapters.length}\n**Source:** ${sourceUrl}\n\n${finalSections
              .map((s) => `## ${s.heading}\n\n${s.paragraphs.join("\n\n")}`)
              .join("\n\n")}`;

            return res.json({
              success: true,
              data: {
                title: pageTitle,
                disguiseTitle: finalDisguiseTitle,
                subtitle: finalSubtitle,
                disguiseSubtitle: finalDisguiseSubtitle,
                author: author,
                date: publishDate,
                domain: siteName,
                sourceUrl: sourceUrl,
                isNovelContent: true,
                isCrawledNovel: true,
                novelChapterCount: novelResult.chapters.length,
                crawledPagesCount: novelResult.chapters.length,
                crawledUrls: novelResult.chapters.map((c) => c.url),
                novelResume: {
                  mode: novelResult.mode,
                  hasMore: novelResult.hasMore,
                  url: novelResult.resume?.url,
                  chapterStart: novelResult.resume?.chapterStart,
                  numberOffset: novelResult.resume?.numberOffset,
                  firstChapterNumber: novelResult.firstChapterNumber,
                  lastChapterNumber:
                    novelResult.chapters[novelResult.chapters.length - 1]?.chapterNumber ??
                    novelResult.firstChapterNumber,
                  totalChaptersFound: novelResult.mode === "toc" ? novelResult.totalChaptersFound : undefined,
                  failedChapters: novelResult.failedChapters,
                  originalUrl: parsedUrl.href,
                },
                executiveSummary:
                  reviewData.executiveSummary ||
                  `Full novel compilation of "${pageTitle}" by ${author}. Successfully extracted ${novelResult.chapters.length} complete chapters (${novelResult.totalChaptersFound} discovered on site) in unabridged format under Google Doc Professional Mode.`,
                disguiseExecutiveSummary:
                  reviewData.disguiseExecutiveSummary ||
                  `Enterprise compliance review and system specifications audit for ${pageTitle}. Zero-image documentation prepared for internal administrative verification.`,
                readingTimeMinutes,
                wordCount: totalWords,
                sections: finalSections,
                chapterReviews: reviewData.chapterReviews,
                fullMarkdown,
                extractedAt: new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
              },
            });
          } else {
            return res.status(422).json({
              success: false,
              isCloudflareBlocked: true,
              error: `Could not automatically crawl chapters from ${siteName}. This website is protected by Cloudflare bot protection (HTTP 403 / Turnstile challenge) which blocks cloud servers.`,
              solution: "Use the 1-Click Browser Extractor to crawl directly in your browser tab without restrictions, or click 'Import novel (.json)'!",
              domain: siteName,
            });
          }
        }

        // Multi-Page Site Crawler (Follows links & checks sitemap.xml)
        const shouldCrawl = (crawlMode === true || req.path === "/api/crawl") && !isGoogleDocs;
        if (shouldCrawl) {
          const crawlResult = await crawlWebsiteDomain(parsedUrl.href, {
            maxPages: Number(maxPages) || 8,
            selectedUrls: Array.isArray(selectedUrls) && selectedUrls.length > 0 ? selectedUrls : undefined,
            excludePatterns: Array.isArray(excludePatterns) ? excludePatterns : undefined,
          });
          if (crawlResult && crawlResult.pages.length > 0) {
            pageTitle = `${siteName.toUpperCase()} — Complete Domain Dossier & Site Overview`;
            sourceUrl = crawlResult.startUrl;
            siteName = crawlResult.domain;
            publishDate = new Date().toLocaleDateString();

            const completeSections = crawlResult.pages.map((p, idx) => ({
              heading: `${idx + 1}. ${p.title} (${p.pathname === "/" ? "Home" : p.pathname})`,
              level: 1,
              paragraphs:
                p.paragraphs.length > 0 ? p.paragraphs : [p.rawText || `Content extracted from ${p.url}`],
              bulletPoints: p.bulletPoints || [],
              callout: `Source URL: ${p.url}`,
            }));

            const finalDisguiseTitle = `Enterprise Site Architecture & Cross-Departmental Operational Audit (Dossier: ${siteName.toUpperCase()})`;
            const finalSubtitle = `Source: ${siteName} • Crawled ${crawlResult.pagesCrawled} Pages • Date: ${publishDate}`;
            const finalDisguiseSubtitle =
              "Enterprise Operational Technology Division • Classification: Restricted • Internal Eyes Only";

            const reviewData = await generateChapterReviewsWithGemini(
              ai,
              pageTitle,
              finalDisguiseTitle,
              completeSections,
              false
            );

            const totalWords = completeSections.reduce(
              (sum, s) =>
                sum +
                s.paragraphs.reduce((pSum, p) => pSum + p.split(/\s+/).filter(Boolean).length, 0) +
                s.bulletPoints.reduce((bSum, b) => bSum + b.split(/\s+/).filter(Boolean).length, 0),
              0
            );
            const readingTimeMinutes = Math.max(1, Math.ceil(totalWords / 200));

            const finalSections = completeSections.map((sec, idx) => {
              const review = reviewData.chapterReviews?.[idx];
              const baseDisguiseHeading = review?.disguiseChapterTitle || sec.heading;
              return {
                ...sec,
                disguiseHeading: baseDisguiseHeading,
              };
            });

            const fullMarkdown = `# ${pageTitle}\n\n**Source:** ${sourceUrl}\n**Crawled Pages:** ${crawlResult.pagesCrawled}\n\n${finalSections
              .map(
                (s) =>
                  `## ${s.heading}\n\n${s.paragraphs.join("\n\n")}\n\n${s.bulletPoints
                    .map((b: string) => `- ${b}`)
                    .join("\n")}`
              )
              .join("\n\n")}`;

            return res.json({
              success: true,
              data: {
                title: pageTitle,
                disguiseTitle: finalDisguiseTitle,
                subtitle: finalSubtitle,
                disguiseSubtitle: finalDisguiseSubtitle,
                author: "Corporate Site Intelligence",
                date: publishDate,
                domain: siteName,
                sourceUrl: sourceUrl,
                isNovelContent: false,
                isCrawledSite: true,
                crawledPagesCount: crawlResult.pagesCrawled,
                crawledUrls: crawlResult.pages.map((p) => p.url),
                executiveSummary:
                  reviewData.executiveSummary ||
                  `Multi-page site dossier for ${siteName}. Successfully crawled ${crawlResult.pagesCrawled} pages including Home, About, Services, Products, and Contact documentation. Formatted for zero-image executive review and instant Word/PDF export.`,
                disguiseExecutiveSummary:
                  reviewData.disguiseExecutiveSummary ||
                  `Enterprise compliance and documentation review across ${crawlResult.pagesCrawled} operational endpoints for ${siteName}. Fiduciary and regulatory documentation verified.`,
                readingTimeMinutes,
                wordCount: totalWords,
                sections: finalSections,
                chapterReviews: reviewData.chapterReviews,
                fullMarkdown,
                extractedAt: new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
              },
            });
          }
        }

        if (isGoogleDocs) {
          const pubMatch = parsedUrl.pathname.match(/\/document\/d\/e\/([a-zA-Z0-9_-]+)/);
          const standardDocMatch = parsedUrl.pathname.match(/\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]{20,})/);

          const googleDocCandidates: string[] = [];
          if (pubMatch && pubMatch[1]) {
            googleDocCandidates.push(
              `https://docs.google.com/document/d/e/${pubMatch[1]}/pub`,
              `https://docs.google.com/document/d/e/${pubMatch[1]}/pub?embedded=true`
            );
          } else if (standardDocMatch && standardDocMatch[1]) {
            const docId = standardDocMatch[1];
            googleDocCandidates.push(
              `https://docs.google.com/document/d/${docId}/export?format=txt`,
              `https://docs.google.com/document/d/${docId}/export?format=html`,
              `https://docs.google.com/document/d/${docId}/mobilebasic`,
              `https://docs.google.com/document/d/${docId}/preview`
            );
          } else {
            googleDocCandidates.push(parsedUrl.href);
          }

          let docText = "";
          for (const candidateUrl of googleDocCandidates) {
            try {
              const response = await fetch(candidateUrl, {
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain,*/*;q=0.8",
                },
                redirect: "follow",
                signal: AbortSignal.timeout(14000),
              });
              if (!response.ok) continue;
              const resText = await response.text();
              if (resText && resText.length > 50 && !resText.includes("ServiceLogin")) {
                docText = resText;
                break;
              }
            } catch {
              // try next candidate
            }
          }

          if (docText) {
            pageTitle = "Google Docs Document";
            const paragraphs = docText
              .split(/\r?\n\r?\n+/)
              .map((p) => p.trim())
              .filter((p) => p.length > 0);

            if (paragraphs.length > 0) {
              if (paragraphs[0].length < 120 && !paragraphs[0].includes(".")) {
                pageTitle = paragraphs[0];
              }
              paragraphs.forEach((p, idx) => {
                if (idx === 0 && p === pageTitle) {
                  extractedElements.push({ type: "h1", text: p });
                } else if (p.length < 80 && !p.endsWith(".")) {
                  extractedElements.push({ type: "h2", text: p });
                } else {
                  extractedElements.push({ type: "p", text: p });
                }
              });
            }
            rawText = docText.trim();
            extractionMethod = "google-docs-export";
          } else {
            return res.status(422).json({
              error:
                "Google Docs public links can be restricted by your organization or blocked by Google's anti-bot system. To cloak this document right away: Copy the text from Google Docs (Ctrl+A, Ctrl+C) and click the button below to paste it into DOCLOAK.",
              canPasteDirectly: true,
            });
          }
        } else {
          // Standard Web Extraction via Multi-Tier Reader Pipeline
          // Tier 1: High-Speed Web Reader API (Jina)
          const jinaResult = await extractWithJinaReader(parsedUrl.href);
          if (jinaResult && jinaResult.elements.length > 0) {
            extractedElements = jinaResult.elements;
            rawText = jinaResult.rawText;
            if (jinaResult.title) pageTitle = jinaResult.title;
            if (jinaResult.author) author = jinaResult.author;
            if (jinaResult.publishDate) publishDate = jinaResult.publishDate;
            extractionMethod = "reader-api";
          }

          // Tier 2: Direct browser-emulated HTTP fetch with novel selectors (Cheerio)
          if (extractedElements.length === 0) {
            const cheerioResult = await extractWithDirectCheerio(parsedUrl.href);
            if (cheerioResult && cheerioResult.elements.length > 0) {
              extractedElements = cheerioResult.elements;
              rawText = cheerioResult.rawText;
              if (cheerioResult.title) pageTitle = cheerioResult.title;
              if (cheerioResult.author) author = cheerioResult.author;
              if (cheerioResult.publishDate) publishDate = cheerioResult.publishDate;
              extractionMethod = "direct-cheerio";
            }
          }

          // Tier 3: Gemini Search Grounding Reader API
          if (extractedElements.length === 0) {
            const geminiResult = await extractWithGeminiSearch(ai, parsedUrl.href);
            if (geminiResult && geminiResult.elements.length > 0) {
              extractedElements = geminiResult.elements;
              rawText = geminiResult.rawText;
              if (geminiResult.title) pageTitle = geminiResult.title;
              if (geminiResult.author) author = geminiResult.author;
              if (geminiResult.publishDate) publishDate = geminiResult.publishDate;
              extractionMethod = "gemini-search-reader";
            }
          }

          if (extractedElements.length === 0) {
            return res.status(422).json({
              error: `Could not automatically extract text from ${siteName}. This website may be protected by anti-crawler verification, Cloudflare, or requires a personal login/membership. You can copy the chapter text directly from your browser and click "Switch to Manual Upload / Paste" to disguise your document instantly!`,
              canPasteDirectly: true,
              domain: siteName,
            });
          }
        }
      } else if (rawContent && typeof rawContent === "string" && rawContent.trim()) {
        // Handle manually pasted text, HTML, or uploaded file
        if (rawContent.includes("<") && rawContent.includes(">")) {
          const $ = cheerio.load(rawContent);
          $("script, style, noscript, svg, img, picture, iframe").remove();
          $("br").replaceWith("\n");
          $("hr").replaceWith("\n\n");
          const parsedTitle = $("h1, title").first().text().trim();
          if (parsedTitle && (!inputTitle || inputTitle === "Extracted Document")) {
            pageTitle = parsedTitle;
          }
          $("h1, h2, h3, h4, p, ul, ol, blockquote, pre").each((_, elem) => {
            const tag = elem.tagName.toLowerCase();
            const text = $(elem).text().trim().replace(/\r/g, "").replace(/\t/g, " ");
            if (text.length > 0) {
              extractedElements.push({ type: tag, text });
            }
          });
          rawText = $.text().replace(/\r/g, "").trim();
        } else {
          rawText = rawContent.replace(/\r/g, "").trim();
        }
        sourceUrl = "Uploaded / Pasted Content";
        siteName = "Manual Document";
        publishDate = new Date().toLocaleDateString();
      } else {
        return res.status(400).json({ error: "Please provide either a website URL or manual text/file content." });
      }

      // Check if this is a novel or narrative fiction
      const isNovelDetected =
        isNovel ||
        docStyle === "workplace-disguise" ||
        /chapter|volume|danmei|bl|novel|shen|xiao|mo ran|lu chen|yan zhen|whispered|kissed|murmured|gazed/i.test(
          rawText.slice(0, 5000)
        );

      // Structure 100% of the sections and paragraphs from the raw document (ZERO truncation, ZERO length limit)
      const completeSections: Array<{
        heading: string;
        disguiseHeading?: string;
        level: number;
        paragraphs: string[];
        bulletPoints: string[];
        callout?: string | null;
      }> = [];

      const hasHeadings = extractedElements.some((e) => ["h1", "h2", "h3", "h4"].includes(e.type));

      if (hasHeadings && extractedElements.length > 0) {
        let currentSec: any = {
          heading: isNovelDetected ? "Chapter 1" : "Document Overview",
          level: 1,
          paragraphs: [],
          bulletPoints: [],
        };

        for (const el of extractedElements) {
          if (["h1", "h2", "h3", "h4"].includes(el.type)) {
            if (currentSec.paragraphs.length > 0 || currentSec.bulletPoints.length > 0) {
              completeSections.push(currentSec);
            }
            currentSec = {
              heading: el.text,
              level: el.type === "h1" ? 1 : el.type === "h2" ? 2 : 3,
              paragraphs: [],
              bulletPoints: [],
            };
          } else if (["ul", "ol"].includes(el.type)) {
            currentSec.bulletPoints.push(el.text);
          } else {
            currentSec.paragraphs.push(el.text);
          }
        }

        if (currentSec.paragraphs.length > 0 || currentSec.bulletPoints.length > 0) {
          completeSections.push(currentSec);
        }
      } else {
        // Parse rawText into paragraphs and detect chapter headings
        const rawParagraphs = rawText
          .split(/\n{2,}|\n(?=[A-Z0-9"“'‘#§])/g)
          .map((p) => p.trim())
          .filter((p) => p.length > 0);

        const chapterRegex = /^(?:#{1,3}\s+[^\n]+|(?:Chapter|Volume|Part|Book|Act|Scene|Section|Capítulo|Chapitre|第[0-9一二三四五六七八九十百千万]+[章回卷节]|Prologue|Epilogue)\s*[\dIVXLCDM\.:\s\-—–].*)$/i;

        let currentSec: any = {
          heading: isNovelDetected ? "Chapter 1" : "Document Overview",
          level: 1,
          paragraphs: [],
          bulletPoints: [],
        };

        for (const para of rawParagraphs) {
          if (chapterRegex.test(para) && para.length < 120) {
            if (currentSec.paragraphs.length > 0) {
              completeSections.push(currentSec);
            }
            currentSec = {
              heading: para.replace(/^#+\s*/, ""),
              level: 1,
              paragraphs: [],
              bulletPoints: [],
            };
          } else {
            currentSec.paragraphs.push(para);
          }
        }

        if (currentSec.paragraphs.length > 0) {
          completeSections.push(currentSec);
        }
      }

      // If document is one continuous long block without headings, group every 12 paragraphs into clean Google Doc sections
      if (completeSections.length === 1 && completeSections[0].paragraphs.length > 15) {
        const allParas = completeSections[0].paragraphs;
        const initialHeading = completeSections[0].heading;
        completeSections.length = 0; // reset
        const PARAS_PER_SECTION = 12;
        for (let i = 0; i < allParas.length; i += PARAS_PER_SECTION) {
          const secNum = Math.floor(i / PARAS_PER_SECTION) + 1;
          completeSections.push({
            heading: i === 0 ? initialHeading : `${isNovelDetected ? "Part" : "Section"} ${secNum}`,
            level: 1,
            paragraphs: allParas.slice(i, i + PARAS_PER_SECTION),
            bulletPoints: [],
          });
        }
      }

      // Fallback if no sections were generated
      if (completeSections.length === 0) {
        completeSections.push({
          heading: "Document Content",
          level: 1,
          paragraphs: rawText ? [rawText] : ["No content extracted."],
          bulletPoints: [],
        });
      }

      // Deterministic corporate heading generator fallback
      const CORPORATE_HEADING_TEMPLATES = [
        "Operational Baseline & Parameter Verification",
        "Technical Architecture & Infrastructure Alignment",
        "Governance Framework & Fiduciary Assessment",
        "Cross-Departmental Security & Protocol Auditing",
        "Enterprise Service Delivery & Deployment Logistics",
        "Process Continuity & Risk Mitigation Parameters",
        "System Diagnostics & Functional Validation",
        "Stakeholder Alignment & Inter-Departmental Metrics",
        "Compliance Verification & Fiduciary Governance",
        "Quality Assurance & Resiliency Testing",
        "Strategic Resource Allocation & Fleet Oversight",
        "Operational Continuity & Protocol Standards",
        "Performance Benchmarks & Capacity Evaluations",
        "Infrastructure Redundancy & Failover Protocols",
        "Regulatory Conformance & Data Governance Review",
      ];

      const getFallbackDisguiseHeading = (index: number): string => {
        const num = `${index + 1}.0`;
        const template = CORPORATE_HEADING_TEMPLATES[index % CORPORATE_HEADING_TEMPLATES.length];
        const cycle = Math.floor(index / CORPORATE_HEADING_TEMPLATES.length);
        const suffix = cycle > 0 ? ` (Phase ${cycle + 1})` : "";
        return `${num} ${template}${suffix}`;
      };

      // Determine Disguise Title & Subtitle
      const finalDisguiseTitle = isNovelDetected
        ? "Internal Systems Architecture & Cross-Functional Audit Review (v2.8)"
        : "Enterprise Technical Specification & Strategic Documentation";

      const finalSubtitle = `Source: ${siteName} • Extracted on ${new Date().toLocaleDateString()}`;
      const finalDisguiseSubtitle =
        "Enterprise Operational Technology Division • Classification: Restricted • Internal Eyes Only";

      // Generate structured Chapter-by-Chapter Review & Executive Summary with Gemini AI
      const reviewData = await generateChapterReviewsWithGemini(
        ai,
        pageTitle,
        finalDisguiseTitle,
        completeSections,
        isNovelDetected
      );

      const sensitiveKeywords = [
        "intimate", "embrace", "kiss", "lips", "cloak", "shiver", "warmth", "breath",
        "bed", "bedroom", "touch", "midnight", "curfew", "private", "whisper", "chest",
        "flush", "body", "undress", "desire", "caress", "climax", "flesh"
      ];

      // Map disguise headings onto complete sections from reviewData, preserving 100% of paragraphs
      const finalSections = completeSections.map((sec, idx) => {
        const review = reviewData.chapterReviews?.[idx];
        const combinedText = (sec.heading + " " + sec.paragraphs.join(" ")).toLowerCase();
        const isSensitive =
          review?.isSensitive ??
          (sec as any).isSensitive ??
          sensitiveKeywords.some((kw) => combinedText.includes(kw));

        const baseDisguiseHeading =
          review?.disguiseChapterTitle || sec.disguiseHeading || getFallbackDisguiseHeading(idx);

        return {
          ...sec,
          disguiseHeading: isSensitive
            ? `[CONFIDENTIAL INFORMATION] ${baseDisguiseHeading.replace(/^\[CONFIDENTIAL INFORMATION\]\s*/i, "")}`
            : baseDisguiseHeading,
          isSensitive,
          confidentialClassification: isSensitive
            ? "CONFIDENTIAL INFORMATION // LEVEL 4 CLASSIFIED"
            : undefined,
        };
      });

      // Calculate total words and reading time from 100% of the text
      const totalWords = finalSections.reduce(
        (sum, s) =>
          sum +
          s.paragraphs.reduce((pSum, p) => pSum + p.split(/\s+/).filter(Boolean).length, 0) +
          s.bulletPoints.reduce((bSum, b) => bSum + b.split(/\s+/).filter(Boolean).length, 0),
        0
      );
      const readingTimeMinutes = Math.max(1, Math.ceil(totalWords / 200));

      const finalTitle = pageTitle;
      const finalExecutiveSummary = reviewData.executiveSummary;
      const finalDisguiseExecutiveSummary = reviewData.disguiseExecutiveSummary;
      const finalChapterReviews = reviewData.chapterReviews;

      const fullMarkdown = `# ${finalTitle}\n\n**Source:** ${sourceUrl}\n**Date:** ${publishDate || new Date().toLocaleDateString()}\n\n${finalSections
        .map(
          (s) =>
            `## ${s.heading}\n\n${s.paragraphs.join("\n\n")}\n\n${s.bulletPoints
              .map((b: string) => `- ${b}`)
              .join("\n")}`
        )
        .join("\n\n")}`;

      return res.json({
        success: true,
        data: {
          title: finalTitle,
          disguiseTitle: finalDisguiseTitle,
          subtitle: finalSubtitle,
          disguiseSubtitle: finalDisguiseSubtitle,
          author: author || (isNovelDetected ? "Original Author" : "Staff Writer"),
          date: publishDate || new Date().toLocaleDateString(),
          domain: siteName,
          sourceUrl: sourceUrl,
          isNovelContent: isNovelDetected,
          executiveSummary: finalExecutiveSummary,
          disguiseExecutiveSummary: finalDisguiseExecutiveSummary,
          readingTimeMinutes,
          wordCount: totalWords,
          sections: finalSections,
          chapterReviews: finalChapterReviews,
          fullMarkdown,
          extractedAt: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      });
    } catch (error: any) {
      console.error("API error in /api/extract:", error);
      res.status(422).json({
        success: false,
        error:
          error.message ||
          "Could not automatically extract text from this website. The site may be protected by anti-bot verification or Cloudflare.",
      });
    }
  });

  // Dedicated Chapter-by-Chapter Review API Endpoint
  app.post("/api/summarize", async (req, res) => {
    try {
      const { title, disguiseTitle, sections, isNovelContent = false } = req.body;
      if (!sections || !Array.isArray(sections) || sections.length === 0) {
        return res.status(400).json({
          error: "Sections are required to generate chapter-by-chapter review.",
        });
      }

      const reviewData = await generateChapterReviewsWithGemini(
        ai,
        title || "Document",
        disguiseTitle || "Enterprise Document",
        sections,
        isNovelContent
      );

      return res.json({
        success: true,
        ...reviewData,
      });
    } catch (err: any) {
      console.error("API error in /api/summarize:", err);
      return res.status(500).json({
        error: err.message || "Failed to generate chapter-by-chapter review.",
      });
    }
  });

  return app;
}

async function startServer() {
  const app = createApp();

  // Vite middleware in development; static file serving in production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// On Vercel the app is served by api/index.ts as a serverless function instead.
if (!process.env.VERCEL) {
  startServer();
}
