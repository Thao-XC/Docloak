import React, { useState, useEffect, useMemo } from "react";
import { UrlInputSection } from "./components/UrlInputSection";
import { DocumentToolbar } from "./components/DocumentToolbar";
import { DocumentViewer } from "./components/DocumentViewer";
import { ManualUploadModal } from "./components/ManualUploadModal";
import { CloakRulesPanel } from "./components/CloakRulesPanel";
import { VerifyPanel } from "./components/VerifyPanel";
import { CloakExportModal } from "./components/CloakExportModal";
import { BrowserCompanionModal } from "./components/BrowserCompanionModal";
import {
  ExtractedDocument,
  DocStylePreset,
  FontFamily,
  FontSize,
  LineSpacing,
  DisguiseTemplate,
  CloakRule,
} from "./types";
import {
  DEFAULT_CLOAK_RULES,
  applyCloakRules,
  verifyDocumentSafety,
} from "./utils/disguiseEngine";
import { copyForGoogleDocs } from "./utils/exportUtils";
import {
  validateNovelJson,
  convertNovelToDocument,
  SAMPLE_NOVEL_JSON,
} from "./utils/novelImporter";
import shieldCloakLogo from "./assets/images/shield_cloak_logo_1789625346572.jpg";
import {
  Shield,
  ShieldCheck,
  CheckCircle,
  FileText,
  Sliders,
  Sparkles,
  Eye,
  Lock,
  ArrowLeft,
  ArrowRight,
  Zap,
  BookOpen,
} from "lucide-react";

