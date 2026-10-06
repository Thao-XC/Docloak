// Remembers where you stopped reading a crawled novel, so you can continue later
// (even after closing the tab). Stored in this browser only.

export interface SavedNovelProgress {
  /** URL to send to the server to continue. */
  url: string;
  chapterStart?: number;
  numberOffset?: number;
  lastChapterNumber: number;
  totalChaptersFound?: number;
  title: string;
  savedAt: number;
  finished?: boolean;
}

const PREFIX = "docloak:novel-progress:";

export function progressKey(url: string): string {
  return url
    .trim()
    .replace(/#.*$/, "")
    .replace(/\/+$/, "")
    .replace(/^https?:\/\/(?:www\.)?/i, "")
    .toLowerCase();
}

export function saveNovelProgress(urls: Array<string | undefined>, progress: SavedNovelProgress): void {
  try {
    const unique = Array.from(new Set(urls.filter(Boolean).map((u) => progressKey(u as string))));
    for (const key of unique) {
      localStorage.setItem(PREFIX + key, JSON.stringify(progress));
    }
  } catch {
    // storage unavailable (private mode etc.) — progress just won't be remembered
  }
}

export function loadNovelProgress(url: string): SavedNovelProgress | null {
  try {
    if (!url.trim()) return null;
    const raw = localStorage.getItem(PREFIX + progressKey(url));
    return raw ? (JSON.parse(raw) as SavedNovelProgress) : null;
  } catch {
    return null;
  }
}

export function clearNovelProgress(url: string): void {
  try {
    localStorage.removeItem(PREFIX + progressKey(url));
  } catch {}
}
