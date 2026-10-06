import React, { useState, useRef } from "react";
import {
  Link2,
  Sparkles,
  Clipboard,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
  BookOpen,
  FileText,
  Upload,
  FileType,
  X,
  Zap,
  Globe,
  Network,
  Compass,
} from "lucide-react";
import { DocStylePreset, ExtractedDocument } from "../types";
import {
  BL_NOVEL_HISTORICAL_SAMPLE,
  BL_NOVEL_MODERN_SAMPLE,
} from "../utils/novelSamples";
import { Shield, Sparkles as SparklesIcon, FileCheck } from "lucide-react";

interface UrlInputSectionProps {
  onExtract: (
    url: string,
    style: DocStylePreset,
    crawlOptions?: { crawlMode?: boolean; novelMode?: boolean; maxPages?: number; maxChapters?: number }
  ) => void;
  onConvertManualContent: (content: string, title: string, style: DocStylePreset) => void;
  onLoadSampleDoc?: (doc: ExtractedDocument) => void;
  onImportNovelFile?: (file: File) => void;
  onLoadSampleNovelJson?: () => void;
  onOpenBrowserCompanion?: () => void;
  isLoading: boolean;
  loadingStep: string;
  errorMessage: string | null;
}

const SAMPLE_URLS = [
  {
    name: "Mother of Learning (RoyalRoad)",
    url: "https://www.royalroad.com/fiction/21220/mother-of-learning",
    desc: "Full fantasy novel (114 chapters) with automated TOC index",
    scope: "novel",
  },
  {
    name: "Mother of Learning (Ch. 1)",
    url: "https://www.royalroad.com/fiction/21220/mother-of-learning/chapter/301778/1-good-morning-brother",
    desc: "Starts at Chapter 1 and automatically crawls next chapters",
    scope: "novel",
  },
  {
    name: "Classic Novel (Gutenberg)",
    url: "https://www.gutenberg.org/files/1342/1342-h/1342-h.htm",
    desc: "Pride & Prejudice (57 chapters) unabridged novel",
    scope: "novel",
  },
  {
    name: "WordPress News",
    url: "https://wordpress.org/news/2024/07/wordpress-6-6-dorsey/",
    desc: "WordPress official announcement & features",
    scope: "single",
  },
  {
    name: "Python Docs (Domain Crawl)",
    url: "https://docs.python.org/3/whatsnew/3.13.html",
    desc: "Multi-page technical documentation",
    scope: "domain",
  },
];

const SAMPLE_MANUAL_TEXT = `Title: Building Modern Web Architecture with Edge Compute

Author: Engineering Team
Date: September 2024

Executive Summary:
Edge compute platforms are transitioning from simple reverse proxies to dynamic serverless environments. Deploying computation near end users drastically cuts Time to First Byte (TTFB) while maintaining central database synchronization.

1. Global Distributed Latency
Traditional multi-tier applications route every request back to a single centralized origin cloud region. Even with high-speed fiber optics, physics dictates speed-of-light propagation delays.
- Sub-50ms latency across 95% of global regions
- Automatic CDN caching layer for static assets
- Dynamic TLS termination at the edge PoP

2. Database Replication & State Synchronization
While stateless compute can execute anywhere, consistent persistence requires robust consensus protocols or read-replicas. Read-heavy workloads benefit tremendously from edge replicas, while transactions route back to primary clusters.

3. Key Engineering Takeaway
Edge computing is no longer an all-or-nothing proposition. Modern frameworks allow developers to seamlessly designate individual routes as edge or regional.`;