// Default pre-loaded sample document demonstrating DOCLOAK
const INITIAL_DEMO_DOC: ExtractedDocument = {
  title: "The Cold General and the Imperial Archivist: Chapter 7",
  subtitle: "By Mo Ran • Archives of Northern Command • Curfew Protocol 102",
  author: "Mo Ran",
  date: "October 14, 2024",
  domain: "archives.internal",
  sourceUrl: "https://archives.internal/chapter-7",
  executiveSummary:
    "Shen Qing reviews provincial supply requisitions late into the night at the Lantern Pavilion. General Xiao Yan arrives unexpectedly from the freezing northern moat to deliver a winter cloak, revealing completed supply dispatches for thirty thousand vanguard troops.",
  readingTimeMinutes: 3,
  wordCount: 580,
  extractedAt: new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  disguiseTitle: "Infrastructure Audit & Resource Verification Protocol (Rev 7.0)",
  disguiseSubtitle: "Enterprise Systems Group • Classification: Internal Eyes Only",
  disguiseExecutiveSummary:
    "Dr. S. Vance (Director) conducts an administrative audit of resource allocations at Secure Data Annex (Site B). VP X. Anderson (Operations) validates delivery of Tier-3 Resource Quota (30,000 units) to regional clusters, confirming ledger balance across divisions.",
  sections: [
    {
      heading: "1. The Night Requisition at Lantern Pavilion",
      disguiseHeading: "1.0 Administrative Audit & Ledger Review",
      level: 1,
      paragraphs: [
        "The wind off the northern moat rattled the lattice windows of the Lantern Pavilion, but Shen Qing did not look up from the requisitions ledger. His fingertips were numb with the autumn chill, yet the ink on his wolf-hair brush had to remain steady. One blot, one miscalculated bushel of winter oats, and thirty thousand vanguard infantry would starve before the frost broke.",
        "A sudden draught made the brass tallow lamps flicker, casting long, wavering shadows across the cedar floorboards. Footsteps approached—heavy, measured, clad in iron-rimmed leather boots that could only belong to one man in this entire palace.",
      ],
      bulletPoints: [
        "Requisitions ledger verified against provincial grain quotas",
        "Curfew compliance audited across the northern palace ward",
        "Thirty thousand vanguard rations calculated before midnight",
      ],
      callout:
        "Entering the secret archives after midnight requires an imperial seal with three minister signatures.",
    },
    {
      heading: "2. The Midnight Encounter with General Xiao Yan",
      disguiseHeading: "[CONFIDENTIAL INFORMATION] 2.0 Operations Alignment & Resource Delivery",
      level: 1,
      isSensitive: true,
      confidentialClassification: "CONFIDENTIAL INFORMATION // LEVEL 4 CLASSIFIED",
      paragraphs: [
        "Shen Qing kept his gaze firmly fixed upon column seven. 'The curfew bell tolled two quarters ago, General Xiao. Entering the secret archives after midnight requires an imperial seal with three minister signatures.'",
        "Xiao Yan did not produce an imperial seal. Instead, he dropped a heavy fur-lined cloak across Shen Qing's trembling shoulders. The dark wool still held the warmth of the general's chest, smelling faintly of cedar smoke and dry mountain snow.",
        "'You haven't eaten since noon,' Xiao Yan's voice was low, rough with the gravel of a man who spent months giving commands across gale-swept ridges. 'The Emperor needs an archivist whose fingers can hold a pen, not an icicle.'",
      ],
      bulletPoints: [
        "Security clearance confirmed by Executive Board of Directors",
        "Dispatched personal escort with critical supplies two dawns prior",
        "Zero requisition errors discovered across provincial logbooks",
      ],
    },
    {
      heading: "3. Completed Ledgers and the Imperial Seal",
      disguiseHeading: "[CONFIDENTIAL INFORMATION] 3.0 System Validation & Protocol Compliance",
      level: 1,
      isSensitive: true,
      confidentialClassification: "CONFIDENTIAL INFORMATION // LEVEL 4 CLASSIFIED",
      paragraphs: [
        "Shen Qing pulled the collar of the cloak slightly tighter against the draft, his heart beating an unruly, betraying cadence against his ribs. He refused to show how his breath caught. 'I have forty more provincial dispatches to verify. If the grain shipment to the West Pass is delayed by three days, the garrison commander will—'",
        "'The grain shipment has already arrived,' Xiao Yan interrupted quietly, stepping closer until his tall silhouette eclipsed the flickering candlelight. 'I dispatched my personal escort with the supplies two dawns ago. You have been checking completed ledgers for three hours, Shen Qing.'",
      ],
    },
  ],
  chapterReviews: [
    {
      chapterNumber: 1,
      chapterTitle: "1. The Night Requisition at Lantern Pavilion",
      disguiseChapterTitle: "1.0 Administrative Audit & Ledger Review",
      summary:
        "Shen Qing verifies thirty thousand vanguard grain allocations late at night in the freezing Lantern Pavilion archives. Amidst the whistling northern winds, an unexpected arrival in iron-rimmed military boots disrupts the silent hall.",
      disguiseSummary:
        "Phase 1.0 executes administrative auditing of regional resource ledgers (30,000 units) at Secure Annex. Environmental compliance monitored with zero discrepancy logged.",
      keyPoints: [
        "Requisition ledger audited for thirty thousand vanguard infantry.",
        "Curfew bell passes while Shen Qing works alone in the sub-zero draft.",
        "Heavy footsteps signal General Xiao Yan's entry into the restricted archives.",
      ],
      disguiseKeyPoints: [
        "Regional ledger allocation audited against baseline quota.",
        "Internal facility access recorded outside standard hours.",
        "Operations management presence detected on-site.",
      ],
      fastPacedRecap:
        "In 2x speed: Archivist Shen Qing is freezing his fingers off past midnight trying to make sure 30,000 soldiers don't starve. Suddenly, heavy combat boots echo down the empty hall—it's the feared General Xiao Yan breaking curfew rules.",
      disguiseFastPacedRecap:
        "High-velocity audit briefing: Facility inspection initiated past scheduled hours. Regional resource balance verified without discrepancies.",
      cliffhanger:
        "Turning point: The intimidating general enters the restricted room without the required three minister seals.",
      isSensitive: false,
    },
    {
      chapterNumber: 2,
      chapterTitle: "2. The Midnight Encounter with General Xiao Yan",
      disguiseChapterTitle: "[CONFIDENTIAL INFORMATION] 2.0 Operations Alignment & Resource Delivery",
      summary:
        "General Xiao Yan bypasses ministerial seal requirements to drape his personal cedar-smoked fur cloak over Shen Qing's shivering shoulders. He chides the archivist for skipping meals in the freezing cold.",
      disguiseSummary:
        "[CONFIDENTIAL INFORMATION] Corporate compliance audit: High-risk bilateral personnel coordination protocol executed. Personal thermal asset provisioned under Level 4 Non-Disclosure Protocol.",
      keyPoints: [
        "Xiao Yan enters without ministerial seal to provide his own warm fur cloak.",
        "Xiao Yan expresses concern over Shen Qing fasting and enduring freezing cold.",
        "Tension and unstated closeness between the cold general and fragile archivist.",
      ],
      disguiseKeyPoints: [
        "CONFIDENTIAL INFORMATION: Level 4 Non-Disclosure Protocol logged.",
        "Administrative protocols adjusted for emergency facility support.",
        "Thermal equipment delivered to maintain active personnel productivity.",
      ],
      fastPacedRecap:
        "In 2x speed: Xiao Yan doesn't care about bureaucratic rules—he wraps his own body-warmed fur coat around Shen Qing and scolds him for starving himself in the cold. Intimacy flares up in the quiet archive.",
      disguiseFastPacedRecap:
        "[CONFIDENTIAL INFORMATION] High-velocity executive audit: Restricted logistics transaction completed under Level 4 Security Protocol with zero external visibility.",
      cliffhanger:
        "Turning point: Xiao Yan steps close enough to block out the candlelight, trapping Shen Qing in his warmth.",
      isSensitive: true,
      confidentialClassification: "CONFIDENTIAL INFORMATION // LEVEL 4 CLASSIFIED",
    },
    {
      chapterNumber: 3,
      chapterTitle: "3. Completed Ledgers and the Imperial Seal",
      disguiseChapterTitle: "[CONFIDENTIAL INFORMATION] 3.0 System Validation & Protocol Compliance",
      summary:
        "When Shen Qing anxiously defends his work citing the delayed West Pass grain shipment, Xiao Yan reveals he already dispatched his elite personal escort two dawns prior—meaning Shen Qing has been re-checking verified ledgers.",
      disguiseSummary:
        "[CONFIDENTIAL INFORMATION] Corporate compliance audit: West Pass supply transaction confirmed concluded two cycles prior. Ledger reconciliation finalized under Level 4 clearance.",
      keyPoints: [
        "Shen Qing learns the West Pass grain dispatch had already arrived.",
        "Xiao Yan dispatched his own escort days earlier to alleviate the archivist's burden.",
        "Shen Qing realizes the general came solely to watch over him.",
      ],
      disguiseKeyPoints: [
        "CONFIDENTIAL INFORMATION: Security perimeter locked under executive discretion.",
        "Critical supply logistics verified completed ahead of deadline.",
        "Verification confirmed with zero outstanding variances.",
      ],
      fastPacedRecap:
        "In 2x speed: Shen Qing panics about the grain shipment being late, but Xiao Yan steps right up to him and drops the truth: he already sent his personal elite guards days ago so Shen Qing wouldn't have to overwork! He came solely to be with Shen Qing.",
      disguiseFastPacedRecap:
        "[CONFIDENTIAL INFORMATION] High-velocity briefing: Operational goals aligned; mutual non-disclosure covenant sealed under Level 4 clearance.",
      cliffhanger:
        "Turning point: Shen Qing realizes the fearsome general risked military reprimand just to check on him in private.",
      isSensitive: true,
      confidentialClassification: "CONFIDENTIAL INFORMATION // LEVEL 4 CLASSIFIED",
    },
  ],
};

