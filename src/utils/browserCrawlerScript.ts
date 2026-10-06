/**
 * DOCLOAK Browser Extractor Bookmarklet & Extension Script
 * Runs directly in the user's browser tab on any novel site (RoyalRoad, NovelFull, Webnovel, etc.)
 * Bypasses Cloudflare, CAPTCHAs, and SPAs by using the user's real browser session and cookies.
 * Outputs exact schemaVersion: "1.0" JSON ready for 1-click import into DOCLOAK.
 */

export const BOOKMARKLET_CODE = `javascript:(function(){
  if (document.getElementById('doccloak-crawler-overlay')) {
    document.getElementById('doccloak-crawler-overlay').remove();
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'doccloak-crawler-overlay';
  overlay.style.cssText = 'position:fixed;top:20px;right:20px;width:400px;max-height:92vh;background:#ffffff;border:2px solid #2563eb;border-radius:12px;box-shadow:0 20px 40px rgba(0,0,0,0.35);z-index:99999999;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1e293b;padding:18px;overflow-y:auto;font-size:13px;box-sizing:border-box;';

  overlay.innerHTML = \`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;border-bottom:1px solid #e2e8f0;padding-bottom:10px;">
      <div style="font-weight:700;font-size:15px;color:#1e40af;display:flex;align-items:center;gap:6px;">
        <span style="background:#2563eb;color:#fff;padding:2px 6px;border-radius:4px;font-size:11px;">DOCLOAK</span>
        Browser Novel Extractor
      </div>
      <button id="doccloak-close-btn" style="margin-left:auto;background:none;border:none;font-size:20px;cursor:pointer;color:#64748b;line-height:1;">&times;</button>
    </div>
    <div style="font-size:11px;color:#059669;background:#ecfdf5;border:1px solid #a7f3d0;padding:6px 10px;border-radius:6px;margin-bottom:12px;">
      &#x2714; Live inside your browser &bull; Bypasses Cloudflare 403 &amp; CAPTCHAs automatically!
    </div>
    <div style="margin-bottom:10px;">
      <label style="font-weight:600;display:block;margin-bottom:3px;font-size:11px;color:#475569;">Book Title:</label>
      <input id="doccloak-book-title" type="text" style="width:100%;box-sizing:border-box;padding:6px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;" />
    </div>
    <div style="margin-bottom:10px;">
      <label style="font-weight:600;display:block;margin-bottom:3px;font-size:11px;color:#475569;">Author:</label>
      <input id="doccloak-book-author" type="text" style="width:100%;box-sizing:border-box;padding:6px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;" />
    </div>
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <div style="flex:1;">
        <label style="font-weight:600;display:block;margin-bottom:3px;font-size:11px;color:#475569;">Chapter Limit:</label>
        <select id="doccloak-chapter-limit" style="width:100%;box-sizing:border-box;padding:6px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;">
          <option value="5">5 Chapters</option>
          <option value="15">15 Chapters</option>
          <option value="25" selected>25 Chapters</option>
          <option value="50">50 Chapters</option>
          <option value="100">100 Chapters</option>
          <option value="999">All Discovered</option>
        </select>
      </div>
      <div style="flex:1;">
        <label style="font-weight:600;display:block;margin-bottom:3px;font-size:11px;color:#475569;">Crawl Mode:</label>
        <select id="doccloak-crawl-mode" style="width:100%;box-sizing:border-box;padding:6px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;">
          <option value="auto">Auto Detect</option>
          <option value="toc">Table of Contents</option>
          <option value="next">Follow "Next Chapter"</option>
        </select>
      </div>
    </div>
    <div style="background:#f8fafc;border:1px solid #cbd5e1;padding:8px 10px;border-radius:6px;margin-bottom:10px;">
      <label style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:#1e293b;cursor:pointer;">
        <input id="doccloak-skip-notices" type="checkbox" checked style="accent-color:#2563eb;" />
        Skip Notices, Author Notes &amp; Hiatus posts
      </label>
      <div style="margin-top:5px;">
        <input id="doccloak-exclude-keywords" type="text" placeholder="Exclude keywords (e.g. hiatus, poll, bonus)" style="width:100%;box-sizing:border-box;padding:4px 6px;border:1px solid #cbd5e1;border-radius:4px;font-size:11px;" />
      </div>
    </div>
    <div id="doccloak-status" style="font-size:11px;color:#475569;margin-bottom:12px;background:#f8fafc;padding:8px 10px;border-radius:6px;border:1px solid #e2e8f0;min-height:36px;line-height:1.4;">
      Scanning page...
    </div>
    <button id="doccloak-start-crawl" style="width:100%;background:#2563eb;color:#ffffff;border:none;padding:10px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;">
      Start In-Browser Extraction
    </button>
    <div id="doccloak-results" style="display:none;margin-top:12px;border-top:1px solid #e2e8f0;padding-top:12px;">
      <div id="doccloak-results-summary" style="font-weight:600;color:#059669;margin-bottom:8px;font-size:12px;">Extraction Complete!</div>
      <div style="display:flex;gap:6px;">
        <button id="doccloak-download-json" style="flex:1;background:#059669;color:#fff;border:none;padding:8px;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;">Download .json</button>
        <button id="doccloak-copy-json" style="flex:1;background:#334155;color:#fff;border:none;padding:8px;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;">Copy JSON</button>
      </div>
    </div>
  \`;

  document.body.appendChild(overlay);

  document.getElementById('doccloak-close-btn').onclick = function() {
    overlay.remove();
  };

  // Safe text getter (handles both layout nodes and DOMParser nodes)
  function getNodeText(node) {
    if (!node) return '';
    return (node.innerText || node.textContent || '').trim();
  }

  // Detect book title and author from DOM
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const h1Text = getNodeText(document.querySelector('h1'));
  const rawTitle = ogTitle || h1Text || document.title || 'Web Novel';
  const cleanTitle = rawTitle.replace(/\\s*[-–|•]\\s*(?:Royal Road|Read Novel|Webnovel|Wuxiaworld|Free Web Novel|NovelFull).*$/i, '').trim();
  document.getElementById('doccloak-book-title').value = cleanTitle;

  const authorMeta = document.querySelector('meta[name="author"]')?.getAttribute('content');
  const authorEl = getNodeText(document.querySelector('.author, .byline, h4 a, .author a'));
  document.getElementById('doccloak-book-author').value = authorMeta || authorEl || 'Author';

  // Discover chapter links
  function findChapterLinks() {
    const links = [];
    const seen = new Set();

    // Check dedicated chapter list container first if available
    const container = document.querySelector('#chapters, .chapter-list, .chapters, .list-chapter, .volume-episodes, .table-chapters, div.catalog, ul.chapters, table');
    const searchRoot = container || document;

    searchRoot.querySelectorAll('a[href]').forEach(a => {
      const href = a.href;
      const text = getNodeText(a);
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
      if (seen.has(href)) return;
      if (/(\\/|\\b)(login|signin|register|signup|comment|donate|patreon|discord|review|forum|support|bookmark|latest|random)(\\/|\\b)/i.test(href)) return;
      if (/^(?:read latest|latest chapter|jump to|read first|bookmark|prev|next|home)$/i.test(text)) return;
      
      const isChapter = /(\\/|\\b)(chapter|ch|read|episode|c\\d+)(\\/|\\b|\\-|\\_|\\d)/i.test(href) ||
        /^(?:Chapter|Ch\\.?|Episode|Part|Section|Volume|Act|第)\\s*[\\dIVXLCDM\\.:\\s\\-—–]/i.test(text) ||
        /^[\\d]+[\\.\\s\\-—–].+/.test(text) ||
        /^(?:Prologue|Epilogue)/i.test(text);

      if (isChapter) {
        seen.add(href);
        links.push({ title: text || ('Chapter ' + (links.length + 1)), url: href });
      }
    });

    return links;
  }

  let discoveredLinks = findChapterLinks();
  const statusEl = document.getElementById('doccloak-status');
  if (discoveredLinks.length >= 3) {
    statusEl.innerHTML = 'Found <strong>' + discoveredLinks.length + ' chapter links</strong> on this Table of Contents page.';
    document.getElementById('doccloak-crawl-mode').value = 'toc';
  } else {
    statusEl.innerHTML = 'Single chapter page detected. Ready to extract and follow <strong>&quot;Next Chapter&quot;</strong> links automatically.';
    document.getElementById('doccloak-crawl-mode').value = 'next';
  }

  // Text parser: extract blocks according to DOCLOAK schema 1.0
  function parseBlocksFromDoc(doc) {
    // 1. Remove non-content elements
    doc.querySelectorAll('.chapter-nav, .nav, .author-note, script, style, .ads, .advertisement, .comments, iframe, noscript, header, footer, .share, .chap-navigation, .breadcrumb').forEach(el => el.remove());
    
    // Replace <br> with newlines
    doc.querySelectorAll('br').forEach(br => br.replaceWith('\n'));

    const candidateSelectors = [
      '.chapter-inner.chapter-content', '.chapter-content', '#chapter-content',
      '#novelcontent', '.novelcontent', '.reading-content', '#read-content',
      '.chapter-body', '#chapter-body', '.entry-content', '.post-content',
      '.chapter-inner', 'article', 'main', '#content', '.content'
    ];
    let contentEl = null;
    let maxPCount = 0;
    for (const sel of candidateSelectors) {
      const el = doc.querySelector(sel);
      if (el) {
        const pCount = el.querySelectorAll('p, div.para').length;
        if (pCount > maxPCount) {
          maxPCount = pCount;
          contentEl = el;
        }
      }
    }
    if (!contentEl) contentEl = doc.body;

    const blocks = [];
    const elements = contentEl.querySelectorAll('p, div.para, h2, h3, h4, blockquote, hr');
    if (elements.length > 2) {
      elements.forEach(el => {
        const tag = el.tagName.toLowerCase();
        if (tag === 'hr') {
          blocks.push({ type: 'break' });
          return;
        }
        const text = getNodeText(el);
        if (!text || text.length < 2) return;
        if (/^(?:read more on|support the author|patreon|previous chapter|next chapter|index|chapter list|report chapter)/i.test(text)) return;
        if (text === '* * *' || text === '***' || text === '---') {
          blocks.push({ type: 'break' });
          return;
        }
        if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
          blocks.push({ type: 'heading', text });
        } else if (tag === 'blockquote') {
          blocks.push({ type: 'quote', text });
        } else {
          // Paragraph with run detection
          const runs = [];
          el.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
              const t = node.textContent;
              if (t) runs.push({ text: t });
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const nodeTag = node.tagName.toLowerCase();
              const isItalic = nodeTag === 'em' || nodeTag === 'i' || node.style?.fontStyle === 'italic';
              const isBold = nodeTag === 'strong' || nodeTag === 'b' || Number(node.style?.fontWeight) >= 600;
              runs.push({
                text: getNodeText(node),
                italic: isItalic ? true : undefined,
                bold: isBold ? true : undefined
              });
            }
          });
          if (runs.some(r => r.italic || r.bold)) {
            blocks.push({ type: 'paragraph', runs });
          } else {
            blocks.push({ type: 'paragraph', text });
          }
        }
      });
    }

    // Fallback if elements query returned too few blocks
    if (blocks.length === 0) {
      const rawAll = getNodeText(contentEl);
      const lines = rawAll.split(/\\n{2,}/);
      lines.forEach(l => {
        const trimmed = l.trim();
        if (trimmed.length > 8 && !/^(?:next|prev|previous|chapter|index)$/i.test(trimmed)) {
          blocks.push({ type: 'paragraph', text: trimmed });
        }
      });
    }

    return blocks;
  }

  let finalJsonPayload = null;

  document.getElementById('doccloak-start-crawl').onclick = async function() {
    const btn = document.getElementById('doccloak-start-crawl');
    btn.disabled = true;
    btn.style.opacity = '0.6';
    btn.innerText = 'Crawling in browser...';

    const maxCh = parseInt(document.getElementById('doccloak-chapter-limit').value, 10);
    const chosenMode = document.getElementById('doccloak-crawl-mode').value;
    const chapters = [];

    const useToc = (chosenMode === 'toc' || (chosenMode === 'auto' && discoveredLinks.length >= 3));

    if (useToc && discoveredLinks.length > 0) {
      const targetLinks = discoveredLinks.slice(0, maxCh);
      for (let i = 0; i < targetLinks.length; i++) {
        const item = targetLinks[i];
        statusEl.innerHTML = 'Crawling Chapter ' + (i + 1) + ' of ' + targetLinks.length + ':<br/><strong style="color:#2563eb;">' + item.title + '</strong>';
        try {
          const res = await fetch(item.url, { credentials: 'include' });
          const text = await res.text();
          const doc = new DOMParser().parseFromString(text, 'text/html');
          const blocks = parseBlocksFromDoc(doc);
          const wordCount = blocks.reduce((sum, b) => sum + (b.text || (b.runs ? b.runs.map(r => r.text).join('') : '')).split(/\\s+/).filter(Boolean).length, 0);

          chapters.push({
            index: i + 1,
            status: blocks.length > 0 ? 'ok' : 'empty',
            title: item.title,
            wordCount,
            blocks
          });
        } catch (e) {
          chapters.push({
            index: i + 1,
            status: 'failed',
            title: item.title,
            wordCount: 0,
            blocks: []
          });
        }
        await new Promise(r => setTimeout(r, 600));
      }
    } else {
      // Follow Next Chapter buttons starting from current page
      let currentUrl = window.location.href;
      let chIdx = 1;
      const seen = new Set();

      while (chIdx <= maxCh && currentUrl && !seen.has(currentUrl)) {
        seen.add(currentUrl);
        statusEl.innerHTML = 'Crawling Chapter ' + chIdx + ' of ' + maxCh + ':<br/><strong style="color:#2563eb;">' + currentUrl + '</strong>';

        let doc = document;
        if (chIdx > 1) {
          try {
            const res = await fetch(currentUrl, { credentials: 'include' });
            const text = await res.text();
            doc = new DOMParser().parseFromString(text, 'text/html');
          } catch (e) {
            break;
          }
        }

        const chTitle = getNodeText(doc.querySelector('h1.chapter-title, h1, h2')) || ('Chapter ' + chIdx);
        const blocks = parseBlocksFromDoc(doc);
        const wordCount = blocks.reduce((sum, b) => sum + (b.text || (b.runs ? b.runs.map(r => r.text).join('') : '')).split(/\\s+/).filter(Boolean).length, 0);

        chapters.push({
          index: chIdx,
          status: blocks.length > 0 ? 'ok' : 'empty',
          title: chTitle,
          wordCount,
          blocks
        });

        // Find Next Chapter link
        let nextA = doc.querySelector('a[rel="next"], a.next, a.next-chapter, a.btn-next');
        if (!nextA) {
          doc.querySelectorAll('a').forEach(a => {
            const aText = getNodeText(a).toLowerCase();
            if (/^(?:next|next chapter|next >|»|下一章)$/i.test(aText)) {
              nextA = a;
            }
          });
        }
        if (nextA && nextA.href) {
          currentUrl = nextA.href;
          chIdx++;
          await new Promise(r => setTimeout(r, 600));
        } else {
          break;
        }
      }
    }

    finalJsonPayload = {
      schemaVersion: '1.0',
      book: {
        title: document.getElementById('doccloak-book-title').value.trim() || 'Imported Novel',
        author: document.getElementById('doccloak-book-author').value.trim() || null,
        language: document.documentElement.lang || 'en',
        sourceUrl: window.location.href
      },
      chapters
    };

    const okCount = chapters.filter(c => c.status === 'ok').length;
    statusEl.innerHTML = '<span style="color:#059669;font-weight:600;">Done!</span> Successfully extracted ' + okCount + ' chapters ready for DOCLOAK.';
    btn.style.display = 'none';
    document.getElementById('doccloak-results').style.display = 'block';

    document.getElementById('doccloak-download-json').onclick = function() {
      const blob = new Blob([JSON.stringify(finalJsonPayload, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const safeTitle = finalJsonPayload.book.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      a.download = safeTitle + '_doccloak.json';
      a.click();
    };

    document.getElementById('doccloak-copy-json').onclick = function() {
      navigator.clipboard.writeText(JSON.stringify(finalJsonPayload, null, 2)).then(() => {
        alert('Novel JSON copied to clipboard! You can now paste or import it directly into DOCLOAK.');
      });
    };
  };
})();`.replace(/\n\s*/g, " ");

export const CHROME_EXTENSION_MANIFEST = {
  manifest_version: 3,
  name: "DOCLOAK - Web Novel Browser Extractor",
  version: "1.0.0",
  description: "Crawl and extract full web novel chapters directly inside your browser tab without Cloudflare 403 blocks.",
  permissions: ["activeTab", "scripting"],
  action: {
    default_title: "Extract Novel to DOCLOAK",
  },
};
