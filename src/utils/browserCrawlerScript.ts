/**
 * DOCLOAK Browser Extractor Bookmarklet
 *
 * Runs inside the user's own browser tab on a novel site and reads chapters with the
 * user's normal session (same as reading them by hand), then outputs schemaVersion "1.0"
 * JSON for "Import novel (.json)".
 *
 * IMPORTANT for editing:
 * - The script below is plain JavaScript inside String.raw, so backslashes are literal
 *   (write /\s+/ normally). Do NOT use backticks or "${" inside it.
 * - It is URL-encoded with encodeURIComponent, so newlines and // comments are safe.
 */

const SCRIPT = String.raw`(function () {
  var OVERLAY_ID = 'doccloak-crawler-overlay';
  var existing = document.getElementById(OVERLAY_ID);
  if (existing) { existing.remove(); return; }

  // ---------- helpers ----------
  function txt(node) {
    if (!node) return '';
    return (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function host(u) { return u.hostname.replace(/^www\./, '').toLowerCase(); }
  function norm(href) {
    try {
      var u = new URL(href, location.href);
      u.hash = '';
      return u.protocol + '//' + host(u) + u.pathname.replace(/\/+$/, '') + u.search;
    } catch (e) { return href; }
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  var CHAPTER_TEXT_RE = /^(?:Chapter|Chap\.?|Ch\.?|Episode|Ep\.?|Part|Section|Volume|Vol\.?|Act|Book|Capítulo|Chapitre|Kapitel|Chương|Chuong|Hồi|第)\s*[\dIVXLCDM零一二三四五六七八九十百千.:\s\-—–]/i;
  var SPECIAL_RE = /^(?:Prologue|Epilogue|Side Story|Interlude|Afterword|Extra|Bonus Chapter)\b/i;
  var CHAPTER_URL_RE = /(?:^|[\/\-_])(?:chapter|chap|ch|episode|ep|c|chuong|hoi|tap)[\-_\/]?\d+/i;
  var CHAPTER_TEXT_ANY_RE = /(?:^|[\s–—\-:|])(?:Chapter|Chương|Chuong|Episode|Ch\.)\s*\d+/i;
  var NAV_TEXT_RE = /^(?:read latest|latest chapter|latest release|jump to.*|read first|start reading|first chapter|last chapter|continue reading|bookmark|prev(?:ious)?(?: chapter)?|next(?: chapter)?|home|index|table of contents|toc|từ đầu|đọc|đọc từ đầu|đọc tiếp|đọc ngay|chương đầu|chương mới nhất|trước|sau|mục lục|«|»|‹|›|<|>|<<|>>)$/i;
  var UTILITY = ['login','signin','sign-in','register','signup','sign-up','logout','comment','comments','donate','patreon','discord','review','reviews','forum','forums','support','bookmark','bookmarks','latest','random','search','tag','tags','genre','genres','ranking','rankings','account','profile','report','share','user','users','author','authors'];
  var NOISE = "aside, header, footer, nav:not(.chapter-nav), .sidebar, [class*='sidebar'], [id*='sidebar'], [class*='latest'], [id*='latest'], [class*='recent'], [id*='recent'], [class*='popular'], [class*='related'], [class*='recommend'], [class*='similar'], [class*='comment'], [id*='comment'], [class*='widget']";
  var NOTICE_RE = /(?:^|[\s\/\-_:])(notice|announcement|author'?s?[\s\-]?note|hiatus|poll|status update|schedule update|glossary|character art|q\s*&\s*a|patreon|discord)(?:$|[\s\/\-_:])/i;
  var MEMBERS_RE = /lock-paywall\.svg|jetpack-subscriber-paywall|wp-block-jetpack-subscriber|Subscribe to keep reading|Subscribe to continue reading|This (?:post|content) is for (?:paid )?subscribers only|Đăng ký để tiếp tục đọc|Đăng ký để truy cập phần còn lại/i;
  var CHALLENGE_RE = /Just a moment\.\.\.|challenge-platform|cf-turnstile|Attention Required! \| Cloudflare/i;

  function isUtility(u) {
    return u.pathname.toLowerCase().split('/').some(function (s) { return UTILITY.indexOf(s) >= 0; });
  }
  function novelPath(u) {
    return u.pathname.replace(/\/+$/, '').replace(/\/navigate$/i, '').replace(/\.(?:html?|php|aspx?)$/i, '');
  }
  function chapterNum(s) {
    var m = String(s).match(/(?:chapter|chap\.?|ch\.?|episode|ep\.?|chương|chuong|第)[\s\-_]*(\d+)/i) || String(s).match(/^(\d+)[.\s\-—–:]/);
    return m ? parseInt(m[1], 10) : null;
  }

  // ---------- find chapter links ----------
  function findChapterLinks(doc, pageUrl) {
    var here = new URL(pageUrl);
    var base = novelPath(here);
    var hereKey = norm(pageUrl);
    var cands = [];
    var anchors = Array.prototype.slice.call(doc.querySelectorAll('a[href]'));
    function consider(a) {
      var u;
      try { u = new URL(a.getAttribute('href'), pageUrl); } catch (e) { return; }
      if (!/^https?:$/.test(u.protocol) || host(u) !== host(here)) return;
      var t = txt(a);
      if (NAV_TEXT_RE.test(t) || isUtility(u) || norm(u.href) === hereKey) return;
      if (/\/page\/\d+\/?$/i.test(u.pathname) || /^\d{1,3}$/.test(t)) return; // list pagination, not chapters
      var looks = CHAPTER_URL_RE.test(u.pathname + u.search) || CHAPTER_TEXT_RE.test(t) || SPECIAL_RE.test(t) ||
        CHAPTER_TEXT_ANY_RE.test(t) || /^\d+[.\s\-—–:]+\S/.test(t) ||
        (base.length > 1 && u.pathname.indexOf(base + '/') === 0 && /\/\d+\/?$/.test(u.pathname));
      if (looks) { u.hash = ''; cands.push({ title: t, url: u.href }); }
    }
    anchors.forEach(function (a) { if (!a.closest(NOISE)) consider(a); });
    if (cands.length < 3) { cands = []; anchors.forEach(consider); } // list lives in a "widget"-named box

    // Keep only links belonging to THIS novel when we can tell.
    var pool = cands;
    if (base.length > 1) {
      var byPrefix = cands.filter(function (c) { return new URL(c.url).pathname.indexOf(base + '/') === 0; });
      if (byPrefix.length >= 3) pool = byPrefix;
      else {
        var slug = (base.split('/').filter(Boolean).pop() || '').toLowerCase();
        if (slug.length >= 4 && !/^\d+$/.test(slug)) {
          var bySlug = cands.filter(function (c) { return new URL(c.url).pathname.toLowerCase().indexOf(slug) >= 0; });
          if (bySlug.length >= 3) pool = bySlug;
        }
      }
    }
    var seen = {}, out = [];
    pool.forEach(function (c) { var k = norm(c.url); if (!seen[k]) { seen[k] = 1; out.push(c); } });
    return out;
  }

  // Newest-first lists -> flip so chapter 1 is first (majority vote, ignores stray links).
  function orderOldestFirst(list) {
    var nums = list.map(function (c) { var n = chapterNum(c.title); return n === null ? chapterNum(new URL(c.url).pathname) : n; });
    var up = 0, down = 0;
    for (var i = 1; i < nums.length; i++) {
      if (nums[i - 1] === null || nums[i] === null || nums[i] === nums[i - 1]) continue;
      if (nums[i] > nums[i - 1]) up++; else down++;
    }
    return down > up ? list.slice().reverse() : list;
  }

  // Extra pages of a paginated chapter list (?page=2, /page/2, /chuong/page/2)
  function findListPages(doc, pageUrl) {
    var base = new URL(pageUrl);
    var basePath = base.pathname.replace(/\/+$/, '').replace(/\/page\/\d+$/i, '');
    var maxN = 1, make = null;
    doc.querySelectorAll('a[href]').forEach(function (a) {
      var u;
      try { u = new URL(a.getAttribute('href'), pageUrl); } catch (e) { return; }
      if (host(u) !== host(base)) return;
      var path = u.pathname.replace(/\/+$/, '');
      ['page', 'p', 'pg', 'paged'].forEach(function (key) {
        var v = u.searchParams.get(key);
        if (v && /^\d+$/.test(v) && path === basePath && +v > maxN) {
          maxN = +v;
          var h = u.href;
          make = function (k) { var x = new URL(h); x.searchParams.set(key, String(k)); x.hash = ''; return x.href; };
        }
      });
      var m = path.match(/^(.*)\/page\/(\d+)$/i);
      if (m && (m[1] === basePath || m[1].indexOf(basePath + '/') === 0) && +m[2] > maxN) {
        maxN = +m[2];
        var prefix = u.origin + m[1];
        make = function (k) { return prefix + '/page/' + k + '/'; };
      }
    });
    var urls = [];
    if (make) for (var n = 2; n <= Math.min(maxN, 60); n++) urls.push(make(n));
    return urls;
  }

  function findNext(doc, currentUrl) {
    var cur = new URL(currentUrl);
    var NEXT = /^(?:next(?:\s*(?:chapter|chap|ch\.?|episode|part))?|下一章|下一页|次へ|次の話|次話|sau|chương sau|chương tiếp|tiếp|siguiente|suivant)$/i;
    function clean(t) { return (t || '').replace(/[›»>→⟩❯▶▸⇒←‹«<]+/g, '').replace(/\s+/g, ' ').trim(); }
    function ok(href) {
      if (!href || /^(?:#|javascript:)/i.test(href)) return null;
      try {
        var u = new URL(href, currentUrl); u.hash = '';
        if (host(u) !== host(cur) || norm(u.href) === norm(currentUrl) || isUtility(u)) return null;
        return u.href;
      } catch (e) { return null; }
    }
    var rel = doc.querySelector('a[rel~="next"]');
    if (rel && ok(rel.getAttribute('href'))) return ok(rel.getAttribute('href'));
    var found = null;
    doc.querySelectorAll('a[href]').forEach(function (a) {
      if (found) return;
      if (NEXT.test(clean(txt(a))) || NEXT.test(clean(a.getAttribute('title')))) found = ok(a.getAttribute('href'));
    });
    if (found) return found;
    var cls = doc.querySelector('a.next, a.next-chapter, a.btn-next, a#next_chap, a#next-chapter, .nav-next a, .next-post a');
    return cls ? ok(cls.getAttribute('href')) : null;
  }

  // ---------- chapter text -> DOCLOAK blocks ----------
  function parseBlocks(doc) {
    doc.querySelectorAll('.chapter-nav, .nav, .author-note, script, style, .ads, .advertisement, .comments, iframe, noscript, header, footer, .share, .chap-navigation, .breadcrumb').forEach(function (el) { el.remove(); });
    doc.querySelectorAll('br').forEach(function (br) { br.replaceWith('\n'); });
    var sels = ['.chapter-inner.chapter-content', '.chapter-content', '#chapter-content', '#novelcontent', '.novelcontent', '.reading-content', '#read-content', '#chr-content', '.chr-c', '.chapter-body', '#chapter-body', '.entry-content', '.post-content', '.userstuff', '#novel_honbun', '.chapter-inner', 'article', 'main', '#content', '.content'];
    var contentEl = null, best = 0;
    sels.forEach(function (s) {
      var el = doc.querySelector(s);
      if (el) { var n = el.querySelectorAll('p, div.para').length; if (n > best) { best = n; contentEl = el; } }
    });
    if (!contentEl) contentEl = doc.body;

    var blocks = [];
    var els = contentEl.querySelectorAll('p, div.para, h2, h3, h4, blockquote, hr');
    if (els.length > 2) {
      els.forEach(function (el) {
        var tag = el.tagName.toLowerCase();
        if (tag === 'hr') { blocks.push({ type: 'break' }); return; }
        var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (!t || t.length < 2) return;
        if (/^(?:read more on|support the author|patreon|previous chapter|next chapter|index|chapter list|report chapter)/i.test(t)) return;
        if (/^(?:\*\s*\*\s*\*|\*\*\*|---)$/.test(t)) { blocks.push({ type: 'break' }); return; }
        if (tag === 'h2' || tag === 'h3' || tag === 'h4') { blocks.push({ type: 'heading', text: t }); return; }
        if (tag === 'blockquote') { blocks.push({ type: 'quote', text: t }); return; }
        var runs = [], styled = false;
        el.childNodes.forEach(function (node) {
          if (node.nodeType === 3) { if (node.textContent) runs.push({ text: node.textContent }); }
          else if (node.nodeType === 1) {
            var nt = node.tagName.toLowerCase();
            var it = nt === 'em' || nt === 'i' || (node.style && node.style.fontStyle === 'italic');
            var bd = nt === 'strong' || nt === 'b' || (node.style && Number(node.style.fontWeight) >= 600);
            if (it || bd) styled = true;
            runs.push({ text: node.textContent || '', italic: it || undefined, bold: bd || undefined });
          }
        });
        blocks.push(styled ? { type: 'paragraph', runs: runs } : { type: 'paragraph', text: t });
      });
    }
    if (blocks.length === 0) {
      (contentEl.textContent || '').split(/\n{2,}/).forEach(function (l) {
        var s = l.replace(/\s+/g, ' ').trim();
        if (s.length > 8 && !/^(?:next|prev|previous|chapter|index)$/i.test(s)) blocks.push({ type: 'paragraph', text: s });
      });
    }
    return blocks;
  }
  function wordsOf(blocks) {
    return blocks.reduce(function (sum, b) {
      var s = b.text || (b.runs ? b.runs.map(function (r) { return r.text; }).join('') : '');
      return sum + s.split(/\s+/).filter(Boolean).length;
    }, 0);
  }

  // Fetch a page with your normal session. Returns a Document or an error string.
  async function getDoc(url) {
    for (var attempt = 0; attempt < 2; attempt++) {
      try {
        var res = await fetch(url, { credentials: 'include' });
        var html = await res.text();
        if (res.ok && MEMBERS_RE.test(html)) return 'subscribers-only: subscribe/log in on this site in this browser, then retry';
        if (res.ok && !CHALLENGE_RE.test(html)) return new DOMParser().parseFromString(html, 'text/html');
        if (CHALLENGE_RE.test(html)) return 'blocked by a security check, open this chapter once in the tab, then retry';
        if (res.status === 401 || res.status === 403) return 'access denied (HTTP ' + res.status + ')';
      } catch (e) {
        if (attempt === 1) return 'network error';
      }
      await sleep(1500);
    }
    return 'could not load';
  }

  // ---------- UI ----------
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.style.cssText = 'position:fixed;top:20px;right:20px;width:400px;max-width:calc(100vw - 40px);max-height:92vh;background:#fff;border:2px solid #2563eb;border-radius:12px;box-shadow:0 20px 40px rgba(0,0,0,.35);z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1e293b;padding:18px;overflow-y:auto;font-size:13px;box-sizing:border-box;';
  var field = 'width:100%;box-sizing:border-box;padding:6px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;color:#1e293b;background:#fff;';
  var label = 'font-weight:600;display:block;margin-bottom:3px;font-size:11px;color:#475569;';
  overlay.innerHTML = [
    '<div style="display:flex;align-items:center;margin-bottom:12px;border-bottom:1px solid #e2e8f0;padding-bottom:10px;">',
    '<div style="font-weight:700;font-size:15px;color:#1e40af;"><span style="background:#2563eb;color:#fff;padding:2px 6px;border-radius:4px;font-size:11px;">DOCLOAK</span> Browser Novel Extractor</div>',
    '<button id="dc-close" style="margin-left:auto;background:none;border:none;font-size:20px;cursor:pointer;color:#64748b;">&times;</button></div>',
    '<div style="margin-bottom:10px;"><label style="' + label + '">Book Title:</label><input id="dc-title" type="text" style="' + field + '"/></div>',
    '<div style="margin-bottom:10px;"><label style="' + label + '">Author:</label><input id="dc-author" type="text" style="' + field + '"/></div>',
    '<div style="display:flex;gap:8px;margin-bottom:10px;">',
    '<div style="flex:1;"><label style="' + label + '">Chapter Limit:</label><select id="dc-limit" style="' + field + '">',
    '<option value="5">5</option><option value="15">15</option><option value="25" selected>25</option><option value="50">50</option><option value="100">100</option><option value="99999">All</option></select></div>',
    '<div style="flex:1;"><label style="' + label + '">Mode:</label><select id="dc-mode" style="' + field + '">',
    '<option value="toc">Chapter list on this page</option><option value="next">Follow &quot;Next&quot; from this page</option></select></div>',
    '<div style="width:70px;"><label style="' + label + '">Start ch.</label><input id="dc-start" type="number" min="1" value="1" style="' + field + '"/></div>',
    '</div>',
    '<div style="background:#f8fafc;border:1px solid #cbd5e1;padding:8px 10px;border-radius:6px;margin-bottom:10px;">',
    '<label style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;cursor:pointer;"><input id="dc-skip" type="checkbox" checked/> Skip notices, author notes &amp; hiatus posts</label>',
    '<input id="dc-exclude" type="text" placeholder="Exclude keywords, comma separated (e.g. poll, bonus)" style="' + field + 'margin-top:6px;font-size:11px;"/></div>',
    '<div id="dc-status" style="font-size:11px;color:#475569;margin-bottom:12px;background:#f8fafc;padding:8px 10px;border-radius:6px;border:1px solid #e2e8f0;min-height:36px;line-height:1.4;"></div>',
    '<button id="dc-start-btn" style="width:100%;background:#2563eb;color:#fff;border:none;padding:10px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">Start In-Browser Extraction</button>',
    '<button id="dc-stop-btn" style="display:none;width:100%;margin-top:6px;background:#fff;color:#b91c1c;border:1px solid #fca5a5;padding:8px;border-radius:6px;font-weight:600;cursor:pointer;font-size:12px;">Stop &amp; keep what I have</button>',
    '<div id="dc-results" style="display:none;margin-top:12px;border-top:1px solid #e2e8f0;padding-top:12px;">',
    '<div style="display:flex;gap:6px;"><button id="dc-download" style="flex:1;background:#059669;color:#fff;border:none;padding:8px;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;">Download .json</button>',
    '<button id="dc-copy" style="flex:1;background:#334155;color:#fff;border:none;padding:8px;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;">Copy JSON</button></div></div>'
  ].join('');
  document.body.appendChild(overlay);
  function $(id) { return overlay.querySelector('#' + id); }
  var statusEl = $('dc-status');
  $('dc-close').onclick = function () { overlay.remove(); };

  var ogTitle = (document.querySelector('meta[property="og:title"]') || {}).content;
  $('dc-title').value = (ogTitle || txt(document.querySelector('h1')) || document.title || 'Web Novel')
    .replace(/\s*[-–|•]\s*(?:Royal Road|Read Novel|Webnovel|Wuxiaworld|Free Web Novel|NovelFull).*$/i, '').trim();
  var authorMeta = (document.querySelector('meta[name="author"]') || {}).content;
  $('dc-author').value = authorMeta || txt(document.querySelector('.author a, .author, .byline, h4 a')) || '';

  var links = findChapterLinks(document, location.href);
  var listPages = findListPages(document, location.href);
  var listComplete = listPages.length === 0;
  if (listComplete) links = orderOldestFirst(links);
  var onChapterPage = CHAPTER_URL_RE.test(location.pathname + location.search) || links.length < 3;
  if (!onChapterPage) {
    $('dc-mode').value = 'toc';
    statusEl.innerHTML = 'Found <strong>' + links.length + ' chapters</strong> on this page' +
      (listPages.length ? ' (+ ' + listPages.length + ' more list pages, read when you start)' : '') + '.';
  } else {
    $('dc-mode').value = 'next';
    $('dc-start').disabled = true;
    statusEl.innerHTML = 'Chapter page detected: will start <strong>from this chapter</strong> and follow &quot;Next&quot; links.';
  }
  $('dc-mode').onchange = function () {
    $('dc-start').disabled = this.value !== 'toc';
    if (this.value === 'toc' && links.length === 0) statusEl.textContent = 'No chapter list found on this page. Open the table of contents, or use "Follow Next".';
  };

  var stopRequested = false;
  var payload = null;
  $('dc-stop-btn').onclick = function () { stopRequested = true; this.textContent = 'Stopping...'; };

  $('dc-start-btn').onclick = async function () {
    var btn = this;
    btn.disabled = true; btn.style.opacity = '0.6'; btn.textContent = 'Reading chapters...';
    $('dc-stop-btn').style.display = 'block';
    var limit = parseInt($('dc-limit').value, 10);
    var skip = $('dc-skip').checked;
    var excludes = $('dc-exclude').value.split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
    function excluded(url, title) {
      var hay = (url + ' ' + title).toLowerCase();
      if (excludes.some(function (k) { return hay.indexOf(k) >= 0; })) return true;
      return skip && NOTICE_RE.test(title);
    }
    var chapters = [];
    var failed = [];
    function show(n, total, title) {
      statusEl.innerHTML = 'Reading chapter ' + n + (total ? ' of ' + total : '') + ':<br/><strong style="color:#2563eb;">' + esc(title) + '</strong>' +
        (failed.length ? '<br/><span style="color:#b45309;">' + failed.length + ' failed so far</span>' : '');
    }

    if ($('dc-mode').value === 'toc' && links.length > 0 && !listComplete) {
      var seenL = {};
      links.forEach(function (l) { seenL[norm(l.url)] = 1; });
      for (var pi = 0; pi < listPages.length && !stopRequested; pi++) {
        statusEl.textContent = 'Reading chapter list page ' + (pi + 2) + ' of ' + (listPages.length + 1) + '...';
        var lp = await getDoc(listPages[pi]);
        if (typeof lp === 'string') continue;
        findChapterLinks(lp, listPages[pi]).forEach(function (l) {
          var k = norm(l.url);
          if (!seenL[k]) { seenL[k] = 1; links.push(l); }
        });
        await sleep(500);
      }
      links = orderOldestFirst(links);
      listComplete = true;
    }

    if ($('dc-mode').value === 'toc' && links.length > 0) {
      var start = Math.max(1, parseInt($('dc-start').value, 10) || 1);
      var list = links.filter(function (l) { return !excluded(l.url, l.title); });
      var target = list.slice(start - 1, start - 1 + limit);
      for (var i = 0; i < target.length && !stopRequested; i++) {
        var item = target[i], num = start + i;
        show(i + 1, target.length, item.title);
        var doc = await getDoc(item.url);
        if (typeof doc === 'string') {
          failed.push('ch. ' + num + ': ' + doc);
          chapters.push({ index: num, status: 'failed', title: item.title, wordCount: 0, blocks: [] });
        } else {
          var title = txt(doc.querySelector('h1.chapter-title, .chapter-title, h1')) || item.title;
          var blocks = parseBlocks(doc);
          chapters.push({ index: num, status: blocks.length ? 'ok' : 'empty', title: title, wordCount: wordsOf(blocks), blocks: blocks });
        }
        await sleep(700);
      }
    } else {
      var url = location.href, seen = {}, steps = 0, n = 0;
      while (url && chapters.length < limit && !stopRequested && steps < limit * 2 + 5) {
        var key = norm(url);
        if (seen[key]) break;
        seen[key] = 1; steps++;
        var page;
        if (steps === 1) {
          page = document.cloneNode(true);
          var ov = page.getElementById(OVERLAY_ID);
          if (ov) ov.remove();
        } else {
          page = await getDoc(url);
        }
        if (typeof page === 'string') { failed.push(url + ': ' + page); break; }
        var next = findNext(page, url);
        var chTitle = txt(page.querySelector('h1.chapter-title, .chapter-title, h1, h2')) || ('Chapter ' + (n + 1));
        if (n === 0) n = chapterNum(chTitle) || chapterNum(new URL(url).pathname) || 1; else n++;
        show(chapters.length + 1, limit < 99999 ? limit : 0, chTitle);
        if (!excluded(url, chTitle)) {
          var b = parseBlocks(page);
          var wc = wordsOf(b);
          if (!(skip && wc < 90)) chapters.push({ index: n, status: b.length ? 'ok' : 'empty', title: chTitle, wordCount: wc, blocks: b });
        }
        url = next;
        if (url) await sleep(700);
      }
    }

    payload = {
      schemaVersion: '1.0',
      book: {
        title: $('dc-title').value.trim() || 'Imported Novel',
        author: $('dc-author').value.trim() || null,
        language: document.documentElement.lang || 'en',
        sourceUrl: location.href
      },
      chapters: chapters
    };
    var okCount = chapters.filter(function (c) { return c.status === 'ok'; }).length;
    statusEl.innerHTML = '<span style="color:#059669;font-weight:600;">Done!</span> ' + okCount + ' chapters ready.' +
      (failed.length ? '<br/><span style="color:#b45309;">' + failed.length + ' failed: ' + esc(failed.slice(0, 3).join(' | ')) + (failed.length > 3 ? ' ...' : '') + '</span>' : '');
    btn.style.display = 'none';
    $('dc-stop-btn').style.display = 'none';
    $('dc-results').style.display = 'block';
  };

  $('dc-download').onclick = function () {
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = payload.book.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() + '_doccloak.json';
    document.body.appendChild(a); a.click(); a.remove();
  };
  $('dc-copy').onclick = function () {
    var text = JSON.stringify(payload);
    var btn = this;
    function done() { btn.textContent = 'Copied!'; setTimeout(function () { btn.textContent = 'Copy JSON'; }, 2000); }
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; overlay.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { alert('Copy failed, use Download .json instead.'); }
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else { fallback(); }
  };
})();`;

/** The raw script (can be pasted into the browser console as a fallback). */
export const BOOKMARKLET_SOURCE = SCRIPT;

/** The bookmarklet URL. URL-encoded so newlines, comments and % signs survive being saved as a bookmark. */
export const BOOKMARKLET_CODE = "javascript:" + encodeURIComponent(SCRIPT.replace(/\n[ \t]+/g, "\n"));

export const CHROME_EXTENSION_MANIFEST = {
  manifest_version: 3,
  name: "DOCLOAK - Web Novel Browser Extractor",
  version: "1.0.0",
  description: "Read web novel chapters from your own browser tab into DOCLOAK.",
  permissions: ["activeTab", "scripting"],
  action: {
    default_title: "Extract Novel to DOCLOAK",
  },
};
