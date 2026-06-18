import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { useAuth } from "@/contexts/AuthContext";
import { getHistory } from "@/services/api";
import { 
  Search, 
  Filter, 
  Download, 
  FileText, 
  ExternalLink,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle
} from "lucide-react";

export default function HistoryPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await getHistory(userId);
        setHistory(data);
      } catch (err) {
        setError(err.message || "Failed to load history.");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [userId]);

  const filteredHistory = history.filter(item => {
    const docType = item.metadata?.document_type || "";
    const matchesSearch = docType.toLowerCase().includes(search.toLowerCase()) ||
      (item.document_id || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || docType.toLowerCase().includes(typeFilter);
    return matchesSearch && matchesType;
  });

  // Get unique document types for filter
  const docTypes = [...new Set(history.map(h => h.metadata?.document_type || "Unknown").filter(Boolean))];

  return (
    <Shell>
      <div className="space-y-8">
        
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Analysis History</h1>
            <p className="text-[13px] text-text-secondary">
              Review history of previous legal compliance audits and analyses.
            </p>
          </div>
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-white text-[12px] font-semibold text-text-secondary hover:text-primary rounded transition-colors shadow-xs"
            aria-label="Export history as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV Ledger</span>
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white border border-border p-4 rounded shadow-sm">
          <div className="relative flex-grow w-full">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search previous analyses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-border rounded text-[13px] placeholder-text-muted text-primary focus:outline-none focus:border-primary"
              aria-label="Search analysis history"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-text-secondary border border-border rounded px-3 py-1.5 text-[13px] bg-white">
              <Filter className="w-3.5 h-3.5" aria-hidden="true" />
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent focus:outline-none border-none text-[13px] text-text-secondary font-medium cursor-pointer"
                aria-label="Filter by document type"
              >
                <option value="all">All Document Types</option>
                {docTypes.map((type, idx) => (
                  <option key={idx} value={type.toLowerCase()}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center" role="status">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                <p className="text-[13px] text-text-secondary">Loading history...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-12 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <AlertCircle className="w-6 h-6 text-risk-red" />
                <p className="text-[13px] text-text-secondary">{error}</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-primary-50 text-[11px] font-bold text-text-secondary uppercase tracking-wider border-b border-border">
                  <th className="p-4">Document Details</th>
                  <th className="p-4">Document Type</th>
                  <th className="p-4">Date Analyzed</th>
                  <th className="p-4">Risk Level</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => {
                    const docType = item.metadata?.document_type || "Legal Document";
                    const parties = item.metadata?.parties?.join(", ") || "";
                    const date = item.created_at ? new Date(item.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
                    const risks = item.risks || [];
                    const highCount = risks.filter(r => r.severity_weight === 3 || (r.severity || "").toLowerCase() === "high").length;
                    const riskLabel = highCount > 0 ? "High Risk" : risks.some(r => r.severity_weight === 2 || (r.severity || "").toLowerCase() === "medium") ? "Medium Risk" : "Low Risk";
                    const riskStyle = highCount > 0 ? "bg-risk-red-light text-risk-red border-risk-red/10" : riskLabel === "Medium Risk" ? "bg-risk-amber-light text-risk-amber border-risk-amber/10" : "bg-risk-green-light text-risk-green border-risk-green/10";

                    return (
                      <tr 
                        key={item.document_id}
                        onClick={() => navigate(`/analysis/${item.document_id}`)}
                        className="hover:bg-primary-50/70 cursor-pointer transition-colors"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && navigate(`/analysis/${item.document_id}`)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <span className="font-semibold text-primary block">{parties || docType}</span>
                              <span className="text-[11px] text-text-secondary">{item.document_id.substring(0, 8)}...</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-text-secondary font-medium uppercase text-[11px] tracking-tight">
                          {docType}
                        </td>
                        <td className="p-4 text-text-secondary font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-text-muted" />
                            <span>{date}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border ${riskStyle}`}>
                            <span>{riskLabel}</span>
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/analysis/${item.document_id}`);
                              }}
                              className="p-1.5 hover:bg-white border border-transparent hover:border-border rounded text-text-secondary hover:text-primary transition-colors"
                              aria-label="Open analysis"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-text-secondary italic">
                      {history.length === 0 ? "No analyses found. Upload a document to get started." : "No matching records found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </Shell>
  );
}
