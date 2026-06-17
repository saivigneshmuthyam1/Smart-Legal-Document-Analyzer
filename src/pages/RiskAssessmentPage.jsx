import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { 
  ArrowLeft, 
  ShieldAlert, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle,
  HelpCircle,
  FileText,
  AlertCircle,
  Lightbulb
} from "lucide-react";

export default function RiskAssessmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const riskDistribution = [
    { label: "Critical Risks", count: 2, color: "bg-risk-red", percentage: 28 },
    { label: "Medium Risks", count: 3, color: "bg-risk-amber", percentage: 43 },
    { label: "Low Risks", count: 2, color: "bg-risk-green", percentage: 29 }
  ];

  const riskCategories = [
    { name: "Liability & Indemnification", score: 8.5, color: "bg-risk-red", width: "85%" },
    { name: "Restrictive Covenants", score: 7.2, color: "bg-risk-red", width: "72%" },
    { name: "Operational Controls", score: 4.5, color: "bg-risk-amber", width: "45%" },
    { name: "Jurisdiction & Governing Law", score: 2.1, color: "bg-risk-green", width: "21%" }
  ];

  const findings = [
    {
      title: "Uncapped Indemnification Obligations",
      impact: "Critical Exposure",
      badgeStyle: "bg-risk-red-light text-risk-red border-risk-red/10",
      description: "Section 8.1 requires the Receiving Party to defend and hold harmless the Disclosing Party against all liabilities, with no cap on exposure. Consequential damages are explicitly included.",
      recommendation: "Negotiate a liability cap equal to 1-2x the contract value or total fees paid in the previous 12 months. Explicitly exclude indirect and consequential damages."
    },
    {
      title: "Overbroad Non-Compete Restriction",
      impact: "High Exposure",
      badgeStyle: "bg-risk-red-light text-risk-red border-risk-red/10",
      description: "Section 5.1 restricts TechVenture from competing in core business markets for 3 years post-termination. This restriction extends to both the United States and the European Union.",
      recommendation: "Negotiate a shorter restriction period (typically 12 months) and narrow the geographic scope to the specific state of operation. Confirm California law compliance."
    },
    {
      title: "Asymmetric Injunctive Relief Right",
      impact: "Medium Exposure",
      badgeStyle: "bg-risk-amber-light text-risk-amber border-risk-amber/10",
      description: "Section 9.1 grants the Disclosing Party the right to seek injunctive relief without proving actual damages or posting a bond, while denying the same right to the Receiving Party.",
      recommendation: "Modify the provision to make the right to seek injunctive relief mutual. Specify that both parties retain the right to seek equitable remedies."
    }
  ];

  return (
    <Shell>
      <div className="space-y-8">
        
        {/* Header & Back Action */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/analysis/${id || '1'}`)}
            className="p-1.5 border border-border bg-white rounded text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Risk Assessment</h1>
            <p className="text-[13px] text-text-secondary">
              Comprehensive exposure scorecard, risk category heatmaps, and mitigation advice.
            </p>
          </div>
        </div>

        {/* Top Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-border rounded p-5 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Overall Risk Index</span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-risk-amber">4.2</span>
              <span className="text-md font-semibold text-text-secondary">/ 10</span>
              <span className="ml-3 px-2 py-0.5 text-[10px] font-bold bg-risk-amber-light text-risk-amber rounded border border-risk-amber/10 uppercase tracking-wider">
                Moderate Risk
              </span>
            </div>
          </div>

          <div className="bg-white border border-border rounded p-5 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Risk Severity Count</span>
            <div className="mt-4 flex items-center gap-4">
              <div className="text-center">
                <span className="text-2xl font-bold text-risk-red block">2</span>
                <span className="text-[10px] font-semibold text-text-secondary uppercase">Critical</span>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="text-center">
                <span className="text-2xl font-bold text-risk-amber block">3</span>
                <span className="text-[10px] font-semibold text-text-secondary uppercase">Medium</span>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="text-center">
                <span className="text-2xl font-bold text-risk-green block">2</span>
                <span className="text-[10px] font-semibold text-text-secondary uppercase">Low</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded p-5 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Confidence Rating</span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary">98%</span>
              <span className="text-[11px] text-risk-green font-medium">99.8% precision rate</span>
            </div>
          </div>
        </div>

        {/* Distribution & Heatmap Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Distribution card */}
          <div className="bg-white border border-border rounded p-6 shadow-sm">
            <h3 className="font-semibold text-[14px] text-primary mb-5">Severity Distribution</h3>
            
            <div className="space-y-4">
              <div className="w-full h-4 bg-primary-100 rounded-full overflow-hidden flex">
                {riskDistribution.map((dist, idx) => (
                  <div 
                    key={idx} 
                    className={`${dist.color} h-full`} 
                    style={{ width: `${dist.percentage}%` }}
                    title={`${dist.label}: ${dist.count}`}
                  ></div>
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-[11px] text-text-secondary pt-2">
                {riskDistribution.map((dist, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 justify-center">
                    <span className={`w-2 h-2 rounded-full ${dist.color}`}></span>
                    <span>{dist.label} ({dist.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category score heatmap */}
          <div className="bg-white border border-border rounded p-6 shadow-sm">
            <h3 className="font-semibold text-[14px] text-primary mb-5">Exposure by Area</h3>
            
            <div className="space-y-3">
              {riskCategories.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="font-medium text-primary">{cat.name}</span>
                    <span className="text-text-secondary font-semibold">{cat.score} / 10</span>
                  </div>
                  <div className="w-full h-2 bg-primary-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${cat.color}`} 
                      style={{ width: cat.width }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Critical Findings & Mitigation recommendations */}
        <div className="space-y-4">
          <h3 className="font-semibold text-[14px] text-primary">Critical Findings & Mitigation Plan</h3>
          
          <div className="space-y-4">
            {findings.map((item, idx) => (
              <div key={idx} className="bg-white border border-border rounded shadow-xs overflow-hidden">
                {/* Findings Header */}
                <div className="p-4 bg-primary-50/50 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-[13px] text-primary">{item.title}</h4>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-semibold border rounded uppercase tracking-wider ${item.badgeStyle}`}>
                    {item.impact}
                  </span>
                </div>

                {/* Findings Details */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-[12px] leading-relaxed">
                  <div className="space-y-2 border-r border-border/60 pr-6">
                    <h5 className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Finding Description</h5>
                    <p className="text-primary">{item.description}</p>
                  </div>
                  <div className="space-y-2 pl-2 md:pl-0">
                    <h5 className="font-bold text-risk-blue uppercase text-[10px] tracking-wider flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Mitigation Recommendation</span>
                    </h5>
                    <p className="text-text-secondary font-medium">{item.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Shell>
  );
}
