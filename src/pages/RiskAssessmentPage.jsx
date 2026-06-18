import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { 
  ArrowLeft, 
  AlertCircle,
  Lightbulb,
  RefreshCw,
  Check,
  CheckCircle2
} from "lucide-react";

export default function RiskAssessmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userName } = useAuth();
  const { currentAnalysis, loadAnalysis, setAnalysis, loading, error } = useAnalysis();
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) loadAnalysis(id).catch(() => {});
  }, [id]);

  // Loading
  if (loading && !currentAnalysis) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-20" role="status">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded bg-primary-100 flex items-center justify-center animate-spin">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <p className="text-[13px] text-text-secondary">Loading risk assessment...</p>
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

  const risks = currentAnalysis?.risks || [];
  
  // Compute stats from real data
  const highCount = risks.filter(r => r.severity_weight === 3 || (r.severity || "").toLowerCase() === "high").length;
  const mediumCount = risks.filter(r => r.severity_weight === 2 || (r.severity || "").toLowerCase() === "medium").length;
  const lowCount = risks.filter(r => r.severity_weight === 1 || (r.severity || "").toLowerCase() === "low").length;
  const totalRisks = risks.length || 1;

  const resolvedCount = risks.filter(r => r.resolved).length;
  const resolvePercentage = risks.length > 0 ? Math.round((resolvedCount / risks.length) * 100) : 0;

  const overallScore = risks.length > 0
    ? (risks.reduce((sum, r) => sum + (r.severity_weight || 1), 0) / risks.length * 3.33).toFixed(1)
    : "0.0";
  const riskLabel = parseFloat(overallScore) >= 7 ? "High Risk" : parseFloat(overallScore) >= 4 ? "Moderate Risk" : "Low Risk";
  const riskLabelColor = parseFloat(overallScore) >= 7 ? "risk-red" : parseFloat(overallScore) >= 4 ? "risk-amber" : "risk-green";

  const riskDistribution = [
    { label: "Critical Risks", count: highCount, color: "bg-risk-red", percentage: Math.round((highCount / totalRisks) * 100) },
    { label: "Medium Risks", count: mediumCount, color: "bg-risk-amber", percentage: Math.round((mediumCount / totalRisks) * 100) },
    { label: "Low Risks", count: lowCount, color: "bg-risk-green", percentage: Math.round((lowCount / totalRisks) * 100) },
  ];

  // Toggle risk resolution
  const handleToggleRisk = async (riskTitle) => {
    if (!currentAnalysis) return;
    setUpdating(true);
    
    const updatedRisks = currentAnalysis.risks.map(r => {
      if (r.title === riskTitle) {
        return { ...r, resolved: !r.resolved };
      }
      return r;
    });

    const toggledRisk = currentAnalysis.risks.find(r => r.title === riskTitle);
    const wasResolved = toggledRisk ? !toggledRisk.resolved : false;

    // Add audit log
    const newLog = {
      id: String(Date.now()),
      event: `Risk "${riskTitle}" marked as ${wasResolved ? "Resolved" : "Unresolved"} by ${userName || "User"} via Risk Assessment Panel`,
      timestamp: new Date().toISOString()
    };

    const updatedMetadata = {
      ...currentAnalysis.metadata,
      audit_log: [...(currentAnalysis.metadata?.audit_log || []), newLog]
    };

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await axios.put(`${apiBaseUrl}/analysis/${id}`, {
        risks: updatedRisks,
        metadata: updatedMetadata
      });
      setAnalysis(response.data);
    } catch (err) {
      console.error("Failed to toggle risk resolved status:", err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-8">
        
        {/* Header & Back Action */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/analysis/${id}`)}
            className="p-1.5 border border-border bg-white rounded text-text-secondary hover:text-primary transition-colors cursor-pointer"
            aria-label="Back to analysis overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Risk Assessment</h1>
            <p className="text-[13px] text-text-secondary">
              Comprehensive exposure scorecard and mitigation advice.
            </p>
          </div>
        </div>

        {/* Top Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-border rounded p-5 shadow-sm">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Overall Risk Index</span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className={`text-4xl font-bold text-${riskLabelColor}`}>{overallScore}</span>
              <span className="text-md font-semibold text-text-secondary">/ 10</span>
              <span className={`ml-3 px-2 py-0.5 text-[10px] font-bold bg-${riskLabelColor}-light text-${riskLabelColor} rounded border border-${riskLabelColor}/10 uppercase tracking-wider`}>
                {riskLabel}
              </span>
            </div>
          </div>

          <div className="bg-white border border-border rounded p-5 shadow-sm">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Risk Severity Count</span>
            <div className="mt-4 flex items-center gap-4">
              <div className="text-center">
                <span className="text-2xl font-bold text-risk-red block">{highCount}</span>
                <span className="text-[10px] font-semibold text-text-secondary uppercase">Critical</span>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="text-center">
                <span className="text-2xl font-bold text-risk-amber block">{mediumCount}</span>
                <span className="text-[10px] font-semibold text-text-secondary uppercase">Medium</span>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="text-center">
                <span className="text-2xl font-bold text-risk-green block">{lowCount}</span>
                <span className="text-[10px] font-semibold text-text-secondary uppercase">Low</span>
              </div>
            </div>
          </div>

          {/* Dynamic Mitigation Progress Ring Box */}
          <div className="bg-white border border-border rounded p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Mitigation Progress</span>
              <div className="mt-3">
                <span className="text-3xl font-bold text-primary">{resolvePercentage}%</span>
                <span className="text-[11px] text-text-secondary block mt-1">{resolvedCount} of {risks.length} resolved</span>
              </div>
            </div>
            
            {/* SVG circle progress */}
            <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="22" className="text-border" strokeWidth="4.5" fill="transparent" stroke="currentColor" />
                <circle cx="28" cy="28" r="22" className="text-risk-green" strokeWidth="4.5" fill="transparent" strokeDasharray="138.2" strokeDashoffset={138.2 - (138.2 * resolvePercentage) / 100} strokeLinecap="round" stroke="currentColor" />
              </svg>
              {resolvePercentage === 100 && risks.length > 0 ? (
                <CheckCircle2 className="w-5 h-5 text-risk-green absolute" />
              ) : (
                <span className="absolute text-[10px] font-bold text-text-secondary">{resolvedCount}R</span>
              )}
            </div>
          </div>
        </div>

        {/* Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-border rounded p-6 shadow-sm">
            <h3 className="font-semibold text-[14px] text-primary mb-5">Severity Distribution</h3>
            
            {risks.length > 0 ? (
              <div className="space-y-4">
                <div className="w-full h-4 bg-primary-100 rounded-full overflow-hidden flex">
                  {riskDistribution.filter(d => d.percentage > 0).map((dist, idx) => (
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
                      <span className={`w-2 h-2 rounded-full ${dist.color}`} aria-hidden="true"></span>
                      <span>{dist.label} ({dist.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-text-secondary text-center py-4">No risks to display.</p>
            )}
          </div>

          {/* Risk list by severity */}
          <div className="bg-white border border-border rounded p-6 shadow-sm">
            <h3 className="font-semibold text-[14px] text-primary mb-5">Risks by Severity</h3>
            {risks.length > 0 ? (
              <div className="space-y-3">
                {risks.map((risk, idx) => {
                  const isHigh = risk.severity_weight === 3 || (risk.severity || "").toLowerCase() === "high";
                  const isMedium = risk.severity_weight === 2 || (risk.severity || "").toLowerCase() === "medium";
                  const barColor = risk.resolved ? "bg-risk-green" : isHigh ? "bg-risk-red" : isMedium ? "bg-risk-amber" : "bg-risk-green";
                  const weight = risk.severity_weight || 1;
                  const width = `${(weight / 3 * 100)}%`;

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-[12px]">
                        <span className={`font-medium truncate pr-2 ${risk.resolved ? "text-text-secondary line-through" : "text-primary"}`}>{risk.title}</span>
                        <span className={`text-[10px] font-bold uppercase ${risk.resolved ? "text-risk-green" : isHigh ? "text-risk-red" : isMedium ? "text-risk-amber" : "text-risk-green"}`}>
                          {risk.resolved ? "Resolved" : risk.severity}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-primary-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[13px] text-text-secondary text-center py-4">No risks to display.</p>
            )}
          </div>
        </div>

        {/* Detailed Findings */}
        {risks.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[14px] text-primary">Detailed Risk Findings</h3>
            
            <div className="space-y-4">
              {risks.map((risk, idx) => {
                const isHigh = risk.severity_weight === 3 || (risk.severity || "").toLowerCase() === "high";
                const isMedium = risk.severity_weight === 2 || (risk.severity || "").toLowerCase() === "medium";
                const isResolved = risk.resolved;
                const badgeStyle = isResolved
                  ? "bg-risk-green-light text-risk-green border-risk-green/10"
                  : isHigh
                    ? "bg-risk-red-light text-risk-red border-risk-red/10"
                    : isMedium ? "bg-risk-amber-light text-risk-amber border-risk-amber/10"
                    : "bg-risk-green-light text-risk-green border-risk-green/10";

                return (
                  <div key={idx} className={`bg-white border rounded shadow-xs overflow-hidden transition-all duration-200 ${isResolved ? "border-risk-green/20 opacity-80" : "border-border"}`}>
                    <div className="p-4 bg-primary-50/50 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!isResolved}
                          disabled={updating}
                          onChange={() => handleToggleRisk(risk.title)}
                          className="w-4 h-4 text-risk-green border-border rounded focus:ring-risk-green/20 cursor-pointer shrink-0"
                          title="Mark risk as resolved"
                        />
                        <h4 className={`font-semibold text-[13px] ${isResolved ? "text-text-secondary line-through" : "text-primary"}`}>{risk.title}</h4>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-semibold border rounded uppercase tracking-wider ${badgeStyle}`}>
                        {isResolved ? "Resolved" : `${risk.severity} Severity`} {risk.is_critical && !isResolved && "• Critical"}
                      </span>
                    </div>

                    <div className="p-5 text-[12px] leading-relaxed">
                      <p className={isResolved ? "text-text-muted" : "text-primary"}>{risk.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </Shell>
  );
}
