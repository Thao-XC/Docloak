import React, { useState, useMemo } from "react";
import {
  X,
  CheckSquare,
  Square,
  Filter,
  Search,
  BookOpen,
  Globe,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Trash2,
  Plus,
} from "lucide-react";
import { DiscoveredPageItem } from "../types";

interface CrawlPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  domain: string;
  sourceUrl: string;
  isNovelMode: boolean;
  discoveredItems: DiscoveredPageItem[];
  onConfirmCrawl: (selectedUrls: string[]) => void;
  isLoading?: boolean;
}

export const CrawlPreviewModal: React.FC<CrawlPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  domain,
  sourceUrl,
  isNovelMode,
  discoveredItems: initialItems,
  onConfirmCrawl,
  isLoading = false,
}) => {
  const [items, setItems] = useState<DiscoveredPageItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(Math.min(initialItems.length, 25));
  const [excludeKeyword, setExcludeKeyword] = useState("");
  const [excludeTags, setExcludeTags] = useState<string[]>([
    "notice",
    "announcement",
    "author-note",
    "hiatus",
    "poll",
    "privacy",
    "terms",
  ]);

  // Synchronize when initialItems change
  React.useEffect(() => {
    setItems(initialItems);
    setRangeEnd(Math.min(initialItems.length, 25));
  }, [initialItems]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        (item.chapterNumber && `chapter ${item.chapterNumber}`.includes(q))
      );
    });
  }, [items, searchQuery]);

  const selectedCount = items.filter((i) => i.selected).length;
  const totalCount = items.length;

  const handleToggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleSelectAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: true })));
  };

  const handleDeselectAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: false })));
  };

  // Automatically uncheck notices, announcements, and items matching excludeTags
  const handleUncheckNotices = () => {
    setItems((prev) =>
      prev.map((item) => {
        const text = (item.title + " " + item.url).toLowerCase();
        const matchesTag = excludeTags.some((tag) => text.includes(tag.toLowerCase()));
        if (item.isNotice || matchesTag) {
          return { ...item, selected: false };
        }
        return item;
      })
    );
  };

  const handleApplyRange = () => {
    setItems((prev) =>
      prev.map((item, idx) => {
        const num = item.chapterNumber ?? idx + 1;
        const inRange = num >= rangeStart && num <= rangeEnd;
        return { ...item, selected: inRange };
      })
    );
  };

  const handleAddExcludeTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!excludeKeyword.trim()) return;
    const tag = excludeKeyword.trim().toLowerCase();
    if (!excludeTags.includes(tag)) {
      setExcludeTags((prev) => [...prev, tag]);
      // Instantly uncheck matching items
      setItems((prev) =>
        prev.map((item) => {
          const text = (item.title + " " + item.url).toLowerCase();
          if (text.includes(tag)) {
            return { ...item, selected: false };
          }
          return item;
        })
      );
    }
    setExcludeKeyword("");
  };

  const handleRemoveExcludeTag = (tagToRemove: string) => {
    setExcludeTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleConfirm = () => {
    const selectedUrls = items.filter((i) => i.selected).map((i) => i.url);
    if (selectedUrls.length === 0) return;
    onConfirmCrawl(selectedUrls);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print animate-in fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              {isNovelMode ? <BookOpen className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <span>{isNovelMode ? "Inspect & Select Chapters" : "Inspect & Select Site Pages"}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                  {totalCount} Discovered
                </span>
              </h3>
              <p className="text-xs text-gray-500 truncate max-w-md sm:max-w-xl">
                Source: <span className="font-mono text-gray-700">{domain}</span> •{" "}
                <span className="italic">{title || sourceUrl}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white/80 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 bg-gray-50/80 border-b border-gray-200 space-y-3">
          {/* Top Row: Search + Quick Select Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chapters or URL..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Select All</span>
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <Square className="w-3.5 h-3.5 text-gray-400" />
                <span>Deselect All</span>
              </button>
              <button
                type="button"
                onClick={handleUncheckNotices}
                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Uncheck author notes, hiatus announcements, polls, and legal pages"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Uncheck Notices & Extras</span>
              </button>
            </div>
          </div>

          {/* Second Row: Chapter Range Selector (for novels) */}
          {isNovelMode && totalCount > 1 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-700">
              <span className="font-semibold text-gray-600 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                Select Range:
              </span>
              <span className="text-gray-500">From Chapter</span>
              <input
                type="number"
                min={1}
                max={totalCount}
                value={rangeStart}
                onChange={(e) => setRangeStart(Number(e.target.value))}
                className="w-16 px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono text-center"
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                min={1}
                max={totalCount}
                value={rangeEnd}
                onChange={(e) => setRangeEnd(Number(e.target.value))}
                className="w-16 px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono text-center"
              />
              <button
                type="button"
                onClick={handleApplyRange}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-semibold cursor-pointer"
              >
                Apply Range
              </button>
            </div>
          )}

          {/* Third Row: Exclusion Pattern Tags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-[11px] font-semibold text-gray-500">Auto-Excluding:</span>
            {excludeTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[11px] font-medium"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveExcludeTag(tag)}
                  className="hover:text-rose-900 cursor-pointer"
                  title="Remove exclusion rule"
                >
                  ✕
                </button>
              </span>
            ))}

            <form onSubmit={handleAddExcludeTag} className="inline-flex items-center gap-1">
              <input
                type="text"
                value={excludeKeyword}
                onChange={(e) => setExcludeKeyword(e.target.value)}
                placeholder="+ Add pattern"
                className="w-24 px-2 py-0.5 bg-white border border-gray-300 rounded text-[11px] focus:outline-none focus:border-blue-500"
              />
            </form>
          </div>
        </div>

        {/* Page / Chapter List */}
        <div className="overflow-y-auto p-4 flex-1 space-y-1.5 divide-y divide-gray-100 min-h-[220px]">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              No items match your search filter.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isNotice = item.isNotice;
              return (
                <div
                  key={item.id || item.url || idx}
                  onClick={() => handleToggleItem(item.id)}
                  className={`pt-1.5 pb-1.5 px-3 rounded-lg flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                    item.selected
                      ? "bg-blue-50/70 hover:bg-blue-50 border border-blue-200/80"
                      : "hover:bg-gray-50 text-gray-400 opacity-60 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate min-w-0">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => handleToggleItem(item.id)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                    />

                    <span
                      className={`w-7 h-6 rounded flex items-center justify-center text-[10px] font-mono shrink-0 font-bold ${
                        item.selected
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {item.chapterNumber ?? idx + 1}
                    </span>

                    <div className="truncate">
                      <p
                        className={`truncate font-medium ${
                          item.selected ? "text-gray-900 font-semibold" : "text-gray-400 line-through"
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate font-mono">{item.url}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isNotice && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                        Notice / Extra
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setItems((prev) => prev.filter((i) => i.id !== item.id));
                      }}
                      className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
                      title="Delete from list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-gray-700">
              Selected: <strong className="text-blue-700">{selectedCount}</strong> of {totalCount}
            </span>
            {totalCount - selectedCount > 0 && (
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                {totalCount - selectedCount} unwanted pages excluded
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedCount === 0 || isLoading}
              onClick={handleConfirm}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Crawl & Finalize Selected ({selectedCount})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
