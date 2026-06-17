import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { mockAnalysisResult } from "@/data/mockData";
import { 
  ChevronDown, 
  ChevronUp, 
  Binary, 
  ShieldAlert, 
  Compass, 
  Lock, 
  DollarSign, 
  HelpCircle,
  ArrowLeft
} from "lucide-react";

export default function ClauseExtractionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expandedIndex, setExpandedIndex] = useState(0);

  const { data } = mockAnalysisResult;

  const categories = [
    {
      name: "Confidentiality & Disclosures",
      icon: Lock,
      clauses: [
        {
          title: "Definition of Confidential Information",
          type: "Standard",
          badgeStyle: "bg-primary-100 text-text-secondary border-border",
          excerpt: '1.1 "Confidential Information" shall mean any and all information, whether written, oral, electronic, or visual...',
          audit: "This broad definition encompasses virtually all shared information between parties, which is standard for mutual NDAs."
        },
        {
          title: "Return or Destruction of Materials",
          type: "Standard",
          badgeStyle: "bg-primary-100 text-text-secondary border-border",
          excerpt: "10.1 Upon written request or termination, the Receiving Party shall return or destroy all Confidential Information within fifteen (15) business days...",
          audit: "Standard 15 business days return window. Ensure certificates of destruction are requested promptly."
        }
      ]
    },
    {
      name: "Restrictive Covenants",
      icon: ShieldAlert,
      clauses: [
        {
          title: "Non-Solicitation of Employees",
          type: "Critical",
          badgeStyle: "bg-risk-red-light text-risk-red border-risk-red/10",
          excerpt: "6.1 For a period of two (2) years following the termination of this Agreement, the Receiving Party shall not, directly or indirectly, recruit, solicit, or hire any employee...",
          audit: "Two year scope is high but standard. Ambiguity in 'indirectly' might lead to dispute over normal agency postings."
        },
        {
          title: "Non-Compete Provision",
          type: "Key Term",
          badgeStyle: "bg-risk-blue-light text-risk-blue border-risk-blue/10",
          excerpt: "5.1 During the Term and for a period of three (3) years following termination, the Receiving Party shall not directly or indirectly engage in any business that competes...",
          audit: "3-year post-termination non-compete is extremely aggressive. Enforceability will be heavily contested in California/EU."
        }
      ]
    },
    {
      name: "Liability & Indemnification",
      icon: DollarSign,
      clauses: [
        {
          title: "Indemnification Obligations",
          type: "Critical",
          badgeStyle: "bg-risk-red-light text-risk-red border-risk-red/10",
          excerpt: "8.1 The Receiving Party shall indemnify, defend, and hold harmless the Disclosing Party from and against all losses, damages, liabilities...",
          audit: "This provision is uncapped and covers indirect/consequential damages. Standard practice is to negotiate a liability cap."
        }
      ]
    },
    {
      name: "Jurisdiction & Compliance",
      icon: Compass,
      clauses: [
        {
          title: "Governing Law and Jurisdiction",
          type: "Standard",
          badgeStyle: "bg-primary-100 text-text-secondary border-border",
          excerpt: "12.1 This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware...",
          audit: "Delaware governing law is preferred for corporate disputes. Court location in Wilmington is standard."
        }
      ]
    }
  ];

  return (
    <Shell>
      <div className="space-y-8">
        
        {/* Header and Back Link */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/analysis/${id || '1'}`)}
            className="p-1.5 border border-border bg-white rounded text-text-secondary hover:text-primary transition-colors"
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

        {/* Clause Extraction Accordion */}
        <div className="space-y-4">
          {categories.map((cat, catIdx) => {
            const Icon = cat.icon;
            const isExpanded = expandedIndex === catIdx;
            
            return (
              <div key={catIdx} className="bg-white border border-border rounded shadow-xs overflow-hidden">
                {/* Accordion Header */}
                <div 
                  onClick={() => setExpandedIndex(isExpanded ? null : catIdx)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5 text-primary" />
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
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider border ${clause.badgeStyle}`}>
                            {clause.type}
                          </span>
                        </div>

                        {/* Contract text excerpt */}
                        <div className="p-4 border-l-2 border-primary bg-primary-50/30 font-serif text-[12px] leading-relaxed text-primary rounded-r">
                          <span className="font-sans font-bold text-[9px] text-text-secondary uppercase tracking-wider block mb-1">
                            Contract Text Extract
                          </span>
                          "{clause.excerpt}"
                        </div>

                        {/* AI Audit explanation */}
                        <div className="text-[12px] text-text-secondary space-y-1">
                          <span className="text-[9px] font-bold text-risk-blue uppercase tracking-wider block">
                            AI Audit Assessment
                          </span>
                          <p className="leading-relaxed">{clause.audit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </Shell>
  );
}
