import React, { useMemo } from "react";
import { ExtractedDocument } from "../types";

/**
 * "Research Post" reader layout.
 * Presents any document (or crawled novel) like a research-community blog post:
 * topic tag, headline, standfirst, author card, source box, numbered sections with
 * summary boxes, references and topic list. Zero images, original branding.
 */

interface ResearchPostViewProps {
  document: ExtractedDocument;
  corporateDisguise: boolean;
}

const INK = "#222222";
const MUTED = "#5c5c5c";
const LINK = "#0c5dad";
const RULE = "#dcdcdc";
const CHIP = "#eef3f8";
const SERIF = 'Georgia, "Iowan Old Style", "Palatino Linotype", Palatino, "Times New Roman", serif';
const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const TOPICS = [
  { name: "Organizational Behaviour", path: "Social Sciences > Management > Organizational Behaviour" },
  { name: "Communication Studies", path: "Humanities > Communication > Communication Studies" },
  { name: "Applied Linguistics", path: "Humanities > Linguistics > Applied Linguistics" },
];

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "R"
  );
}

function formatDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  const safe = isNaN(d.getTime()) ? new Date() : d;
  return safe.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const AuthorCard: React.FC<{ name: string; affiliation: string }> = ({ name, affiliation }) => (
  <div className="flex items-center gap-3 py-4" style={{ fontFamily: SANS }}>
    <div
      aria-hidden="true"
      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
      style={{ background: "#3b6e8f" }}
    >
      {initials(name)}
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[15px] font-semibold truncate" style={{ color: LINK }}>
        {name}
      </div>
      <div className="text-[13px] truncate" style={{ color: MUTED }}>
        {affiliation}
      </div>
    </div>
    <button
      type="button"
      className="text-[13px] font-semibold px-4 py-1.5 rounded-full border cursor-pointer hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      style={{ color: LINK, borderColor: LINK }}
    >
      Follow
    </button>
  </div>
);

