import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { mockAnalysisResult, contractText } from "@/data/mockData";
import { 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ShieldAlert,
  MessageSquare,
  RefreshCw,
  FileText,
  Bookmark,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  ArrowRight
} from "lucide-react";

export default function DocumentAnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(100);
  const [activeHighlight, setActiveHighlight] = useState(null);

  const { data } = mockAnalysisResult;

  const handleHighlightClick = (clauseTitle) => {
    setActiveHighlight(clauseTitle === activeHighlight ? null : clauseTitle);
  };

  return (
    <Shell>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Left Side: Mock PDF Viewer (3/5 columns) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* PDF Viewer Bar */}
          <div className="bg-white border border-border rounded p-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-text-secondary" />
              <span className="text-[12px] font-semibold text-primary uppercase tracking-tight">
                MSA_PROJECT_ALPHA_V2.PDF
              </span>
            </div>
            
            {/* Zoom / Page / Download Controls */}
            <div className="flex items-center gap-4 text-text-secondary">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setZoom(prev => Math.max(75, prev - 10))}
                  className="p-1 hover:bg-primary-50 rounded transition-colors"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-semibold w-10 text-center">{zoom}%</span>
                <button 
                  onClick={() => setZoom(prev => Math.min(150, prev + 10))}
                  className="p-1 hover:bg-primary-50 rounded transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="h-4 w-px bg-border"></div>
              <button className="p-1 hover:bg-primary-50 rounded transition-colors" title="Search Document">
                <Search className="w-3.5 h-3.5" />
              </button>
              <button className="p-1 hover:bg-primary-50 rounded transition-colors" title="Download Original PDF">
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* PDF Visual Page sheet */}
          <div 
            className="bg-white border border-border rounded shadow-md p-10 min-h-[700px] relative font-serif select-text selection:bg-risk-blue/20"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center", transition: "transform 0.15s ease-out" }}
          >
            {/* Page Header watermark */}
            <div className="flex justify-between items-center text-[10px] text-text-muted font-sans border-b border-border/40 pb-3 mb-6 font-semibold uppercase tracking-wider">
              <span>Juris Precision System Workspace</span>
              <span>Draft Revision V2.4</span>
            </div>

            {/* Document Text */}
            <div className="space-y-4 text-[13px] leading-[1.8] text-primary whitespace-pre-line text-justify">
              <h2 className="text-center font-bold font-sans text-[15px] uppercase mb-4 tracking-tight">
                MUTUAL NON-DISCLOSURE AND RESTRICTIVE COVENANT AGREEMENT
              </h2>
              
              <p>
                This Mutual Non-Disclosure and Restrictive Covenant Agreement ("Agreement") is entered into as of the 1st day of January, 2026 ("Effective Date"),
              </p>
              
              <p className="font-semibold font-sans text-[11px] uppercase tracking-wider text-text-secondary mt-6">
                ARTICLE 1 — DEFINITION OF CONFIDENTIAL INFORMATION
              </p>
              <p>
                1.1 "Confidential Information" shall mean any and all information, whether written, oral, electronic, or visual, disclosed by one Party to the other, including but not limited to: Technical data, source code, object code, algorithms, software architectures, business strategies, and trade secrets.
              </p>

              {/* Highlight Target for Clause 5 (Non-Compete) */}
              <p className="font-semibold font-sans text-[11px] uppercase tracking-wider text-text-secondary mt-6">
                ARTICLE 5 — NON-COMPETE PROVISION
              </p>
              <div 
                onClick={() => handleHighlightClick("Overbroad Non-Compete")}
                className={`relative px-2 py-0.5 rounded cursor-pointer transition-all ${
                  activeHighlight === "Overbroad Non-Compete" 
                    ? "bg-risk-amber-light border-l-4 border-risk-amber text-primary" 
                    : "bg-risk-amber-light/35 border-l-2 border-risk-amber/20 hover:bg-risk-amber-light"
                }`}
              >
                <span className="font-sans font-bold text-[9px] text-risk-amber absolute -left-16 top-1 px-1.5 py-0.5 rounded bg-white border border-risk-amber/30 uppercase tracking-wider">
                  Clause 5.1
                </span>
                <p className="italic">
                  5.1 During the Term and for a period of three (3) years following termination, the Receiving Party shall not directly or indirectly engage in any business that competes with the Disclosing Party's core business lines. The geographic scope covers the entire United States and European Union markets.
                </p>
              </div>

              {/* Highlight Target for Clause 8 (Liability & Indemnification) */}
              <p className="font-semibold font-sans text-[11px] uppercase tracking-wider text-text-secondary mt-6">
                ARTICLE 8 — INDEMNIFICATION & LIABILITY
              </p>
              <div 
                onClick={() => handleHighlightClick("Uncapped Liability")}
                className={`relative px-2 py-0.5 rounded cursor-pointer transition-all ${
                  activeHighlight === "Uncapped Liability" 
                    ? "bg-risk-red-light border-l-4 border-risk-red text-primary" 
                    : "bg-risk-red-light/35 border-l-2 border-risk-red/20 hover:bg-risk-red-light"
                }`}
              >
                <span className="font-sans font-bold text-[9px] text-risk-red absolute -left-16 top-1 px-1.5 py-0.5 rounded bg-white border border-risk-red/30 uppercase tracking-wider">
                  Clause 8.1
                </span>
                <p className="italic">
                  8.1 The Receiving Party shall indemnify, defend, and hold harmless the Disclosing Party from and against all losses, damages, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from any breach of this Agreement. This indemnification is uncapped and includes consequential damages.
                </p>
              </div>

              <p className="font-semibold font-sans text-[11px] uppercase tracking-wider text-text-secondary mt-6">
                ARTICLE 12 — GOVERNING LAW
              </p>
              <p>
                12.1 This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware. Any disputes shall be subject to the exclusive jurisdiction of the courts in Wilmington, Delaware.
              </p>
            </div>

            {/* Page Footer */}
            <div className="absolute bottom-6 left-10 right-10 flex justify-between items-center text-[10px] text-text-muted font-sans border-t border-border/40 pt-3">
              <span>Page 1 of 24</span>
              <span>Confidential Corporate Draft</span>
            </div>
          </div>

        </div>

        {/* Right Side: AI Analysis Panel (2/5 columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Analysis Title */}
          <div className="bg-white border border-border rounded p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-[15px] text-primary">AI Analysis</h3>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-risk-blue font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-risk-blue animate-pulse"></span>
                <span>Live Sync</span>
              </span>
            </div>

            {/* Executive Summary */}
            <div className="bg-primary-50 p-4 border border-border rounded space-y-2">
              <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Executive Summary</h4>
              <p className="text-[12px] text-primary leading-relaxed">
                Project Alpha exhibits a <span className="font-semibold text-risk-amber">Moderate Risk</span> profile. The document contains standard indemnification clauses, but lacks clarity on <span className="font-semibold text-risk-blue">Force Majeure</span> liabilities in Section 14. AI detected 3 missing definitions critical for compliance with the recent Euro-Zone data directives.
              </p>
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 border border-border rounded text-center">
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Confidence</span>
                <span className="text-md font-bold text-primary block mt-1">98%</span>
              </div>
              <div className="p-3 border border-border rounded text-center bg-risk-amber-light/30 border-risk-amber/15">
                <span className="text-[9px] font-bold text-risk-amber uppercase tracking-wider block">Risk Score</span>
                <span className="text-md font-bold text-risk-amber block mt-1">4.2<span className="text-[10px] text-text-secondary font-medium">/10</span></span>
              </div>
              <div className="p-3 border border-border rounded text-center">
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Anomalies</span>
                <span className="text-md font-bold text-primary block mt-1">07</span>
              </div>
            </div>
          </div>

          {/* Risk Detection Cards */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Risk Detection</h4>
            
            {/* Risk Card 1 */}
            <div 
              onClick={() => setActiveHighlight("Uncapped Liability")}
              className={`p-4 border rounded shadow-xs cursor-pointer transition-all duration-300 ${
                activeHighlight === "Uncapped Liability"
                  ? "bg-risk-red-light border-risk-red shadow-sm"
                  : "bg-white border-border hover:border-risk-red/40"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-semibold text-[13px] text-primary">Unlimited Liability Loophole</h5>
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-risk-red-light text-risk-red rounded border border-risk-red/10 uppercase tracking-wider">
                  Critical
                </span>
              </div>
              <p className="text-[12px] text-text-secondary leading-relaxed">
                Section 8.2 states liabilities are capped at contract value, but 8.4 creates an exception for IP claims without a secondary ceiling.
              </p>
              <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] font-medium text-text-secondary">
                <span className="hover:text-primary transition-colors">View in Doc</span>
                <span className="hover:text-primary transition-colors">Suggest Redraft</span>
              </div>
            </div>

            {/* Risk Card 2 */}
            <div 
              onClick={() => setActiveHighlight("Overbroad Non-Compete")}
              className={`p-4 border rounded shadow-xs cursor-pointer transition-all duration-300 ${
                activeHighlight === "Overbroad Non-Compete"
                  ? "bg-risk-amber-light border-risk-amber shadow-sm"
                  : "bg-white border-border hover:border-risk-amber/40"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-semibold text-[13px] text-primary">Overbroad Non-Compete Scope</h5>
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-risk-amber-light text-risk-amber rounded border border-risk-amber/10 uppercase tracking-wider">
                  Medium
                </span>
              </div>
              <p className="text-[12px] text-text-secondary leading-relaxed">
                Restrictive covenant spans 3 years across all US and EU markets. A period over 1-2 years is highly likely to be ruled unreasonable in California courts.
              </p>
              <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] font-medium text-text-secondary">
                <span className="hover:text-primary transition-colors">View in Doc</span>
                <span className="hover:text-primary transition-colors">Suggest Redraft</span>
              </div>
            </div>
          </div>

          {/* Action Navigation Row */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(`/clauses/${id || '1'}`)}
              className="flex-1 py-2 bg-primary text-white text-[12px] font-semibold rounded hover:bg-primary-light transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Explore Extracted Clauses</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => navigate(`/chat/${id || '1'}`)}
              className="px-4 py-2 border border-border rounded bg-white text-text-secondary hover:text-primary transition-colors"
              title="Open Chat Assistant"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </Shell>
  );
}
