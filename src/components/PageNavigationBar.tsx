import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BookOpen,
  ListOrdered,
  FileText,
  Eye,
  Check,
} from "lucide-react";
import { PaginatedPage } from "../utils/paginationUtils";

interface PageNavigationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  pages: PaginatedPage[];
  pagedViewType: "single" | "scroll";
  onChangePagedViewType: (type: "single" | "scroll") => void;
  isFloating?: boolean;
}

export const PageNavigationBar: React.FC<PageNavigationBarProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pages,
  pagedViewType,
  onChangePagedViewType,
  isFloating = false,
}) => {
  const [isJumpOpen, setIsJumpOpen] = useState(false);
  const [singlePageNotice, setSinglePageNotice] = useState<string | null>(null);

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePrev = () => {
    if (canGoPrev) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    } else if (totalPages <= 1) {
      setSinglePageNotice("This document is 1 page. All content is already displayed on this screen! To read multi-chapter novels, use Screen 1 to extract chapters or upload a novel file.");
      setTimeout(() => setSinglePageNotice(null), 5000);
    } else if (currentPage >= totalPages) {
      setSinglePageNotice("You are already on the final page of this document.");
      setTimeout(() => setSinglePageNotice(null), 3000);
    }
  };

  const progressPercent = Math.round((currentPage / Math.max(1, totalPages)) * 100);

  if (isFloating) {
    return (
      <>
        {/* Toast alert if user taps next page when on 1-page doc or end of document */}
        {singlePageNotice && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-blue-500 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 no-print">
            <span className="leading-snug">{singlePageNotice}</span>
            <button
              type="button"
              onClick={() => setSinglePageNotice(null)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* Floating Mobile & Desktop Bottom Bar */}
        <div
          id="floating-page-navigator"
          className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 sm:gap-2 bg-slate-900/95 text-white px-2.5 sm:px-4 py-2 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-md border border-slate-700 text-xs font-semibold select-none no-print transition-all max-w-[calc(100vw-16px)]"
        >
          {/* Previous Page Button */}
          <button
            type="button"
            id="prev-page-floating-btn"
            onClick={handlePrev}
            disabled={!canGoPrev}
            className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-full flex items-center gap-1 transition-all cursor-pointer min-h-[36px] shrink-0"
            title="Previous Page (Left Arrow or Swipe Right)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Page Counter & Quick Jump Trigger */}
          <button
            type="button"
            id="jump-page-floating-btn"
            onClick={() => setIsJumpOpen(!isJumpOpen)}
            className="px-2.5 sm:px-3.5 py-1.5 bg-blue-700/80 hover:bg-blue-600 active:bg-blue-500 rounded-full font-mono text-xs flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-xs transition-colors min-h-[36px] shrink-0"
            title="Click to jump to any page or chapter"
          >
            <span>
              Page {currentPage} / {totalPages}
            </span>
            <span className="hidden md:inline text-blue-200 text-[10px]">({progressPercent}%)</span>
            <ChevronDown className={`w-3.5 h-3.5 text-blue-200 transition-transform ${isJumpOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Next Page Button (Prominent, High-Contrast & Easy to Tap) */}
          <button
            type="button"
            id="next-page-floating-btn"
            onClick={handleNext}
            className={`px-3 sm:px-4 py-1.5 font-bold rounded-full flex items-center gap-1 transition-all cursor-pointer shadow-md min-h-[36px] shrink-0 ${
              canGoNext
                ? "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white ring-2 ring-blue-400"
                : totalPages <= 1
                ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600"
                : "bg-slate-800 hover:bg-slate-700 text-slate-400 opacity-80"
            }`}
            title={
              canGoNext
                ? "Next Page (Right Arrow or Swipe Left)"
                : totalPages <= 1
                ? "Click for info: Document is 1 page"
                : "You have reached the final page"
            }
          >
            <span>{canGoNext ? "Next Page" : totalPages <= 1 ? "1 Page Total" : "End (Page " + totalPages + ")"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* View Type Toggle (Single Sheet vs All Sheets Scroll) */}
          <button
            type="button"
            onClick={() => onChangePagedViewType(pagedViewType === "single" ? "scroll" : "single")}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full border border-slate-700 ml-1 transition-colors shrink-0"
            title={pagedViewType === "single" ? "Switch to All Pages Scroll" : "Switch to Single Page Focus"}
          >
            {pagedViewType === "single" ? <Eye className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
            <span>{pagedViewType === "single" ? "Single Page" : "All Sheets"}</span>
          </button>
        </div>

        {/* Quick Jump Drawer / Popover Modal */}
        {isJumpOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs no-print"
            onClick={() => setIsJumpOpen(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden text-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-sm text-gray-900">Jump to Page / Chapter</h3>
                </div>
                <span className="text-xs text-gray-500 font-mono">
                  {totalPages} Total Pages
                </span>
              </div>

              {/* Progress Track */}
              <div className="px-5 pt-3 pb-1">
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500 mt-1 font-mono">
                  <span>Page 1</span>
                  <span>{progressPercent}% completed</span>
                  <span>Page {totalPages}</span>
                </div>
              </div>

              {/* Page & Chapter List */}
              <div className="overflow-y-auto p-3 space-y-1 divide-y divide-gray-100 max-h-[50vh]">
                {pages.map((p) => {
                  const isCurrent = p.pageNumber === currentPage;
                  const firstSec = p.sections[0];
                  const heading = p.isTitlePage
                    ? "Title Page & Metadata"
                    : p.chapterTitle || firstSec?.heading || `Page ${p.pageNumber}`;

                  return (
                    <button
                      key={p.pageNumber}
                      type="button"
                      onClick={() => {
                        onPageChange(p.pageNumber);
                        setIsJumpOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isCurrent
                          ? "bg-blue-50 text-blue-800 font-bold border border-blue-200"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <span
                          className={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-mono shrink-0 ${
                            isCurrent
                              ? "bg-blue-600 text-white font-bold"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {p.pageNumber}
                        </span>
                        <div className="truncate">
                          <p className="truncate font-medium">{heading}</p>
                          {firstSec?.isContinued && (
                            <span className="text-[10px] text-gray-400 font-normal">
                              (continued)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-mono text-gray-400">
                        <span>{p.wordCount} words</span>
                        {isCurrent && <Check className="w-4 h-4 text-blue-600 ml-1" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsJumpOpen(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 rounded border border-gray-300 hover:bg-gray-100"
                >
                  Close
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onPageChange(1);
                      setIsJumpOpen(false);
                    }}
                    className="px-3 py-1.5 text-xs text-blue-600 hover:underline"
                  >
                    Go to Start
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onPageChange(totalPages);
                      setIsJumpOpen(false);
                    }}
                    className="px-3 py-1.5 text-xs text-blue-600 hover:underline"
                  >
                    Go to End
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Inline / Static Top or Bottom Bar inside the Canvas
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg text-xs font-medium my-6 select-none no-print">
      <button
        type="button"
        onClick={handlePrev}
        disabled={!canGoPrev}
        className="w-full sm:w-auto px-3.5 py-2 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-300 rounded-md flex items-center justify-center gap-1.5 text-gray-700 cursor-pointer shadow-xs transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Previous Page</span>
      </button>

      <div className="flex items-center gap-2 font-mono text-gray-700">
        <BookOpen className="w-4 h-4 text-blue-600" />
        <span>
          Page <strong className="text-blue-700 font-bold">{currentPage}</strong> of <strong>{totalPages}</strong>
        </span>
      </div>

      <button
        type="button"
        onClick={handleNext}
        className={`w-full sm:w-auto px-4 py-2 font-bold rounded-md flex items-center justify-center gap-1.5 transition-all shadow-xs ${
          canGoNext
            ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white cursor-pointer ring-1 ring-blue-500"
            : totalPages <= 1
            ? "bg-gray-200 hover:bg-gray-300 text-gray-700 cursor-pointer"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
        title={
          canGoNext
            ? "Next Page (Right Arrow)"
            : totalPages <= 1
            ? "1 Page Document (All content loaded)"
            : "You are on the final page"
        }
      >
        <span>{canGoNext ? "Next Page" : totalPages <= 1 ? "1 Page Total" : "End of Document"}</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
