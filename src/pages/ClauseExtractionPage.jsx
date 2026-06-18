import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { 
  ChevronDown, 
  ChevronUp, 
  Search,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Shield,
  FileText
} from "lucide-react";

export default function ClauseExtractionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentAnalysis, loadAnalysis, loading, error } = useAnalysis();
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (id) loadAnalysis(id).catch(() => {});
  }, [id]);

  // Loading state
  if (loading && !currentAnalysis) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-20" role="status">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded bg-primary-100 flex items-center justify-center animate-spin">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <p className="text-[13px] text-text-secondary">Loading clause analysis...</p>
          </div>
        </div>
      </Shell>
    );
  }

  if (error && !currentAnalysis) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <AlertCircle className="w-8 h-8 text-risk-red" />
            <h3 className="text-[15px] font-semibold text-primary">Failed to Load</h3>
            <p className="text-[13px] text-text-secondary">{error}</p>
            <button onClick={() => loadAnalysis(id).catch(() => {})} className="px-4 py-2 bg-primary text-white text-[13px] rounded hover:bg-primary-light">Retry</button>
          </div>
        </div>
      </Shell>
    );
  }

  const clauses = currentAnalysis?.clauses || {};
  const standardClauses = clauses.standard_clauses || [];
  const nonStandardClauses = clauses.non_standard_clauses || [];

  // Build categories dynamically
  const categories = [
    {
      name: "Standard Clauses",
      icon: FileText,
      clauses: standardClauses.map(c => ({
        title: c.title,
        type: "Standard",
        badgeStyle: "bg-primary-100 text-text-secondary border-border",
        content: c.content,
      })),
    },
    {
      name: "Non-Standard / Flagged Clauses",
      icon: Shield,
      clauses: nonStandardClauses.map(c => ({
        title: c.title,
        type: "Non-Standard",
        badgeStyle: "bg-risk-red-light text-risk-red border-risk-red/10",
        content: c.content,
      })),
    },
  ].filter(cat => cat.clauses.length > 0);

  // Search filter
  const filteredCategories = searchTerm.trim()
    ? categories.map(cat => ({
        ...cat,
        clauses: cat.clauses.filter(c =>
          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.content.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      })).filter(cat => cat.clauses.length > 0)
    : categories;

  return (
    <Shell>
      <div className="space-y-8">
        
        {/* Header and Back Link */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/analysis/${id}`)}
            className="p-1.5 border border-border bg-white rounded text-text-secondary hover:text-primary transition-colors"
            aria-label="Back to analysis overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Clause Analysis</h1>
            <p className="text-[13px] text-text-secondary">
              Review and audit key sections extracted and classified by Lexicon AI.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search clauses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-border rounded text-[13px] placeholder-text-muted text-primary focus:outline-none focus:border-primary bg-white"
            aria-label="Search clauses"
          />
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-4 text-[12px]">
          <span className="px-3 py-1 bg-primary-100 rounded text-primary font-medium">
            {standardClauses.length} Standard
          </span>
          <span className="px-3 py-1 bg-risk-red-light rounded text-risk-red font-medium">
            {nonStandardClauses.length} Non-Standard
          </span>
          <span className="text-text-secondary">
            {standardClauses.length + nonStandardClauses.length} total clauses detected
          </span>
        </div>

        {/* Clause Extraction Accordion */}
        <div className="space-y-4">
          {filteredCategories.length > 0 ? filteredCategories.map((cat, catIdx) => {
            const Icon = cat.icon;
            const isExpanded = expandedIndex === catIdx;
            
            return (
              <div key={catIdx} className="bg-white border border-border rounded shadow-xs overflow-hidden">
                {/* Accordion Header */}
                <div 
                  onClick={() => setExpandedIndex(isExpanded ? null : catIdx)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-primary-50 transition-colors"
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-label={`${cat.name} — ${cat.clauses.length} clauses`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-[14px] text-primary">{cat.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-text-secondary">
                    <span className="text-[11px] font-medium">{cat.clauses.length} clauses detected</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border bg-primary-50/15">
                    {cat.clauses.map((clause, clIdx) => (
                      <div key={clIdx} className="p-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="font-semibold text-[13px] text-primary">{clause.title}</h4>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider border shrink-0 ${clause.badgeStyle}`}>
                            {clause.type}
                          </span>
                        </div>

                        {/* Contract text */}
                        <div className="p-4 border-l-2 border-primary bg-primary-50/30 font-serif text-[12px] leading-relaxed text-primary rounded-r">
                          <span className="font-sans font-bold text-[9px] text-text-secondary uppercase tracking-wider block mb-1">
                            Clause Content
                          </span>
                          "{clause.content}"
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="bg-white border border-border rounded p-8 text-center">
              <p className="text-[13px] text-text-secondary">
                {searchTerm ? "No clauses match your search." : "No clauses found in this analysis."}
              </p>
            </div>
          )}
        </div>

      </div>
    </Shell>
  );
}
