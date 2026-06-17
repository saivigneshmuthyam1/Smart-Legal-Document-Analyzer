import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
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
  ArrowUpDown
} from "lucide-react";

export default function DocumentLibrary() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");

  const [documents, setDocuments] = useState([
    {
      id: "1",
      name: "Master Service Agreement - TechFlow Inc.",
      filename: "MSA_2023_FINAL_V2.pdf",
      date: "Oct 24, 2023, 14:32",
      riskLevel: "High Risk",
      riskStyle: "bg-risk-red-light text-risk-red border-risk-red/10",
      status: "Analyzed"
    },
    {
      id: "2",
      name: "Non-Disclosure Agreement - Creative Studio",
      filename: "NDA_Standard_Mutual.docx",
      date: "Oct 22, 2023, 09:15",
      riskLevel: "Low Risk",
      riskStyle: "bg-risk-green-light text-risk-green border-risk-green/10",
      status: "Analyzed"
    },
    {
      id: "3",
      name: "Employment Contract Template - EU",
      filename: "EMP_Template_Berlin.pdf",
      date: "Oct 18, 2023, 16:45",
      riskLevel: "Medium Risk",
      riskStyle: "bg-risk-amber-light text-risk-amber border-risk-amber/10",
      status: "Analyzed"
    },
    {
      id: "4",
      name: "Data Processing Addendum (DPA) - CloudProvider",
      filename: "DPA_Global_Ops.pdf",
      date: "Oct 15, 2023, 11:20",
      riskLevel: "High Risk",
      riskStyle: "bg-risk-red-light text-risk-red border-risk-red/10",
      status: "Analyzed"
    },
    {
      id: "5",
      name: "Software Licensing Agreement - OpenDev",
      filename: "LICENSE_Commercial_A.pdf",
      date: "Oct 12, 2023, 10:05",
      riskLevel: "Low Risk",
      riskStyle: "bg-risk-green-light text-risk-green border-risk-green/10",
      status: "Analyzed"
    }
  ]);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRisk === "all" || 
                          doc.riskLevel.toLowerCase().replace(" risk", "") === filterRisk;
    return matchesSearch && matchesFilter;
  });

  return (
    <Shell>
      <div className="space-y-8">
        {/* Title and Intro */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Document Library</h1>
          <p className="text-[13px] text-text-secondary">
            Access and manage all analyzed legal documents. Monitor risk levels across your organization's portfolio with high-precision AI scanning.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white border border-border p-4 rounded shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-border rounded text-[13px] placeholder-text-muted text-primary focus:outline-none focus:border-primary"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-text-secondary border border-border rounded px-3 py-1.5 text-[13px] bg-white">
              <Filter className="w-3.5 h-3.5" />
              <select 
                value={filterRisk} 
                onChange={(e) => setFilterRisk(e.target.value)}
                className="bg-transparent focus:outline-none border-none text-[13px] text-text-secondary font-medium cursor-pointer"
              >
                <option value="all">All Risks</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>
            </div>
            
            <button className="flex items-center justify-center p-2 border border-border rounded bg-white text-text-secondary hover:text-primary transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Library Table Container */}
        <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-primary-50 text-[11px] font-bold text-text-secondary uppercase tracking-wider border-b border-border">
                  <th className="p-4 flex items-center gap-1">
                    <span>Document Name</span>
                    <ArrowUpDown className="w-3 h-3 cursor-pointer" />
                  </th>
                  <th className="p-4">Date Analyzed</th>
                  <th className="p-4">Risk Level</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc) => (
                    <tr 
                      key={doc.id}
                      onClick={() => navigate(`/analysis/${doc.id}`)}
                      className="hover:bg-primary-50/70 cursor-pointer transition-colors"
                    >
                      {/* Name Column */}
                      <td className="p-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <div className="truncate">
                            <h4 className="font-semibold text-primary truncate leading-normal">{doc.name}</h4>
                            <span className="text-[11px] text-text-secondary leading-normal">{doc.filename}</span>
                          </div>
                        </div>
                      </td>

                      {/* Date Column */}
                      <td className="p-4 text-text-secondary font-medium uppercase text-[11px] tracking-tight">
                        {doc.date}
                      </td>

                      {/* Risk Level Badge */}
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border ${doc.riskStyle}`}>
                          {doc.riskLevel}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-text-secondary font-medium">
                        {doc.status}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/analysis/${doc.id}`);
                            }}
                            className="p-1.5 hover:bg-white border border-transparent hover:border-border rounded text-text-secondary hover:text-primary transition-colors"
                            title="View Document"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 hover:bg-white border border-transparent hover:border-border rounded text-text-secondary hover:text-primary transition-colors"
                            title="Download Report"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(doc.id, e)}
                            className="p-1.5 hover:bg-white border border-transparent hover:border-border rounded text-text-secondary hover:text-risk-red transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-text-secondary italic">
                      No documents found matching search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="p-4 border-t border-border flex items-center justify-between text-[12px] text-text-secondary bg-white">
            <span>Showing 1 to {filteredDocs.length} of {documents.length} documents</span>
            <div className="flex items-center gap-1">
              <button className="p-1 border border-border rounded hover:bg-primary-50 transition-colors disabled:opacity-50" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="px-3 py-1 bg-primary text-white border border-primary rounded text-[11px] font-semibold">1</button>
              <button className="px-3 py-1 border border-border rounded hover:bg-primary-50 transition-colors">2</button>
              <button className="px-3 py-1 border border-border rounded hover:bg-primary-50 transition-colors">3</button>
              <button className="p-1 border border-border rounded hover:bg-primary-50 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Exposure Stats Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="bg-white border border-border rounded p-5 shadow-sm">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Total Exposure</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-primary">$1.2M</span>
              <span className="text-[11px] text-risk-red font-medium">+12% vs last month</span>
            </div>
          </div>
          <div className="bg-white border border-border rounded p-5 shadow-sm">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">High Risk Clauses</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-primary">42</span>
              <span className="text-[11px] text-text-secondary">Across 18 documents</span>
            </div>
          </div>
          <div className="bg-primary text-white rounded p-5 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Efficiency Rating</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold">94%</span>
              <span className="text-[11px] text-text-muted">Avg compliance match</span>
            </div>
          </div>
        </div>

      </div>
    </Shell>
  );
}
