import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
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
  // Deterministic fallback generator
  const createFallbackReview = () => {
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
  };

  try {
    const compactSections = sections.map((s, idx) => ({
      index: idx + 1,
      heading: s.heading,
      disguiseHeading: s.disguiseHeading || `${idx + 1}.0 Operational Review`,
      excerpt: (s.paragraphs.slice(0, 3).join(" ")).slice(0, 450),
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

    if (!process.env.GEMINI_API_KEY) {
      return createFallbackReview();
    }

    const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest"];
    for (const model of candidateModels) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.3,
            },
          });

          const text = response.text?.trim();
          if (text) {
            const parsed = JSON.parse(text);
            if (parsed && Array.isArray(parsed.chapterReviews) && parsed.chapterReviews.length > 0) {
              return {
                executiveSummary: parsed.executiveSummary || "Document review completed.",
                disguiseExecutiveSummary:
                  parsed.disguiseExecutiveSummary ||
                  "Comprehensive systems assessment and procedural milestone review completed.",
                chapterReviews: parsed.chapterReviews,
              };
            }
          }
        } catch (e: any) {
          const status = e?.status || e?.error?.status;
          const code = e?.code || e?.error?.code;
          const isTransient = status === "UNAVAILABLE" || code === 503 || status === 429 || code === 429;
          if (isTransient && attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 800));
            continue;
          }
          break;
        }
      }
    }
  } catch {
    // Graceful fallback to deterministic structural chapter reviewer
  }

  return createFallbackReview();
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ extended: true, limit: "100mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Extract and format endpoint (supports URL OR manual text / HTML / uploaded file content)
  app.post("/api/extract", async (req, res) => {
    try {
      const {
        url,
        rawContent,
        inputTitle,
        docStyle = "google-doc",
        includeSummary = false,
        isNovel = false,
        disguiseTheme = "corporate-audit",
      } = req.body;

      let pageTitle = inputTitle || "Extracted Document";
      let author = "";
      let publishDate = "";
      let siteName = "Manual Upload";
      let sourceUrl = url || "";
      let rawText = "";
      const extractedElements: Array<{ type: string; text: string }> = [];

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
        let isGoogleDocTextExport = false;
        let isGoogleDocs = parsedUrl.hostname.includes("docs.google.com");
        let html = "";

        if (isGoogleDocs) {
          const pubMatch = parsedUrl.pathname.match(/\/document\/d\/e\/([a-zA-Z0-9_-]+)/);
          const standardDocMatch = parsedUrl.pathname.match(/\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]{20,})/);

          const googleDocCandidates: string[] = [];

          if (pubMatch && pubMatch[1]) {
            // Published Google Doc (File -> Share -> Publish to the web)
            googleDocCandidates.push(
              `https://docs.google.com/document/d/e/${pubMatch[1]}/pub`,
              `https://docs.google.com/document/d/e/${pubMatch[1]}/pub?embedded=true`
            );
          } else if (standardDocMatch && standardDocMatch[1]) {
            const docId = standardDocMatch[1];
            googleDocCandidates.push(
              `https://docs.google.com/document/d/${docId}/export?format=html`,
              `https://docs.google.com/document/d/${docId}/export?format=txt`,
              `https://docs.google.com/document/d/${docId}/mobilebasic`,
              `https://docs.google.com/document/d/${docId}/preview`
            );
          } else {
            googleDocCandidates.push(parsedUrl.href);
          }

          let lastGoogleError = "";
          let success = false;

          for (const candidateUrl of googleDocCandidates) {
            try {
              const response = await fetch(candidateUrl, {
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain,*/*;q=0.8",
                  "Accept-Language": "en-US,en;q=0.9",
                },
                redirect: "follow",
                signal: AbortSignal.timeout(18000),
              });

              // Check if Google redirected to a login page
              if (
                response.url.includes("accounts.google.com") ||
                response.url.includes("ServiceLogin") ||
                response.status === 401 ||
                response.status === 403
              ) {
                lastGoogleError = "Google Account login required";
                continue;
              }

              if (!response.ok) {
                lastGoogleError = `Status ${response.status}`;
                continue;
              }

              const resText = await response.text();

              // Check if HTML returned is an authentication or login prompt
              if (resText.includes("ServiceLogin") || resText.includes("Sign in - Google Accounts")) {
                lastGoogleError = "Google Account login required";
                continue;
              }

              if (resText && resText.trim().length > 50) {
                html = resText;
                if (candidateUrl.includes("format=txt")) {
                  isGoogleDocTextExport = true;
                }
                success = true;
                break;
              }
            } catch (err: any) {
              lastGoogleError = err?.message || "Timeout";
            }
          }

          if (!success || !html) {
            return res.status(422).json({
              error:
                "Google Docs public links can be restricted by your organization (e.g. 'Anyone at your company with the link') or blocked by Google's anti-bot system. To cloak this document right away: Copy the text from Google Docs (Ctrl+A, Ctrl+C) and click the button below to paste it into DOCLOAK, or use File → Download → Plain Text (.txt).",
            });
          }
        } else {
          // Standard webpage fetch
          try {
            const response = await fetch(parsedUrl.href, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
              },
              redirect: "follow",
              signal: AbortSignal.timeout(15000),
            });

            if (!response.ok) {
              throw new Error(`Webpage returned status ${response.status}: ${response.statusText}`);
            }
            html = await response.text();
          } catch (err: any) {
            console.warn("Fetch warning:", err?.message || err);
            return res.status(422).json({
              error: `Could not load webpage from ${parsedUrl.hostname}: ${err.message || "Connection timed out"}`,
            });
          }
        }

        if (isGoogleDocTextExport) {
          // If plain text was exported from Google Docs, split into paragraphs
          pageTitle = "Google Docs Document";
          const paragraphs = html
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
          rawText = html.trim();
        } else {
          // Parse HTML with cheerio
          const $ = cheerio.load(html);

          // Clean out scripts, styles, navigations, cookies, ads, footers, AND ALL IMAGES / MEDIA
          $(
            "script, style, nav, footer, noscript, iframe, svg, img, picture, figure, video, audio, canvas, [role='navigation'], [role='banner'], .cookie-banner, .cookie-notice, .advertisement, .ads, .social-share, .share-buttons, .widget, .comments-area, .sidebar"
          ).remove();

          // Replace <br> and <hr> with newlines so text inside divs preserves paragraph separation
          $("br").replaceWith("\n");
          $("hr").replaceWith("\n\n");

          pageTitle =
            $('meta[property="og:title"]').attr("content") ||
            $("title").text().trim() ||
            $("h1").first().text().trim() ||
            pageTitle;

          author =
            $('meta[name="author"]').attr("content") ||
            $('meta[property="article:author"]').attr("content") ||
            $(".author, .byline, [rel='author']").first().text().trim() ||
            "";

          publishDate =
            $('meta[property="article:published_time"]').attr("content") ||
            $('meta[name="date"]').attr("content") ||
            $("time").first().attr("datetime") ||
            $("time").first().text().trim() ||
            "";

          siteName =
            $('meta[property="og:site_name"]').attr("content") || parsedUrl.hostname.replace(/^www\./, "");

          // Find the container that actually has the most text content (avoid tiny header/footer elements matching selectors)
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

          const contentEl = bestEl;

          contentEl.find("h1, h2, h3, h4, p, ul, ol, blockquote, pre").each((_, elem) => {
            const tag = elem.tagName.toLowerCase();
            const text = $(elem).text().trim().replace(/\r/g, "").replace(/\t/g, " ");
            if (text.length > 0) {
              extractedElements.push({ type: tag, text });
            }
          });

          const directText = contentEl.text().replace(/\r/g, "").trim();
          if (extractedElements.length < 5 && directText.length > 200) {
            extractedElements.length = 0;
            const lines = directText.split(/\n{2,}|\n/).map((l) => l.trim()).filter((l) => l.length > 0);
            for (const line of lines) {
              if (
                line.length < 100 &&
                /^(?:#{1,3}\s+|(?:Chapter|Volume|Part|Book|Section|Act|Capítulo|Chapitre|第[0-9一二三四五六七八九十百千万]+[章回卷节]|Prologue|Epilogue)\s*[\dIVXLCDM\.:\s\-—–])/i.test(
                  line
                )
              ) {
                extractedElements.push({ type: "h2", text: line.replace(/^#+\s*/, "") });
              } else {
                extractedElements.push({ type: "p", text: line });
              }
            }
          }

          rawText = directText;
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

      // Query Gemini for professional corporate metadata and disguised headings
      // Note: We only ask Gemini for metadata & heading transformations, NOT the body text.
      // This ensures 100% of the user's full document is preserved with ZERO token limit truncation!
      let aiMetadata: any = null;

      try {
        const sectionSummaries = completeSections.map((s, idx) => ({
          index: idx,
          heading: s.heading,
          preview: (s.paragraphs[0] || "").slice(0, 100),
        }));

        const metadataPrompt = `You are an enterprise document disguise and corporate typography engine.
The user is reading a document (such as a webfiction novel, chapter, or web article) that they want disguised as an ultra-realistic corporate document in Google Docs format.

TASK: Generate corporate disguise metadata and an enterprise disguise heading for EACH section in the list.
CRITICAL: Do NOT output the body text or summarize the story narrative. Only generate the title, subtitles, and disguised section headings.

INPUT CONTEXT:
- Document Title: "${pageTitle}"
- Source/Domain: "${siteName}"
- Detected Author: "${author || "Author"}"
- Detected Fiction / Novel: ${isNovelDetected ? "YES" : "NO"}
- Sections Count: ${completeSections.length}
- Section Headers:
${JSON.stringify(sectionSummaries, null, 2)}

Return ONLY valid JSON matching this exact structure:
{
  "title": "Clean Original Title or Chapter Name",
  "disguiseTitle": "Serious Enterprise Audit or Systems Architecture Title (e.g. 'Q3 Systems Infrastructure & Fiduciary Risk Evaluation')",
  "subtitle": "By ${author || "Author"} • ${siteName} • ${publishDate || new Date().toLocaleDateString()}",
  "disguiseSubtitle": "Enterprise Operational Technology Division • Classification: Restricted • Internal Eyes Only",
  "disguiseExecutiveSummary": ${includeSummary ? '"Brief 2-sentence corporate executive overview of system parameters and compliance."' : '""'},
  "executiveSummary": ${includeSummary ? '"Brief 2-sentence overview."' : '""'},
  "disguisedHeadings": [
    ${completeSections.map((_, i) => `"1.${i} Disguise Heading..."`).join(",\n    ")}
  ]
}`;

        const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest"];
        for (const model of candidateModels) {
          if (aiMetadata) break;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const geminiResponse = await ai.models.generateContent({
                model,
                contents: metadataPrompt,
                config: {
                  responseMimeType: "application/json",
                  temperature: 0.2,
                },
              });

              const jsonStr = geminiResponse.text?.trim();
              if (jsonStr) {
                const parsed = JSON.parse(jsonStr);
                if (parsed && (parsed.disguiseTitle || parsed.disguisedHeadings)) {
                  aiMetadata = parsed;
                  break;
                }
              }
            } catch (err: any) {
              const status = err?.status || err?.error?.status;
              const code = err?.code || err?.error?.code;
              const isTransient = status === "UNAVAILABLE" || code === 503 || status === 429 || code === 429;
              if (isTransient && attempt < 3) {
                await new Promise((resolve) => setTimeout(resolve, attempt * 800));
                continue;
              }
              break;
            }
          }
        }
      } catch {
        // Fallback to deterministic corporate disguise
      }

      const sensitiveKeywords = [
        "intimate", "embrace", "kiss", "lips", "cloak", "shiver", "warmth", "breath",
        "bed", "bedroom", "touch", "midnight", "curfew", "private", "whisper", "chest",
        "flush", "body", "undress", "desire", "caress", "climax", "flesh"
      ];

      // Map disguise headings onto complete sections, preserving 100% of paragraphs
      const finalSections = completeSections.map((sec, idx) => {
        const aiHeading =
          aiMetadata?.disguisedHeadings && Array.isArray(aiMetadata.disguisedHeadings)
            ? aiMetadata.disguisedHeadings[idx]
            : null;

        const combinedText = (sec.heading + " " + sec.paragraphs.join(" ")).toLowerCase();
        const isSensitive = sensitiveKeywords.some((kw) => combinedText.includes(kw));
        const baseDisguiseHeading = aiHeading || getFallbackDisguiseHeading(idx);

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

      const finalTitle = aiMetadata?.title || pageTitle;
      const finalDisguiseTitle =
        aiMetadata?.disguiseTitle ||
        (isNovelDetected
          ? "Internal Systems Architecture & Cross-Functional Audit Review (v2.8)"
          : "Enterprise Technical Specification & Strategic Documentation");

      const finalSubtitle =
        aiMetadata?.subtitle ||
        `Source: ${siteName} • Extracted on ${new Date().toLocaleDateString()}`;

      const finalDisguiseSubtitle =
        aiMetadata?.disguiseSubtitle ||
        "Enterprise Operational Technology Division • Classification: Restricted • Internal Eyes Only";

      // Generate structured Chapter-by-Chapter Review & Executive Summary
      const reviewData = await generateChapterReviewsWithGemini(
        ai,
        finalTitle,
        finalDisguiseTitle,
        finalSections,
        isNovelDetected
      );

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
      res.status(500).json({
        error: error.message || "An unexpected error occurred while processing the website.",
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

  // Vite middleware in development; static file serving in production
  if (process.env.NODE_ENV !== "production") {
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

startServer();