const SAMPLE_BL_NOVEL_TEXT = `Title: The Cold General and the Imperial Archivist
Chapter: Chapter 7 - The Night Verification
Author: Mo Ran

The wind off the northern moat rattled the lattice windows of the Lantern Pavilion, but Shen Qing did not look up from the requisitions ledger. His fingertips were numb with the autumn chill, yet the ink on his wolf-hair brush had to remain steady. One blot, one miscalculated bushel of winter oats, and thirty thousand vanguard infantry would starve before the frost broke.

A sudden draught made the brass tallow lamps flicker, casting long, wavering shadows across the cedar floorboards. Footsteps approached—heavy, measured, clad in iron-rimmed leather boots that could only belong to one man in this entire palace.

Shen Qing kept his gaze firmly fixed upon column seven. "The curfew bell tolled two quarters ago, General Xiao. Entering the secret archives after midnight requires an imperial seal with three minister signatures."

Xiao Yan did not produce an imperial seal. Instead, he dropped a heavy fur-lined cloak across Shen Qing's trembling shoulders. The dark wool still held the warmth of the general's chest, smelling faintly of cedar smoke and dry mountain snow.

"You haven't eaten since noon," Xiao Yan's voice was low, rough with the gravel of a man who spent months giving commands across gale-swept ridges. "The Emperor needs an archivist whose fingers can hold a pen, not an icicle."

Shen Qing pulled the collar of the cloak slightly tighter against the draft, his heart beating an unruly, betraying cadence against his ribs. He refused to show how his breath caught. "I have forty more provincial dispatches to verify. If the grain shipment to the West Pass is delayed by three days, the garrison commander will—"

"The grain shipment has already arrived," Xiao Yan interrupted quietly, stepping closer until his tall silhouette eclipsed the flickering candlelight. "I dispatched my personal escort with the supplies two dawns ago. You have been checking completed ledgers for three hours, Shen Qing."`;

