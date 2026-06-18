import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { useAuth } from "@/contexts/AuthContext";
import { getHistory } from "@/services/api";
import { 
  FileText, 
  AlertTriangle, 
  Binary, 
  CheckCircle2, 
  ChevronRight, 
  TrendingUp, 
  ArrowUpRight, 
  Clock, 
  Filter,
  BarChart3,
  RefreshCw
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { userId, userName } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getHistory(userId);
        setHistory(data);
      } catch {
        // Silent — dashboard is informational
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  // Compute real metrics
  const totalDocs = history.length;
  const totalRisks = history.reduce((sum, d) => sum + (d.risks?.length || 0), 0);
  const totalClauses = history.reduce((sum, d) => {
    const c = d.clauses || {};
    return sum + (c.standard_clauses?.length || 0) + (c.non_standard_clauses?.length || 0);
  }, 0);
  const highRiskDocs = history.filter(d => (d.risks || []).some(r => r.severity_weight === 3 || (r.severity || "").toLowerCase() === "high")).length;

  const metrics = [
    {
      label: "Total Documents",
      value: String(totalDocs),
      change: `${totalDocs} analyzed`,
      trend: "up",
      icon: FileText,
      color: "text-primary bg-primary-100"
    },
    {
      label: "Risk Reports",
      value: String(totalRisks),
      change: `Across ${highRiskDocs} high-risk docs`,
      trend: "stable",
      icon: AlertTriangle,
      color: "text-risk-red bg-risk-red-light"
    },
    {
      label: "Clauses Extracted",
      value: totalClauses.toLocaleString(),
      change: "Standard & Non-Standard",
      trend: "up",
      icon: Binary,
      color: "text-risk-blue bg-risk-blue-light"
    },
    {
      label: "Documents with Risks",
      value: highRiskDocs > 0 ? `${Math.round((1 - highRiskDocs / Math.max(totalDocs, 1)) * 100)}%` : "100%",
      change: "Compliance rate",
      trend: "up",
      icon: CheckCircle2,
      color: "text-risk-green bg-risk-green-light"
    }
  ];

  // Recent activities from latest history entries
  const recentActivities = history.slice(0, 5).map(doc => {
    const risks = doc.risks || [];
    const highCount = risks.filter(r => r.severity_weight === 3 || (r.severity || "").toLowerCase() === "high").length;
    const docType = doc.metadata?.document_type || "Legal Document";
    const parties = doc.metadata?.parties?.join(" & ") || docType;
    const clauseCount = (doc.clauses?.standard_clauses?.length || 0) + (doc.clauses?.non_standard_clauses?.length || 0);
    
    let status, statusColor;
    if (highCount > 0) {
      status = "High Risk";
      statusColor = "bg-risk-red-light text-risk-red border-risk-red/10";
    } else if (risks.some(r => r.severity_weight === 2)) {
      status = "Medium Risk";
      statusColor = "bg-risk-amber-light text-risk-amber border-risk-amber/10";
    } else {
      status = "Compliant";
      statusColor = "bg-risk-green-light text-risk-green border-risk-green/10";
    }

    const date = doc.created_at ? new Date(doc.created_at) : new Date();
    const timeAgo = getTimeAgo(date);

    return {
      id: doc.document_id,
      docName: parties,
      action: `${clauseCount} clauses extracted, ${risks.length} risks identified`,
      time: timeAgo,
      type: docType,
      status,
      statusColor,
    };
  });

  // Risk category breakdown
  const riskByTitle = {};
  history.forEach(doc => {
    (doc.risks || []).forEach(r => {
      const title = r.title || "Other";
      if (!riskByTitle[title]) riskByTitle[title] = { count: 0, severity: r.severity };
      riskByTitle[title].count++;
    });
  });
  const riskCategories = Object.entries(riskByTitle)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4)
    .map(([name, data]) => ({
      name,
      count: data.count,
      severity: data.severity || "Medium",
      percentage: Math.round((data.count / Math.max(totalRisks, 1)) * 100),
    }));

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Executive Dashboard</h1>
            <p className="text-[13px] text-text-secondary">
              Welcome back, {userName}. Here's your portfolio intelligence.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/upload")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[13px] font-medium rounded hover:bg-primary-light transition-colors"
              aria-label="Start new contract analysis"
            >
              <span>Analyze Contract</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-border rounded p-5 animate-pulse">
                <div className="w-20 h-2 bg-primary-100 rounded mb-4"></div>
                <div className="w-12 h-6 bg-primary-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {metrics.map((metric, idx) => {
              const Icon = metric.icon;
              return (
                <div key={idx} className="bg-white border border-border rounded p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                      {metric.label}
                    </span>
                    <div className={`w-8 h-8 rounded flex items-center justify-center ${metric.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-3xl font-bold tracking-tight text-primary">{metric.value}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-text-secondary">
                      {metric.trend === "up" && <TrendingUp className="w-3 h-3 text-risk-green" />}
                      <span>{metric.change}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Risk Categories */}
        {riskCategories.length > 0 && (
          <div className="bg-white border border-border rounded p-6 shadow-sm">
            <h3 className="font-semibold text-[15px] text-primary">Top Risk Categories</h3>
            <p className="text-[11px] text-text-secondary mb-5">Most frequently identified legal vulnerabilities.</p>
            
            <div className="space-y-4">
              {riskCategories.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="font-medium text-primary">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-text-secondary">{cat.count} occurrences</span>
                      <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                        (cat.severity || "").toLowerCase() === "high" 
                          ? "bg-risk-red-light text-risk-red" 
                          : (cat.severity || "").toLowerCase() === "medium"
                          ? "bg-risk-amber-light text-risk-amber"
                          : "bg-risk-green-light text-risk-green"
                      }`}>
                        {cat.severity}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-primary-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${(cat.severity || "").toLowerCase() === "high" ? "bg-risk-red" : (cat.severity || "").toLowerCase() === "medium" ? "bg-risk-amber" : "bg-risk-green"}`}
                      style={{ width: `${Math.max(cat.percentage, 5)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[15px] text-primary">Recent Activities</h3>
              <p className="text-[11px] text-text-secondary">Latest analyses performed.</p>
            </div>
            <button 
              onClick={() => navigate("/history")}
              className="text-[12px] font-medium text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
              aria-label="View all history"
            >
              <span>All History</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-8 flex items-center justify-center" role="status">
                <RefreshCw className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div 
                  key={act.id} 
                  onClick={() => navigate(`/analysis/${act.id}`)}
                  className="p-5 flex items-center justify-between hover:bg-primary-50 cursor-pointer transition-colors group"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && navigate(`/analysis/${act.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded bg-primary-100 flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-border transition-colors">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[13px] text-primary">{act.docName}</h4>
                      <p className="text-[11px] text-text-secondary mt-0.5">{act.action}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div className="hidden sm:block">
                      <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">TYPE</span>
                      <span className="text-[11px] text-text-secondary uppercase">{act.type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border uppercase tracking-wider ${act.statusColor}`}>
                        {act.status}
                      </span>
                      <Clock className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-xs text-text-secondary">{act.time}</span>
                      <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-text-secondary text-[13px]">
                No recent activities. <button onClick={() => navigate("/upload")} className="text-primary font-medium hover:underline">Upload your first document</button>.
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

// Helper: relative time
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}
