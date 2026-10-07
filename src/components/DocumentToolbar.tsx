import React, { useState } from "react";
import {
  FileText,
  Printer,
  Copy,
  Download,
  ExternalLink,
  Check,
  Type,
  AlignLeft,
  Eye,
  FileCode,
  Upload,
  Shield,
  ShieldAlert,
  Star,
  Folder,
  CloudCheck,
  Lock,
  Sun,
  Moon,
  Indent,
  ChevronDown,
  Sliders,
  ShieldCheck,
  Sparkles,
  ListCollapse,
  Loader2,
  BookOpen,
} from "lucide-react";
import {
  ExtractedDocument,
  FontFamily,
  FontSize,
  LineSpacing,
  DisguiseTemplate,
} from "../types";
import {
  copyForGoogleDocs,
  downloadGoogleDocFile,
  downloadTextFile,
  downloadMarkdownFile,
  printAsPdf,
} from "../utils/exportUtils";

interface DocumentToolbarProps {
  document: ExtractedDocument;
  onUpdateTitle: (newTitle: string) => void;
  fontFamily: FontFamily;
  onChangeFontFamily: (font: FontFamily) => void;
  fontSize: FontSize;
  onChangeFontSize: (size: FontSize) => void;
  lineSpacing: LineSpacing;
  onChangeLineSpacing: (spacing: LineSpacing) => void;
  viewMode: "paged" | "continuous" | "markdown" | "research";
  onChangeViewMode: (mode: "paged" | "continuous" | "markdown" | "research") => void;
  corporateDisguise: boolean;
  onToggleDisguise: () => void;
  paragraphIndent: boolean;
  onToggleParagraphIndent: () => void;
  paperTheme: "white" | "warm" | "dark-docs";
  onChangePaperTheme: (theme: "white" | "warm" | "dark-docs") => void;
  disguiseTemplate: DisguiseTemplate;
  onChangeDisguiseTemplate: (template: DisguiseTemplate) => void;
  onOpenManualUpload?: () => void;
  onOpenCloakExport?: () => void;
  onOpenRules?: () => void;
  onOpenVerify?: () => void;
  showSummary?: boolean;
  onToggleSummary?: () => void;
  isSummarizing?: boolean;
  onImportNovelFile?: (file: File) => void;
}

