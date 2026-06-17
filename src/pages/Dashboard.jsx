import React from "react";
import { useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { 
  FileText, 
  AlertTriangle, 
  Binary, 
  CheckCircle2, 
  ChevronRight, 
  TrendingUp, 
  ArrowUpRight, 
  Clock, 
  ShieldAlert, 
  Filter,
  BarChart3
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  const metrics = [
    {
      label: "Total Documents",
      value: "124",
      change: "+12% vs last month",
      trend: "up",
      icon: FileText,
      color: "text-primary bg-primary-100"
    },
    {
      label: "Risk Reports",
      value: "42",
      change: "Across 18 documents",
      trend: "stable",
      icon: AlertTriangle,
      color: "text-risk-red bg-risk-red-light"
    },
    {
      label: "Clauses Extracted",
      value: "1,482",
      change: "24 categorized types",
      trend: "up",
      icon: Binary,
      color: "text-risk-blue bg-risk-blue-light"
    },
    {
      label: "Compliance Score",
      value: "94%",
      change: "Avg efficiency rating",
      trend: "up",
      icon: CheckCircle2,
      color: "text-risk-green bg-risk-green-light"
    }
  ];

  const recentActivities = [
    {
      docName: "Project Alpha_V2.pdf",
      action: "High Risk detected in Indemnification & Liability clauses",
      time: "2 hours ago",
      type: "construction",
      status: "High Risk",
      statusColor: "bg-risk-red-light text-risk-red border-risk-red/10"
    },
    {
      docName: "Vendor_Standard_NDA.docx",
      action: "Successfully audited: 12 standard clauses matched perfectly",
      time: "Yesterday",
      type: "non-disclosure",
      status: "Compliant",
      statusColor: "bg-risk-green-light text-risk-green border-risk-green/10"
    },
    {
      docName: "Q4_Investment_Terms.pdf",
      action: "Document queued for processing: OCR text extraction complete",
      time: "4 hours ago",
      type: "term sheet",
      status: "Pending",
      statusColor: "bg-primary-100 text-text-secondary border-border"
    }
  ];

  const riskCategories = [
    { name: "Liability Loophole", count: 14, severity: "High", percentage: 80 },
    { name: "Jurisdiction Ambiguity", count: 12, severity: "Medium", percentage: 55 },
    { name: "Non-Solicitation Scope", count: 9, severity: "Medium", percentage: 40 },
    { name: "Overbroad Non-Compete", count: 7, severity: "High", percentage: 90 }
  ];

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Executive Dashboard</h1>
            <p className="text-[13px] text-text-secondary">
              Real-time portfolio intelligence, contract risks, and compliance status.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-white text-[13px] text-text-secondary hover:text-primary rounded transition-colors">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Workspace</span>
            </button>
            <button 
              onClick={() => navigate("/upload")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[13px] font-medium rounded hover:bg-primary-light transition-colors"
            >
              <span>Analyze Contract</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
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

        {/* Analytics & Distribution Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Mock Chart Section */}
          <div className="lg:col-span-2 bg-white border border-border rounded p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-0.5">
                <h3 className="font-semibold text-[15px] text-primary">Contract Analysis History</h3>
                <p className="text-[11px] text-text-secondary">Analysis volume and risk distribution by month.</p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-text-secondary bg-primary-50 px-2 py-1 rounded border border-border">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>6 Months</span>
              </div>
            </div>

            {/* Visual HTML Chart */}
            <div className="h-48 flex items-end justify-between gap-4 px-2 pt-4 border-b border-border">
              {[
                { label: "Jan", total: 12, risk: 2, height: "30%" },
                { label: "Feb", total: 18, risk: 4, height: "45%" },
                { label: "Mar", total: 24, risk: 8, height: "60%" },
                { label: "Apr", total: 29, risk: 11, height: "75%" },
                { label: "May", total: 32, risk: 9, height: "80%" },
                { label: "Jun", total: 42, risk: 14, height: "95%" }
              ].map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                  <div className="w-full flex flex-col gap-0.5 justify-end rounded-t h-full max-w-[40px]">
                    {/* Stacked Risk volume */}
                    <div 
                      className="bg-risk-red rounded-t transition-all duration-500 w-full" 
                      style={{ height: `calc(${bar.height} * 0.35)` }}
                      title={`High Risk: ${bar.risk}`}
                    ></div>
                    {/* Rest of the documents */}
                    <div 
                      className="bg-primary rounded-t transition-all duration-500 w-full" 
                      style={{ height: `calc(${bar.height} * 0.65)` }}
                      title={`Total: ${bar.total}`}
                    ></div>
                  </div>
                  <span className="text-[10px] text-text-secondary font-medium mt-1">{bar.label}</span>
                </div>
              ))}
            </div>
            
            {/* Chart Legend */}
            <div className="flex items-center gap-6 mt-4 pt-2 text-[11px] text-text-secondary">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-primary"></span>
                <span>Standard Audit Pass</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-risk-red"></span>
                <span>High Exposure/Breach Risks</span>
              </div>
            </div>
          </div>

          {/* Risk Categories Distribution */}
          <div className="bg-white border border-border rounded p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-[15px] text-primary">Risk Categories</h3>
              <p className="text-[11px] text-text-secondary mb-5">Categorized legal vulnerabilities identified.</p>
              
              <div className="space-y-4">
                {riskCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="font-medium text-primary">{cat.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-text-secondary">{cat.count} files</span>
                        <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                          cat.severity === "High" 
                            ? "bg-risk-red-light text-risk-red" 
                            : "bg-risk-amber-light text-risk-amber"
                        }`}>
                          {cat.severity}
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-1.5 bg-primary-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${cat.severity === "High" ? "bg-risk-red" : "bg-risk-amber"}`}
                        style={{ width: `${cat.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => navigate("/library")}
              className="w-full mt-6 py-2 border border-border rounded text-[12px] font-medium text-text-secondary hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-1"
            >
              <span>View Exposure Index</span>
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>

        </div>

        {/* Recent Activities Section */}
        <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[15px] text-primary">Recent Activities</h3>
              <p className="text-[11px] text-text-secondary">Latest analyses performed inside Juris Precision.</p>
            </div>
            <button 
              onClick={() => navigate("/history")}
              className="text-[12px] font-medium text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
            >
              <span>All History</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-border">
            {recentActivities.map((act, idx) => (
              <div 
                key={idx} 
                onClick={() => navigate("/analysis/1")}
                className="p-5 flex items-center justify-between hover:bg-primary-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded bg-primary-100 flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-border transition-colors">
                    <FileText className="w-4.5 h-4.5 text-primary" />
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
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
