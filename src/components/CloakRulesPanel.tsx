import React, { useState, useMemo, useRef } from "react";
import { CloakRule, CloakCategory, ExtractedDocument } from "../types";
import { DEFAULT_CLOAK_RULES } from "../utils/disguiseEngine";
import {
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Sliders,
  RotateCcw,
  BookOpen,
  Lock,
  DollarSign,
  Mail,
  User,
  Building,
  Search,
  Download,
  Upload,
  Check,
  X,
} from "lucide-react";

interface CloakRulesPanelProps {
  rules: CloakRule[];
  onUpdateRules: (newRules: CloakRule[]) => void;
  document: ExtractedDocument;
  onClose: () => void;
}

export const CloakRulesPanel: React.FC<CloakRulesPanelProps> = ({
  rules,
  onUpdateRules,
  document,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newSynthetic, setNewSynthetic] = useState("");
  const [newCategory, setNewCategory] = useState<CloakCategory>("Name");
  const [newDesc, setNewDesc] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-calculate document text once for fast match counting
  const fullDocumentText = useMemo(() => {
    let text = `${document.title} ${document.subtitle || ""} ${document.executiveSummary || ""}`;
    document.sections.forEach((s) => {
      text += ` ${s.heading} ${s.paragraphs.join(" ")}`;
      if (s.bulletPoints) text += ` ${s.bulletPoints.join(" ")}`;
      if (s.callout) text += ` ${s.callout}`;
    });
    return text;
  }, [document]);

  const getMatchCount = (term?: string): number => {
    if (!term || !term.trim()) return 0;
    try {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "gi");
      const matches = fullDocumentText.match(regex);
      return matches ? matches.length : 0;
    } catch {
      return 0;
    }
  };

  const toggleRule = (ruleId: string) => {
    onUpdateRules(
      rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const deleteRule = (ruleId: string) => {
    onUpdateRules(rules.filter((r) => r.id !== ruleId));
  };

  const handleEnableAll = () => {
    onUpdateRules(rules.map((r) => ({ ...r, enabled: true })));
  };

  const handleDisableAll = () => {
    onUpdateRules(rules.map((r) => ({ ...r, enabled: false })));
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset all cloak rules to standard default enterprise rules?")) {
      onUpdateRules(DEFAULT_CLOAK_RULES);
    }
  };

  const handleExportRules = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rules, null, 2));
    const downloadAnchor = window.document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `docleak-rules-${new Date().toISOString().slice(0, 10)}.json`);
    window.document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onUpdateRules(parsed);
          setImportStatus(`Successfully imported ${parsed.length} rules.`);
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          throw new Error("Invalid rules format");
        }
      } catch (err) {
        setImportStatus("Failed to parse JSON file.");
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTarget.trim() || !newSynthetic.trim()) return;

    const newRule: CloakRule = {
      id: `rule-custom-${Date.now()}`,
      name: newTarget.trim(),
      category: newCategory,
      enabled: true,
      description: newDesc.trim() || `Replaces sensitive term with synthetic value.`,
      targetTerm: newTarget.trim(),
      syntheticValue: newSynthetic.trim(),
      isCustom: true,
    };

    onUpdateRules([newRule, ...rules]);
    setNewTarget("");
    setNewSynthetic("");
    setNewDesc("");
    setShowAddForm(false);
  };

  const categories: Array<{ id: string; label: string; icon: React.ReactNode }> = [
    { id: "all", label: "All Rules", icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: "Name", label: "Personal Names", icon: <User className="w-3.5 h-3.5 text-blue-600" /> },
    { id: "Organization", label: "Organizations & Units", icon: <Building className="w-3.5 h-3.5 text-purple-600" /> },
    { id: "Novel/Fiction", label: "Entities & Ranks", icon: <BookOpen className="w-3.5 h-3.5 text-emerald-600" /> },
    { id: "Financial", label: "Financials & Figures", icon: <DollarSign className="w-3.5 h-3.5 text-amber-600" /> },
    { id: "Contact", label: "Contact & PII", icon: <Mail className="w-3.5 h-3.5 text-rose-600" /> },
    { id: "Custom", label: "Custom Rules", icon: <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> },
  ];

  const filteredRules = rules.filter((r) => {
    const matchesCat =
      activeCategory === "all"
        ? true
        : activeCategory === "Custom"
        ? r.isCustom
        : r.category === activeCategory;

    if (!matchesCat) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        (r.targetTerm && r.targetTerm.toLowerCase().includes(q)) ||
        r.syntheticValue.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = rules.filter((r) => r.enabled).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden my-4">
      {/* Panel Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <span>Cloak Rules</span>
              <span className="text-xs font-mono font-normal bg-slate-800 text-emerald-400 border border-slate-700 px-2 py-0.5 rounded-full">
                {activeCount} of {rules.length} active
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Define protection rules to replace sensitive entities with realistic synthetic values
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Rule</span>
          </button>

          <button
            type="button"
            onClick={handleExportRules}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Export rules as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-800 font-medium flex items-center justify-between">
          <span>{importStatus}</span>
          <button type="button" onClick={() => setImportStatus(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Add Rule Drawer Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddRule}
          className="bg-slate-50 border-b border-gray-200 p-4 sm:p-6 text-xs transition-all"
        >
          <div className="max-w-4xl mx-auto">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Define New Protection Rule</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Sensitive Term / Target Pattern
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Secret Project Alpha, Jane Smith"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Synthetic Disguise Value
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Core Infrastructure Review, J. Vance (Lead)"
                  value={newSynthetic}
                  onChange={(e) => setNewSynthetic(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Rule Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as CloakCategory)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Name">Personal Name</option>
                  <option value="Organization">Organization / Location</option>
                  <option value="Novel/Fiction">Narrative / Entity Term</option>
                  <option value="Financial">Financial / Number</option>
                  <option value="Contact">Contact & PII</option>
                  <option value="Custom">Custom Rule</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <input
                type="text"
                placeholder="Optional description or rationale for this rule..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full sm:max-w-md bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Save Protection Rule
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === cat.id
                  ? "bg-white text-gray-900 shadow-xs border border-gray-200 font-semibold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Search input & Bulk Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg pl-8 pr-3 py-1 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-48"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
            <button
              type="button"
              onClick={handleEnableAll}
              className="px-2 py-1 bg-white hover:bg-gray-100 text-emerald-700 border border-gray-200 rounded font-medium transition-colors"
              title="Enable all rules"
            >
              All ON
            </button>
            <button
              type="button"
              onClick={handleDisableAll}
              className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 rounded font-medium transition-colors"
              title="Disable all rules"
            >
              All OFF
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
              title="Reset to default rules"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {filteredRules.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs">
            No rules matching the current filter.
          </div>
        ) : (
          filteredRules.map((rule) => {
            const matchesInDoc = getMatchCount(rule.targetTerm);

            return (
              <div
                key={rule.id}
                className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-colors ${
                  rule.enabled ? "bg-white hover:bg-slate-50/70" : "bg-gray-50/70 opacity-60"
                }`}
              >
                {/* Left: Checkbox + Rule Info */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => toggleRule(rule.id)}
                    className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{rule.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          rule.category === "Name"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : rule.category === "Organization"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : rule.category === "Novel/Fiction"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : rule.category === "Financial"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {rule.category}
                      </span>
                      {rule.isCustom && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-mono">
                          custom
                        </span>
                      )}
                      {matchesInDoc > 0 && (
                        <span className="text-[10px] px-2 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-semibold">
                          {matchesInDoc} in document
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-[11px] mt-0.5">{rule.description}</p>
                  </div>
                </div>

                {/* Middle: Target ➔ Synthetic Mapping */}
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-[11px] shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
                  <span className="text-rose-700 font-medium truncate max-w-[140px]" title={rule.targetTerm}>
                    {rule.targetTerm || "*all*"}
                  </span>
                  <span className="text-slate-400 font-sans">➔</span>
                  <span className="text-emerald-700 font-semibold truncate max-w-[160px]" title={rule.syntheticValue}>
                    {rule.syntheticValue}
                  </span>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => toggleRule(rule.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      rule.enabled
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    {rule.enabled ? "Active" : "Disabled"}
                  </button>

                  {rule.isCustom && (
                    <button
                      type="button"
                      onClick={() => deleteRule(rule.id)}
                      className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Delete custom rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      <div className="p-3 bg-slate-50 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
        <span>
          Active rules automatically disguise text in <strong>Cloak Preview</strong> and exports (.doc, .txt, Google Docs).
        </span>
        <button
          type="button"
          onClick={onClose}
          className="font-medium text-emerald-700 hover:underline cursor-pointer"
        >
          Return to Preview
        </button>
      </div>
    </div>
  );
};
