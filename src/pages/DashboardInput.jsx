import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Upload,
  FileText,
  Type,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function DashboardInput() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upload");
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [pasteText, setPasteText] = useState("");

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  }, []);

  const handleAnalyze = () => {
    navigate("/loading");
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Document Analysis"
          subtitle="Upload or paste your legal document to begin AI analysis"
        />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-10">
            {/* Welcome card */}
            <div className="mb-8 animate-slide-up">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-text">
                    Analyze Legal Documents
                  </h2>
                  <p className="text-[13px] text-text-secondary">
                    AI-powered analysis of contracts, NDAs, and agreements
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <Tabs>
                <TabsList>
                  <TabsTrigger
                    active={activeTab === "upload"}
                    onClick={() => setActiveTab("upload")}
                  >
                    <Upload className="w-4 h-4 mr-2" strokeWidth={1.8} />
                    Upload PDF
                  </TabsTrigger>
                  <TabsTrigger
                    active={activeTab === "paste"}
                    onClick={() => setActiveTab("paste")}
                  >
                    <Type className="w-4 h-4 mr-2" strokeWidth={1.8} />
                    Paste Raw Text
                  </TabsTrigger>
                </TabsList>

                {/* Upload Tab */}
                {activeTab === "upload" && (
                  <TabsContent>
                    <div
                      className={`
                        relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
                        ${
                          dragOver
                            ? "border-primary bg-primary-50/50 scale-[1.01]"
                            : uploadedFile
                            ? "border-success/40 bg-success-light/30"
                            : "border-border hover:border-primary/40 hover:bg-primary-50/20"
                        }
                      `}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() =>
                        document.getElementById("file-input").click()
                      }
                    >
                      <input
                        id="file-input"
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <div className="flex flex-col items-center justify-center py-16 px-6">
                        {uploadedFile ? (
                          <>
                            <div className="w-16 h-16 rounded-2xl bg-success-light flex items-center justify-center mb-4">
                              <CheckCircle2
                                className="w-8 h-8 text-success"
                                strokeWidth={1.5}
                              />
                            </div>
                            <p className="text-[15px] font-medium text-text mb-1">
                              {uploadedFile.name}
                            </p>
                            <p className="text-[13px] text-text-secondary">
                              {(uploadedFile.size / 1024).toFixed(1)} KB •
                              Ready to analyze
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
                              <Upload
                                className="w-8 h-8 text-primary"
                                strokeWidth={1.5}
                              />
                            </div>
                            <p className="text-[15px] font-medium text-text mb-1">
                              Drop your PDF here, or{" "}
                              <span className="text-primary">browse</span>
                            </p>
                            <p className="text-[13px] text-text-muted">
                              Supports PDF files up to 25MB
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* File info */}
                    <div className="flex items-center gap-2 mt-3 px-1">
                      <AlertCircle className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.8} />
                      <p className="text-[12px] text-text-muted">
                        Only PDF format is supported. Files are encrypted and
                        deleted after analysis.
                      </p>
                    </div>

                    {/* Analyze Button */}
                    <Button
                      size="lg"
                      className="w-full mt-6 h-12 text-[14px] font-semibold rounded-xl shadow-md shadow-primary/20 gap-2"
                      onClick={handleAnalyze}
                    >
                      <Sparkles className="w-4 h-4" />
                      Analyze Document
                    </Button>
                  </TabsContent>
                )}

                {/* Paste Tab */}
                {activeTab === "paste" && (
                  <TabsContent>
                    <div className="relative">
                      <textarea
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        placeholder="Paste your legal document text here..."
                        className="w-full h-72 rounded-2xl border border-border bg-white px-5 py-4 text-[13.5px] text-text leading-relaxed placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all resize-none"
                      />
                      {pasteText && (
                        <div className="absolute bottom-4 right-4 text-[11px] text-text-muted bg-white/90 px-2 py-0.5 rounded-md">
                          {pasteText.length.toLocaleString()} characters
                        </div>
                      )}
                    </div>

                    <Button
                      size="lg"
                      className="w-full mt-6 h-12 text-[14px] font-semibold rounded-xl shadow-md shadow-primary/20 gap-2"
                      onClick={handleAnalyze}
                      disabled={!pasteText.trim()}
                    >
                      <Sparkles className="w-4 h-4" />
                      Analyze Document
                    </Button>
                  </TabsContent>
                )}
              </Tabs>
            </div>

            {/* Quick stats */}
            <div
              className="grid grid-cols-3 gap-4 mt-10 animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              {[
                { label: "Documents Analyzed", value: "1,284", icon: FileText },
                { label: "Risks Identified", value: "3,472", icon: AlertCircle },
                { label: "Hours Saved", value: "856", icon: Sparkles },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-xl border border-border p-4 flex items-center gap-3.5 shadow-xs hover:shadow-sm transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                    <stat.icon
                      className="w-[18px] h-[18px] text-primary"
                      strokeWidth={1.8}
                    />
                  </div>
                  <div>
                    <p className="text-[18px] font-bold text-text leading-tight">
                      {stat.value}
                    </p>
                    <p className="text-[11.5px] text-text-muted leading-tight mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
