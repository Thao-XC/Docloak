import React, { useState } from "react";
import { ExtractedDocument, FontFamily } from "../types";
import shieldCloakLogo from "../assets/images/shield_cloak_logo_1789625346572.jpg";
import {
  copyForGoogleDocs,
  downloadGoogleDocFile,
  downloadTextFile,
  downloadMarkdownFile,
  printAsPdf,
} from "../utils/exportUtils";
import {
  X,
  FileText,
  Copy,
  Download,
  ExternalLink,
  Check,
  Printer,
  Shield,
  FileCode,
  Sparkles,
} from "lucide-react";

interface CloakExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ExtractedDocument;
  fontFamily: FontFamily;
  isDisguised: boolean;
  onToggleDisguise: () => void;
  paragraphIndent: boolean;
}

export const CloakExportModal: React.FC<CloakExportModalProps> = ({
  isOpen,
  onClose,
  document,
  fontFamily,
  isDisguised,
  onToggleDisguise,
  paragraphIndent,
}) => {
  const [copiedDocs, setCopiedDocs] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [activeTab, setActiveTab] = useState<"actions" | "preview">("actions");
  const [previewFormat, setPreviewFormat] = useState<"docs" | "text" | "md">("docs");

  if (!isOpen) return null;

  const handleCopyGoogleDocs = async () => {
    const success = await copyForGoogleDocs(
      document,
      fontFamily,
      isDisguised,
      paragraphIndent
    );
    if (success) {
      setCopiedDocs(true);
      setTimeout(() => setCopiedDocs(false), 2500);
    }
  };

  const handleCopyPlainText = async () => {
    const activeTitle = isDisguised && document.disguiseTitle ? document.disguiseTitle : document.title;
    const activeSummary = isDisguised && document.disguiseExecutiveSummary ? document.disguiseExecutiveSummary : document.executiveSummary;
    let text = `${activeTitle}\n\n`;
    if (activeSummary) text += `EXECUTIVE BRIEF:\n${activeSummary}\n\n`;
    document.sections.forEach((sec, i) => {
      const heading = isDisguised && sec.disguiseHeading ? sec.disguiseHeading : sec.heading;
      const paras = isDisguised && sec.disguiseParagraphs ? sec.disguiseParagraphs : sec.paragraphs;
      text += `${i + 1}.0 ${heading}\n\n${paras.join("\n\n")}\n\n`;
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch (err) {
      console.error("Text copy failed:", err);
    }
  };

  const handleOpenGoogleDocs = () => {
    window.open("https://docs.new", "_blank", "noopener,noreferrer");
  };

  const currentTitle = isDisguised && document.disguiseTitle ? document.disguiseTitle : document.title;
  const currentSummary = isDisguised && document.disguiseExecutiveSummary ? document.disguiseExecutiveSummary : document.executiveSummary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-950 flex items-center justify-center shrink-0">
              <img
                src={shieldCloakLogo}
                alt="DOCLOAK"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="text-base font-bold">Cloak & Export Document</h3>
              <p className="text-xs text-slate-300">
                Transform into Google Doc, .docx, clean text, or PDF with zero images
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disguise Mode Switch Banner */}
        <div className="bg-slate-50 border-b border-gray-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <Shield
              className={`w-4 h-4 ${isDisguised ? "text-emerald-600" : "text-slate-400"}`}
            />
            <div>
              <span className="font-semibold text-gray-900">
                {isDisguised ? "Exporting with Synthetic Disguise" : "Exporting Original Text"}
              </span>
              <p className="text-gray-500 text-[11px] truncate max-w-xs sm:max-w-sm">
                Active Title: {currentTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleDisguise}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer shrink-0 ${
                isDisguised
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {isDisguised ? "Disguise: ON (Esc)" : "Turn On Disguise"}
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Export Hub vs Live Inspection) */}
        <div className="flex items-center justify-between px-5 pt-3 border-b border-gray-200 bg-white text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("actions")}
              className={`pb-2.5 px-3 border-b-2 font-medium transition-colors ${
                activeTab === "actions"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              Export Options
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`pb-2.5 px-3 border-b-2 font-medium transition-colors ${
                activeTab === "preview"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              Inspect Export Content
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-gray-500 font-mono pb-2">
            <span>{document.wordCount} words</span>
            <span>•</span>
            <span>0 images</span>
          </div>
        </div>

        {/* Body Container */}
        <div className="overflow-y-auto p-5 space-y-3 flex-1">
          {activeTab === "actions" ? (
            <>
              {/* Option 1: Google Docs Rich Copy */}
              <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1a73e8] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                      <span>Google Docs (Clipboard)</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-mono font-bold px-1.5 py-0.2 rounded">
                        RECOMMENDED
                      </span>
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Copies formatted rich HTML so pasting into docs.google.com creates a native document with preserved headings, margins, and typography.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyGoogleDocs}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    {copiedDocs ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy for Google Docs</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenGoogleDocs}
                    className="p-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg transition-colors cursor-pointer"
                    title="Open docs.new in a new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Option 2: Download .doc / docx */}
              <div className="p-3.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0 font-bold font-mono text-[11px]">
                    DOCX
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Download .doc / Word Document</h4>
                    <p className="text-gray-500 text-[11px]">
                      Opens natively in Microsoft Word, LibreOffice, and Google Drive with standard 1" margins
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    downloadGoogleDocFile(
                      document,
                      fontFamily,
                      isDisguised,
                      paragraphIndent
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .doc</span>
                </button>
              </div>

              {/* Option 3: Download Clean Text File (.txt) */}
              <div className="p-3.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 font-bold font-mono text-[11px]">
                    TXT
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Plain Text File (.txt)</h4>
                    <p className="text-gray-500 text-[11px]">
                      100% pure text with zero graphic assets, zero scripts, and clean paragraph breaks
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyPlainText}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors cursor-pointer"
                    title="Copy plain text to clipboard"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadTextFile(document, isDisguised)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Option 4: Save / Print as Google PDF */}
              <div className="p-3.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0 font-bold font-mono text-[11px]">
                    PDF
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Print / Save as Google PDF</h4>
                    <p className="text-gray-500 text-[11px]">
                      Renders standard 8.5x11 page layout with headers and page numbering for PDF export
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={printAsPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
              </div>

              {/* Option 5: Download Markdown (.md) */}
              <div className="p-3.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-300 flex items-center justify-center shrink-0 font-bold font-mono text-[11px]">
                    MD
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Markdown Document (.md)</h4>
                    <p className="text-gray-500 text-[11px]">
                      Markdown formatted with section headers, lists, and quotes
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => downloadMarkdownFile(document)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
              </div>
            </>
          ) : (
            /* Live Inspection Tab */
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Preview Mode:</span>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-md text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewFormat("docs")}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      previewFormat === "docs" ? "bg-white text-blue-700 font-semibold shadow-2xs" : "text-gray-600"
                    }`}
                  >
                    Google Doc View
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFormat("text")}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      previewFormat === "text" ? "bg-white text-blue-700 font-semibold shadow-2xs" : "text-gray-600"
                    }`}
                  >
                    Plain Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFormat("md")}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      previewFormat === "md" ? "bg-white text-blue-700 font-semibold shadow-2xs" : "text-gray-600"
                    }`}
                  >
                    Markdown
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 max-h-80 overflow-y-auto text-xs font-mono text-gray-800 leading-relaxed">
                {previewFormat === "docs" && (
                  <div className="font-sans space-y-3">
                    <h1 className="text-base font-bold text-[#1a73e8]">{currentTitle}</h1>
                    {currentSummary && (
                      <div className="p-2 bg-blue-50/70 border-l-2 border-blue-500 italic text-[11px] text-gray-700">
                        {currentSummary}
                      </div>
                    )}
                    {document.sections.slice(0, 3).map((s, idx) => {
                      const heading = isDisguised && s.disguiseHeading ? s.disguiseHeading : s.heading;
                      const paras = isDisguised && s.disguiseParagraphs ? s.disguiseParagraphs : s.paragraphs;
                      return (
                        <div key={idx} className="space-y-1 pt-2">
                          <h2 className="font-semibold text-gray-900">{heading}</h2>
                          {paras.slice(0, 2).map((p, pIdx) => (
                            <p key={pIdx} className="text-gray-700 text-[11px]">{p}</p>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}

                {previewFormat === "text" && (
                  <pre className="whitespace-pre-wrap text-[11px]">
                    {`${currentTitle}\n${"=".repeat(40)}\n\n${currentSummary ? `EXECUTIVE BRIEF:\n${currentSummary}\n\n` : ""}${document.sections.map((s) => `${isDisguised && s.disguiseHeading ? s.disguiseHeading : s.heading}\n\n${(isDisguised && s.disguiseParagraphs ? s.disguiseParagraphs : s.paragraphs).join("\n\n")}`).join("\n\n")}`}
                  </pre>
                )}

                {previewFormat === "md" && (
                  <pre className="whitespace-pre-wrap text-[11px]">
                    {document.fullMarkdown || `# ${currentTitle}\n\n${document.sections.map((s) => `## ${isDisguised && s.disguiseHeading ? s.disguiseHeading : s.heading}\n\n${(isDisguised && s.disguiseParagraphs ? s.disguiseParagraphs : s.paragraphs).join("\n\n")}`).join("\n\n")}`}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-gray-200 p-4 flex items-center justify-between text-xs shrink-0">
          <span className="text-gray-500">
            Zero images • Enterprise clean formatting • Press <kbd className="bg-white border border-gray-300 px-1 py-0.5 rounded font-mono text-[10px]">Esc</kbd> to toggle disguise
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