export const ResearchPostView: React.FC<ResearchPostViewProps> = ({ document: doc, corporateDisguise }) => {
  const title = (corporateDisguise && doc.disguiseTitle) || doc.title;
  const domain =
    doc.domain ||
    (() => {
      try {
        return new URL(doc.sourceUrl).hostname.replace(/^www\./, "");
      } catch {
        return "";
      }
    })();

  const sections = useMemo(
    () =>
      doc.sections.map((s) => ({
        heading: (corporateDisguise && s.disguiseHeading) || s.heading,
        paragraphs: (corporateDisguise && s.disguiseParagraphs?.length ? s.disguiseParagraphs : s.paragraphs) || [],
      })),
    [doc.sections, corporateDisguise]
  );

  const standfirst =
    (corporateDisguise && doc.disguiseExecutiveSummary) ||
    doc.executiveSummary ||
    sections[0]?.paragraphs[0]?.slice(0, 320) ||
    "";

  const reviews = doc.chapterReviews || [];
  const author = (doc.author && doc.author !== "Original Author" ? doc.author : "") || "Contributing Author";
  const affiliation = domain ? `Contributor, ${domain}` : "Contributor";
  const references = (doc.crawledUrls && doc.crawledUrls.length > 0 ? doc.crawledUrls : [doc.sourceUrl]).filter(
    Boolean
  );

  return (
    <div className="w-full bg-white" style={{ color: INK }}>
      {/* Site bar */}
      <div className="border-b" style={{ borderColor: RULE, fontFamily: SANS }}>
        <div className="max-w-[1080px] mx-auto px-5 py-3 flex items-center gap-3">
          <span className="text-[17px] font-semibold tracking-tight" style={{ color: "#1d3c5a" }}>
            Research Notes
          </span>
          <span className="text-[13px] hidden sm:inline" style={{ color: MUTED }}>
            Stories behind the work
          </span>
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto px-5 py-8 lg:grid lg:grid-cols-[minmax(0,680px)_260px] lg:gap-14">
        <article className="min-w-0">
          {/* Channel tag */}
          <span
            className="inline-block text-[13px] font-semibold px-3 py-1 rounded-full mb-4"
            style={{ background: CHIP, color: "#1d3c5a", fontFamily: SANS }}
          >
            Behind the Study
          </span>

          <h1
            className="text-[30px] sm:text-[38px] leading-[1.15] font-bold mb-4"
            style={{ fontFamily: SERIF, letterSpacing: "-0.01em" }}
          >
            {title}
          </h1>

          {standfirst && (
            <p className="text-[19px] leading-[1.55] mb-5" style={{ fontFamily: SERIF, color: "#3a3a3a" }}>
              {standfirst}
            </p>
          )}

          <div className="text-[14px] mb-1" style={{ fontFamily: SANS, color: MUTED }}>
            Published in{" "}
            {TOPICS.map((t, i) => (
              <React.Fragment key={t.name}>
                <span style={{ color: LINK }}>{t.name}</span>
                {i < TOPICS.length - 2 ? ", " : i === TOPICS.length - 2 ? ", and " : ""}
              </React.Fragment>
            ))}
          </div>
          <div className="text-[14px]" style={{ fontFamily: SANS, color: MUTED }}>
            {formatDate(doc.extractedAt)}
            {doc.readingTimeMinutes ? `, ${doc.readingTimeMinutes} min read` : ""}
          </div>

          <div className="border-b mt-2" style={{ borderColor: RULE }}>
            <AuthorCard name={author} affiliation={affiliation} />
          </div>

          {/* Source box */}
          <a
            href={doc.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-4 items-start my-7 p-4 border rounded-md hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            style={{ borderColor: RULE, fontFamily: SANS }}
          >
            <div
              aria-hidden="true"
              className="w-14 h-[72px] shrink-0 rounded-sm flex items-end p-1.5"
              style={{ background: "linear-gradient(160deg, #1d3c5a 0%, #3b6e8f 100%)" }}
            >
              <span className="block w-full h-[3px] bg-white/70 rounded" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold mb-1" style={{ color: MUTED }}>
                Explore the research
              </div>
              <div className="text-[16px] font-semibold leading-snug" style={{ color: LINK }}>
                {title}
              </div>
              <div className="text-[13px] mt-1 truncate" style={{ color: MUTED }}>
                {domain || doc.sourceUrl}
              </div>
            </div>
          </a>

          {/* Body */}
          <div style={{ fontFamily: SERIF }}>
            {sections.map((sec, i) => {
              const review = reviews[i];
              const boxText = review
                ? (corporateDisguise && review.disguiseSummary) || review.summary
                : "";
              return (
                <section key={i} id={`rp-sec-${i}`} className="scroll-mt-6">
                  {sec.heading && (
                    <h2 className="text-[24px] leading-snug font-bold mt-10 mb-4" style={{ fontFamily: SERIF }}>
                      {sec.heading}
                    </h2>
                  )}
                  {sec.paragraphs.map((p, j) => (
                    <p key={j} className="text-[18px] leading-[1.75] mb-5">
                      {p}
                    </p>
                  ))}
                  {boxText && (
                    <figure
                      className="my-8 border-l-4 pl-5 py-1"
                      style={{ borderColor: "#3b6e8f", fontFamily: SANS }}
                    >
                      <figcaption>
                        <span className="block text-[14px] font-semibold mb-1">Box {i + 1}</span>
                        <span className="block text-[15px] leading-relaxed" style={{ color: "#3a3a3a" }}>
                          {boxText}
                        </span>
                      </figcaption>
                    </figure>
                  )}
                </section>
              );
            })}
          </div>

          {/* References */}
          <section className="mt-12 pt-6 border-t" style={{ borderColor: RULE, fontFamily: SANS }}>
            <h2 className="text-[20px] font-bold mb-4" style={{ fontFamily: SERIF }}>
              References
            </h2>
            <ol className="list-decimal pl-6 space-y-2 text-[14px] leading-relaxed" style={{ color: "#3a3a3a" }}>
              {references.map((url, i) => (
                <li key={url + i}>
                  {sections[i]?.heading || title}. {domain}.{" "}
                  <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: LINK }} className="underline">
                    Link
                  </a>
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-8 border-y" style={{ borderColor: RULE }}>
            <AuthorCard name={author} affiliation={affiliation} />
          </div>

          {/* Topics */}
          <section className="mt-10" style={{ fontFamily: SANS }}>
            <h2 className="text-[22px] font-bold mb-4" style={{ fontFamily: SERIF }}>
              Follow the topic
            </h2>
            <ul className="divide-y" style={{ borderColor: RULE }}>
              {TOPICS.map((t) => (
                <li key={t.name} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold" style={{ color: LINK }}>
                      {t.name}
                    </div>
                    <div className="text-[13px] truncate" style={{ color: MUTED }}>
                      {t.path}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-[13px] font-semibold px-4 py-1.5 rounded-full border shrink-0 cursor-pointer hover:bg-blue-50"
                    style={{ color: LINK, borderColor: LINK }}
                  >
                    Follow
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </article>

        {/* Sidebar: contents */}
        <aside className="hidden lg:block" style={{ fontFamily: SANS }}>
          <nav className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pr-1" aria-label="Contents">
            <div className="text-[15px] font-bold mb-3" style={{ fontFamily: SERIF }}>
              Contents
            </div>
            <ol className="space-y-1.5 text-[13px] leading-snug">
              {sections.map((s, i) => (
                <li key={i}>
                  <a
                    href={`#rp-sec-${i}`}
                    className="block hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                    style={{ color: LINK }}
                  >
                    {s.heading || `Section ${i + 1}`}
                  </a>
                </li>
              ))}
            </ol>
            <div className="mt-6 pt-4 border-t text-[13px] space-y-1" style={{ borderColor: RULE, color: MUTED }}>
              <div>{doc.wordCount.toLocaleString("en-US")} words</div>
              <div>{sections.length} sections</div>
            </div>
          </nav>
        </aside>
      </div>
    </div>
  );
};
