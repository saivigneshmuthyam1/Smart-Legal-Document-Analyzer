import React, { useState } from "react";
import Shell from "@/components/layout/Shell";
import { compareDocuments } from "@/services/api";
import { 
  ArrowLeftRight, 
  FileText, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  CheckCircle2
} from "lucide-react";

export default function ComparePage() {
  // File states
  const [origFile, setOrigFile] = useState(null);
  const [revFile, setRevFile] = useState(null);
  const [origDragActive, setOrigDragActive] = useState(false);
  const [revDragActive, setRevDragActive] = useState(false);

  // Loading & error states
  const [comparing, setComparing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");

  // Result state
  const [result, setResult] = useState(null);

  // Drag handlers
  const handleDrag = (e, setDragActive) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e, setFile, setDragActive) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith(".pdf")) {
        setFile(file);
        setError("");
      } else {
        setError("Only PDF files are supported for comparison.");
      }
    }
  };

  const handleFileChange = (e, setFile) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith(".pdf")) {
        setFile(file);
        setError("");
      } else {
        setError("Only PDF files are supported for comparison.");
      }
    }
  };

  const runComparison = async () => {
    if (!origFile || !revFile) return;
    setError("");
    setComparing(true);
    setStatusMsg("Extracting text from original document...");
    
    try {
      // Simulate steps briefly to enhance premium UX feel
      await new Promise(r => setTimeout(r, 600));
      setStatusMsg("Extracting text from revised contract draft...");
      await new Promise(r => setTimeout(r, 600));
      setStatusMsg("Comparing sections and legal clauses using AI...");
      
      const comparisonResult = await compareDocuments(origFile, revFile);
      setResult(comparisonResult);
    } catch (err) {
      setError(err.message || "Semantic comparison failed. Ensure API endpoints are running.");
    } finally {
      setComparing(false);
      setStatusMsg("");
    }
  };

  const clearComparison = () => {
    setOrigFile(null);
    setRevFile(null);
    setResult(null);
    setError("");
  };

  return (
    <Shell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-primary" />
            <span>Semantic Compare Mode</span>
          </h1>
          <p className="text-[13px] text-text-secondary">
            Perform side-by-side legal document audit checks. Upload two contract versions to instantly reveal the legal and risk-shifting consequences of modifications.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-risk-red-light border border-risk-red/20 rounded text-[12px] text-risk-red">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!result && !comparing ? (
          /* File selection workspace */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* Original contract drag-drop */}
            <div className="bg-white border border-border rounded p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[13px] text-primary uppercase tracking-wider mb-1">Version A: Original Draft</h3>
                <p className="text-[11px] text-text-secondary mb-4 leading-normal">
                  The initial draft, standard baseline contract, or incoming template before revisions were made.
                </p>
              </div>

              <div
                onDragEnter={(e) => handleDrag(e, setOrigDragActive)}
                onDragOver={(e) => handleDrag(e, setOrigDragActive)}
                onDragLeave={(e) => handleDrag(e, setOrigDragActive)}
                onDrop={(e) => handleDrop(e, setOrigFile, setOrigDragActive)}
                className={`border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-all ${
                  origDragActive 
                    ? "border-primary bg-primary-50/50" 
                    : "border-border bg-primary-50/10 hover:bg-primary-50/35"
                }`}
              >
                <div className="w-10 h-10 rounded bg-white border border-border flex items-center justify-center mb-3 shadow-sm text-text-secondary">
                  <FileText className="w-4 h-4" />
                </div>
                
                {origFile ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 justify-center">
                      <CheckCircle2 className="w-4.5 h-4.5 text-risk-green" />
                      <p className="text-[12.5px] font-semibold text-primary truncate max-w-[180px]">{origFile.name}</p>
                    </div>
                    <button onClick={() => setOrigFile(null)} className="text-[10px] text-risk-red hover:underline mt-1 cursor-pointer">Remove file</button>
                  </div>
                ) : (
                  <>
                    <p className="text-[12px] font-semibold text-primary">Drag original PDF here</p>
                    <input
                      type="file"
                      id="orig-file-input"
                      onChange={(e) => handleFileChange(e, setOrigFile)}
                      accept=".pdf"
                      className="hidden"
                    />
                    <label
                      htmlFor="orig-file-input"
                      className="mt-3 px-3.5 py-1.5 bg-white border border-border rounded text-[11px] font-semibold text-text-secondary hover:text-primary hover:border-primary cursor-pointer transition-colors shadow-xs"
                    >
                      Choose Original
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Revised contract drag-drop */}
            <div className="bg-white border border-border rounded p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[13px] text-primary uppercase tracking-wider mb-1">Version B: Revised / Counterparty Draft</h3>
                <p className="text-[11px] text-text-secondary mb-4 leading-normal">
                  The redlined draft, counterparty's mark-up version, or revised contract received for review.
                </p>
              </div>

              <div
                onDragEnter={(e) => handleDrag(e, setRevDragActive)}
                onDragOver={(e) => handleDrag(e, setRevDragActive)}
                onDragLeave={(e) => handleDrag(e, setRevDragActive)}
                onDrop={(e) => handleDrop(e, setRevFile, setRevDragActive)}
                className={`border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-all ${
                  revDragActive 
                    ? "border-primary bg-primary-50/50" 
                    : "border-border bg-primary-50/10 hover:bg-primary-50/35"
                }`}
              >
                <div className="w-10 h-10 rounded bg-white border border-border flex items-center justify-center mb-3 shadow-sm text-text-secondary">
                  <FileText className="w-4 h-4" />
                </div>
                
                {revFile ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 justify-center">
                      <CheckCircle2 className="w-4.5 h-4.5 text-risk-green" />
                      <p className="text-[12.5px] font-semibold text-primary truncate max-w-[180px]">{revFile.name}</p>
                    </div>
                    <button onClick={() => setRevFile(null)} className="text-[10px] text-risk-red hover:underline mt-1 cursor-pointer">Remove file</button>
                  </div>
                ) : (
                  <>
                    <p className="text-[12px] font-semibold text-primary">Drag revised PDF here</p>
                    <input
                      type="file"
                      id="rev-file-input"
                      onChange={(e) => handleFileChange(e, setRevFile)}
                      accept=".pdf"
                      className="hidden"
                    />
                    <label
                      htmlFor="rev-file-input"
                      className="mt-3 px-3.5 py-1.5 bg-white border border-border rounded text-[11px] font-semibold text-text-secondary hover:text-primary hover:border-primary cursor-pointer transition-colors shadow-xs"
                    >
                      Choose Revised
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Run button full span */}
            <div className="md:col-span-2 flex justify-end pt-2">
              <button
                onClick={runComparison}
                disabled={!origFile || !revFile}
                className={`px-5 py-2.5 rounded text-[13px] font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                  origFile && revFile 
                    ? "bg-primary text-white hover:bg-primary-light" 
                    : "bg-primary-100 text-text-secondary border border-border cursor-not-allowed"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Run Semantic Comparison</span>
              </button>
            </div>
          </div>
        ) : comparing ? (
          /* Analyzing loader */
          <div className="bg-white border border-border rounded p-12 text-center max-w-md mx-auto space-y-6 shadow-sm" role="status">
            <div className="w-10 h-10 rounded bg-primary-100 flex items-center justify-center animate-spin mx-auto">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-[14px] text-primary">Running Comparison Audit...</h3>
              <p className="text-[11.5px] text-text-secondary italic h-4 leading-tight">{statusMsg}</p>
              <div className="w-full h-1 bg-primary-100 rounded-full overflow-hidden mt-4">
                <div className="h-full bg-primary rounded-full animate-pulse w-2/3"></div>
              </div>
            </div>
          </div>
        ) : (
          /* Display comparison audit findings */
          <div className="space-y-6">
            
            {/* Header reset actions */}
            <div className="flex justify-between items-center gap-4 bg-white border border-border rounded p-4 shadow-sm">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4.5 h-4.5 text-text-secondary" />
                <div>
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Audited Documents</span>
                  <span className="text-[12px] font-semibold text-primary truncate max-w-xs md:max-w-md block">
                    {origFile?.name} vs {revFile?.name}
                  </span>
                </div>
              </div>
              <button
                onClick={clearComparison}
                className="px-4 py-2 border border-border rounded bg-white hover:bg-primary-50 text-[12px] font-semibold text-text-secondary hover:text-primary transition-all cursor-pointer shadow-xs"
              >
                Start New Audit
              </button>
            </div>

            {/* Executive summary card */}
            <div className="bg-primary-50 border border-border rounded p-5 space-y-2 shadow-xs">
              <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Executive Comparison Summary</h3>
              <p className="text-[13px] text-primary leading-relaxed">{result.change_summary}</p>
            </div>

            {/* Changes list */}
            <div className="space-y-4">
              <h3 className="font-bold text-[14px] text-primary">Semantic Section Redlines</h3>
              
              {result.changes && result.changes.length > 0 ? (
                <div className="space-y-4">
                  {result.changes.map((item, idx) => {
                    const isIncreased = item.risk_change === "Increased";
                    const isDecreased = item.risk_change === "Decreased";
                    
                    const riskStyle = isIncreased
                      ? "bg-risk-red-light text-risk-red border-risk-red/15"
                      : isDecreased
                        ? "bg-risk-green-light text-risk-green border-risk-green/15"
                        : "bg-primary-50 text-text-secondary border-border";

                    return (
                      <div key={idx} className="bg-white border border-border rounded shadow-xs overflow-hidden">
                        {/* Card Header */}
                        <div className="p-4 bg-primary-50/45 border-b border-border flex items-center justify-between flex-wrap gap-2">
                          <h4 className="font-semibold text-[13px] text-primary">{item.clause_title}</h4>
                          
                          <div className="flex items-center gap-2">
                            {/* Severity Badge */}
                            {item.severity && item.severity !== "None" && (
                              <span className="px-2 py-0.5 border border-border rounded text-[9.5px] font-semibold text-text-secondary bg-white">
                                {item.severity} Severity
                              </span>
                            )}
                            
                            {/* Risk Shift Badge */}
                            <span className={`px-2 py-0.5 border rounded text-[9.5px] font-bold uppercase tracking-wider flex items-center gap-1 ${riskStyle}`}>
                              {isIncreased ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : isDecreased ? (
                                <TrendingDown className="w-3 h-3" />
                              ) : (
                                <Minus className="w-3 h-3" />
                              )}
                              <span>Risk {item.risk_change}</span>
                            </span>
                          </div>
                        </div>

                        {/* Card Content Side by Side */}
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px] border-b border-border bg-white leading-relaxed">
                          <div className="space-y-1.5">
                            <span className="font-bold text-text-secondary uppercase text-[9px] tracking-wider block">Original Draft</span>
                            <div className="p-3 bg-primary-50/20 border border-border/60 rounded font-serif italic text-text-secondary whitespace-pre-wrap select-text">
                              {item.original_text || "No corresponding clause present in original draft."}
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <span className="font-bold text-text-secondary uppercase text-[9px] tracking-wider block">Revised Draft</span>
                            <div className="p-3 bg-primary-50/20 border border-border/60 rounded font-serif italic text-primary whitespace-pre-wrap select-text">
                              {item.revised_text || "Clause deleted in revised draft."}
                            </div>
                          </div>
                        </div>

                        {/* Semantic impact panel */}
                        <div className="p-4 bg-primary-50/25 text-[12.5px] leading-relaxed flex items-start gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center shrink-0 border border-border">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <span className="font-bold text-primary uppercase text-[9.5px] tracking-wider block mb-0.5">Semantic Analysis Impact</span>
                            <p className="text-text-secondary">{item.semantic_impact}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 border border-border rounded bg-white text-center text-text-secondary text-[12.5px]">
                  No material semantic legal changes were identified between the drafts.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
