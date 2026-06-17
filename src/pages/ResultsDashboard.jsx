import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Scale,
  FileText,
  Clock,
  Search,
  Settings,
  HelpCircle,
  Plus,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  BookOpen,
  ShieldAlert,
  ListTree
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchHistory } from "@/services/api";

import DocumentViewer from "@/components/results/DocumentViewer";
import SummarySection from "@/components/results/SummarySection";
import ClausesSection from "@/components/results/ClausesSection";
import RiskAnalysis from "@/components/results/RiskAnalysis";
import Chatbot from "@/components/Chatbot";

export default function ResultsDashboard() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [activePanel, setActivePanel] = useState("summary");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory()
      .then((data) => setHistory(data))
      .catch((err) => console.error("Failed to load history:", err));
  }, []);
  
  const analysisData = state?.analysisData;
  const summary = analysisData?.summary;
  const clauses = analysisData?.clauses;
  const risks = analysisData?.risks;
  const metadata = analysisData?.metadata;

  const panels = [
    { id: "summary", label: "Summary", icon: BookOpen },
    { id: "clauses", label: "Clauses", icon: ListTree },
    { id: "risks", label: "Risks", icon: ShieldAlert },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - 20% width */}
      <aside className="w-[272px] h-screen bg-white border-r border-border flex flex-col shrink-0 sticky top-0">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border/60 shrink-0">
          <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-sm shadow-primary/20 shrink-0">
            <Scale className="w-[18px] h-[18px] text-white" strokeWidth={2} />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-[14px] font-bold text-text truncate leading-tight">
              LegalDoc AI
            </h2>
            <p className="text-[11px] text-text-muted truncate leading-tight">
              Document Analyzer
            </p>
          </div>
        </div>

        {/* New Analysis */}
        <div className="px-3 pt-4 pb-2">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center gap-2.5 rounded-xl transition-all duration-200 cursor-pointer bg-primary text-white hover:bg-primary-dark shadow-sm shadow-primary/20 px-4 h-10 text-[13px] font-medium"
          >
            <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} />
            <span>New Analysis</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          <div className="mb-1">
            <span className="px-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Menu
            </span>
          </div>
          {[
            { icon: LayoutDashboard, label: "Dashboard", active: false },
            { icon: FileText, label: "Documents", active: true },
            { icon: Clock, label: "History", active: false },
            { icon: Search, label: "Search", active: false },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => item.label === "Dashboard" ? navigate("/dashboard") : null}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl h-10 transition-all duration-150 cursor-pointer px-3",
                item.active
                  ? "bg-primary-50 text-primary font-medium"
                  : "text-text-secondary hover:bg-gray-50 hover:text-text"
              )}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
              <span className="text-[13px]">{item.label}</span>
            </button>
          ))}

          {/* History */}
          <div className="mt-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                Recent Analysis
              </span>
            </div>
            <div className="space-y-0.5">
              {history.map((doc, i) => (
                <button
                  key={doc.id}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors duration-150 group cursor-pointer",
                    i === 0 ? "bg-primary-50/60" : "hover:bg-gray-50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    i === 0 ? "bg-primary-100" : "bg-primary-50"
                  )}>
                    <FileText className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-[12.5px] truncate leading-tight",
                      i === 0 ? "text-primary font-semibold" : "text-text font-medium"
                    )}>
                      {doc.name}
                    </p>
                    <p className="text-[11px] text-text-muted truncate leading-tight mt-0.5">
                      {doc.date}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom */}
        <div className="px-3 py-2 border-t border-border/60 space-y-0.5">
          {[
            { icon: Settings, label: "Settings" },
            { icon: HelpCircle, label: "Help & Support" },
          ].map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 rounded-xl h-9 transition-all duration-150 cursor-pointer px-3 text-text-secondary hover:bg-gray-50 hover:text-text"
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
              <span className="text-[13px]">{item.label}</span>
            </button>
          ))}
          <div className="flex items-center gap-3 rounded-xl mt-2 pt-2 border-t border-border/40 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xs font-semibold shrink-0">
              SC
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium text-text truncate leading-tight">
                Sarah Chen
              </p>
              <p className="text-[11px] text-text-muted truncate leading-tight">
                Pro Plan
              </p>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" onClick={() => navigate("/")}>
              <LogOut className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </aside>

      {/* Document Viewer - 45% */}
      <div className="flex-[45] min-w-0 flex flex-col border-r border-border/60">
        {/* Header */}
        <header className="h-16 bg-white border-b border-border/60 flex items-center justify-between px-6 shrink-0">
          <div>
            <h1 className="text-[17px] font-semibold text-text leading-tight">
              NDA Agreement Analysis
            </h1>
            <p className="text-[12.5px] text-text-secondary mt-0.5">
              Acme Corp × TechVenture Startups
            </p>
          </div>
          <div className="flex items-center gap-2 bg-success-light px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-[11.5px] font-medium text-green-700">
              Analysis Complete
            </span>
          </div>
        </header>

        {/* Document */}
        <div className="flex-1 p-4 overflow-hidden">
          <DocumentViewer documentContent={state?.pasteText || "Document text not available"} />
        </div>
      </div>

      {/* Analysis Panel - 35% */}
      <div className="flex-[35] min-w-0 flex flex-col bg-background">
        {/* Panel Header with tabs */}
        <div className="h-16 bg-white border-b border-border/60 flex items-center px-5 shrink-0">
          <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl">
            {panels.map((panel) => (
              <button
                key={panel.id}
                onClick={() => setActivePanel(panel.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-medium transition-all duration-200 cursor-pointer",
                  activePanel === panel.id
                    ? "bg-white text-text shadow-sm"
                    : "text-text-secondary hover:text-text"
                )}
              >
                <panel.icon className="w-3.5 h-3.5" strokeWidth={2} />
                {panel.label}
              </button>
            ))}
          </div>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activePanel === "summary" && <SummarySection summary={summary} clausesCount={clauses?.standard_clauses?.length + clauses?.non_standard_clauses?.length || 0} risksCount={risks?.length || 0} />}
          {activePanel === "clauses" && <ClausesSection clauses={clauses} />}
          {activePanel === "risks" && <RiskAnalysis risks={risks} />}
        </div>
      </div>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}
