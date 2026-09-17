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

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "10mb" }));

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
        includeSummary = true,
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

        // Fetch webpage content
        let html = "";
        try {
          const response = await fetch(parsedUrl.href, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9",
            },
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

        // Parse HTML with cheerio
        const $ = cheerio.load(html);

        // Clean out scripts, styles, navigations, cookies, ads, footers, AND ALL IMAGES / MEDIA
        $(
          "script, style, nav, footer, noscript, iframe, svg, img, picture, figure, video, audio, canvas, [role='navigation'], [role='banner'], .cookie-banner, .cookie-notice, .advertisement, .ads, .social-share, .share-buttons, .widget, .comments-area, .sidebar"
        ).remove();

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

        let contentEl = $(
          ".entry-content, .post-content, .article-content, article, [role='main'], main, .content"
        ).first();

        if (!contentEl || contentEl.length === 0) {
          contentEl = $("body");
        }

        contentEl.find("h1, h2, h3, h4, p, ul, ol, blockquote, pre").each((_, elem) => {
          const tag = elem.tagName.toLowerCase();
          const text = $(elem).text().trim().replace(/\s+/g, " ");
          if (text.length > 5) {
            extractedElements.push({ type: tag, text });
          }
        });

        rawText =
          extractedElements.length > 0
            ? extractedElements.map((e) => `${e.type.toUpperCase()}: ${e.text}`).join("\n\n")
            : contentEl.text().replace(/\s+/g, " ").trim();
      } else if (rawContent && typeof rawContent === "string" && rawContent.trim()) {
        // Handle manually pasted text, HTML, or uploaded file
        if (rawContent.includes("<") && rawContent.includes(">")) {
          const $ = cheerio.load(rawContent);
          $("script, style, noscript").remove();
          const parsedTitle = $("h1, title").first().text().trim();
          if (parsedTitle && (!inputTitle || inputTitle === "Extracted Document")) {
            pageTitle = parsedTitle;
          }
          $("h1, h2, h3, h4, p, ul, ol, blockquote, pre").each((_, elem) => {
            const tag = elem.tagName.toLowerCase();
            const text = $(elem).text().trim().replace(/\s+/g, " ");
            if (text.length > 5) {
              extractedElements.push({ type: tag, text });
            }
          });
          rawText = $.text().replace(/\s+/g, " ").trim();
        } else {
          rawText = rawContent.trim();
        }
        sourceUrl = "Uploaded / Pasted Content";
        siteName = "Manual Document";
        publishDate = new Date().toLocaleDateString();
      } else {
        return res.status(400).json({ error: "Please provide either a website URL or manual text/file content." });
      }

      const truncatedContent = rawText.slice(0, 30000); // Protect against gigantic pages

      const isNovelDetected =
        isNovel ||
        docStyle === "workplace-disguise" ||
        /chapter|volume|danmei|bl|novel|shen|xiao|mo ran|lu chen|yan zhen|whispered|kissed|murmured|gazed/i.test(
          rawText.slice(0, 3000)
        );

      // Use Gemini to format into an executive Google Doc structure
      let docResult: any = null;

      try {
        const prompt = `You are a professional document formatting engine modeled after Google Docs typography and enterprise document standards.
Transform the following content into a pristine, beautifully structured Google Doc work document.

CRITICAL MANDATES:
1. STRICTLY ZERO IMAGES: Do NOT include any images, <img> tags, markdown images, figures, or visual placeholders. Pure clean professional text and typography only.
2. PROFESSIONAL WORK DOCUMENT LOOK: The user wants to read this (which may be a BL novel, webfiction, or story) disguised as or formatted like an ultra-professional enterprise work document (like a technical specification, corporate audit, or executive strategy memo).
3. If this is a novel or story:
   - Provide a real "title" (e.g. Chapter name or story title).
   - Provide an ultra-realistic corporate "disguiseTitle" (e.g. "Q3 Systems Architecture & Service Protocol Review" or "Internal Financial Risk Evaluation & Fiduciary Audit").
   - Provide a "disguiseSubtitle" (e.g. "Enterprise Technology Core • Classification: Internal Eyes Only • 2026").
   - Provide a "disguiseExecutiveSummary" that sounds like a serious, believable corporate overview.
   - For each section, provide the original "heading" (e.g. "Chapter 1: The Archive") AND a convincing "disguiseHeading" (e.g. "1.0 Operational Baseline & Environmental Protocol").
   - Format dialogue and paragraphs into clean, readable, professional corporate-style narrative text (clear paragraphs, standard quotes, no weird fanfiction tags, no ads).
4. If this is regular non-fiction/article, provide clean Google Doc sections with headings, paragraphs, and optional bullet points.

SOURCE INFO:
- URL / Origin: ${sourceUrl}
- Site / Context: ${siteName}
- Suggested Title: ${pageTitle}
- Extracted Author: ${author || "Author"}
- Date: ${publishDate || new Date().toLocaleDateString()}
- Detected Fiction / Novel: ${isNovelDetected ? "YES (format with disguise headers)" : "NO"}

CONTENT:
${truncatedContent}

Return ONLY valid JSON matching this exact structure:
{
  "title": "Document Title or Chapter Title",
  "disguiseTitle": "Enterprise Corporate Specification / Audit Title",
  "subtitle": "By [Author] • [Source] • [Date]",
  "disguiseSubtitle": "Corporate Systems Group • Classification: Internal Eyes Only • 2026",
  "author": "${author || "Author"}",
  "date": "${publishDate || new Date().toLocaleDateString()}",
  "domain": "${siteName}",
  "sourceUrl": "${sourceUrl}",
  "isNovelContent": ${isNovelDetected ? "true" : "false"},
  "executiveSummary": "Concise summary of content...",
  "disguiseExecutiveSummary": "Believable corporate audit or technical specification summary...",
  "readingTimeMinutes": 4,
  "sections": [
    {
      "heading": "Section or Chapter Heading",
      "disguiseHeading": "1.0 Operational Parameters & Protocol Verification",
      "level": 1,
      "paragraphs": ["Paragraph 1...", "Paragraph 2..."],
      "bulletPoints": ["Key item 1", "Key item 2"],
      "callout": "Key quote or takeaway if any"
    }
  ],
  "fullMarkdown": "# Title\\n\\n..."
}`;

        const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];

        for (const model of candidateModels) {
          if (docResult) break;

          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
              const geminiResponse = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                  responseMimeType: "application/json",
                  temperature: 0.2,
                },
              });

              const jsonStr = geminiResponse.text?.trim();
              if (jsonStr) {
                docResult = JSON.parse(jsonStr);
                if (docResult && docResult.title && docResult.sections) {
                  break; // Successful parse
                }
              }
            } catch (err: any) {
              const status = err?.status || err?.error?.status;
              const code = err?.code || err?.error?.code;
              const isTransient = status === "UNAVAILABLE" || code === 503 || status === 429 || code === 429;

              if (isTransient && attempt < 2) {
                // Short wait before retry
                await new Promise((resolve) => setTimeout(resolve, 800));
                continue;
              }
              // If not recoverable on this model, loop to next candidate model
              break;
            }
          }
        }
      } catch (geminiError: any) {
        console.info("AI assistance temporarily busy or unavailable; utilizing built-in deterministic formatter.");
      }

      if (!docResult) {
        console.info("Using built-in deterministic document sanitizer & formatter.");
      }

      // If Gemini formatting succeeded, return it
      if (docResult && docResult.title && docResult.sections) {
        const totalWords = (docResult.fullMarkdown || rawText).split(/\s+/).filter(Boolean).length;
        return res.json({
          success: true,
          data: {
            ...docResult,
            isNovelContent: docResult.isNovelContent ?? isNovelDetected,
            disguiseTitle:
              docResult.disguiseTitle ||
              "Q3 Strategic Architecture & Operational Verification Protocol",
            disguiseSubtitle:
              docResult.disguiseSubtitle ||
              "Enterprise Risk Management & Infrastructure Review • Internal Only",
            disguiseExecutiveSummary:
              docResult.disguiseExecutiveSummary ||
              "Comprehensive assessment of operational parameters, technical cross-verifications, and executive process governance.",
            wordCount: totalWords,
            readingTimeMinutes: docResult.readingTimeMinutes || Math.ceil(totalWords / 200),
            extractedAt: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          },
        });
      }

      // Fallback clean structured formatter if AI was unavailable
      const fallbackSections = [];
      let currentSection: any = {
        heading: "Overview",
        level: 1,
        paragraphs: [],
        bulletPoints: [],
      };

      if (extractedElements && extractedElements.length > 0) {
        for (const el of extractedElements.slice(0, 50)) {
          if (["h1", "h2", "h3"].includes(el.type)) {
            if (currentSection.paragraphs.length || currentSection.bulletPoints.length) {
              fallbackSections.push(currentSection);
            }
            currentSection = {
              heading: el.text,
              level: el.type === "h1" ? 1 : el.type === "h2" ? 2 : 3,
              paragraphs: [],
              bulletPoints: [],
            };
          } else if (["ul", "ol"].includes(el.type)) {
            currentSection.bulletPoints.push(el.text);
          } else {
            currentSection.paragraphs.push(el.text);
          }
        }
      } else {
        // Break raw text into paragraphs
        const rawParagraphs = rawText.split(/\n{2,}|\r\n{2,}/).filter((p: string) => p.trim().length > 0);
        if (rawParagraphs.length > 0) {
          currentSection.paragraphs = rawParagraphs.slice(0, 4);
          fallbackSections.push(currentSection);
          if (rawParagraphs.length > 4) {
            fallbackSections.push({
              heading: "Key Details",
              level: 1,
              paragraphs: rawParagraphs.slice(4, 10),
              bulletPoints: [],
            });
          }
        }
      }

      if (currentSection.paragraphs.length || currentSection.bulletPoints.length) {
        if (!fallbackSections.includes(currentSection)) {
          fallbackSections.push(currentSection);
        }
      }

      const totalWords = rawText.split(/\s+/).filter(Boolean).length;
      const readingTime = Math.max(1, Math.ceil(totalWords / 200));

      const fallbackMarkdown = `# ${pageTitle}\n\n**Source:** ${sourceUrl}\n**Date:** ${new Date().toLocaleDateString()}\n\n${fallbackSections
        .map(
          (s) =>
            `## ${s.heading}\n\n${s.paragraphs.join("\n\n")}\n\n${s.bulletPoints
              .map((b: string) => `- ${b}`)
              .join("\n")}`
        )
        .join("\n\n")}`;

      const decoratedFallbackSections = (
        fallbackSections.length > 0
          ? fallbackSections
          : [{ heading: "Content", level: 1, paragraphs: [rawText.slice(0, 2000)], bulletPoints: [] }]
      ).map((sec, idx) => ({
        ...sec,
        disguiseHeading: `${idx + 1}.0 Operational Verification & Protocol Findings`,
      }));

      return res.json({
        success: true,
        data: {
          title: pageTitle,
          disguiseTitle: "Internal Systems Architecture & Cross-Functional Audit Review (v2.8)",
          subtitle: `Source: ${siteName} • Extracted on ${new Date().toLocaleDateString()}`,
          disguiseSubtitle: "Enterprise Operational Technology Division • Classification: Restricted • Internal Eyes Only",
          author: author || "Staff Writer",
          date: publishDate || new Date().toLocaleDateString(),
          domain: siteName,
          sourceUrl: sourceUrl,
          isNovelContent: isNovelDetected,
          executiveSummary: `Content formatted for Google Docs and Google PDF. Total reading time is ${readingTime} min (${totalWords} words).`,
          disguiseExecutiveSummary:
            "This operational review outlines foundational system verifications, procedural alignment, and inter-departmental findings compiled during standard review cycles.",
          readingTimeMinutes: readingTime,
          wordCount: totalWords,
          sections: decoratedFallbackSections,
          fullMarkdown: fallbackMarkdown,
          extractedAt: new Date().toLocaleDateString(),
        },
      });
    } catch (error: any) {
      console.error("API error in /api/extract:", error);
      res.status(500).json({
        error: error.message || "An unexpected error occurred while processing the website.",
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
