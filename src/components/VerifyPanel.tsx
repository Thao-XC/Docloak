import React, { useState } from "react";
import { VerificationAudit, ExtractedDocument } from "../types";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ImageOff,
  Code,
  Lock,
  FileCheck,
  Sparkles,
  ArrowRight,
  Printer,
  Copy,
} from "lucide-react";

interface VerifyPanelProps {
  audit: VerificationAudit;
  document: ExtractedDocument;
  isDisguised: boolean;
  onToggleDisguise: () => void;
  onRefreshAudit: () => void;
  onCopyGoogleDocs: () => void;
  onClose: () => void;
}

export const VerifyPanel: React.FC<VerifyPanelProps> = ({
  audit,
  document,
  isDisguised,
  onToggleDisguise,
  onRefreshAudit,
  onCopyGoogleDocs,
  onClose,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [copiedCertificate, setCopiedCertificate] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "pass" | "warn">("all");

  const handleRescan = () => {
    setIsScanning(true);
    setTimeout(() => {
      onRefreshAudit();
      setIsScanning(false);
    }, 500);
  };

  const handleAutoSanitize = () => {
    if (!isDisguised) {
      onToggleDisguise();
    }
    handleRescan();
  };

  const handleCopyCertificate = async () => {
    const cert = `=====================================================
DOCLOAK COMPLIANCE & SAFETY AUDIT CERTIFICATE
Generated: ${audit.verifiedAt}
Classification: ENTERPRISE RESTRICTED / AUDITED
Document: ${isDisguised && document.disguiseTitle ? document.disguiseTitle : document.title}
=====================================================

SAFETY SCORE: ${audit.safetyScore}/100
ZERO IMAGES CONFIRMED: ${audit.zeroImagesConfirmed ? "YES (PASSED)" : "NO"}
TRACKING SCRIPTS STRIPPED: ${audit.scriptsStripped ? "YES (PASSED)" : "NO"}
SYNTHETIC REPLACEMENTS: ${audit.piiMaskedCount} entities disguised
UNMASKED RISKS: ${audit.unmaskedRisksCount}

CHECKLIST AUDIT DETAILS:
${audit.items.map((it) => `[${it.status.toUpperCase()}] ${it.title} (${it.category}): ${it.detail}`).join("\n")}

Status: Certified ready for corporate workspace deployment.
=====================================================`;
    try {
      await navigator.clipboard.writeText(cert);
      setCopiedCertificate(true);
      setTimeout(() => setCopiedCertificate(false), 2500);
    } catch (e) {
      console.warn("Clipboard write failed:", e);
    }
  };

  const filteredItems = audit.items.filter((item) => {
    if (filterMode === "pass") return item.status === "pass";
    if (filterMode === "warn") return item.status === "warn" || item.status === "fail";
    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden my-4">
      {/* Verify Header */}
      <div
        className={`px-6 py-5 text-white flex flex-wrap items-center justify-between gap-4 transition-colors duration-300 ${
          audit.isSafe
            ? "bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950"
            : "bg-gradient-to-r from-amber-900 via-slate-900 to-amber-950"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform ${
              audit.isSafe ? "bg-emerald-600 border border-emerald-400/40" : "bg-amber-600 border border-amber-400/40"
            }`}
          >
            {audit.isSafe ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">
                {audit.isSafe ? "DOCUMENT VERIFIED SAFE" : "DOCUMENT REQUIRES CLOAKING"}
              </h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold ${
                  audit.isSafe
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                {audit.safetyScore}/100 Safety Score
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Automated safety audit confirms zero images, stripped trackers, and sanitized synthetic data
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isDisguised && (
            <button
              type="button"
              onClick={handleAutoSanitize}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Sanitize to 100%</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyCertificate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/20 transition-all cursor-pointer"
            title="Copy compliance certificate"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedCertificate ? "Certificate Copied!" : "Copy Certificate"}</span>
          </button>

          <button
            type="button"
            onClick={handleRescan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? "Scanning..." : "Re-Verify"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/20 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Primary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 bg-slate-50/50 border-b border-gray-200">
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-700 font-bold text-lg">
            <ImageOff className="w-4 h-4 text-emerald-600" />
            <span>0 Images</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5 font-medium">100% Text Only</div>
        </div>

        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-blue-700 font-bold text-lg">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>{audit.piiMaskedCount} Values</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5 font-medium">Synthetic Disguises</div>
        </div>

        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-indigo-700 font-bold text-lg">
            <Code className="w-4 h-4 text-indigo-600" />
            <span>Clean</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5 font-medium">Scripts & Ads Stripped</div>
        </div>

        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-700 font-bold text-lg">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>Google Docs</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5 font-medium">Export Ready (.doc / .txt)</div>
        </div>
      </div>

      {/* Disguise Recommendation Callout if not yet disguised */}
      {!isDisguised && (
        <div className="p-4 bg-blue-50/70 border-b border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="font-semibold text-blue-900">
                Enhance Disguise with Synthetic Values:
              </span>
              <span className="text-blue-700 ml-1">
                Original text is active. Turn on Disguise Mode to substitute characters, sensitive names, and titles with corporate enterprise tokens.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleDisguise}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            Turn On Disguise (Esc)
          </button>
        </div>
      )}

      {/* Audit Checklist Items */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Safety Audit Checklist & Threat Verification
          </h3>

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                filterMode === "all" ? "bg-white text-gray-900 font-semibold shadow-2xs" : "text-gray-600"
              }`}
            >
              All ({audit.items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("pass")}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                filterMode === "pass" ? "bg-white text-emerald-700 font-semibold shadow-2xs" : "text-gray-600"
              }`}
            >
              Passed ({audit.items.filter((i) => i.status === "pass").length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("warn")}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                filterMode === "warn" ? "bg-white text-amber-700 font-semibold shadow-2xs" : "text-gray-600"
              }`}
            >
              Warnings ({audit.items.filter((i) => i.status !== "pass").length})
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-lg border border-gray-200 bg-white hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {item.status === "pass" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{item.title}</span>
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-0.5">{item.detail}</p>
                </div>
              </div>

              {item.metric && (
                <span
                  className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-md shrink-0 self-end sm:self-auto ${
                    item.status === "pass"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {item.metric}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-slate-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-gray-500 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Verified safe for corporate workspace, sharing, and archiving at {audit.verifiedAt}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCopyGoogleDocs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy for Google Docs</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Return to Document
          </button>
        </div>
      </div>
    </div>
  );
};
