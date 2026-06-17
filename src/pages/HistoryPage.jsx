import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { analysisHistory } from "@/data/mockData";
import { 
  Search, 
  Filter, 
  Download, 
  FileText, 
  ArrowUpDown, 
  ExternalLink,
  Calendar,
  CheckCircle2,
  FileSpreadsheet
} from "lucide-react";

export default function HistoryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredHistory = analysisHistory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || item.type.toLowerCase() === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <Shell>
      <div className="space-y-8">
        
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Analysis History</h1>
            <p className="text-[13px] text-text-secondary">
              Review history of previous legal compliance audits, drafts, and report exports.
            </p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-white text-[12px] font-semibold text-text-secondary hover:text-primary rounded transition-colors shadow-xs">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV Ledger</span>
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white border border-border p-4 rounded shadow-sm">
          <div className="relative flex-grow w-full">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search previous files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-border rounded text-[13px] placeholder-text-muted text-primary focus:outline-none focus:border-primary"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-text-secondary border border-border rounded px-3 py-1.5 text-[13px] bg-white">
              <Filter className="w-3.5 h-3.5" />
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent focus:outline-none border-none text-[13px] text-text-secondary font-medium cursor-pointer"
              >
                <option value="all">All Document Types</option>
                <option value="nda">NDA Agreements</option>
                <option value="vendor">Vendor Agreements</option>
                <option value="service">Service Contracts</option>
                <option value="employment">Employment Contracts</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit History table */}
        <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-primary-50 text-[11px] font-bold text-text-secondary uppercase tracking-wider border-b border-border">
                <th className="p-4">Document Details</th>
                <th className="p-4">Contract Class</th>
                <th className="p-4">Completed Date</th>
                <th className="p-4">Compliance Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => (
                  <tr 
                    key={item.id}
                    onClick={() => navigate("/analysis/1")}
                    className="hover:bg-primary-50/70 cursor-pointer transition-colors"
                  >
                    {/* Doc Title */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-semibold text-primary">{item.name}</span>
                      </div>
                    </td>

                    {/* Class Type */}
                    <td className="p-4 text-text-secondary font-medium uppercase text-[11px] tracking-tight">
                      {item.type} Agreement
                    </td>

                    {/* Completion Date */}
                    <td className="p-4 text-text-secondary font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-text-muted" />
                        <span>{item.date}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border bg-risk-green-light text-risk-green border-risk-green/10">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Audit Completed</span>
                      </span>
                    </td>

                    {/* Action */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/analysis/1");
                          }}
                          className="p-1.5 hover:bg-white border border-transparent hover:border-border rounded text-text-secondary hover:text-primary transition-colors"
                          title="Open Analysis"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 hover:bg-white border border-transparent hover:border-border rounded text-text-secondary hover:text-primary transition-colors"
                          title="Download PDF Ledger"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-text-secondary italic">
                    No matching audit ledger records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </Shell>
  );
}
