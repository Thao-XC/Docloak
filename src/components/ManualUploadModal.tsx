import React, { useState } from "react";
import {
  X,
  Upload,
  Download,
  Copy,
  Check,
  ExternalLink,
  Printer,
  FileText,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ExtractedDocument, FontFamily } from "../types";
import {
  copyForGoogleDocs,
  downloadGoogleDocFile,
  downloadMarkdownFile,
  printAsPdf,
} from "../utils/exportUtils";

interface ManualUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ExtractedDocument;
  fontFamily: FontFamily;
}

export const ManualUploadModal: React.FC<ManualUploadModalProps> = ({
  isOpen,
  onClose,
  document,
  fontFamily,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadedDoc, setDownloadedDoc] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const success = await copyForGoogleDocs(document, fontFamily);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadDoc = () => {
    downloadGoogleDocFile(document, fontFamily);
    setDownloadedDoc(true);
    setTimeout(() => setDownloadedDoc(false), 3000);
  };

  const handleOpenGoogleDrive = () => {
    window.open("https://drive.google.com/drive/my-drive", "_blank", "noopener,noreferrer");
  };

  const handleOpenDocsNew = () => {
    window.open("https://docs.new", "_blank", "noopener,noreferrer");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-upload-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/50 flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="manual-upload-modal-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  Export & Upload Manually to Google Drive
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" /> No Login Required
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Download formatted files and drop them into your personal Google Drive or Google Docs account.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Method 1: Google Drive Direct Upload */}
          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4" />
                Method 1: Drag & Drop into Google Drive (Recommended)
              </span>
              <span className="text-[11px] text-gray-500">Fastest for permanent saving</span>
            </div>

            <ol className="space-y-2 text-xs text-gray-700 list-decimal list-inside pl-1">
              <li>
                <strong>Download the formatted file</strong> in your preferred format:
                <div className="flex flex-wrap items-center gap-2 mt-2 mb-1 pl-4">
                  <button
                    type="button"
                    onClick={handleDownloadDoc}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    {downloadedDoc ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Downloaded .doc!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Google Doc (.doc)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={printAsPdf}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-gray-500" />
                    <span>Download Google PDF</span>
                  </button>
                </div>
              </li>
              <li className="pt-1">
                <strong>Open your Google Drive</strong>:
                <div className="mt-1.5 pl-4">
                  <button
                    type="button"
                    onClick={handleOpenGoogleDrive}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-xs font-medium border border-gray-300 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                    <span>Open Google Drive (drive.google.com)</span>
                  </button>
                </div>
              </li>
              <li className="pt-1">
                <strong>Drag & drop</strong> the downloaded file from your browser download tray into Google Drive.
                <p className="text-[11px] text-gray-500 pl-4 mt-0.5">
                  Google Drive will instantly upload it. You can double-click to open and edit it as a native Google Doc!
                </p>
              </li>
            </ol>
          </div>

          {/* Method 2: Instant Copy & Paste into docs.new */}
          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Method 2: One-Click Paste into Google Docs
              </span>
              <span className="text-[11px] text-gray-500">Instant in 5 seconds</span>
            </div>

            <ol className="space-y-2 text-xs text-gray-700 list-decimal list-inside pl-1">
              <li>
                <strong>Copy formatted content</strong> (preserves headings, fonts & bullets):
                <div className="mt-1.5 pl-4">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Copied Formatted Doc to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy for Google Docs</span>
                      </>
                    )}
                  </button>
                </div>
              </li>
              <li className="pt-1">
                <strong>Open a new blank Google Doc</strong>:
                <div className="mt-1.5 pl-4">
                  <button
                    type="button"
                    onClick={handleOpenDocsNew}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-800 rounded-md text-xs font-medium border border-gray-300 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                    <span>Open docs.new</span>
                  </button>
                </div>
              </li>
              <li className="pt-1">
                In the new Google Doc, press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[11px] font-mono font-semibold text-gray-800">Ctrl+V</kbd> (or <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[11px] font-mono font-semibold text-gray-800">Cmd+V</kbd> on Mac).
                <p className="text-[11px] text-gray-500 pl-4 mt-0.5">
                  The article will immediately appear with authentic Google Docs headings, styling, typography, and line spacing.
                </p>
              </li>
            </ol>
          </div>

          {/* Method 3: File > Open > Upload inside Google Docs */}
          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Method 3: In Google Docs: File &rarr; Open &rarr; Upload
            </span>
            <p className="text-xs text-gray-600 leading-relaxed">
              If you already have Google Docs open, click <strong>File</strong> in the top menu, select <strong>Open</strong> (Ctrl+O), switch to the <strong>Upload</strong> tab, and select your downloaded <code>.doc</code> or <code>.pdf</code> file.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Document: <strong className="text-gray-700 truncate max-w-xs inline-block align-bottom">{document.title}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
