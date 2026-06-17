import React, { useState } from "react";
import { FileText, ChevronDown, ChevronUp, BookOpen } from "lucide-react";

export default function SummarySection({ summary, clausesCount, risksCount }) {
  const [expanded, setExpanded] = useState(false);
  const mainSummary = summary?.main_summary || "No summary available.";
  const truncateLength = 280;
  const needsTruncation = mainSummary.length > truncateLength;

  return (
    <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
            <BookOpen className="w-[18px] h-[18px] text-primary" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-[14.5px] font-semibold text-text">Document Summary</h3>
            <p className="text-[11.5px] text-text-muted">AI-generated overview</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        <p className="text-[13px] text-text-secondary leading-relaxed">
          {expanded || !needsTruncation
            ? mainSummary
            : mainSummary.slice(0, truncateLength) + "..."}
        </p>

        {needsTruncation && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-3 text-[12.5px] font-medium text-primary hover:text-primary-dark transition-colors cursor-pointer"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Read More
              </>
            )}
          </button>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/40">
          {[
            { label: "Clauses", value: clausesCount || 0 },
            { label: "Risks Found", value: risksCount || 0 },
            { label: "Key Points", value: summary?.key_points?.length || 0 },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center rounded-lg bg-gray-50/80 py-2.5"
            >
              <p className="text-[17px] font-bold text-text">{stat.value}</p>
              <p className="text-[11px] text-text-muted mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