export const UrlInputSection: React.FC<UrlInputSectionProps> = ({
  onExtract,
  onConvertManualContent,
  onLoadSampleDoc,
  onImportNovelFile,
  onLoadSampleNovelJson,
  onOpenBrowserCompanion,
  isLoading,
  loadingStep,
  errorMessage,
}) => {
  const [activeTab, setActiveTab] = useState<"url" | "manual">("url");
  const [inputUrl, setInputUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [scanScope, setScanScope] = useState<"novel" | "single" | "domain">("novel");
  const [maxChapters, setMaxChapters] = useState<number>(25);
  const [maxPages, setMaxPages] = useState<number>(8);
  const [stylePreset, setStylePreset] = useState<DocStylePreset>("google-doc");
  const [pasted, setPasted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [clipboardNotice, setClipboardNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const novelFileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    onExtract(inputUrl.trim(), stylePreset, {
      crawlMode: scanScope === "domain",
      novelMode: scanScope === "novel",
      maxPages,
      maxChapters,
    });
  };

  const handleSelectSample = (sample: typeof SAMPLE_URLS[0]) => {
    setInputUrl(sample.url);
    if ((sample as any).scope) {
      setScanScope((sample as any).scope);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualContent.trim()) return;
    onConvertManualContent(manualContent.trim(), manualTitle.trim(), stylePreset);
  };

  const handlePasteClipboard = async () => {
    setClipboardNotice(null);
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          if (activeTab === "url") {
            setInputUrl(text.trim());
            urlInputRef.current?.focus();
          } else {
            setManualContent(text.trim());
          }
          setPasted(true);
          setTimeout(() => setPasted(false), 2000);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not read clipboard via API:", e);
    }

    // Fallback for mobile browsers or when browser blocks clipboard reading:
    if (activeTab === "url") {
      urlInputRef.current?.focus();
      urlInputRef.current?.select();
      setClipboardNotice("Tip for mobile: Tap and hold (long-press) inside the URL box, then tap 'Paste'.");
      setTimeout(() => setClipboardNotice(null), 5000);
    }
  };

  const handleSelectSampleUrl = (url: string) => {
    setInputUrl(url);
  };

  const handleLoadSampleManualText = () => {
    setManualTitle("Building Modern Web Architecture with Edge Compute");
    setManualContent(SAMPLE_MANUAL_TEXT);
    setUploadedFileName(null);
  };

  const handleLoadSampleNovelText = () => {
    setManualTitle("The Cold General and the Imperial Archivist: Chapter 7");
    setManualContent(SAMPLE_BL_NOVEL_TEXT);
    setUploadedFileName(null);
  };

  const handleFileProcess = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        setManualContent(result);
        setUploadedFileName(file.name);
        if (!manualTitle) {
          // Clean filename without extension
          const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          setManualTitle(cleanName);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const manualWordCount = manualContent
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <div
      id="url-input-card"
      className="w-full max-w-4xl mx-auto mb-8 bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6"
    >
      {/* Top Header: Title & Preset Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white shadow-xs">
              <Shield className="w-4 h-4" />
            </span>
            <span>DOCLOAK</span>
            <span className="text-xs font-mono font-normal bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
              Zero Images • Pure Text
            </span>
          </h2>
          <p className="text-xs text-gray-600 mt-1 font-medium">
            Protect sensitive information without losing the document.
          </p>
        </div>

        {/* Style Presets and Novel Import Button */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {onOpenBrowserCompanion && (
            <button
              id="open-browser-extractor-btn"
              type="button"
              onClick={onOpenBrowserCompanion}
              className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Crawl novel directly in your browser tab to bypass Cloudflare 403 blocks"
            >
              <Globe className="w-3.5 h-3.5 text-amber-600" />
              <span>Bypass Cloudflare (Browser Extractor)</span>
            </button>
          )}

          {onImportNovelFile && (
            <button
              id="import-novel-json-btn"
              type="button"
              onClick={() => novelFileInputRef.current?.click()}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Import novel JSON file (.json) into Google Doc Professional Mode"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Import novel (.json)</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => setStylePreset("google-doc")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                stylePreset === "google-doc"
                  ? "bg-white text-emerald-700 shadow-xs border border-gray-200 font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Google Doc
            </button>
            <button
              type="button"
              onClick={() => setStylePreset("executive")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                stylePreset === "executive"
                  ? "bg-white text-emerald-700 shadow-xs border border-gray-200 font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Corporate Audit
            </button>
            <button
              type="button"
              onClick={() => setStylePreset("minimalist")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                stylePreset === "minimalist"
                  ? "bg-white text-emerald-700 shadow-xs border border-gray-200 font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Minimalist
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file input for Import novel (.json) */}
      <input
        ref={novelFileInputRef}
        id="novel-json-file-input"
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0] && onImportNovelFile) {
            onImportNovelFile(e.target.files[0]);
            e.target.value = "";
          }
        }}
      />

      {/* Professional Status Bar & Discreet Demo Loader */}
      {onLoadSampleDoc && (
        <div className="mt-3 py-2 px-3 bg-slate-50 border border-gray-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-gray-600">
              Zero-image text extraction with real-time synthetic data cloaking (press <kbd className="bg-white border border-gray-300 px-1 py-0.5 rounded text-[10px] font-mono text-gray-700">Esc</kbd> to toggle disguise).
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto text-slate-500 flex-wrap">
            <span className="text-[11px] text-gray-400 font-medium">Demo:</span>
            {onLoadSampleNovelJson && (
              <button
                type="button"
                onClick={onLoadSampleNovelJson}
                className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                title="Load sample novel (.json) demonstration with 5 chapters"
              >
                <BookOpen className="w-3 h-3 text-blue-600" />
                <span>Sample Novel (.json)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onLoadSampleDoc(BL_NOVEL_HISTORICAL_SAMPLE)}
              className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs transition-colors cursor-pointer"
              title="Load Archival Ledger sample document"
            >
              Archival Ledger
            </button>
            <button
              type="button"
              onClick={() => onLoadSampleDoc(BL_NOVEL_MODERN_SAMPLE)}
              className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs transition-colors cursor-pointer"
              title="Load Workplace Audit sample document"
            >
              Workplace Audit
            </button>
          </div>
        </div>
      )}

      {/* Input Mode Tabs: Web URL vs. Manual Content vs. Import Novel */}
      <div className="flex items-center justify-between mt-4 border-b border-gray-200 text-xs font-medium flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "url"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Web Reader API (Novels, Articles, Docs)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "manual"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste or Upload Content Manually</span>
          </button>

          {onImportNovelFile && (
            <button
              type="button"
              onClick={() => novelFileInputRef.current?.click()}
              className="pb-2.5 px-3 border-b-2 border-transparent flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer"
              title="Upload and import novel .json file directly"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Import novel (.json)</span>
            </button>
          )}
        </div>

        {activeTab === "url" && (
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 mb-2">
            <Zap className="w-3 h-3 text-emerald-600" />
            <span>Cloudflare & JS Bypass Active</span>
          </span>
        )}
      </div>

      {/* Tab 1: URL Input Mode */}
      {activeTab === "url" && (
        <form onSubmit={handleUrlSubmit} className="mt-4 space-y-3.5">
          <div className="flex flex-col gap-2.5">
            {/* Input field wrapper */}
            <div className="relative flex items-center w-full">
              <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                <Link2 className="w-5 h-5" />
              </div>

              <input
                ref={urlInputRef}
                id="url-input-field"
                type="url"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  if (clipboardNotice) setClipboardNotice(null);
                }}
                placeholder={
                  scanScope === "novel"
                    ? "Paste novel link (TOC page or Chapter 1)..."
                    : scanScope === "domain"
                    ? "Enter website URL to crawl..."
                    : "Paste novel or article URL..."
                }
                disabled={isLoading}
                className="w-full pl-11 pr-28 py-3 bg-gray-50 hover:bg-gray-50/80 focus:bg-white border border-gray-300 focus:border-blue-500 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-3 focus:ring-blue-100 transition-all font-mono select-text min-h-[48px]"
              />

              {/* In-field actions: Clear & Paste (Compact and never covering the text) */}
              <div className="absolute right-2 flex items-center gap-1 z-10">
                {inputUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputUrl("");
                      urlInputRef.current?.focus();
                    }}
                    title="Clear input"
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  id="clipboard-paste-btn"
                  type="button"
                  onClick={handlePasteClipboard}
                  title="Paste from clipboard"
                  className="px-2.5 py-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  {pasted ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5 text-blue-600" />}
                  <span>{pasted ? "Pasted!" : "Paste"}</span>
                </button>
              </div>
            </div>

            {/* Mobile / Screen Helper Toast when clipboard read is blocked */}
            {clipboardNotice && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{clipboardNotice}</span>
              </div>
            )}

            {/* Submit Action Button: Separate, large, touch-friendly button */}
            <button
              id="extract-submit-btn"
              type="submit"
              disabled={isLoading || !inputUrl.trim()}
              className="w-full py-3 px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed min-h-[48px] active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {scanScope === "novel"
                      ? "Discovering & Compiling Chapters..."
                      : scanScope === "domain"
                      ? "Crawling Site & Compiling..."
                      : "Reading & Formatting..."}
                  </span>
                </>
              ) : (
                <>
                  {scanScope === "novel" ? (
                    <BookOpen className="w-4 h-4 text-blue-200" />
                  ) : scanScope === "domain" ? (
                    <Network className="w-4 h-4 text-blue-200" />
                  ) : (
                    <Shield className="w-4 h-4 text-emerald-300" />
                  )}
                  <span>
                    {scanScope === "novel"
                      ? "Extract All Chapters into Google Doc"
                      : scanScope === "domain"
                      ? "Crawl Site & Build Dossier"
                      : "Format & Open Preview"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Mode Selector: Full Novel vs Single Page vs Site Crawler */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-700">Extractor Mode:</span>
              <div className="inline-flex rounded-md shadow-2xs" role="group">
                <button
                  type="button"
                  onClick={() => setScanScope("novel")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-l-md border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    scanScope === "novel"
                      ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-xs"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>📖 Full Novel (All Chapters)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScanScope("single")}
                  className={`px-3 py-1.5 text-xs font-medium border-t border-b border-r transition-colors cursor-pointer ${
                    scanScope === "single"
                      ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-xs"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  📄 Single Page
                </button>
                <button
                  type="button"
                  onClick={() => setScanScope("domain")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-r-md border-t border-b border-r transition-colors flex items-center gap-1.5 cursor-pointer ${
                    scanScope === "domain"
                      ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-xs"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <Network className="w-3.5 h-3.5" />
                  <span>🌐 Site Crawler</span>
                </button>
              </div>
            </div>

            {scanScope === "novel" ? (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Chapter Limit:</span>
                <select
                  value={maxChapters}
                  onChange={(e) => setMaxChapters(Number(e.target.value))}
                  className="bg-white border border-gray-300 rounded px-2.5 py-1 text-xs text-gray-800 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value={10}>10 Chapters (Standard)</option>
                  <option value={25}>25 Chapters (Full Arc)</option>
                  <option value={50}>50 Chapters (Complete Book)</option>
                  <option value={100}>100 Chapters (Epic Novel)</option>
                </select>
              </div>
            ) : scanScope === "domain" ? (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Page Limit:</span>
                <select
                  value={maxPages}
                  onChange={(e) => setMaxPages(Number(e.target.value))}
                  className="bg-white border border-gray-300 rounded px-2.5 py-1 text-xs text-gray-800 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value={5}>5 Pages (Quick Scan)</option>
                  <option value={8}>8 Pages (Standard Dossier)</option>
                  <option value={15}>15 Pages (Comprehensive)</option>
                </select>
              </div>
            ) : (
              <span className="text-gray-500 text-[11px]">
                Fetches only the specific chapter or page URL.
              </span>
            )}
          </div>

          {/* Full Novel Mode Explainer Banner */}
          {scanScope === "novel" && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200 rounded-lg text-xs text-blue-950 flex items-start gap-2.5 animate-fadeIn">
              <BookOpen className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 flex items-center gap-2">
                  <span>Full Web Novel Discovery & Chapter Compiler</span>
                  <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded font-mono font-medium">Google Doc Professional Mode</span>
                </p>
                <p className="text-blue-800 mt-1 leading-relaxed text-[11px]">
                  Paste any novel link (table of contents or chapter 1). DOCLOAK automatically finds all chapters, follows &ldquo;Next Chapter&rdquo; links, strips ads, translator notes & donation banners, and extracts <strong>100% unabridged text</strong> into a single Google Docs-ready document with chapters, TOC outline, and Word/PDF export.
                </p>
              </div>
            </div>
          )}

          {/* Site Crawler Mode Explainer Banner */}
          {scanScope === "domain" && (
            <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5 animate-fadeIn">
              <Globe className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-950 flex items-center gap-1.5">
                  <span>Automated Company Site Crawler & Sitemap Link Follower</span>
                  <span className="bg-blue-200 text-blue-800 text-[10px] px-1.5 py-0.2 rounded font-mono">Server-Side CORS Free</span>
                </p>
                <p className="text-blue-800 mt-1 leading-relaxed text-[11px]">
                  <strong>1.</strong> Checks <code>/sitemap.xml</code> for full page index. <strong>2.</strong> Discovers internal <code>&lt;a href&gt;</code> links. <strong>3.</strong> Resolves relative paths. <strong>4.</strong> Compiles Home, About, Services, Products, and Contact into an executive document ready for Word (.doc) and PDF export.
                </p>
              </div>
            </div>
          )}

          {/* Google Docs detected proactive assistance */}
          {inputUrl.includes("docs.google.com") && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Google Docs link detected.</strong> We will try automated public export.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("manual")}
                className="text-xs bg-white hover:bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded border border-blue-300 transition-colors shrink-0 cursor-pointer"
              >
                Or Paste / Upload Text Directly →
              </button>
            </div>
          )}

          {/* Sample URLs */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-500">
            <span className="font-medium text-gray-600 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Try samples:
            </span>
            {SAMPLE_URLS.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="px-2.5 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-gray-200 rounded-md text-gray-700 transition-colors cursor-pointer"
              >
                {sample.name}
              </button>
            ))}
          </div>
        </form>
      )}

      {/* Tab 2: Manual Content Input / File Upload Mode */}
      {activeTab === "manual" && (
        <form onSubmit={handleManualSubmit} className="mt-4 space-y-3.5">
          {/* Document Title & File Upload Quick Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="manual-doc-title" className="block text-xs font-medium text-gray-700 mb-1">
                Document Title (optional)
              </label>
              <input
                id="manual-doc-title"
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="e.g., Q3 Project Report or Article Heading..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Upload File (.txt, .md, .html)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.markdown,.html,.htm,.doc"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-gray-500" />
                <span>Choose Local File</span>
              </button>
            </div>
          </div>

          {/* Uploaded File Badge if present */}
          {uploadedFileName && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <FileType className="w-3.5 h-3.5" />
                <span>Loaded file: <strong>{uploadedFileName}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadedFileName(null);
                  setManualContent("");
                }}
                className="text-blue-500 hover:text-blue-800 p-0.5"
                title="Remove file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Text Area with Drag & Drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-lg transition-all ${
              isDragging
                ? "ring-2 ring-blue-500 bg-blue-50/50"
                : "bg-gray-50"
            }`}
          >
            <textarea
              id="manual-content-textarea"
              value={manualContent}
              onChange={(e) => setManualContent(e.target.value)}
              placeholder="Paste article text, raw WordPress body copy, HTML, or drag & drop a file here..."
              rows={7}
              disabled={isLoading}
              className="w-full p-3 text-xs text-gray-800 bg-transparent border border-gray-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono resize-y leading-relaxed"
            />

            {/* Quick Actions overlay inside textarea bottom bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100/80 border-t border-gray-200 rounded-b-lg text-[11px] text-gray-500">
              <div className="flex items-center gap-3">
                <span>{manualWordCount} words</span>
                <span>•</span>
                <span>{manualContent.length} characters</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
                >
                  <Clipboard className="w-3 h-3" />
                  <span>Paste Clipboard</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!manualContent.trim()) return;
                    // Auto-split chapters by adding markdown headers if missing
                    const formatted = manualContent.replace(
                      /(?:^|\n)(Chapter\s+\d+|Volume\s+\d+|Part\s+\d+|第[0-9一二三四五六七八九十百千万]+[章回卷节])([:\s\-—–][^\n]+)?(?=\n|$)/gi,
                      "\n\n## $1$2\n\n"
                    );
                    setManualContent(formatted.trim());
                  }}
                  className="text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium cursor-pointer"
                  title="Detect chapter titles and format into structured sections"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-Detect Chapters</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleLoadSampleManualText}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  Tech Sample
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleLoadSampleNovelText}
                  className="text-emerald-700 font-medium hover:underline cursor-pointer"
                >
                  Novel Sample
                </button>
              </div>
            </div>
          </div>

          {/* Submit Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-gray-500">
              Preserves 100% full documents with no text length restrictions — complete multi-chapter novels, long books, and full archives are supported without truncation.
            </p>

            <button
              id="convert-manual-submit-btn"
              type="submit"
              disabled={isLoading || !manualContent.trim()}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed min-h-[44px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Disguising Document...</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Disguise & Open Preview</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Loading Status Bar */}
      {isLoading && (
        <div className="mt-4 bg-blue-50/80 border border-blue-100 rounded-lg p-3.5 flex items-center gap-3 text-blue-900 text-xs animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">{loadingStep || "Structuring document..."}</p>
            <p className="text-blue-600/80 text-[11px] mt-0.5">
              Generating headings, bullet lists, executive overview, and typography
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3.5 flex flex-col sm:flex-row items-start justify-between gap-3 text-red-800 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Notice regarding web address</p>
              <p className="text-red-700 mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {onOpenBrowserCompanion && (
              <button
                type="button"
                onClick={onOpenBrowserCompanion}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md shadow-xs transition-colors shrink-0 cursor-pointer text-xs flex items-center gap-1.5"
                title="Open the browser extractor companion"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Bypass with Browser Extractor →</span>
              </button>
            )}
            <button
              type="button"
              onClick={async () => {
                setActiveTab("manual");
                await handlePasteClipboard();
              }}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-xs transition-colors shrink-0 cursor-pointer text-xs flex items-center gap-1.5"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Paste Text Directly →</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
