import React from "react";
import { Loader2, CheckCircle2, BookOpen, AlertCircle, Zap, Shield, StopCircle } from "lucide-react";

export interface CrawlProgressData {
  title?: string;
  author?: string;
  currentChapter: number;
  totalChapters: number;
  lastChapterTitle: string;
  totalWords: number;
  status: "discovering" | "crawling" | "finalizing" | "error" | "complete";
  errorMessage?: string;
  isCloudflareBlocked?: boolean;
}

interface LiveCrawlProgressProps {
  progress: CrawlProgressData;
  onFinalizeEarly?: () => void;
  onCancel?: () => void;
  onOpenBrowserCompanion?: () => void;
}

export const LiveCrawlProgress: React.FC<LiveCrawlProgressProps> = ({
  progress,
  onFinalizeEarly,
  onCancel,
  onOpenBrowserCompanion,
}) => {
  const percentage = progress.totalChapters > 0
    ? Math.min(100, Math.round((progress.currentChapter / progress.totalChapters) * 100))
    : 10;

  return (
    <div className="w-full max-w-4xl mx-auto my-6 p-5 bg-white rounded-xl border border-blue-200 shadow-md animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            {progress.status === "finalizing" || progress.status === "crawling" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : progress.status === "complete" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <BookOpen className="w-4 h-4" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span>{progress.title || "Crawling Web Novel..."}</span>
              {progress.author && (
                <span className="text-gray-500 font-normal text-xs">by {progress.author}</span>
              )}
            </h3>
            <p className="text-xs text-blue-600 font-medium mt-0.5 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-blue-500" />
              <span>
                {progress.status === "discovering" && "Discovering Table of Contents and resolving chapter links..."}
                {progress.status === "crawling" && `Live Extraction in Progress: Chapter ${progress.currentChapter} of ${progress.totalChapters}`}
                {progress.status === "finalizing" && "Finalizing 100% unabridged text into Google Doc Professional Mode..."}
                {progress.status === "complete" && "All chapters extracted and compiled successfully!"}
                {progress.status === "error" && "Crawling notice"}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {progress.currentChapter > 0 && progress.status === "crawling" && onFinalizeEarly && (
            <button
              type="button"
              onClick={onFinalizeEarly}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Stop crawling and finalize immediately with chapters gathered so far"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Finalize Now ({progress.currentChapter} Chs)</span>
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {progress.status !== "error" && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
            <span>
              {progress.status === "discovering"
                ? "Connecting..."
                : `Progress: ${progress.currentChapter} / ${progress.totalChapters} chapters`}
            </span>
            <span className="font-mono text-blue-700 font-bold">{percentage}%</span>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden p-0.5 border border-gray-200">
            <div
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Live Stream Details */}
      {progress.status === "crawling" && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 bg-slate-50 border border-gray-200 rounded-lg">
            <span className="text-gray-500 block text-[11px]">Active Chapter:</span>
            <span className="font-semibold text-gray-800 truncate block mt-0.5" title={progress.lastChapterTitle}>
              {progress.lastChapterTitle || `Chapter ${progress.currentChapter}`}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-gray-200 rounded-lg">
            <span className="text-gray-500 block text-[11px]">Cumulative Words:</span>
            <span className="font-semibold text-gray-900 block mt-0.5 font-mono">
              {progress.totalWords.toLocaleString()} words
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-gray-200 rounded-lg">
            <span className="text-gray-500 block text-[11px]">Speed &amp; Concurrency:</span>
            <span className="font-semibold text-emerald-700 block mt-0.5 flex items-center gap-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Parallel Multi-Worker</span>
            </span>
          </div>
        </div>
      )}

      {/* Error state */}
      {progress.status === "error" && (
        <div className="mt-3 p-3.5 bg-red-50 border border-red-200 rounded-lg flex flex-col sm:flex-row items-start justify-between gap-3 text-red-900 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to complete server-side extraction</p>
              <p className="text-red-700 mt-0.5 leading-relaxed">{progress.errorMessage}</p>
            </div>
          </div>

          {progress.isCloudflareBlocked && onOpenBrowserCompanion && (
            <button
              type="button"
              onClick={onOpenBrowserCompanion}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs shrink-0 cursor-pointer shadow-xs"
            >
              Open Browser Extractor (Bypass 403) →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