export default function App() {
  const [document, setDocument] = useState<ExtractedDocument>(INITIAL_DEMO_DOC);
  const [corporateDisguise, setCorporateDisguise] = useState(false);
  const [cloakRules, setCloakRules] = useState<CloakRule[]>(DEFAULT_CLOAK_RULES);
  const [disguiseTemplate, setDisguiseTemplate] = useState<DisguiseTemplate>("corporate-spec");

  // Panel & Modal States
  const [isCloakExportOpen, setIsCloakExportOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isManualUploadOpen, setIsManualUploadOpen] = useState(false);
  const [isBrowserCompanionOpen, setIsBrowserCompanionOpen] = useState(false);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Formatting settings
  const [fontFamily, setFontFamily] = useState<FontFamily>("Arial");
  const [fontSize, setFontSize] = useState<FontSize>("11pt");
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>("1.15");
  const [viewMode, setViewMode] = useState<"paged" | "continuous" | "markdown">("paged");
  const [paragraphIndent, setParagraphIndent] = useState<boolean>(false);
  const [paperTheme, setPaperTheme] = useState<"white" | "warm" | "dark-docs">("white");
  const [showSummary, setShowSummary] = useState<boolean>(true);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [currentScreen, setCurrentScreen] = useState<"input" | "preview">("input");

  const handleLoadSampleDoc = (sampleDoc: ExtractedDocument) => {
    setDocument(sampleDoc);
    setCurrentScreen("preview");
  };

  // Novel Import Notification (Summary or Validation Error)
  const [novelImportNotification, setNovelImportNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleImportNovelFile = (file: File) => {
    setErrorMessage(null);
    setNovelImportNotification(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          const err = "Invalid JSON file: Failed to parse uploaded novel file syntax.";
          setErrorMessage(err);
          setNovelImportNotification({ message: err, type: "error" });
          return;
        }

        const validation = validateNovelJson(parsed);
        if (!validation.valid || !validation.payload) {
          const err = validation.error || "Invalid novel JSON file format.";
          setErrorMessage(err);
          setNovelImportNotification({ message: err, type: "error" });
          return;
        }

        // Convert novel directly in code (Zero Gemini API calls, client-side only)
        const result = convertNovelToDocument(validation.payload);
        setDocument(result.document);
        setCurrentScreen("preview");
        setNovelImportNotification({
          message: result.summary,
          type: "success",
        });
      } catch (err: any) {
        console.error("Novel import error:", err);
        const errStr = err?.message || "Failed to process novel file.";
        setErrorMessage(errStr);
        setNovelImportNotification({ message: errStr, type: "error" });
      }
    };

    reader.onerror = () => {
      const err = "Could not read uploaded file.";
      setErrorMessage(err);
      setNovelImportNotification({ message: err, type: "error" });
    };

    reader.readAsText(file);
  };

  const handleLoadSampleNovelJson = () => {
    setErrorMessage(null);
    const result = convertNovelToDocument(SAMPLE_NOVEL_JSON);
    setDocument(result.document);
    setCurrentScreen("preview");
    setNovelImportNotification({
      message: result.summary,
      type: "success",
    });
  };

  const handleImportNovelJsonString = (rawJson: string) => {
    setErrorMessage(null);
    setNovelImportNotification(null);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawJson);
      } catch {
        const err = "Invalid JSON file: Failed to parse uploaded novel file syntax.";
        setErrorMessage(err);
        setNovelImportNotification({ message: err, type: "error" });
        return;
      }

      const validation = validateNovelJson(parsed);
      if (!validation.valid || !validation.payload) {
        const err = validation.error || "Invalid novel JSON file format.";
        setErrorMessage(err);
        setNovelImportNotification({ message: err, type: "error" });
        return;
      }

      // Convert novel directly in code (Zero Gemini API calls, client-side only)
      const result = convertNovelToDocument(validation.payload);
      setDocument(result.document);
      setCurrentScreen("preview");
      setNovelImportNotification({
        message: result.summary,
        type: "success",
      });
    } catch (err: any) {
      console.error("Novel import error:", err);
      const errStr = err?.message || "Failed to process novel.";
      setErrorMessage(errStr);
      setNovelImportNotification({ message: errStr, type: "error" });
    }
  };

  // Keyboard shortcut: Press Escape to toggle workplace cloak mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is editing an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (e.key === "Escape" && targetTag !== "input" && targetTag !== "textarea") {
        e.preventDefault();
        setCorporateDisguise((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute active document with synthetic replacements according to rules
  const activeDocument = useMemo(() => {
    const transformation = applyCloakRules(document, cloakRules);
    return {
      ...document,
      disguiseTitle: transformation.disguisedTitle || document.disguiseTitle,
      disguiseSubtitle: transformation.disguisedSubtitle || document.disguiseSubtitle,
      disguiseExecutiveSummary:
        transformation.disguisedSummary || document.disguiseExecutiveSummary,
      sections: transformation.disguisedSections,
      syntheticReplacements: transformation.replacements,
    };
  }, [document, cloakRules]);

  // Compute live safety audit for the active document
  const audit = useMemo(() => {
    return verifyDocumentSafety(activeDocument, corporateDisguise, cloakRules);
  }, [activeDocument, corporateDisguise, cloakRules]);

  const handleExtract = async (
    url: string,
    stylePreset: DocStylePreset,
    crawlOptions?: { crawlMode?: boolean; novelMode?: boolean; maxPages?: number; maxChapters?: number }
  ) => {
    setIsLoading(true);
    setErrorMessage(null);

    const isCrawl = !!crawlOptions?.crawlMode;
    const isNovel = !!crawlOptions?.novelMode;

    setLoadingStep(
      isNovel
        ? "Scanning novel URL & discovering chapter table of contents..."
        : isCrawl
        ? "Checking sitemap.xml & discovering company domain links..."
        : "Connecting to website and fetching text body..."
    );

    try {
      setTimeout(() => {
        setLoadingStep(
          isNovel
            ? "Discovered chapter links! Fetching unabridged chapter texts..."
            : isCrawl
            ? "Filtering domain links: /about, /services, /products & resolving relative URLs..."
            : "Stripping images, navigation, tracking scripts, and graphic banners..."
        );
      }, 1200);

      setTimeout(() => {
        setLoadingStep(
          isNovel
            ? "Formatting all chapters under Google Doc Professional Mode with zero images..."
            : isCrawl
            ? "Crawling pages & extracting clean text without CORS blocks..."
            : "Structuring text into clean Google Docs sections with Gemini AI..."
        );
      }, 2600);

      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          docStyle: stylePreset,
          crawlMode: isCrawl,
          novelMode: isNovel,
          maxPages: crawlOptions?.maxPages || 8,
          maxChapters: crawlOptions?.maxChapters || 25,
        }),
      });

      let result: any = null;
      const responseText = await response.text();
      try {
        result = JSON.parse(responseText);
      } catch {
        if (response.status === 504 || response.status === 502) {
          throw new Error(
            "Website Connection Timeout (HTTP " +
              response.status +
              "): The website took too long to respond or is blocking datacenter connections with Cloudflare Turnstile. You can easily copy and paste the chapter text directly or use 'Import novel (.json)'!"
          );
        }
        throw new Error(
          `Connection error (HTTP ${response.status}): This website restricts automated cloud access. You can copy the chapter text directly from your browser to format it in Google Doc Professional Mode.`
        );
      }

      if (!response.ok || !result || !result.success) {
        if (result?.isCloudflareBlocked) {
          setIsBrowserCompanionOpen(true);
        }
        throw new Error(result?.error || "Failed to extract text from URL.");
      }

      setDocument(result.data);
      setCurrentScreen("preview");

      if (stylePreset === "minimalist") {
        setFontFamily("Georgia");
        setLineSpacing("1.5");
      } else if (stylePreset === "executive") {
        setFontFamily("Roboto");
        setLineSpacing("1.15");
      } else {
        setFontFamily("Arial");
        setFontSize("11pt");
        setLineSpacing("1.15");
      }
    } catch (err: any) {
      console.error("Extraction error:", err);
      setErrorMessage(
        err.message || "Could not extract content from this source. Please verify URL is public."
      );
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleConvertManualContent = async (
    content: string,
    title: string,
    stylePreset: DocStylePreset
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep("Reading text & stripping external media...");

    try {
      setTimeout(() => {
        setLoadingStep("Structuring into DOCLOAK document format with Gemini AI...");
      }, 1200);

      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawContent: content,
          inputTitle: title || undefined,
          docStyle: stylePreset,
        }),
      });

      let result: any = null;
      const responseText = await response.text();
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(`Failed to process manual content (HTTP ${response.status}).`);
      }

      if (!response.ok || !result || !result.success) {
        throw new Error(result?.error || "Failed to process content.");
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to process and cloak document.");
      }

      setDocument(result.data);
      setCurrentScreen("preview");

      if (stylePreset === "minimalist") {
        setFontFamily("Georgia");
        setLineSpacing("1.5");
      } else if (stylePreset === "executive") {
        setFontFamily("Roboto");
        setLineSpacing("1.15");
      } else {
        setFontFamily("Arial");
        setFontSize("11pt");
        setLineSpacing("1.15");
      }
    } catch (err: any) {
      console.error("Manual conversion error:", err);
      setErrorMessage(err.message || "Could not format text. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleUpdateTitle = (newTitle: string) => {
    setDocument((prev) => ({ ...prev, title: newTitle }));
  };

  const handleUpdateSectionParagraph = (secIndex: number, pIndex: number, newText: string) => {
    setDocument((prev) => {
      const newSections = [...prev.sections];
      const targetSec = { ...newSections[secIndex] };
      const targetParagraphs = [...targetSec.paragraphs];
      targetParagraphs[pIndex] = newText;
      targetSec.paragraphs = targetParagraphs;
      newSections[secIndex] = targetSec;
      return { ...prev, sections: newSections };
    });
  };

  const handleGenerateChapterReviews = async () => {
    if (!activeDocument || !activeDocument.sections || activeDocument.sections.length === 0) return;
    setIsSummarizing(true);
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeDocument.title,
          disguiseTitle: activeDocument.disguiseTitle,
          sections: activeDocument.sections,
          isNovelContent: activeDocument.isNovelContent,
        }),
      });
      const data = await response.json();
      if (data.success && data.chapterReviews) {
        setDocument((prev) => ({
          ...prev,
          executiveSummary: data.executiveSummary || prev.executiveSummary,
          disguiseExecutiveSummary: data.disguiseExecutiveSummary || prev.disguiseExecutiveSummary,
          chapterReviews: data.chapterReviews,
        }));
      }
    } catch (e) {
      console.error("Failed to generate chapter reviews:", e);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleToggleSummary = async () => {
    const nextState = !showSummary;
    setShowSummary(nextState);
    if (nextState && (!activeDocument.chapterReviews || activeDocument.chapterReviews.length === 0)) {
      await handleGenerateChapterReviews();
    }
  };

  const handleCopyGoogleDocs = async () => {
    await copyForGoogleDocs(
      activeDocument,
      fontFamily,
      corporateDisguise,
      paragraphIndent
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Top DOCLOAK Navigation Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 py-3 px-4 sm:px-8 no-print shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/40 shadow-xs shrink-0 bg-slate-950 flex items-center justify-center">
              <img
                src={shieldCloakLogo}
                alt="DOCLOAK Shield Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">DOCLOAK</h1>
                <span className="hidden sm:inline-block text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Zero Images • Pure Text
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Enterprise document sanitizer & executive reader
              </p>
            </div>
          </div>

          {/* Screen 1 / Screen 2 Stepper */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-700/80 text-xs font-semibold shrink-0">
            <button
              id="screen-tab-input-btn"
              type="button"
              onClick={() => setCurrentScreen("input")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                currentScreen === "input"
                  ? "bg-blue-600 text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Screen 1: Input URL or paste content"
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">1</span>
              <span><span className="hidden sm:inline">Screen 1: </span>Input Link</span>
            </button>

            <button
              id="screen-tab-preview-btn"
              type="button"
              onClick={() => setCurrentScreen("preview")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                currentScreen === "preview"
                  ? "bg-blue-600 text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Screen 2: Reader Preview / Document Pages"
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">2</span>
              <span><span className="hidden sm:inline">Screen 2: </span>Reader Preview</span>
            </button>
          </div>

          {/* Quick Header Functions */}
          <div className="flex items-center gap-2 text-xs">
            {/* Cloak (Export) Button */}
            <button
              id="header-cloak-btn"
              type="button"
              onClick={() => setIsCloakExportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
              title="Cloak: Turn document into Google Doc, .docx, or plain text file"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Cloak (Export)</span>
            </button>

            {/* Disguise Toggle */}
            <button
              id="header-disguise-toggle-btn"
              type="button"
              onClick={() => setCorporateDisguise((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                corporateDisguise
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              }`}
              title="Disguise: Replace sensitive information with synthetic values (Shortcut: Esc)"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{corporateDisguise ? "Disguise: ON" : "Disguise"}</span>
              <kbd className="hidden md:inline-block bg-black/30 text-[10px] px-1 rounded font-mono">
                Esc
              </kbd>
            </button>

            {/* Cloak Rules Toggle */}
            <button
              id="header-rules-btn"
              type="button"
              onClick={() => setIsRulesOpen((prev) => !prev)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
              title="Cloak Rules: Define protection rules and custom synthetic replacements"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span>Rules</span>
            </button>

            {/* Verify Button */}
            <button
              id="header-verify-btn"
              type="button"
              onClick={() => setIsVerifyOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg font-semibold transition-colors cursor-pointer"
              title="Verify: Confirm document is safe and certified"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verify</span>
              <span className="font-mono text-[11px] font-normal opacity-80">
                ({audit.safetyScore}%)
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Novel Import Notification Banner (Summary or Error) */}
      {novelImportNotification && (
        <div className="max-w-5xl mx-auto w-full px-4 pt-3 no-print">
          <div
            className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs shadow-xs ${
              novelImportNotification.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : "bg-red-50 border-red-300 text-red-950"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {novelImportNotification.type === "success" ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Shield className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">
                  {novelImportNotification.type === "success"
                    ? "Novel Imported Successfully"
                    : "Novel Import Error"}
                </p>
                <p className="mt-0.5 font-medium leading-relaxed font-mono">
                  {novelImportNotification.message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNovelImportNotification(null)}
              className="text-gray-400 hover:text-gray-700 text-sm font-bold px-1.5 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* ========================================================================= */}
        {/* SCREEN 1: INPUT LINK AND CLICK BUTTON                                      */}
        {/* ========================================================================= */}
        {currentScreen === "input" && (
          <div className="flex-1 flex flex-col py-6 px-4 max-w-5xl mx-auto w-full no-print">
            {/* Screen 1 Banner */}
            <div className="mb-4 p-4 bg-white rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono font-bold text-xs">
                    SCREEN 1
                  </span>
                  <h2 className="text-base font-bold text-gray-900">
                    Input Link and Click Button to Disguise
                  </h2>
                </div>
                <p className="text-xs text-gray-600">
                  Input any novel or article link below and click the button to format, disguise, and open the preview reader.
                </p>
              </div>

              {document && (
                <button
                  id="jump-to-preview-btn"
                  type="button"
                  onClick={() => setCurrentScreen("preview")}
                  className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Go to Next Page: Reader Preview ({document.title.slice(0, 24)}...)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* URL / Manual Content Input Form */}
            <UrlInputSection
              onExtract={handleExtract}
              onConvertManualContent={handleConvertManualContent}
              onLoadSampleDoc={handleLoadSampleDoc}
              onImportNovelFile={handleImportNovelFile}
              onLoadSampleNovelJson={handleLoadSampleNovelJson}
              onOpenBrowserCompanion={() => setIsBrowserCompanionOpen(true)}
              isLoading={isLoading}
              loadingStep={loadingStep}
              errorMessage={errorMessage}
            />

            {/* Bottom Quick Jump to Next Page (Screen 2: Reader Preview) */}
            {document && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      Document Loaded: &ldquo;{document.title}&rdquo; ({document.sections?.length || 1} chapters, {document.wordCount?.toLocaleString() || 0} words)
                    </p>
                    <p className="text-[11px] text-gray-600">
                      Click below to proceed to the next page / reader preview.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  id="bottom-jump-to-preview-btn"
                  onClick={() => setCurrentScreen("preview")}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  <span>Go to Next Page: Reader Preview</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 2: PREVIEW                                                         */}
        {/* ========================================================================= */}
        {currentScreen === "preview" && (
          <div className="flex-1 flex flex-col">
            {/* Screen 2 Top Action & Breadcrumb Bar */}
            <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs no-print shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  id="back-to-input-btn"
                  type="button"
                  onClick={() => setCurrentScreen("input")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md font-semibold transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Back to Screen 1: Input New Link</span>
                </button>
                <span className="text-gray-300 hidden sm:inline">|</span>
                <span className="text-gray-700 font-medium truncate max-w-sm sm:max-w-md hidden sm:inline">
                  {corporateDisguise && activeDocument.disguiseTitle
                    ? activeDocument.disguiseTitle
                    : activeDocument.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="screen2-toggle-summary-btn"
                  type="button"
                  onClick={handleToggleSummary}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    showSummary
                      ? "bg-amber-600 hover:bg-amber-500 text-white shadow-xs"
                      : "bg-white hover:bg-amber-50 text-amber-800 border border-amber-300"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{showSummary ? "Hide 2X Film Review" : "⚡ 2X Film Review Recap"}</span>
                </button>

                <button
                  id="screen2-toggle-disguise-btn"
                  type="button"
                  onClick={() => setCorporateDisguise((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    corporateDisguise
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                      : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-300"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{corporateDisguise ? "Disguise: ON (Esc)" : "Disguise: OFF (Esc)"}</span>
                </button>
              </div>
            </div>

            {/* Dynamic Panels: Rules or Safety Verification Audit */}
            <div className="max-w-7xl mx-auto w-full px-4 no-print">
              {isRulesOpen && (
                <CloakRulesPanel
                  rules={cloakRules}
                  onUpdateRules={setCloakRules}
                  document={activeDocument}
                  onClose={() => setIsRulesOpen(false)}
                />
              )}

              {isVerifyOpen && (
                <VerifyPanel
                  audit={audit}
                  document={activeDocument}
                  isDisguised={corporateDisguise}
                  onToggleDisguise={() => setCorporateDisguise((prev) => !prev)}
                  onRefreshAudit={() => {}}
                  onCopyGoogleDocs={handleCopyGoogleDocs}
                  onClose={() => setIsVerifyOpen(false)}
                />
              )}
            </div>

            {/* Document Toolbar & Viewer */}
            <DocumentToolbar
              document={activeDocument}
              onUpdateTitle={handleUpdateTitle}
              fontFamily={fontFamily}
              onChangeFontFamily={setFontFamily}
              fontSize={fontSize}
              onChangeFontSize={setFontSize}
              lineSpacing={lineSpacing}
              onChangeLineSpacing={setLineSpacing}
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
              corporateDisguise={corporateDisguise}
              onToggleDisguise={() => setCorporateDisguise((prev) => !prev)}
              paragraphIndent={paragraphIndent}
              onToggleParagraphIndent={() => setParagraphIndent((prev) => !prev)}
              paperTheme={paperTheme}
              onChangePaperTheme={setPaperTheme}
              disguiseTemplate={disguiseTemplate}
              onChangeDisguiseTemplate={setDisguiseTemplate}
              onOpenManualUpload={() => setIsManualUploadOpen(true)}
              onOpenCloakExport={() => setIsCloakExportOpen(true)}
              onOpenRules={() => setIsRulesOpen(true)}
              onOpenVerify={() => setIsVerifyOpen(true)}
              showSummary={showSummary}
              onToggleSummary={handleToggleSummary}
              isSummarizing={isSummarizing}
              onImportNovelFile={handleImportNovelFile}
            />

            <DocumentViewer
              document={activeDocument}
              fontFamily={fontFamily}
              fontSize={fontSize}
              lineSpacing={lineSpacing}
              viewMode={viewMode}
              corporateDisguise={corporateDisguise}
              onToggleDisguise={() => setCorporateDisguise((prev) => !prev)}
              paragraphIndent={paragraphIndent}
              paperTheme={paperTheme}
              onUpdateSectionParagraph={handleUpdateSectionParagraph}
              onOpenManualUpload={() => setIsManualUploadOpen(true)}
              onOpenRules={() => setIsRulesOpen(true)}
              onOpenVerify={() => setIsVerifyOpen(true)}
              onOpenExportModal={() => setIsCloakExportOpen(true)}
              showSummary={showSummary}
              onToggleSummary={handleToggleSummary}
              isSummarizing={isSummarizing}
              onGenerateSummary={handleGenerateChapterReviews}
            />
          </div>
        )}
      </div>

      {/* Cloak & Export Modal */}
      <CloakExportModal
        isOpen={isCloakExportOpen}
        onClose={() => setIsCloakExportOpen(false)}
        document={activeDocument}
        fontFamily={fontFamily}
        isDisguised={corporateDisguise}
        onToggleDisguise={() => setCorporateDisguise((prev) => !prev)}
        paragraphIndent={paragraphIndent}
      />

      {/* Manual Upload Guide Modal */}
      <ManualUploadModal
        isOpen={isManualUploadOpen}
        onClose={() => setIsManualUploadOpen(false)}
        document={activeDocument}
        fontFamily={fontFamily}
      />

      {/* Browser Novel Extractor (Cloudflare Bypass) Modal */}
      <BrowserCompanionModal
        isOpen={isBrowserCompanionOpen}
        onClose={() => setIsBrowserCompanionOpen(false)}
        onImportJsonString={handleImportNovelJsonString}
      />
    </div>
  );
}