export const DocumentToolbar: React.FC<DocumentToolbarProps> = ({
  document,
  onUpdateTitle,
  fontFamily,
  onChangeFontFamily,
  fontSize,
  onChangeFontSize,
  lineSpacing,
  onChangeLineSpacing,
  viewMode,
  onChangeViewMode,
  corporateDisguise,
  onToggleDisguise,
  paragraphIndent,
  onToggleParagraphIndent,
  paperTheme,
  onChangePaperTheme,
  disguiseTemplate,
  onChangeDisguiseTemplate,
  onOpenManualUpload,
  onOpenCloakExport,
  onOpenRules,
  onOpenVerify,
  showSummary = false,
  onToggleSummary,
  isSummarizing = false,
  onImportNovelFile,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(document.title);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const novelToolbarFileInputRef = React.useRef<HTMLInputElement>(null);

  const displayTitle =
    corporateDisguise && document.disguiseTitle ? document.disguiseTitle : document.title;

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    }
  };

  const handleCopy = async () => {
    const success = await copyForGoogleDocs(
      document,
      fontFamily,
      corporateDisguise,
      paragraphIndent
    );
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  const handleOpenGoogleDocs = () => {
    window.open("https://docs.new", "_blank", "noopener,noreferrer");
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-xs no-print select-none">
      {/* Google Docs Primary Top Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Google Docs File Icon, Title, & Google Menu Bar */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center justify-center w-9 h-9 rounded bg-[#1a73e8] text-white shadow-xs shrink-0 cursor-pointer"
            title="Google Docs Document"
          >
            <FileText className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            {/* Title & Drive Saved Status */}
            <div className="flex items-center gap-2">
              {isEditingTitle && !corporateDisguise ? (
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => e.key === "Enter" && handleTitleSubmit()}
                  autoFocus
                  className="font-medium text-gray-900 border border-blue-500 rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-72"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!corporateDisguise) {
                      setTitleInput(document.title);
                      setIsEditingTitle(true);
                    }
                  }}
                  title={
                    corporateDisguise
                      ? "Disguised title active (turn off disguise to edit original title)"
                      : "Click to rename document"
                  }
                  className="font-medium text-gray-900 hover:bg-gray-100 px-1.5 py-0.5 rounded text-sm truncate max-w-xs sm:max-w-md block text-left transition-colors cursor-pointer"
                >
                  {displayTitle}
                </button>
              )}

              {/* Star & Folder & Saved to Drive Indicators */}
              <div className="hidden sm:flex items-center gap-1.5 text-gray-400">
                <Star className="w-3.5 h-3.5 hover:text-amber-500 transition-colors cursor-pointer" />
                <Folder className="w-3.5 h-3.5 hover:text-gray-600 transition-colors cursor-pointer" />
                <span className="flex items-center gap-1 text-[11px] text-gray-500 ml-1">
                  <CloudCheck className="w-3.5 h-3.5 text-gray-500" />
                  <span>Saved to Drive</span>
                </span>
              </div>
            </div>

            {/* Authentic Google Docs Submenu (File, Edit, View, Format, Tools, Help) */}
            <nav aria-label="Document Menu" className="flex items-center gap-1 text-[12px] text-gray-700 mt-0.5">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMenu(activeMenu === "file" ? null : "file")}
                  className={`px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors ${
                    activeMenu === "file" ? "bg-gray-100 text-blue-600" : ""
                  }`}
                >
                  File
                </button>
                {activeMenu === "file" && (
                  <div
                    className="absolute left-0 mt-1 w-52 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 text-xs text-gray-700"
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenGoogleDocs();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span>New Document (docs.new)</span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleCopy();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span>Make a copy / Copy to Docs</span>
                    </button>
                    <div className="my-1 border-t border-gray-100"></div>
                    <button
                      type="button"
                      onClick={() => {
                        printAsPdf();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span>Download PDF document (.pdf)</span>
                      <span className="text-[10px] text-gray-400">Ctrl+P</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        downloadGoogleDocFile(
                          document,
                          fontFamily,
                          corporateDisguise,
                          paragraphIndent
                        );
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-100"
                    >
                      <span>Download Word / Docs (.doc)</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMenu(activeMenu === "view" ? null : "view")}
                  className={`px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors ${
                    activeMenu === "view" ? "bg-gray-100 text-blue-600" : ""
                  }`}
                >
                  View
                </button>
                {activeMenu === "view" && (
                  <div
                    className="absolute left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 text-xs text-gray-700"
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onToggleDisguise();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center justify-between font-medium text-emerald-800"
                    >
                      <span>Workplace Disguise (Boss Mode)</span>
                      <kbd className="text-[10px] bg-gray-100 px-1 rounded font-mono">Esc</kbd>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onChangeViewMode(viewMode === "paged" ? "continuous" : "paged");
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-100"
                    >
                      <span>Toggle Paged / Continuous Layout</span>
                    </button>
                    {onToggleSummary && (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleSummary();
                          setActiveMenu(null);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center justify-between"
                      >
                        <span>Executive Summary Box</span>
                        <span className="text-[10px] text-gray-500">{showSummary ? "Visible" : "Hidden"}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onToggleParagraphIndent}
                className="px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
                title="Toggle 0.5 inch first-line paragraph indent"
              >
                Format
              </button>

              <button
                type="button"
                onClick={onToggleDisguise}
                className="px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors text-emerald-700 font-medium"
                title="Toggle Corporate Disguise Mode"
              >
                Disguise
              </button>
            </nav>
          </div>
        </div>

        {/* Right: DOCLOAK Actions & Tooling */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          {/* Import novel (.json) button */}
          {onImportNovelFile && (
            <>
              <button
                id="toolbar-import-novel-json-btn"
                type="button"
                onClick={() => novelToolbarFileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Import novel (.json)"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Import novel (.json)</span>
                <span className="sm:hidden">Import (.json)</span>
              </button>
              <input
                ref={novelToolbarFileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onImportNovelFile(e.target.files[0]);
                    e.target.value = "";
                  }
                }}
              />
            </>
          )}

          {/* 1. Cloak Button (Turn document into Google doc / docx / text file) */}
          <button
            id="cloak-export-btn"
            type="button"
            onClick={onOpenCloakExport ? onOpenCloakExport : handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Cloak: Turn document into Google Doc, .docx, plain text, or PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Cloak (Export)</span>
          </button>

          {/* 2. Disguise Toggle (Replace sensitive info with synthetic values) */}
          <button
            id="boss-disguise-toggle-btn"
            type="button"
            onClick={onToggleDisguise}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              corporateDisguise
                ? "bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/50"
                : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
            }`}
            title="Disguise: Replace sensitive information with synthetic corporate values (Shortcut: Esc)"
          >
            {corporateDisguise ? (
              <>
                <Shield className="w-3.5 h-3.5 text-emerald-200" />
                <span>Disguise: ON</span>
                <kbd className="bg-emerald-700 text-[10px] px-1 rounded font-mono">Esc</kbd>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                <span>Disguise: OFF</span>
                <kbd className="bg-slate-200 text-slate-600 text-[10px] px-1 rounded font-mono">
                  Esc
                </kbd>
              </>
            )}
          </button>

          {/* 3. Special Summarize Toggle Button (Chapter Review) */}
          {onToggleSummary && (
            <button
              id="toolbar-summarize-btn"
              type="button"
              onClick={onToggleSummary}
              disabled={isSummarizing}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer disabled:cursor-not-allowed ${
                showSummary
                  ? "bg-blue-50 text-blue-800 border-blue-300 font-semibold shadow-xs"
                  : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
              }`}
              title={showSummary ? "Hide Chapter Review panel" : "Generate or show Chapter-by-Chapter Review"}
            >
              {isSummarizing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  <span>Reviewing...</span>
                </>
              ) : (
                <>
                  <ListCollapse className="w-3.5 h-3.5 text-blue-600" />
                  <span>{showSummary ? "Chapter Review: ON" : "Chapter Review"}</span>
                </>
              )}
            </button>
          )}

          {/* 4. Cloak Rules Button (Define protection rules) */}
          {onOpenRules && (
            <button
              id="cloak-rules-btn"
              type="button"
              onClick={onOpenRules}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Cloak Rules: Define protection rules and custom synthetic replacements"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Cloak Rules</span>
            </button>
          )}

          {/* 5. Verify Button (Confirm the document is safe) */}
          {onOpenVerify && (
            <button
              id="verify-doc-btn"
              type="button"
              onClick={onOpenVerify}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Verify: Confirm document is 100% safe, 0 images, sanitized PII, and Google Docs ready"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verify</span>
            </button>
          )}

          {/* Copy to Google Docs Quick Shortcut */}
          <button
            id="copy-for-google-docs-btn"
            type="button"
            onClick={handleCopy}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
            title="Copies formatted content to clipboard for Google Docs"
          >
            {copySuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Dropdown for other downloads & formats */}
          <div className="relative">
            <button
              id="more-downloads-btn"
              type="button"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
              title="More export options (docx, txt, md, print)"
            >
              <Download className="w-4 h-4" />
            </button>

            {showDownloadMenu && (
              <div
                className="absolute right-0 mt-1 w-60 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50 text-xs"
                onMouseLeave={() => setShowDownloadMenu(false)}
              >
                {onOpenCloakExport && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCloakExport();
                      setShowDownloadMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 text-blue-700 font-semibold border-b border-gray-100"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cloak & Export Hub...</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    downloadGoogleDocFile(
                      document,
                      fontFamily,
                      corporateDisguise,
                      paragraphIndent
                    );
                    setShowDownloadMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Download .doc (Word / Docs)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadTextFile(document, corporateDisguise);
                    setShowDownloadMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-medium"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download .txt (Clean Text File)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadMarkdownFile(document);
                    setShowDownloadMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <FileCode className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download .md (Markdown)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    printAsPdf();
                    setShowDownloadMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 border-t border-gray-100"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-600" />
                  <span>Print / Save as Google PDF</span>
                </button>
                {onOpenVerify && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenVerify();
                      setShowDownloadMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center gap-2 text-emerald-800 font-medium border-t border-gray-100"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verify Document Safety</span>
                  </button>
                )}
                {onOpenManualUpload && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenManualUpload();
                      setShowDownloadMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center gap-2 text-emerald-800 font-medium border-t border-gray-100"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Manual Google Drive Upload Guide</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Google Docs Formatting Toolbar Ribbon */}
      <div className="bg-[#edf2fa] border-t border-gray-200/80 px-4 py-1.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Formatting Controls */}
          <div className="flex items-center gap-2">
            {/* Font Family */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded px-2 py-1 shadow-2xs">
              <Type className="w-3.5 h-3.5 text-gray-400" />
              <select
                id="font-family-select"
                value={fontFamily}
                onChange={(e) => onChangeFontFamily(e.target.value as FontFamily)}
                className="bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="Arial">Arial (Google Default)</option>
                <option value="Roboto">Roboto (Clean)</option>
                <option value="Times New Roman">Times New Roman (Formal)</option>
                <option value="Georgia">Georgia (Editorial)</option>
              </select>
            </div>

            {/* Font Size */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded px-2 py-1 shadow-2xs">
              <select
                id="font-size-select"
                value={fontSize}
                onChange={(e) => onChangeFontSize(e.target.value as FontSize)}
                className="bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="10pt">10 pt</option>
                <option value="11pt">11 pt (Standard)</option>
                <option value="12pt">12 pt</option>
                <option value="14pt">14 pt</option>
              </select>
            </div>

            {/* Line Spacing */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded px-2 py-1 shadow-2xs">
              <AlignLeft className="w-3.5 h-3.5 text-gray-400" />
              <select
                id="line-spacing-select"
                value={lineSpacing}
                onChange={(e) => onChangeLineSpacing(e.target.value as LineSpacing)}
                className="bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="1.0">Single (1.0)</option>
                <option value="1.15">1.15 (Standard Doc)</option>
                <option value="1.5">1.5 (Relaxed)</option>
                <option value="2.0">Double (2.0)</option>
              </select>
            </div>

            {/* Paragraph First-Line Indent (0.5 in) */}
            <button
              type="button"
              onClick={onToggleParagraphIndent}
              className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors cursor-pointer ${
                paragraphIndent
                  ? "bg-blue-100 text-blue-800 border-blue-300"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
              title="First-line paragraph indent (0.5 in standard layout)"
            >
              <Indent className="w-3.5 h-3.5" />
              <span className="hidden md:inline">0.5" Indent</span>
            </button>

            {/* Paper Theme (White / Warm / Dark Docs) */}
            <div className="hidden lg:flex items-center gap-1 bg-white border border-gray-200 rounded px-1.5 py-0.5">
              <button
                type="button"
                onClick={() => onChangePaperTheme("white")}
                className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  paperTheme === "white" ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900"
                }`}
                title="Crisp white office paper"
              >
                White
              </button>
              <button
                type="button"
                onClick={() => onChangePaperTheme("warm")}
                className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  paperTheme === "warm" ? "bg-amber-100 text-amber-900" : "text-gray-500 hover:text-gray-900"
                }`}
                title="Warm eye-care paper"
              >
                Warm
              </button>
              <button
                type="button"
                onClick={() => onChangePaperTheme("dark-docs")}
                className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  paperTheme === "dark-docs" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-900"
                }`}
                title="Google Docs dark reading mode"
              >
                <Moon className="w-3 h-3 inline mr-0.5" />
                Night
              </button>
            </div>
          </div>

          {/* Right: Layout Switcher & Zero Images Assurance Badge */}
          <div className="flex items-center gap-2">
            <span className="hidden xl:flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <span>Zero Images • Professional Work Document</span>
            </span>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 p-0.5 rounded-md shadow-2xs">
              <button
                type="button"
                onClick={() => onChangeViewMode("paged")}
                className={`px-2.5 py-1 rounded transition-colors font-medium flex items-center gap-1 ${
                  viewMode === "paged"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Paged Doc</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeViewMode("continuous")}
                className={`px-2.5 py-1 rounded transition-colors font-medium flex items-center gap-1 ${
                  viewMode === "continuous"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Continuous</span>
              </button>
              <button
                type="button"
                id="view-research-post-btn"
                onClick={() => onChangeViewMode("research")}
                className={`px-2.5 py-1 rounded transition-colors font-medium flex items-center gap-1 ${
                  viewMode === "research"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Research Post</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
