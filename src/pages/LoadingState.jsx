import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { Scale } from "lucide-react";
import { analyzeDocument } from "@/services/api";

export default function LoadingState() {
  const navigate = useNavigate();

  const { state } = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const textToAnalyze = state?.pasteText || "Dummy text for now since PDF parsing requires backend update";
        const response = await analyzeDocument(textToAnalyze);
        navigate("/results", { state: { analysisData: response } });
      } catch (error) {
        console.error("Failed to analyze:", error);
        navigate("/dashboard");
      }
    };
    fetchData();
  }, [navigate, state]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Analyzing Document" subtitle="Please wait while we process your document" />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-10">
            {/* Progress indicator */}
            <div className="flex flex-col items-center mb-12 animate-fade-in">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse-soft">
                  <Scale className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
                <div className="absolute -inset-2 rounded-2xl border-2 border-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
              </div>
              <h2 className="text-lg font-semibold text-text mb-1">Analyzing your document...</h2>
              <p className="text-[13px] text-text-secondary">
                Extracting clauses, identifying risks, and generating insights
              </p>
              {/* Progress bar */}
              <div className="w-64 h-1.5 bg-gray-100 rounded-full mt-5 overflow-hidden">
                <div
                  className="h-full gradient-bg rounded-full transition-all duration-[3000ms] ease-out"
                  style={{ width: "100%", animation: "progress 3s ease-out forwards" }}
                />
              </div>
            </div>

            {/* Skeleton cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-slide-up">
              {/* Summary skeleton */}
              <div className="lg:col-span-3 bg-white rounded-xl border border-border p-6 shadow-card">
                <div className="flex items-center gap-3 mb-5">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div>
                    <Skeleton className="h-5 w-40 rounded-lg mb-2" />
                    <Skeleton className="h-3 w-56 rounded-lg" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full rounded-lg mb-3" />
                <Skeleton className="h-4 w-[90%] rounded-lg mb-3" />
                <Skeleton className="h-4 w-[75%] rounded-lg mb-3" />
                <Skeleton className="h-4 w-[85%] rounded-lg" />
              </div>

              {/* Clauses skeleton */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-border p-6 shadow-card">
                <div className="flex items-center gap-3 mb-5">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <Skeleton className="h-5 w-28 rounded-lg" />
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-xl border border-border/50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Skeleton className="h-4 w-48 rounded-lg" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-full rounded-lg mb-2" />
                      <Skeleton className="h-3 w-[80%] rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk skeleton */}
              <div className="bg-white rounded-xl border border-border p-6 shadow-card">
                <div className="flex items-center gap-3 mb-5">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <Skeleton className="h-5 w-28 rounded-lg" />
                </div>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border border-border/50 p-3 text-center">
                      <Skeleton className="h-7 w-8 mx-auto rounded-lg mb-1" />
                      <Skeleton className="h-3 w-12 mx-auto rounded-lg" />
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border border-border/50 p-4">
                      <Skeleton className="h-5 w-20 rounded-full mb-2" />
                      <Skeleton className="h-4 w-40 rounded-lg mb-2" />
                      <Skeleton className="h-3 w-full rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
