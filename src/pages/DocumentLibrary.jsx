import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { useAuth } from "@/contexts/AuthContext";
import { getHistory, deleteAnalysis } from "@/services/api";
import { 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  Download, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  RefreshCw,
  AlertCircle
} from "lucide-react";

export default function DocumentLibrary() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDocuments = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getHistory(userId);
      setDocuments(data);
    } catch (err) {
      setError(err.message || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const handleDelete = async (documentId, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this analysis?")) return;
    
    try {
      await deleteAnalysis(documentId);
      setDocuments(prev => prev.filter(doc => doc.document_id !== documentId));
    } catch (err) {
      alert("Failed to delete: " + (err.message || "Unknown error"));
    }
  };

  // Risk level helper
  const getRiskInfo = (doc) => {
    const risks = doc.risks || [];
    const highCount = risks.filter(r => r.severity_weight === 3 || (r.severity || "").toLowerCase() === "high").length;
    if (highCount > 0) return { label: "High Risk", level: "high", style: "bg-risk-red-light text-risk-red border-risk-red/10" };
    const medCount = risks.filter(r => r.severity_weight === 2 || (r.severity || "").toLowerCase() === "medium").length;
    if (medCount > 0) return { label: "Medium Risk", level: "medium", style: "bg-risk-amber-light text-risk-amber border-risk-amber/10" };
    return { label: "Low Risk", level: "low", style: "bg-risk-green-light text-risk-green border-risk-green/10" };
  };

  const filteredDocs = documents.filter(doc => {
    const docType = doc.metadata?.document_type || "";
    const parties = doc.metadata?.parties?.join(", ") || "";
    const matchesSearch = docType.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          parties.toLowerCase().includes(searchTerm.toLowerCase());
    const risk = getRiskInfo(doc);
    const matchesFilter = filterRisk === "all" || risk.level === filterRisk;
    return matchesSearch && matchesFilter;
  });

  // Compute stats
  const totalRisks = documents.reduce((sum, d) => sum + (d.risks?.length || 0), 0);
  const highRiskClauses = documents.reduce((sum, d) => {
    return sum + (d.risks || []).filter(r => r.severity_weight === 3 || (r.severity || "").toLowerCase() === "high").length;
  }, 0);

  return (
    <Shell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Document Library</h1>
          <p className="text-[13px] text-text-secondary">
            Access and manage all analyzed legal documents.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white border border-border p-4 rounded shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by document type or parties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-border rounded text-[13px] placeholder-text-muted text-primary focus:outline-none focus:border-primary"
              aria-label="Search documents"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-text-secondary border border-border rounded px-3 py-1.5 text-[13px] bg-white">
              <Filter className="w-3.5 h-3.5" aria-hidden="true" />
              <select 
                value={filterRisk} 
                onChange={(e) => setFilterRisk(e.target.value)}
                className="bg-transparent focus:outline-none border-none text-[13px] text-text-secondary font-medium cursor-pointer"
                aria-label="Filter by risk level"
              >
                <option value="all">All Risks</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Library Table */}
        <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center" role="status">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                <p className="text-[13px] text-text-secondary">Loading documents...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-12 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <AlertCircle className="w-6 h-6 text-risk-red" />
                <p className="text-[13px] text-text-secondary">{error}</p>
                <button onClick={fetchDocuments} className="px-4 py-1.5 bg-primary text-white text-[12px] rounded">Retry</button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="bg-primary-50 text-[11px] font-bold text-text-secondary uppercase tracking-wider border-b border-border">
                    <th className="p-4">Document Name</th>
                    <th className="p-4">Date Analyzed</th>
                    <th className="p-4">Risk Level</th>
                    <th className="p-4">Clauses</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDocs.length > 0 ? (
                    filteredDocs.map((doc) => {
                      const risk = getRiskInfo(doc);
                      const docType = doc.metadata?.document_type || "Legal Document";
                      const parties = doc.metadata?.parties?.join(" & ") || "";
                      const date = doc.created_at ? new Date(doc.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
                      const clauseCount = (doc.clauses?.standard_clauses?.length || 0) + (doc.clauses?.non_standard_clauses?.length || 0);

                      return (
                        <tr 
                          key={doc.document_id}
                          onClick={() => navigate(`/analysis/${doc.document_id}`)}
                          className="hover:bg-primary-50/70 cursor-pointer transition-colors"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === "Enter" && navigate(`/analysis/${doc.document_id}`)}
                        >
                          <td className="p-4 max-w-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4 text-primary" />
                              </div>
                              <div className="truncate">
                                <h4 className="font-semibold text-primary truncate leading-normal">{parties || docType}</h4>
                                <span className="text-[11px] text-text-secondary leading-normal">{docType}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-text-secondary font-medium text-[11px]">{date}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border ${risk.style}`}>
                              {risk.label}
                            </span>
                          </td>
                          <td className="p-4 text-text-secondary font-medium">{clauseCount}</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={(e) => { e.stopPropagation(); navigate(`/analysis/${doc.document_id}`); }}
                                className="p-1.5 hover:bg-white border border-transparent hover:border-border rounded text-text-secondary hover:text-primary transition-colors"
                                aria-label="View document analysis"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => handleDelete(doc.document_id, e)}
                                className="p-1.5 hover:bg-white border border-transparent hover:border-border rounded text-text-secondary hover:text-risk-red transition-colors"
                                aria-label="Delete analysis"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-text-secondary italic">
                        {documents.length === 0 ? "No documents in library. Upload your first document." : "No documents match your search."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          {!loading && !error && (
            <div className="p-4 border-t border-border flex items-center justify-between text-[12px] text-text-secondary bg-white">
              <span>Showing {filteredDocs.length} of {documents.length} documents</span>
            </div>
          )}
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="bg-white border border-border rounded p-5 shadow-sm">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Total Documents</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-primary">{documents.length}</span>
              <span className="text-[11px] text-text-secondary">analyzed</span>
            </div>
          </div>
          <div className="bg-white border border-border rounded p-5 shadow-sm">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">High Risk Items</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-risk-red">{highRiskClauses}</span>
              <span className="text-[11px] text-text-secondary">across all documents</span>
            </div>
          </div>
          <div className="bg-primary text-white rounded p-5 shadow-sm">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Total Risks Found</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold">{totalRisks}</span>
              <span className="text-[11px] text-text-muted">identified risks</span>
            </div>
          </div>
        </div>

      </div>
    </Shell>
  );
}
