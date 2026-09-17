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
} from "lucide-react";
import { DocStylePreset, ExtractedDocument } from "../types";
import {
  BL_NOVEL_HISTORICAL_SAMPLE,
  BL_NOVEL_MODERN_SAMPLE,
} from "../utils/novelSamples";
import { Shield, Sparkles as SparklesIcon, FileCheck } from "lucide-react";

interface UrlInputSectionProps {
  onExtract: (url: string, style: DocStylePreset) => void;
  onConvertManualContent: (content: string, title: string, style: DocStylePreset) => void;
  onLoadSampleDoc?: (doc: ExtractedDocument) => void;
  isLoading: boolean;
  loadingStep: string;
  errorMessage: string | null;
}

const SAMPLE_URLS = [
  {
    name: "WordPress 6.6 Release",
    url: "https://wordpress.org/news/2024/07/wordpress-6-6-dorsey/",
    desc: "WordPress official announcement & features",
  },
  {
    name: "Python 3.13 Overview",
    url: "https://docs.python.org/3/whatsnew/3.13.html",
    desc: "Technical documentation & notes",
  },
  {
    name: "MIT Technology Review",
    url: "https://www.technologyreview.com/2024/01/08/1085094/10-breakthrough-technologies-2024/",
    desc: "In-depth magazine article",
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
  isLoading,
  loadingStep,
  errorMessage,
}) => {
  const [activeTab, setActiveTab] = useState<"url" | "manual">("url");
  const [inputUrl, setInputUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [stylePreset, setStylePreset] = useState<DocStylePreset>("google-doc");
  const [pasted, setPasted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    onExtract(inputUrl.trim(), stylePreset);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualContent.trim()) return;
    onConvertManualContent(manualContent.trim(), manualTitle.trim(), stylePreset);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        if (activeTab === "url") {
          setInputUrl(text.trim());
        } else {
          setManualContent(text.trim());
        }
        setPasted(true);
        setTimeout(() => setPasted(false), 2000);
      }
    } catch (e) {
      console.warn("Could not read clipboard:", e);
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
      className="w-full max-w-4xl mx-auto mb-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6"
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

        {/* Style Presets */}
        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200 self-start md:self-auto">
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

      {/* Professional Status Bar & Discreet Demo Loader */}
      {onLoadSampleDoc && (
        <div className="mt-3 py-2 px-3 bg-slate-50 border border-gray-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-gray-600">
              Zero-image text extraction with real-time synthetic data cloaking (press <kbd className="bg-white border border-gray-300 px-1 py-0.5 rounded text-[10px] font-mono text-gray-700">Esc</kbd> to toggle disguise).
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto text-slate-500">
            <span className="text-[11px] text-gray-400 font-medium">Demo:</span>
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

      {/* Input Mode Tabs: Web URL vs. Manual Content */}
      <div className="flex items-center gap-2 mt-4 border-b border-gray-200 text-xs font-medium">
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
          <span>From Website URL (WordPress, News, Docs)</span>
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
      </div>

      {/* Tab 1: URL Input Mode */}
      {activeTab === "url" && (
        <form onSubmit={handleUrlSubmit} className="mt-4 space-y-4">
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-gray-400 pointer-events-none">
              <Link2 className="w-5 h-5" />
            </div>

            <input
              id="url-input-field"
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://example-wordpress-site.com/article..."
              disabled={isLoading}
              className="w-full pl-11 pr-32 py-3 bg-gray-50 hover:bg-gray-50/80 focus:bg-white border border-gray-300 focus:border-blue-500 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-3 focus:ring-blue-100 transition-all font-mono"
            />

            <div className="absolute right-2 flex items-center gap-1.5">
              <button
                id="clipboard-paste-btn"
                type="button"
                onClick={handlePasteClipboard}
                title="Paste from clipboard"
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200/60 rounded-md transition-colors text-xs flex items-center gap-1"
              >
                {pasted ? <Check className="w-4 h-4 text-emerald-600" /> : <Clipboard className="w-4 h-4" />}
                <span className="hidden sm:inline">{pasted ? "Pasted" : "Paste"}</span>
              </button>

              <button
                id="extract-submit-btn"
                type="submit"
                disabled={isLoading || !inputUrl.trim()}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Formatting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Format Doc</span>
                    <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sample URLs */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-500">
            <span className="font-medium text-gray-600 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Try samples:
            </span>
            {SAMPLE_URLS.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => handleSelectSampleUrl(sample.url)}
                className="px-2.5 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-gray-200 rounded-md text-gray-700 transition-colors"
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
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <Clipboard className="w-3 h-3" />
                  <span>Paste Clipboard</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleLoadSampleManualText}
                  className="text-blue-600 hover:underline"
                >
                  Load Tech Sample
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleLoadSampleNovelText}
                  className="text-emerald-700 font-medium hover:underline"
                >
                  Load Narrative Sample
                </button>
              </div>
            </div>
          </div>

          {/* Submit Row */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-gray-500">
              AI automatically creates executive summaries, section headings, bullet points & Google Doc styling.
            </p>

            <button
              id="convert-manual-submit-btn"
              type="submit"
              disabled={isLoading || !manualContent.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Formatting Document...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Format into Google Doc & PDF</span>
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
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3.5 flex items-start gap-2.5 text-red-800 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error processing document</p>
            <p className="text-red-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};
