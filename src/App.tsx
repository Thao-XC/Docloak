import React, { useState, useEffect, useMemo } from "react";
import { UrlInputSection } from "./components/UrlInputSection";
import { DocumentToolbar } from "./components/DocumentToolbar";
import { DocumentViewer } from "./components/DocumentViewer";
import { ManualUploadModal } from "./components/ManualUploadModal";
import { CloakRulesPanel } from "./components/CloakRulesPanel";
import { VerifyPanel } from "./components/VerifyPanel";
import { CloakExportModal } from "./components/CloakExportModal";
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
      disguiseHeading: "2.0 Operations Alignment & Resource Delivery",
      level: 1,
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
      disguiseHeading: "3.0 System Validation & Protocol Compliance",
      level: 1,
      paragraphs: [
        "Shen Qing pulled the collar of the cloak slightly tighter against the draft, his heart beating an unruly, betraying cadence against his ribs. He refused to show how his breath caught. 'I have forty more provincial dispatches to verify. If the grain shipment to the West Pass is delayed by three days, the garrison commander will—'",
        "'The grain shipment has already arrived,' Xiao Yan interrupted quietly, stepping closer until his tall silhouette eclipsed the flickering candlelight. 'I dispatched my personal escort with the supplies two dawns ago. You have been checking completed ledgers for three hours, Shen Qing.'",
      ],
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

  const handleExtract = async (url: string, stylePreset: DocStylePreset) => {
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep("Connecting to website and fetching text body...");

    try {
      setTimeout(() => {
        setLoadingStep("Stripping images, navigation, tracking scripts, and graphic banners...");
      }, 1000);

      setTimeout(() => {
        setLoadingStep("Structuring text into clean Google Docs sections with Gemini AI...");
      }, 2200);

      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, docStyle: stylePreset }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to extract text from URL.");
      }

      setDocument(result.data);

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

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to process and cloak document.");
      }

      setDocument(result.data);

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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* URL / Manual Content Input Form */}
        <div className="pt-6 px-4 no-print">
          <UrlInputSection
            onExtract={handleExtract}
            onConvertManualContent={handleConvertManualContent}
            isLoading={isLoading}
            loadingStep={loadingStep}
            errorMessage={errorMessage}
          />
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
        <div className="flex-1 flex flex-col">
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
          />
        </div>
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
    </div>
  );
}
