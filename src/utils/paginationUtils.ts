import { DocumentSection, ExtractedDocument, NovelBlock } from "../types";

export interface PaginatedSectionItem {
  sectionIndex: number;
  heading: string;
  disguiseHeading?: string;
  isSectionSensitive?: boolean;
  paragraphs: string[];
  disguiseParagraphs?: string[];
  bulletPoints?: string[];
  callout?: string;
  blocks?: NovelBlock[];
  startParaIdx: number;
  isContinued: boolean;
}

export interface PaginatedPage {
  pageNumber: number;
  totalPages: number;
  chapterIndex?: number;
  chapterTitle?: string;
  isTitlePage?: boolean;
  isFirstPageOfChapter: boolean;
  sections: PaginatedSectionItem[];
  wordCount: number;
}

const WORDS_PER_PAGE_DEFAULT = 400;

/**
 * Paginates an ExtractedDocument into discrete Google Doc letter pages.
 * Handles page breaks before chapters, distributes paragraphs cleanly,
 * and maintains accurate running heads and footers ("Page X of Total").
 */
export function paginateDocument(
  doc: ExtractedDocument,
  corporateDisguise: boolean,
  wordsPerPage: number = WORDS_PER_PAGE_DEFAULT
): PaginatedPage[] {
  const pages: PaginatedPage[] = [];
  const sections = doc.sections || [];

  if (sections.length === 0) {
    return [
      {
        pageNumber: 1,
        totalPages: 1,
        isFirstPageOfChapter: true,
        sections: [],
        wordCount: 0,
      },
    ];
  }

  let currentPageNumber = 1;

  // Optional Page 1: Standalone Title Page for Novels
  const hasDedicatedTitlePage = !!doc.isImportedNovel && !corporateDisguise;
  if (hasDedicatedTitlePage) {
    pages.push({
      pageNumber: currentPageNumber++,
      totalPages: 1, // updated at end
      isTitlePage: true,
      chapterTitle: doc.title,
      isFirstPageOfChapter: true,
      sections: [],
      wordCount: 50,
    });
  }

  // Iterate sections/chapters
  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const sec = sections[sIdx];
    const heading = corporateDisguise && sec.disguiseHeading ? sec.disguiseHeading : sec.heading;
    const disguiseHeading = sec.disguiseHeading;
    const paras = corporateDisguise && sec.disguiseParagraphs ? sec.disguiseParagraphs : sec.paragraphs;
    const disguiseParas = sec.disguiseParagraphs;
    const isSensitive = sec.isSensitive ?? false;
    const hasBlocks = !!(sec.blocks && sec.blocks.length > 0 && !corporateDisguise);

    // If novel blocks are present, paginate by blocks
    if (hasBlocks && sec.blocks) {
      let currentBlockChunk: NovelBlock[] = [];
      let currentWordCount = 0;
      let isFirstPageForSection = true;

      for (let bIdx = 0; bIdx < sec.blocks.length; bIdx++) {
        const block = sec.blocks[bIdx];
        const blockText = block.runs ? block.runs.map((r) => r.text).join("") : block.text || "";
        const blockWords = blockText.split(/\s+/).filter(Boolean).length;

        // If page has enough words and this isn't the first block on the page, flush to new page
        if (currentWordCount + blockWords > wordsPerPage && currentBlockChunk.length > 0) {
          pages.push({
            pageNumber: currentPageNumber++,
            totalPages: 1,
            chapterIndex: sec.chapterIndex ?? sIdx + 1,
            chapterTitle: heading,
            isFirstPageOfChapter: isFirstPageForSection,
            sections: [
              {
                sectionIndex: sIdx,
                heading: isFirstPageForSection ? heading : "",
                disguiseHeading,
                isSectionSensitive: isSensitive,
                paragraphs: [],
                blocks: currentBlockChunk,
                startParaIdx: 0,
                isContinued: !isFirstPageForSection,
              },
            ],
            wordCount: currentWordCount,
          });
          currentBlockChunk = [];
          currentWordCount = 0;
          isFirstPageForSection = false;
        }

        currentBlockChunk.push(block);
        currentWordCount += blockWords;
      }

      // Flush remaining blocks
      if (currentBlockChunk.length > 0 || isFirstPageForSection) {
        pages.push({
          pageNumber: currentPageNumber++,
          totalPages: 1,
          chapterIndex: sec.chapterIndex ?? sIdx + 1,
          chapterTitle: heading,
          isFirstPageOfChapter: isFirstPageForSection,
          sections: [
            {
              sectionIndex: sIdx,
              heading: isFirstPageForSection ? heading : "",
              disguiseHeading,
              isSectionSensitive: isSensitive,
              paragraphs: [],
              bulletPoints: sec.bulletPoints,
              callout: sec.callout,
              blocks: currentBlockChunk,
              startParaIdx: 0,
              isContinued: !isFirstPageForSection,
            },
          ],
          wordCount: currentWordCount,
        });
      }
      continue;
    }

    // Standard Paragraph-based pagination
    let currentParaChunk: string[] = [];
    let currentDisguiseChunk: string[] = [];
    let currentWordCount = 0;
    let isFirstPageForSection = true;
    let chunkStartParaIdx = 0;

    for (let pIdx = 0; pIdx < paras.length; pIdx++) {
      const pText = paras[pIdx] || "";
      const pWords = pText.split(/\s+/).filter(Boolean).length;

      // If page limit reached and we already have at least 1 paragraph, push page
      if (currentWordCount + pWords > wordsPerPage && currentParaChunk.length > 0) {
        pages.push({
          pageNumber: currentPageNumber++,
          totalPages: 1,
          chapterIndex: sec.chapterIndex ?? sIdx + 1,
          chapterTitle: heading,
          isFirstPageOfChapter: isFirstPageForSection,
          sections: [
            {
              sectionIndex: sIdx,
              heading: isFirstPageForSection ? heading : "",
              disguiseHeading,
              isSectionSensitive: isSensitive,
              paragraphs: currentParaChunk,
              disguiseParagraphs: currentDisguiseChunk,
              startParaIdx: chunkStartParaIdx,
              isContinued: !isFirstPageForSection,
            },
          ],
          wordCount: currentWordCount,
        });
        currentParaChunk = [];
        currentDisguiseChunk = [];
        chunkStartParaIdx = pIdx;
        currentWordCount = 0;
        isFirstPageForSection = false;
      }

      currentParaChunk.push(pText);
      if (disguiseParas && disguiseParas[pIdx]) {
        currentDisguiseChunk.push(disguiseParas[pIdx]);
      }
      currentWordCount += pWords;
    }

    // Flush remaining paragraphs in section (or empty section)
    pages.push({
      pageNumber: currentPageNumber++,
      totalPages: 1,
      chapterIndex: sec.chapterIndex ?? sIdx + 1,
      chapterTitle: heading,
      isFirstPageOfChapter: isFirstPageForSection,
      sections: [
        {
          sectionIndex: sIdx,
          heading: isFirstPageForSection ? heading : "",
          disguiseHeading,
          isSectionSensitive: isSensitive,
          paragraphs: currentParaChunk,
          disguiseParagraphs: currentDisguiseChunk,
          bulletPoints: sec.bulletPoints,
          callout: sec.callout,
          startParaIdx: chunkStartParaIdx,
          isContinued: !isFirstPageForSection,
        },
      ],
      wordCount: currentWordCount,
    });
  }

  // Finalize totalPages count on all pages
  const finalTotalPages = Math.max(1, pages.length);
  for (const page of pages) {
    page.totalPages = finalTotalPages;
  }

  return pages;
}
