import React, { useState, useMemo, useEffect } from "react";
import {
  ExternalLink,
  BookOpen,
  Calendar,
  User,
  Globe,
  Quote,
  ChevronRight,
  ChevronLeft,
  Upload,
  Printer,
  Download,
  Shield,
  ShieldAlert,
  Eye,
  FileCheck2,
  Lock,
  Sparkles,
  Columns,
  CheckCircle2,
  Sliders,
  FileText,
  X,
  ListCollapse,
  RefreshCw,
  Loader2,
  Zap,
  Flame,
  Network,
} from "lucide-react";
import {
  ExtractedDocument,
  FontFamily,
  FontSize,
  LineSpacing,
  SyntheticReplacement,
  NovelBlock,
} from "../types";
import { downloadGoogleDocFile, printAsPdf } from "../utils/exportUtils";
import { paginateDocument, PaginatedPage } from "../utils/paginationUtils";
import { PageNavigationBar } from "./PageNavigationBar";
import { ResearchPostView } from "./ResearchPostView";

interface DocumentViewerProps {
  document: ExtractedDocument;
  fontFamily: FontFamily;
  fontSize: FontSize;
  lineSpacing: LineSpacing;
  viewMode: "paged" | "continuous" | "markdown" | "research";
  corporateDisguise: boolean;
  onToggleDisguise: () => void;
  paragraphIndent: boolean;
  paperTheme: "white" | "warm" | "dark-docs";
  onUpdateSectionParagraph: (secIndex: number, pIndex: number, newText: string) => void;
  onOpenManualUpload?: () => void;
  onOpenRules?: () => void;
  onOpenVerify?: () => void;
  onOpenExportModal?: () => void;
  showSummary?: boolean;
  onToggleSummary?: () => void;
  isSummarizing?: boolean;
  onGenerateSummary?: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  fontFamily,
  fontSize,
  lineSpacing,
  viewMode,
  corporateDisguise,
  onToggleDisguise,
  paragraphIndent,
  paperTheme,
  onUpdateSectionParagraph,
  onOpenManualUpload,
  onOpenRules,
  onOpenVerify,
  onOpenExportModal,
  showSummary = false,
  onToggleSummary,
  isSummarizing = false,
  onGenerateSummary,
}) => {
  const [highlightSynthetic, setHighlightSynthetic] = useState(true);
  const [splitCompare, setSplitCompare] = useState(false);
  const [reviewPacingMode, setReviewPacingMode] = useState<"2x-speed" | "detailed">("2x-speed");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagedViewType, setPagedViewType] = useState<"single" | "scroll">("single");
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);

  // Calculate discrete Google Doc letter pages
  const pages = useMemo(() => {
    return paginateDocument(document, corporateDisguise);
  }, [document, corporateDisguise]);

  const totalPages = pages.length;
  const isPagedSingle = viewMode === "paged" && pagedViewType === "single";

  // Clamp current page on document change
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  const activePage: PaginatedPage = pages[currentPage - 1] || pages[0];

  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(clamped);

    // If in Continuous or All-Sheets scroll mode, scroll directly to target section
    if (viewMode === "continuous" || pagedViewType === "scroll") {
      const targetPage = pages[clamped - 1];
      const targetSecIdx = targetPage?.sections[0]?.sectionIndex ?? (clamped - 1);
      const targetElem = document.getElementById(`sec-${targetSecIdx}`);
      if (targetElem) {
        targetElem.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

    // In Single Page Mode, scroll to anchor or canvas start
    const anchor =
      document.getElementById("page-content-anchor") ||
      document.getElementById("google-doc-canvas");
    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Touch Swipe Gesture Support for Mobile Devices (Swipe left for Next Page, right for Prev Page)
  const touchStartXRef = React.useRef<number | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Detect horizontal swipe (horizontal distance > 45px and more than vertical)
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0 && currentPage < totalPages) {
        // Swipe Left -> Next Page
        handlePageChange(currentPage + 1);
      } else if (deltaX > 0 && currentPage > 1) {
        // Swipe Right -> Prev Page
        handlePageChange(currentPage - 1);
      }
    }
  };

  // Keyboard navigation for page turning (Left/Right arrows, PageUp/PageDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === "PageDown") {
        if (currentPage < totalPages) {
          handlePageChange(currentPage + 1);
        }
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        if (currentPage > 1) {
          handlePageChange(currentPage - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages]);

  const fontClass =
    fontFamily === "Georgia"
      ? "font-serif"
      : fontFamily === "Times New Roman"
      ? "font-serif"
      : fontFamily === "Roboto"
      ? "font-sans"
      : "font-sans";

  const fontSizeClass =
    fontSize === "10pt"
      ? "text-[13px]"
      : fontSize === "12pt"
      ? "text-[16px]"
      : fontSize === "14pt"
      ? "text-[18px]"
      : "text-[14px]"; // 11pt Google Docs default

  const lineSpacingStyle = {
    lineHeight: lineSpacing,
  };

  const activeTitle =
    corporateDisguise && document.disguiseTitle ? document.disguiseTitle : document.title;
  const activeSubtitle =
    corporateDisguise && document.disguiseSubtitle ? document.disguiseSubtitle : document.subtitle;
  const activeSummary =
    corporateDisguise && document.disguiseExecutiveSummary
      ? document.disguiseExecutiveSummary
      : document.executiveSummary;

  // Paper Theme Styling
  const themePaperClasses =
    paperTheme === "dark-docs"
      ? "bg-[#1f1f1f] text-[#e3e3e3] border-gray-800"
      : paperTheme === "warm"
      ? "bg-[#faf8f5] text-[#2c2825] border-[#eae4dc]"
      : "bg-white text-[#202124] border-gray-200/80";

  const themeBgClass =
    paperTheme === "dark-docs"
      ? "bg-[#121212]"
      : paperTheme === "warm"
      ? "bg-[#f2ece4]"
      : "bg-[#f8f9fa]";

  const syntheticCount = document.syntheticReplacements?.reduce((sum, r) => sum + r.count, 0) || 0;

  // Helper to render paragraph with highlighted synthetic values
  const renderParagraphText = (
    text: string,
    replacements?: SyntheticReplacement[]
  ) => {
    if (!corporateDisguise || !highlightSynthetic || !replacements || replacements.length === 0) {
      return text;
    }

    // Build regex of active synthetic strings
    const sortedReplacements = [...replacements].sort(
      (a, b) => b.synthetic.length - a.synthetic.length
    );

    const syntheticTerms = sortedReplacements
      .map((r) => r.synthetic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .filter(Boolean);

    if (syntheticTerms.length === 0) return text;

    const regex = new RegExp(`(${syntheticTerms.join("|")})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const matched = sortedReplacements.find(
        (r) => r.synthetic.toLowerCase() === part.toLowerCase()
      );

      if (matched) {
        return (
          <span
            key={i}
            className="inline-block bg-emerald-50 text-emerald-800 border-b border-dashed border-emerald-500 font-medium px-1 rounded mx-0.5 relative group cursor-help"
            title={`Synthetic Disguise: Replaced "${matched.original}" (${matched.category})`}
          >
            {part}
            <span className="hidden group-hover:inline-block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-[10px] rounded shadow-lg whitespace-nowrap z-50 pointer-events-none font-sans font-normal">
              Original: <span className="text-rose-300 line-through">{matched.original}</span> ➔ Disguised: <span className="text-emerald-300 font-bold">{matched.synthetic}</span>
            </span>
          </span>
        );
      }
      return part;
    });
  };

  // Helper to render formatted NovelBlock (runs, italic, bold, quote, break, heading, \n line breaks)
  const renderNovelBlock = (block: NovelBlock, bIdx: number) => {
    if (block.type === "break") {
      return (
        <div
          key={bIdx}
          className="my-6 text-center text-gray-500 font-serif tracking-[0.6em] text-base select-none py-1"
        >
          * * *
        </div>
      );
    }

    if (block.type === "heading") {
      return (
        <h3
          key={bIdx}
          className="text-base sm:text-lg font-bold text-gray-900 mt-6 mb-2.5 pb-1 border-b border-gray-100"
        >
          {block.runs && block.runs.length > 0 ? (
            block.runs.map((r, rIdx) => (
              <span
                key={rIdx}
                className={`${r.bold ? "font-bold" : ""} ${r.italic ? "italic" : ""} whitespace-pre-line`}
              >
                {renderParagraphText(r.text, document.syntheticReplacements)}
              </span>
            ))
          ) : (
            <span className="whitespace-pre-line">
              {renderParagraphText(block.text || "", document.syntheticReplacements)}
            </span>
          )}
        </h3>
      );
    }

    if (block.type === "quote") {
      return (
        <blockquote
          key={bIdx}
          className="my-3 pl-4 border-l-4 border-blue-500/80 italic text-gray-700 bg-gray-50/70 py-2.5 pr-4 rounded-r text-xs sm:text-sm"
        >
          {block.runs && block.runs.length > 0 ? (
            block.runs.map((r, rIdx) => (
              <span
                key={rIdx}
                className={`${r.bold ? "font-bold" : ""} ${r.italic ? "italic" : ""} whitespace-pre-line`}
              >
                {renderParagraphText(r.text, document.syntheticReplacements)}
              </span>
            ))
          ) : (
            <span className="whitespace-pre-line">
              {renderParagraphText(block.text || "", document.syntheticReplacements)}
            </span>
          )}
        </blockquote>
      );
    }

    // Default: paragraph
    return (
      <p
        key={bIdx}
        className={`text-justify outline-none hover:bg-blue-50/20 focus:bg-blue-50/40 rounded px-1 transition-colors leading-relaxed ${
          paragraphIndent ? "indent-8" : ""
        }`}
      >
        {block.runs && block.runs.length > 0 ? (
          block.runs.map((r, rIdx) => (
            <span
              key={rIdx}
              className={`${r.bold ? "font-bold" : ""} ${r.italic ? "italic" : ""} whitespace-pre-line`}
            >
              {renderParagraphText(r.text, document.syntheticReplacements)}
            </span>
          ))
        ) : (
          <span className="whitespace-pre-line">
            {renderParagraphText(block.text || "", document.syntheticReplacements)}
          </span>
        )}
      </p>
    );
  };

  if (viewMode === "research") {
    return <ResearchPostView document={document} corporateDisguise={corporateDisguise} />;
  }

  if (viewMode === "markdown") {
    return (
      <div className="w-full max-w-4xl mx-auto my-8 bg-white border border-gray-200 rounded-xl shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Raw Text / Markdown View (Zero Images)
          </span>
          <button
            type="button"
            onClick={printAsPdf}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium cursor-pointer"
          >
            Print / PDF
          </button>
        </div>
        <pre className="font-mono text-xs text-gray-800 whitespace-pre-wrap leading-relaxed overflow-x-auto">
          {document.fullMarkdown ||
            `# ${activeTitle}\n\n${document.sections
              .map(
                (s) =>
                  `## ${s.heading}\n\n${s.paragraphs.join("\n\n")}`
              )
              .join("\n\n")}`}
        </pre>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 ${themeBgClass} py-4 px-2 sm:px-6 min-h-screen transition-colors`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Cloak Preview Inspector Bar */}
      <div className="max-w-7xl mx-auto mb-4 no-print">
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: View Mode Indicator & Quick Disguise Switch */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 font-semibold text-gray-900">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Cloak Preview:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] ${
                  corporateDisguise
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-slate-100 text-slate-700 border border-slate-300"
                }`}
              >
                {corporateDisguise ? "Disguised with Synthetic Data" : "Original Raw View"}
              </span>
            </div>

            <button
              type="button"
              onClick={onToggleDisguise}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                corporateDisguise
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{corporateDisguise ? "Disguise: ACTIVE (Esc)" : "Turn On Disguise (Esc)"}</span>
            </button>
          </div>

          {/* Center/Right: Synthetic Inspector Toggle & Split Compare */}
          <div className="flex items-center gap-3 flex-wrap">
            {corporateDisguise && (
              <label className="flex items-center gap-1.5 text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={highlightSynthetic}
                  onChange={(e) => setHighlightSynthetic(e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span className="flex items-center gap-1 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Highlight Disguised Values ({syntheticCount})</span>
                </span>
              </label>
            )}

            <button
              type="button"
              onClick={() => setSplitCompare(!splitCompare)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                splitCompare
                  ? "bg-blue-50 text-blue-700 border-blue-300 font-semibold"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
              title="Side-by-side comparison between Original and Disguised document"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>{splitCompare ? "Close Split View" : "Split / Compare View"}</span>
            </button>

            {onOpenRules && (
              <button
                type="button"
                onClick={onOpenRules}
                className="flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Rules</span>
              </button>
            )}

            {onOpenVerify && (
              <button
                type="button"
                onClick={onOpenVerify}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md font-medium transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verify Safe</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Document Workspace */}
      <div className="max-w-7xl mx-auto flex justify-center gap-6 items-start">
        {/* Document Outline Navigation (Desktop Sidebar) */}
        <nav
          aria-label="Document Navigation Outline"
          className={`hidden xl:block w-64 shrink-0 sticky top-28 no-print rounded-xl border p-4 shadow-xs text-xs transition-colors ${
            paperTheme === "dark-docs"
              ? "bg-[#1e1e1e] border-gray-800 text-gray-300"
              : "bg-white border-gray-200 text-gray-700"
          }`}
        >
          {/* Disguise Quick Switch Status */}
          <div className="mb-4 pb-3 border-b border-gray-200/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-medium">
              {corporateDisguise ? (
                <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span className="font-semibold text-gray-900 truncate">
                {corporateDisguise ? "Corporate Spec" : "Document Outline"}
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleDisguise}
              title="Shortcut: Press Esc to toggle disguise mode"
              className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                corporateDisguise
                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {corporateDisguise ? "Cloak ON" : "Cloak OFF"}
            </button>
          </div>

          <div className="font-medium text-gray-500 mb-2 uppercase tracking-wider text-[10px]">
            {corporateDisguise ? "Sections & Procedures" : "Sections & Topics"}
          </div>

          <ul className="space-y-1 text-gray-600">
            {document.sections.map((sec, idx) => {
              const displayHeading =
                corporateDisguise && sec.disguiseHeading ? sec.disguiseHeading : sec.heading;
              return (
                <li key={idx}>
                  <a
                    href={`#sec-${idx}`}
                    className="hover:text-blue-600 flex items-center gap-1 py-1 px-1.5 rounded hover:bg-blue-50/50 transition-colors truncate block"
                    title={displayHeading}
                  >
                    <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{displayHeading}</span>
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Quick Metrics */}
          <div className="mt-4 pt-3 border-t border-gray-200/60 space-y-1 text-gray-500 text-[11px]">
            <div className="flex items-center justify-between">
              <span>Word Count:</span>
              <span className="font-mono text-gray-700 font-semibold">{document.wordCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Images:</span>
              <span className="font-mono text-emerald-600 font-semibold">0 (100% Pure Text)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Disguised Values:</span>
              <span className="font-mono text-blue-600 font-semibold">{syntheticCount}</span>
            </div>
          </div>

          {/* Sidebar Quick Export Shortcuts */}
          <div className="mt-4 pt-3 border-t border-gray-200/60 space-y-2">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
              Quick Export
            </span>
            {onOpenExportModal ? (
              <button
                type="button"
                onClick={onOpenExportModal}
                className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Cloak & Export</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={printAsPdf}
                className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            )}
          </div>
        </nav>

        {/* Split / Compare View Container OR Single Document Canvas */}
        {splitCompare ? (
          <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Original Raw Content */}
            <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-200">
                <span className="text-xs font-mono font-bold text-slate-700 uppercase bg-slate-100 px-2 py-0.5 rounded">
                  ORIGINAL CONTENT
                </span>
                <span className="text-xs text-gray-500">Unmasked</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">{document.title}</h1>
              {document.subtitle && <p className="text-xs text-gray-500 mb-4">{document.subtitle}</p>}
              {document.executiveSummary && (
                <div className="p-3 bg-gray-50 border-l-4 border-gray-300 text-xs italic text-gray-700 mb-6">
                  {document.executiveSummary}
                </div>
              )}
              <div className="space-y-6">
                {document.sections.map((sec, sIdx) => (
                  <div key={sIdx}>
                    <h2 className="text-base font-semibold text-gray-900 mb-2">{sec.heading}</h2>
                    <div className="space-y-2 text-xs text-gray-700 leading-relaxed">
                      {sec.paragraphs.map((p, pIdx) => (
                        <p key={pIdx}>{p}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Cloaked & Disguised Content */}
            <div className="bg-emerald-50/30 rounded-xl border-2 border-emerald-300 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-emerald-200">
                <span className="text-xs font-mono font-bold text-emerald-800 uppercase bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-600" />
                  <span>CLOAKED & DISGUISED</span>
                </span>
                <span className="text-xs text-emerald-700 font-medium font-mono">
                  {syntheticCount} Synthetic Disguises
                </span>
              </div>
              <h1 className="text-xl font-bold text-[#1a73e8] mb-2">{document.disguiseTitle || document.title}</h1>
              <p className="text-xs text-gray-600 font-mono mb-4">
                {document.disguiseSubtitle || "Enterprise Corporate Document • Classification: Internal Eyes Only"}
              </p>
              {document.disguiseExecutiveSummary && (
                <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 text-xs italic text-emerald-900 mb-6">
                  {document.disguiseExecutiveSummary}
                </div>
              )}
              <div className="space-y-6">
                {document.sections.map((sec, sIdx) => {
                  const heading = sec.disguiseHeading || sec.heading;
                  const paras = sec.disguiseParagraphs || sec.paragraphs;
                  return (
                    <div key={sIdx}>
                      <h2 className="text-base font-semibold text-gray-900 mb-2 flex items-center justify-between">
                        <span>{heading}</span>
                        <span className="text-[10px] font-mono text-emerald-700">§ {sIdx + 1}.0</span>
                      </h2>
                      <div className="space-y-2 text-xs text-gray-800 leading-relaxed">
                        {paras.map((p, pIdx) => (
                          <p key={pIdx}>{renderParagraphText(p, document.syntheticReplacements)}</p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Standard Single Google Docs Container & Canvas */
          <div className="flex-1 max-w-4xl w-full">
            {/* Realistic Google Docs Ruler (Visible in Paged Mode) */}
            {viewMode === "paged" && (
              <div className="hidden sm:flex items-center justify-between bg-gray-100 border border-gray-300 border-b-0 h-4 px-12 text-[9px] font-mono text-gray-400 select-none no-print rounded-t-sm">
                <div className="flex items-center gap-1 text-blue-600">
                  <span className="w-2 h-2 border-b-2 border-l-2 border-blue-600 transform rotate-45 inline-block"></span>
                  <span>Margin: 1.0&quot;</span>
                </div>
                <div className="flex justify-between flex-1 mx-8 text-gray-400">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                  <span>6</span>
                  <span>7</span>
                </div>
                <div className="flex items-center gap-1 text-blue-600">
                  <span>Margin: 1.0&quot;</span>
                  <span className="w-2 h-2 border-b-2 border-r-2 border-blue-600 transform -rotate-45 inline-block"></span>
                </div>
              </div>
            )}

            {/* The Actual Document Canvas */}
            <div
              id="google-doc-canvas"
              className={`google-doc-page mx-auto relative ${themePaperClasses} ${
                viewMode === "paged"
                  ? "border rounded-sm shadow-[0_1px_3px_1px_rgba(60,64,67,0.15)] my-0 px-8 sm:px-14 py-12"
                  : "w-full border-none shadow-none px-4 py-8"
              } ${fontClass} ${fontSizeClass}`}
              style={lineSpacingStyle}
            >
              {/* Enterprise Header Running Head */}
              <div className="flex items-center justify-between pb-3 mb-6 border-b border-gray-200/80 text-[10px] text-gray-500 font-mono uppercase tracking-wider select-none">
                <span className="flex items-center gap-1.5">
                  {corporateDisguise ? (
                    <>
                      <Lock className="w-3 h-3 text-red-500" />
                      <span className="text-red-700 font-semibold">
                        CONFIDENTIAL // INTERNAL AUDIT & SPECIFICATION
                      </span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-3 h-3 text-blue-500" />
                      <span>PROFESSIONAL DOCUMENT // CLEAN WORK VIEW</span>
                    </>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline">
                    {corporateDisguise ? "REF: DOC-SEC-2026-Q3" : "NO IMAGES • PURE TEXT"}
                  </span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
              </div>

              {/* Document Header Bar */}
              {viewMode === "paged" && pagedViewType === "single" && currentPage > 1 ? (
                /* Compact Running Page Header on Page 2+ */
                <div className="mb-6 pb-3 border-b border-gray-200 flex items-center justify-between text-xs no-print">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded text-xs border border-blue-200 shrink-0">
                      {activePage.chapterTitle || `Page ${currentPage}`}
                    </span>
                    <span className="text-gray-500 truncate hidden sm:inline">{activeTitle}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Quick review recap trigger if summaries exist */}
                    {document.chapterReviews && document.chapterReviews.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsReviewDrawerOpen(true)}
                        className="px-2 py-1 text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded transition-colors cursor-pointer flex items-center gap-1"
                        title="Open 2X Film Review Storyline Recap"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        <span className="hidden sm:inline">2X Recap</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded transition-colors disabled:opacity-30 cursor-pointer flex items-center gap-1"
                      title="Previous Page (Left Arrow or Swipe Right)"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>
                    <span className="font-mono text-xs text-gray-700 font-bold px-1.5">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded transition-colors disabled:opacity-30 cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Next Page (Right Arrow or Swipe Left)"
                    >
                      <span>Next Page</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Full Cover / Title Header Bar (Page 1 or Continuous Scroll) */
                <div className="mb-6 pb-4 border-b border-gray-200">
                  {/* Document Title */}
                  <h1 className="text-2xl sm:text-3xl font-normal text-[#1a73e8] tracking-tight leading-snug mb-3">
                    {activeTitle}
                  </h1>

                  {/* Metadata Byline */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-gray-600">
                    {corporateDisguise ? (
                      <span className="font-mono text-[11px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {activeSubtitle || "Enterprise Systems Group • Document Status: Approved For Internal Review"}
                      </span>
                    ) : (
                      <>
                        {document.author && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span>
                              By <strong>{document.author}</strong>
                            </span>
                          </span>
                        )}
                        {document.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{document.date}</span>
                          </span>
                        )}
                        {document.domain && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-gray-400" />
                            <span>{document.domain}</span>
                          </span>
                        )}
                      </>
                    )}
                  </div>

                {/* Multi-Page Crawled Domain Dossier Badge */}
                {document.isCrawledSite && (
                  <div className="mt-3 p-3 bg-blue-50/90 border border-blue-200 rounded-lg text-xs text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        <strong>Multi-Page Domain Dossier:</strong> Crawled {document.crawledPagesCount || document.sections.length} connected pages across <span className="font-mono font-semibold">{document.domain}</span> (Home, About, Services, Products, Contact).
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-blue-800 bg-blue-100/90 border border-blue-200 px-2 py-0.5 rounded font-semibold shrink-0">
                      Sitemap & Link Crawler Verified
                    </span>
                  </div>
                )}

                {/* Full Web Novel Compilation Badge */}
                {document.isCrawledNovel && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-blue-50/90 to-indigo-50/80 border border-blue-200 rounded-lg text-xs text-blue-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        <strong>Full Web Novel Compilation:</strong> Extracted {document.crawledPagesCount || document.sections.length} Complete Chapters from <span className="font-mono font-semibold">{document.domain}</span> in <strong>Google Doc Professional Mode</strong>. 100% unabridged text • Zero images.
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                        Google Doc Ready
                      </span>
                      <span className="text-[10px] font-mono text-blue-800 bg-blue-100/90 border border-blue-200 px-2 py-0.5 rounded font-semibold">
                        {document.wordCount?.toLocaleString()} Words
                      </span>
                    </div>
                  </div>
                )}

                {/* Imported Novel Compilation Badge & Summary */}
                {document.isImportedNovel && (
                  <div className="mt-3 p-3.5 bg-gradient-to-r from-emerald-50/90 to-teal-50/80 border border-emerald-300 rounded-lg text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Novel Imported:</strong> {document.importSummary || `${document.title}: ${document.sections.length} chapters imported.`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded font-semibold">
                        Google Doc Mode
                      </span>
                      <span className="text-[10px] font-mono text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                        {document.wordCount?.toLocaleString()} Words
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

              {/* Novel Title Page (Google Doc Professional Mode) - Only when NOT in paged single mode, or on Page 1 if not already an active title page */}
              {document.isImportedNovel &&
                !corporateDisguise &&
                (!isPagedSingle || currentPage === 1) &&
                !activePage.isTitlePage && (
                <div className="novel-title-page text-center py-12 px-6 mb-12 border-b-2 border-dashed border-gray-300 bg-gray-50/40 rounded-sm">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-semibold inline-block mb-4">
                    Google Doc Professional Mode • Title Page
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 tracking-tight mb-3">
                    {document.title}
                  </h1>
                  {document.author && (
                    <p className="text-lg text-gray-600 font-serif italic mb-6">
                      By <strong className="font-semibold text-gray-800">{document.author}</strong>
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 font-mono mt-8 pt-4 border-t border-gray-200">
                    <span>{document.sections.length} Chapters</span>
                    <span>•</span>
                    <span>{document.wordCount?.toLocaleString()} Total Words</span>
                    <span>•</span>
                    <span>~{document.readingTimeMinutes} min reading time</span>
                  </div>
                  <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-mono text-gray-400">
                    <span className="h-px w-10 bg-gray-300"></span>
                    <span>Page Break • Chapter 1 Begins Below</span>
                    <span className="h-px w-10 bg-gray-300"></span>
                  </div>
                </div>
              )}

              {/* Chapter-by-Chapter Review & Executive Summary Panel - Only on Page 1 or Continuous Scroll */}
              {showSummary && (!isPagedSingle || currentPage === 1) && (
                <div className="mb-8 rounded-xl border border-blue-200 bg-white shadow-xs overflow-hidden text-gray-800 not-italic no-print">
                  {/* Review Header */}
                  <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/50 px-5 py-3.5 border-b border-blue-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-blue-600 text-white rounded-md shadow-xs shrink-0">
                        <ListCollapse className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <span>
                            {corporateDisguise
                              ? "Section-by-Section Operational Audit & Security Briefing"
                              : "Chapter-by-Chapter Review & Storyline Recap"}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-mono">
                            {document.chapterReviews?.length || document.sections.length} Chapters
                          </span>
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          {corporateDisguise
                            ? "Comprehensive audit of organizational parameters and confidential personnel protocols."
                            : "Follow the storyline fast: 2X-speed film review recap & dramatic chapter turning points."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Pacing Mode Switcher */}
                      <div className="flex items-center bg-white/90 p-0.5 rounded-lg border border-blue-200 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setReviewPacingMode("2x-speed")}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            reviewPacingMode === "2x-speed"
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-blue-700 hover:text-blue-900 hover:bg-blue-50"
                          }`}
                          title="Fast-paced storyline recap like viral 2x-speed film reviews"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>⚡ 2X Film Review</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewPacingMode("detailed")}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            reviewPacingMode === "detailed"
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                          title="Full detailed synopsis & audit findings"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Standard Synopsis</span>
                        </button>
                      </div>

                      {onGenerateSummary && (
                        <button
                          type="button"
                          onClick={onGenerateSummary}
                          disabled={isSummarizing}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-semibold transition-colors cursor-pointer disabled:opacity-50"
                          title="Re-analyze document and regenerate chapter review"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSummarizing ? "animate-spin text-blue-600" : ""}`} />
                          <span className="hidden sm:inline">{isSummarizing ? "Analyzing..." : "Regenerate"}</span>
                        </button>
                      )}
                      {onToggleSummary && (
                        <button
                          type="button"
                          onClick={onToggleSummary}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Hide review panel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Review Body */}
                  <div className="p-5 space-y-5">
                    {isSummarizing ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-3 text-gray-500">
                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        <p className="text-xs font-semibold text-gray-700">
                          Analyzing chapter narratives & generating fast-paced chapter review...
                        </p>
                        <p className="text-[11px] text-gray-400">
                          Evaluating character motivations, romantic turning points, and corporate disguises.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Overall Executive Overview Callout */}
                        {activeSummary && (
                          <div className="p-4 bg-blue-50/50 rounded-lg border-l-4 border-blue-600 text-xs leading-relaxed text-gray-700">
                            <span className="font-bold text-blue-900 block mb-1.5 uppercase tracking-wider text-[10px]">
                              {corporateDisguise ? "Strategic Executive Overview" : "Storyline Executive Overview"}
                            </span>
                            <p className="italic text-gray-800">{activeSummary}</p>
                          </div>
                        )}

                        {/* Chapter Breakdown Cards */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                              {reviewPacingMode === "2x-speed" ? (
                                <>
                                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                                  <span>
                                    {corporateDisguise
                                      ? "High-Velocity Operational Briefings & Confidential Protocols"
                                      : "2X-Speed Film Review Storyline Recaps (Fast 30s Catch-Up)"}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                                  <span>
                                    {corporateDisguise
                                      ? "Audit Section Milestones & Compliance Findings"
                                      : "Chapter Breakdown & Narrative Synopsis"}
                                  </span>
                                </>
                              )}
                            </h4>
                            <span className="text-[11px] text-gray-400 font-medium">
                              {reviewPacingMode === "2x-speed" ? "⚡ Paced for fast storyline comprehension" : "Detailed scene analysis"}
                            </span>
                          </div>

                          {document.chapterReviews && document.chapterReviews.length > 0 ? (
                            document.chapterReviews.map((rev, rIdx) => {
                              const isSens = rev.isSensitive;
                              const title =
                                corporateDisguise && rev.disguiseChapterTitle
                                  ? rev.disguiseChapterTitle
                                  : rev.chapterTitle;
                              const summaryText =
                                corporateDisguise && rev.disguiseSummary
                                  ? rev.disguiseSummary
                                  : rev.summary;
                              const fastRecapText =
                                corporateDisguise && rev.disguiseFastPacedRecap
                                  ? rev.disguiseFastPacedRecap
                                  : rev.fastPacedRecap || summaryText;
                              const points =
                                corporateDisguise && rev.disguiseKeyPoints
                                  ? rev.disguiseKeyPoints
                                  : rev.keyPoints;

                              return (
                                <div
                                  key={rIdx}
                                  className={`p-4 rounded-lg border transition-all text-xs ${
                                    isSens && corporateDisguise
                                      ? "bg-amber-50/40 border-amber-400/90 ring-1 ring-amber-300 shadow-xs"
                                      : isSens && !corporateDisguise
                                      ? "bg-rose-50/30 border-rose-200"
                                      : "bg-gray-50/80 hover:bg-gray-50 border-gray-200/90"
                                  }`}
                                >
                                  {/* Confidential Information Alert Banner for 18+ Chapters in Disguise */}
                                  {isSens && corporateDisguise && (
                                    <div className="mb-3 px-3 py-2 bg-red-950 text-red-100 rounded-md border border-red-700 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                        <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                        <span className="font-bold tracking-wider text-red-200">
                                          CONFIDENTIAL INFORMATION // LEVEL 4 CLASSIFIED
                                        </span>
                                      </div>
                                      <span className="px-2 py-0.5 bg-red-800 text-red-100 text-[10px] font-bold rounded uppercase tracking-wider font-mono">
                                        RESTRICTED NON-DISCLOSURE PROTOCOL
                                      </span>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span
                                        className={`px-2 py-0.5 rounded font-bold text-[11px] font-mono shrink-0 ${
                                          isSens && corporateDisguise
                                            ? "bg-red-100 text-red-800 border border-red-200"
                                            : "bg-blue-100 text-blue-800"
                                        }`}
                                      >
                                        {corporateDisguise ? `Section ${rIdx + 1}.0` : `Chapter ${rIdx + 1}`}
                                      </span>

                                      <h5 className="font-semibold text-gray-900 flex items-center gap-1.5">
                                        <span>{title}</span>
                                      </h5>

                                      {/* Sensitive Badges */}
                                      {isSens && !corporateDisguise && (
                                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold flex items-center gap-1 border border-rose-200">
                                          <Flame className="w-3 h-3 text-rose-600" />
                                          🔞 Sensitive / Intimate Scene
                                        </span>
                                      )}
                                    </div>

                                    <a
                                      href={`#sec-${rIdx}`}
                                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline shrink-0 flex items-center gap-0.5"
                                    >
                                      <span>Read Chapter</span>
                                      <span>↓</span>
                                    </a>
                                  </div>

                                  {/* Fast Paced 2X Recap or Standard Synopsis */}
                                  {reviewPacingMode === "2x-speed" ? (
                                    <div className="space-y-2.5">
                                      <div
                                        className={`p-3 rounded-lg border leading-relaxed text-xs ${
                                          isSens && corporateDisguise
                                            ? "bg-amber-100/50 border-amber-300 text-amber-950"
                                            : "bg-white border-amber-200/70 text-gray-800 shadow-xs"
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 font-bold text-amber-800 text-[10px] uppercase tracking-wider mb-1">
                                          <Zap className="w-3 h-3 text-amber-600" />
                                          <span>
                                            {corporateDisguise
                                              ? "High-Velocity Executive Briefing (2X Pace)"
                                              : "2X-Speed Film Review Storyline Recap"}
                                          </span>
                                          <span className="ml-auto text-[10px] font-mono text-amber-700/80 font-normal">
                                            ⏱️ ~30s read
                                          </span>
                                        </div>
                                        <p className="text-gray-800 font-medium">{fastRecapText}</p>
                                      </div>

                                      {/* Dramatic Cliffhanger / Turning Point */}
                                      {rev.cliffhanger && (
                                        <div className="px-3 py-2 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 rounded-md border border-blue-200/70 flex items-start gap-2 text-[11px]">
                                          <span className="font-bold text-blue-800 shrink-0">🎯 Turning Point:</span>
                                          <span className="text-gray-700 italic font-medium">{rev.cliffhanger}</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-gray-700 leading-relaxed mb-2.5 font-normal">
                                      {summaryText}
                                    </p>
                                  )}

                                  {/* Detailed Key Points (shown in detailed mode or as secondary support) */}
                                  {points && points.length > 0 && reviewPacingMode === "detailed" && (
                                    <div className="bg-white/80 rounded p-2.5 border border-gray-200/60 mt-2">
                                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                        {corporateDisguise ? "Key Audit Findings" : "Key Narrative Moments"}
                                      </span>
                                      <ul className="space-y-1">
                                        {points.map((pt, pIdx) => (
                                          <li
                                            key={pIdx}
                                            className="flex items-start gap-1.5 text-gray-700 text-[11px]"
                                          >
                                            <span className="text-blue-500 font-bold mt-0.5">•</span>
                                            <span>{pt}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            /* Fallback if chapterReviews wasn't loaded: auto-extract from document sections */
                            document.sections.map((sec, sIdx) => {
                              const heading =
                                corporateDisguise && sec.disguiseHeading ? sec.disguiseHeading : sec.heading;
                              const firstPara = sec.paragraphs[0] || "";
                              return (
                                <div
                                  key={sIdx}
                                  className="p-3.5 bg-gray-50/80 rounded-lg border border-gray-200/80 text-xs"
                                >
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[11px] font-mono shrink-0">
                                        {corporateDisguise ? `Section ${sIdx + 1}.0` : `Chapter ${sIdx + 1}`}
                                      </span>
                                      <h5 className="font-semibold text-gray-900">{heading}</h5>
                                    </div>
                                    <a
                                      href={`#sec-${sIdx}`}
                                      className="text-[11px] text-blue-600 hover:text-blue-800 font-medium hover:underline shrink-0"
                                    >
                                      Jump to Text ↓
                                    </a>
                                  </div>
                                  <p className="text-gray-700 leading-relaxed font-normal">
                                    {firstPara.slice(0, 200)}...
                                  </p>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Scroll Anchor for smooth and precise page turning */}
              <div id="page-content-anchor" className="scroll-mt-6" />

              {/* Sections & Chapters Content Rendering */}
              {viewMode === "paged" && pagedViewType === "single" ? (
                /* Single Page Focus Mode (Phone-Friendly & Discrete Google Doc Letter Sheet) */
                <div className="space-y-6">
                  {activePage.isTitlePage ? (
                    /* Standalone Cover / Title Page */
                    <div className="novel-title-page text-center py-12 px-6 mb-8 bg-gray-50/50 rounded-sm border border-gray-200">
                      <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-semibold inline-block mb-4">
                        Google Doc Professional Mode • Cover Page
                      </span>
                      <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 tracking-tight mb-3">
                        {document.title}
                      </h1>
                      {document.author && (
                        <p className="text-lg text-gray-600 font-serif italic mb-6">
                          By <strong className="font-semibold text-gray-800">{document.author}</strong>
                        </p>
                      )}
                      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 font-mono mt-8 pt-4 border-t border-gray-200">
                        <span>{document.sections.length} Chapters</span>
                        <span>•</span>
                        <span>{document.wordCount?.toLocaleString()} Total Words</span>
                        <span>•</span>
                        <span>{totalPages} Total Pages</span>
                      </div>
                      <div className="mt-8 flex justify-center">
                        <button
                          type="button"
                          onClick={() => handlePageChange(2)}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
                        >
                          <span>Begin Reading (Page 2)</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Discrete Content Page */
                    <div className="space-y-6">
                      {activePage.sections.map((section, secIdx) => {
                        const sectionHeading = section.heading;
                        const isSectionSensitive = section.isSectionSensitive;
                        const paras = section.paragraphs;

                        return (
                          <section key={secIdx} className="pt-2">
                            {/* Confidential Information Alert Banner for Sensitive Sections in Disguise Mode */}
                            {isSectionSensitive && corporateDisguise && (
                              <div className="mb-2.5 px-3 py-1.5 bg-red-950 text-red-100 rounded border border-red-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono shadow-xs">
                                <div className="flex items-center gap-2">
                                  <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                  <span className="font-bold tracking-wider text-red-300">
                                    CONFIDENTIAL INFORMATION // LEVEL 4 AUDIT PROTOCOL
                                  </span>
                                </div>
                                <span className="text-[10px] bg-red-900 px-1.5 py-0.5 rounded text-red-200 border border-red-700 font-semibold uppercase">
                                  RESTRICTED CLEARANCE
                                </span>
                              </div>
                            )}

                            {/* Sensitive Tag for Normal Reader Mode */}
                            {isSectionSensitive && !corporateDisguise && (
                              <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-[11px] border border-rose-200 font-medium">
                                <Flame className="w-3 h-3 text-rose-600" />
                                <span>Chapter {activePage.chapterIndex ?? (section.sectionIndex + 1)}: Sensitive & Intimate Narrative Arc</span>
                              </div>
                            )}

                            {/* Section / Chapter Heading (Heading 1 in Google Doc Novel Mode) */}
                            {sectionHeading && (
                              document.isImportedNovel && !corporateDisguise ? (
                                <h2 className="text-xl sm:text-2xl font-bold text-[#1a73e8] pb-1.5 mb-4 border-b border-gray-200 flex items-center justify-between">
                                  <span>{sectionHeading}</span>
                                  <span className="text-xs font-mono text-gray-400 font-normal">
                                    Chapter {activePage.chapterIndex ?? (section.sectionIndex + 1)}
                                  </span>
                                </h2>
                              ) : (
                                <h2 className="text-lg sm:text-xl font-medium text-[#202124] pb-1 mb-3 border-b border-gray-100 flex items-center justify-between">
                                  <span>{sectionHeading}</span>
                                  <span className="text-[10px] font-mono text-gray-400 font-normal">
                                    § {section.sectionIndex + 1}.0
                                  </span>
                                </h2>
                              )
                            )}

                            {/* Continued Marker if section spans from previous page */}
                            {section.isContinued && !sectionHeading && (
                              <div className="mb-3 text-[11px] font-mono text-gray-400 flex items-center gap-2">
                                <span className="h-px bg-gray-200 flex-1"></span>
                                <span>{activePage.chapterTitle} (continued)</span>
                                <span className="h-px bg-gray-200 flex-1"></span>
                              </div>
                            )}

                            {/* Content: Formatted Novel Blocks OR Legacy Paragraphs */}
                            {section.blocks && section.blocks.length > 0 && !corporateDisguise ? (
                              <div className="space-y-3">
                                {section.blocks.map(renderNovelBlock)}
                              </div>
                            ) : (
                              /* Paragraphs */
                              <div className="space-y-3">
                                {paras.map((para, pIdx) => (
                                  <p
                                    key={pIdx}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) =>
                                      onUpdateSectionParagraph(
                                        section.sectionIndex,
                                        section.startParaIdx + pIdx,
                                        e.currentTarget.textContent || para
                                      )
                                    }
                                    className={`text-justify outline-none hover:bg-blue-50/20 focus:bg-blue-50/40 rounded px-1 transition-colors ${
                                      paragraphIndent ? "indent-8" : ""
                                    }`}
                                    title="Click to edit text directly"
                                  >
                                    {renderParagraphText(para, document.syntheticReplacements)}
                                  </p>
                                ))}
                              </div>
                            )}

                            {/* Bullet Points */}
                            {section.bulletPoints && section.bulletPoints.length > 0 && (
                              <div className="my-3 pl-4">
                                <ul className="list-disc space-y-1.5 text-gray-800">
                                  {section.bulletPoints.map((item, bIdx) => (
                                    <li key={bIdx} className="pl-1">
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Callout Quote */}
                            {section.callout && (
                              <div className="my-4 p-3 bg-blue-50/50 border-l-3 border-blue-500 rounded-r text-gray-700 text-xs italic flex items-start gap-2">
                                <Quote className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                <span>{section.callout}</span>
                              </div>
                            )}
                          </section>
                        );
                      })}
                    </div>
                  )}

                  {/* In-Canvas Bottom Page Navigation (Large & Prominent) */}
                  <PageNavigationBar
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    pages={pages}
                    pagedViewType={pagedViewType}
                    onChangePagedViewType={setPagedViewType}
                  />
                </div>
              ) : (
                /* Continuous Scroll Mode (All sections rendered continuously) */
                <div className="space-y-6">
                  {document.sections.map((section, sIdx) => {
                    const sectionHeading =
                      corporateDisguise && section.disguiseHeading
                        ? section.disguiseHeading
                        : section.heading;

                    const paras =
                      corporateDisguise && section.disguiseParagraphs
                        ? section.disguiseParagraphs
                        : section.paragraphs;

                    const isSectionSensitive =
                      section.isSensitive ??
                      (document.chapterReviews && document.chapterReviews[sIdx]?.isSensitive) ??
                      false;

                    const isNewPage = (document.isImportedNovel || section.pageBreakBefore) && sIdx > 0;

                    return (
                      <section
                        key={sIdx}
                        id={`sec-${sIdx}`}
                        className={`pt-2 transition-all ${
                          isSectionSensitive && corporateDisguise
                            ? "p-3 bg-red-50/10 rounded-lg border-l-4 border-red-600"
                            : ""
                        } ${isNewPage ? "break-before-page border-t-2 border-dashed border-gray-200 mt-10 pt-8" : ""}`}
                      >
                        {/* Confidential Information Alert Banner for Sensitive Sections in Disguise Mode */}
                        {isSectionSensitive && corporateDisguise && (
                          <div className="mb-2.5 px-3 py-1.5 bg-red-950 text-red-100 rounded border border-red-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono shadow-xs">
                            <div className="flex items-center gap-2">
                              <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              <span className="font-bold tracking-wider text-red-300">
                                CONFIDENTIAL INFORMATION // LEVEL 4 AUDIT PROTOCOL
                              </span>
                              <span className="hidden sm:inline text-red-400/80">
                                — STRICT BILATERAL NON-DISCLOSURE ENFORCED
                              </span>
                            </div>
                            <span className="text-[10px] bg-red-900 px-1.5 py-0.5 rounded text-red-200 border border-red-700 font-semibold uppercase">
                              RESTRICTED CLEARANCE
                            </span>
                          </div>
                        )}

                        {/* Sensitive Tag for Normal Reader Mode */}
                        {isSectionSensitive && !corporateDisguise && (
                          <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-[11px] border border-rose-200 font-medium">
                            <Flame className="w-3 h-3 text-rose-600" />
                            <span>Chapter {section.chapterIndex ?? (sIdx + 1)}: Sensitive & Intimate Narrative Arc</span>
                          </div>
                        )}

                        {/* Section / Chapter Heading (Heading 1 in Google Doc Novel Mode) */}
                        {document.isImportedNovel && !corporateDisguise ? (
                          <h2 className="text-xl sm:text-2xl font-bold text-[#1a73e8] pb-1.5 mb-4 border-b border-gray-200 flex items-center justify-between">
                            <span>{sectionHeading}</span>
                            <span className="text-xs font-mono text-gray-400 font-normal">
                              Chapter {section.chapterIndex ?? (sIdx + 1)}
                            </span>
                          </h2>
                        ) : (
                          <h2 className="text-lg sm:text-xl font-medium text-[#202124] pb-1 mb-3 border-b border-gray-100 flex items-center justify-between">
                            <span>{sectionHeading}</span>
                            <span className="text-[10px] font-mono text-gray-400 font-normal">
                              § {sIdx + 1}.0
                            </span>
                          </h2>
                        )}

                        {/* Content: Formatted Novel Blocks OR Legacy Paragraphs */}
                        {section.blocks && section.blocks.length > 0 && !corporateDisguise ? (
                          <div className="space-y-3">
                            {section.blocks.map(renderNovelBlock)}
                          </div>
                        ) : (
                          /* Paragraphs */
                          <div className="space-y-3">
                            {paras.map((para, pIdx) => (
                              <p
                                key={pIdx}
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) =>
                                  onUpdateSectionParagraph(
                                    sIdx,
                                    pIdx,
                                    e.currentTarget.textContent || para
                                  )
                                }
                                className={`text-justify outline-none hover:bg-blue-50/20 focus:bg-blue-50/40 rounded px-1 transition-colors ${
                                  paragraphIndent ? "indent-8" : ""
                                }`}
                                title="Click to edit text directly"
                              >
                                {renderParagraphText(para, document.syntheticReplacements)}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Bullet Points */}
                        {section.bulletPoints && section.bulletPoints.length > 0 && (
                          <div className="my-3 pl-4">
                            <ul className="list-disc space-y-1.5 text-gray-800">
                              {section.bulletPoints.map((item, bIdx) => (
                                <li key={bIdx} className="pl-1">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Callout Quote */}
                        {section.callout && (
                          <div className="my-4 p-3 bg-blue-50/50 border-l-3 border-blue-500 rounded-r text-gray-700 text-xs italic flex items-start gap-2">
                            <Quote className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <span>{section.callout}</span>
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}

              {/* Document Footer (Visible on screen and in print) */}
              <div className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="font-mono text-[11px]">
                  {corporateDisguise
                    ? "CLASSIFICATION: RESTRICTED // INTERNAL ENTERPRISE EYES ONLY"
                    : `Source: ${document.domain || "Text Upload"} • ${document.extractedAt}`}
                </span>
                <span className="font-mono font-bold text-gray-700">
                  Formatted as Google Doc • Page {currentPage} of {totalPages}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Mobile & Desktop Bottom Page Navigator */}
      <PageNavigationBar
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        pages={pages}
        pagedViewType={pagedViewType}
        onChangePagedViewType={setPagedViewType}
        isFloating={true}
      />

      {/* Mobile & Tablet Side Quick Page Turn Chevrons */}
      <div className="fixed inset-y-0 right-0 w-12 sm:w-16 flex items-center justify-end pr-1 sm:pr-2 pointer-events-none z-40 no-print">
        {currentPage < totalPages && (
          <button
            type="button"
            id="mobile-side-next-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600/90 hover:bg-blue-600 active:bg-blue-700 text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs border border-blue-400/50"
            title="Next Page (Tap or Swipe Left)"
            aria-label="Next Page"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}
      </div>

      <div className="fixed inset-y-0 left-0 w-12 sm:w-16 flex items-center justify-start pl-1 sm:pl-2 pointer-events-none z-40 no-print">
        {currentPage > 1 && (
          <button
            type="button"
            id="mobile-side-prev-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800/80 hover:bg-slate-700 active:bg-slate-900 text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs border border-slate-600/50"
            title="Previous Page (Tap or Swipe Right)"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}
      </div>

      {/* Discreet Floating Disguise Button (Positioned safely above floating page navigator) */}
      <aside aria-label="Disguise Mode" className="fixed bottom-20 right-4 sm:bottom-4 sm:right-4 z-40 no-print">
        <button
          type="button"
          onClick={onToggleDisguise}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold shadow-lg transition-all duration-200 cursor-pointer ${
            corporateDisguise
              ? "bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-400"
              : "bg-slate-900 text-white hover:bg-slate-800"
          }`}
          title="Toggle Disguise Mode (Esc)"
        >
          <Shield className="w-4 h-4" />
          <span>{corporateDisguise ? "Disguise: ON (Esc)" : "Disguise (Esc)"}</span>
        </button>
      </aside>

      {/* 2X Film Review Modal Drawer for reading on Page 2+ */}
      {isReviewDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print animate-in fade-in"
          onClick={() => setIsReviewDrawerOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-gray-900">
                  {corporateDisguise ? "Operational Audit Briefing" : "2X Film Review & Chapter Storyline Recap"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewDrawerOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 flex-1 space-y-4">
              {activeSummary && (
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-600 text-xs italic text-gray-800">
                  {activeSummary}
                </div>
              )}
              {document.chapterReviews?.map((rev, rIdx) => {
                const title = corporateDisguise && rev.disguiseChapterTitle ? rev.disguiseChapterTitle : rev.chapterTitle;
                const recap = corporateDisguise && rev.disguiseFastPacedRecap ? rev.disguiseFastPacedRecap : (rev.fastPacedRecap || rev.summary);
                return (
                  <div key={rIdx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-gray-900">
                      <span>{title}</span>
                      <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Chapter {rev.chapterNumber}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{recap}</p>
                    {rev.cliffhanger && (
                      <p className="text-[11px] text-amber-800 font-medium bg-amber-50/80 p-1.5 rounded border border-amber-200">
                        ⚡ {rev.cliffhanger}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsReviewDrawerOpen(false)}
                className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 cursor-pointer"
              >
                Close & Return to Reading Page {currentPage}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
