import React, { useState } from "react";
import {
  ExternalLink,
  BookOpen,
  Calendar,
  User,
  Globe,
  Quote,
  ChevronRight,
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
} from "lucide-react";
import {
  ExtractedDocument,
  FontFamily,
  FontSize,
  LineSpacing,
  SyntheticReplacement,
} from "../types";
import { downloadGoogleDocFile, printAsPdf } from "../utils/exportUtils";

interface DocumentViewerProps {
  document: ExtractedDocument;
  fontFamily: FontFamily;
  fontSize: FontSize;
  lineSpacing: LineSpacing;
  viewMode: "paged" | "continuous" | "markdown";
  corporateDisguise: boolean;
  onToggleDisguise: () => void;
  paragraphIndent: boolean;
  paperTheme: "white" | "warm" | "dark-docs";
  onUpdateSectionParagraph: (secIndex: number, pIndex: number, newText: string) => void;
  onOpenManualUpload?: () => void;
  onOpenRules?: () => void;
  onOpenVerify?: () => void;
  onOpenExportModal?: () => void;
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
}) => {
  const [highlightSynthetic, setHighlightSynthetic] = useState(true);
  const [splitCompare, setSplitCompare] = useState(false);

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
    <div className={`flex-1 ${themeBgClass} py-4 px-2 sm:px-6 min-h-screen transition-colors`}>
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
                <span>
                  {corporateDisguise ? "REF: DOC-SEC-2026-Q3" : "NO IMAGES • PURE TEXT"}
                </span>
              </div>

              {/* Document Header Bar */}
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
              </div>

              {/* Executive Summary Callout */}
              {activeSummary && (
                <div className="mb-8 p-4 bg-[#f8f9fa] border-l-4 border-[#1a73e8] rounded-r-md text-gray-700 italic">
                  <span className="not-italic font-semibold text-[#1a73e8] block mb-1 text-xs uppercase tracking-wider">
                    {corporateDisguise ? "Executive Brief & Strategic Parameters" : "Executive Overview"}
                  </span>
                  <p>{activeSummary}</p>
                </div>
              )}

              {/* Sections & Chapters */}
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

                  return (
                    <section key={sIdx} id={`sec-${sIdx}`} className="pt-2">
                      {/* Section Heading */}
                      <h2 className="text-lg sm:text-xl font-medium text-[#202124] pb-1 mb-3 border-b border-gray-100 flex items-center justify-between">
                        <span>{sectionHeading}</span>
                        <span className="text-[10px] font-mono text-gray-400 font-normal">
                          § {sIdx + 1}.0
                        </span>
                      </h2>

                      {/* Paragraphs */}
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

              {/* Document Footer (Visible on screen and in print) */}
              <div className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="font-mono text-[11px]">
                  {corporateDisguise
                    ? "CLASSIFICATION: RESTRICTED // INTERNAL ENTERPRISE EYES ONLY"
                    : `Source: ${document.domain || "Text Upload"} • ${document.extractedAt}`}
                </span>
                <span>
                  Formatted as Google Doc • Page 1 of{" "}
                  {Math.max(1, Math.ceil(document.wordCount / 450))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Discreet Floating Disguise Button */}
      <aside aria-label="Disguise Mode" className="fixed bottom-4 right-4 z-40 no-print">
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
    </div>
  );
};
