import React, { useState } from "react";
import {
  X,
  Globe,
  Bookmark,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Code2,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { BOOKMARKLET_CODE } from "../utils/browserCrawlerScript";

interface BrowserCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportJsonString: (jsonString: string) => void;
}

export const BrowserCompanionModal: React.FC<BrowserCompanionModalProps> = ({
  isOpen,
  onClose,
  onImportJsonString,
}) => {
  const [activeTab, setActiveTab] = useState<"bookmarklet" | "paste" | "extension">("bookmarklet");
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [pastedJson, setPastedJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyBookmarklet = async () => {
    try {
      await navigator.clipboard.writeText(BOOKMARKLET_CODE);
      setCopiedBookmarklet(true);
      setTimeout(() => setCopiedBookmarklet(false), 2500);
    } catch (e) {
      console.warn("Could not copy:", e);
    }
  };

  const handleImportPasted = () => {
    setJsonError(null);
    if (!pastedJson.trim()) {
      setJsonError("Please paste your novel JSON text first.");
      return;
    }
    try {
      JSON.parse(pastedJson);
      onImportJsonString(pastedJson);
      onClose();
    } catch {
      setJsonError("Invalid JSON syntax. Please check that you copied the complete JSON object.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 text-white shadow-xs">
              <Globe className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <span>Bypass Cloudflare &amp; Anti-Bot Blocks</span>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                  Browser Companion
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Crawl novels directly inside your real browser tab — 100% bypass of Cloudflare 403s &amp; logins.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Why this happens explainer */}
        <div className="px-5 py-3 bg-amber-50/70 border-b border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-amber-900">
              Why some novel websites block automated cloud servers:
            </p>
            <p className="text-amber-800/90 leading-relaxed text-[11px]">
              Sites like RoyalRoad, Webnovel, NovelFull, and Wuxiaworld use Cloudflare Bot Management and Turnstile challenges. They reject datacenter cloud IPs (HTTP 403). Running the crawl <strong>in your active browser tab</strong> uses your real residential IP and verified session, so 0 blocks happen!
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 px-5 pt-3 gap-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("bookmarklet")}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "bookmarklet"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>1-Click Bookmarklet (Instant)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "paste"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Paste Novel JSON Directly</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("extension")}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "extension"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Browser Extension</span>
          </button>
        </div>

        {/* Tab 1: Bookmarklet (Instant zero-install) */}
        {activeTab === "bookmarklet" && (
          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                <span>Step 1: Save the Bookmarklet to your browser</span>
              </h4>
              <p className="text-gray-600 mb-3 leading-relaxed">
                Drag this button directly to your browser's Bookmarks bar (press <kbd className="bg-white border border-gray-300 px-1 py-0.5 rounded text-[10px] font-mono">Ctrl+Shift+B</kbd> or <kbd className="bg-white border border-gray-300 px-1 py-0.5 rounded text-[10px] font-mono">Cmd+Shift+B</kbd> to show bookmarks):
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Draggable bookmarklet link */}
                <a
                  href={BOOKMARKLET_CODE}
                  onClick={(e) => {
                    // Prevent navigation if clicked on current page
                    e.preventDefault();
                    alert("Drag this button to your Bookmarks Bar, or click 'Copy Code' below!");
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-2 text-xs transition-transform active:scale-95 cursor-grab"
                  title="Drag me to your Bookmarks Bar!"
                >
                  <Bookmark className="w-4 h-4 fill-white" />
                  <span>📚 DOCLOAK Extractor</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyBookmarklet}
                  className="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedBookmarklet ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Code Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-500" />
                      <span>Copy Bookmarklet Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
              <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <span>Step 2: Crawl any novel in 3 clicks</span>
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-gray-600 leading-relaxed">
                <li>
                  Open the novel's Table of Contents or Chapter 1 on any website (e.g. RoyalRoad, NovelFull, Webnovel).
                </li>
                <li>
                  Click the <strong>📚 DOCLOAK Extractor</strong> bookmark in your browser bar.
                </li>
                <li>
                  A popup appears on the site. Click <strong>&ldquo;Start In-Browser Extraction&rdquo;</strong>.
                </li>
                <li>
                  Click <strong>&ldquo;Download .json&rdquo;</strong> (or Copy JSON), then return here and click <strong>&ldquo;Import novel (.json)&rdquo;</strong>!
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 2: Paste JSON directly */}
        {activeTab === "paste" && (
          <div className="p-5 overflow-y-auto space-y-3 text-xs">
            <p className="text-gray-600">
              If you copied the novel JSON from the browser crawler, paste it directly below without needing to save a file:
            </p>

            <textarea
              value={pastedJson}
              onChange={(e) => {
                setPastedJson(e.target.value);
                setJsonError(null);
              }}
              placeholder='{\n  "schemaVersion": "1.0",\n  "book": { "title": "...", "author": "..." },\n  "chapters": [ ... ]\n}'
              rows={8}
              className="w-full p-3 font-mono text-xs bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />

            {jsonError && (
              <p className="text-red-600 text-xs font-medium">{jsonError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportPasted}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Import &amp; Format in Google Doc Mode</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Chrome Extension */}
        {activeTab === "extension" && (
          <div className="p-5 overflow-y-auto space-y-3 text-xs text-gray-600">
            <h4 className="font-semibold text-gray-900 text-sm">
              Chrome / Edge Extension Companion
            </h4>
            <p className="leading-relaxed">
              If you prefer an installed Chrome extension rather than a bookmarklet, create a folder on your computer named <code>doccloak-extension</code> with these two files:
            </p>

            <div className="space-y-2">
              <div className="font-semibold text-gray-800">1. manifest.json:</div>
              <pre className="p-2.5 bg-gray-900 text-emerald-400 rounded-lg text-[11px] overflow-x-auto font-mono">
{`{
  "manifest_version": 3,
  "name": "DOCLOAK - Novel Companion",
  "version": "1.0.0",
  "permissions": ["activeTab", "scripting"],
  "action": { "default_title": "Extract Novel" }
}`}
              </pre>

              <div className="font-semibold text-gray-800">2. Load in Chrome:</div>
              <p className="text-[11px]">
                Go to <code>chrome://extensions</code>, enable <strong>Developer mode</strong> (top right), and click <strong>&ldquo;Load unpacked&rdquo;</strong> to select the folder.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Zero Gemini model calls used • Clean formatting in code
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
