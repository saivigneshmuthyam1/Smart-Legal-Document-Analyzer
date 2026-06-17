import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { 
  Upload, 
  FileText, 
  Settings2, 
  CheckSquare, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  RefreshCw,
  AlertTriangle
} from "lucide-react";

export default function DocumentSubmissionPage() {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [enableRiskScoring, setEnableRiskScoring] = useState(true);
  const [clauseExtraction, setClauseExtraction] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const steps = [
    "Reading file bytes...",
    "OCR Text Extraction...",
    "Highlighting semantic sentences...",
    "AI Clause Classification...",
    "Auditing definition links...",
    "Generating risk score card..."
  ];

  useEffect(() => {
    let interval;
    if (analyzing) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 8;
          if (next >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              navigate("/analysis/1");
            }, 500);
            return 100;
          }
          // Update message based on progress
          const currentStep = Math.min(
            Math.floor((next / 100) * steps.length),
            steps.length - 1
          );
          setStatusMessage(steps[currentStep]);
          return next;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [analyzing]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const startAnalysis = () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    setStatusMessage(steps[0]);
  };

  const recentDocs = [
    {
      name: "Project Alpha_V2.pdf",
      date: "Analyzed 2 hours ago • 48 clauses",
      type: "Construction Agreement",
      status: "High Risk",
      statusStyle: "bg-risk-red-light text-risk-red border-risk-red/10"
    },
    {
      name: "Vendor_Standard_NDA.docx",
      date: "Analyzed Yesterday • 12 clauses",
      type: "Non-Disclosure",
      status: "Compliant",
      statusStyle: "bg-risk-green-light text-risk-green border-risk-green/10"
    },
    {
      name: "Q4_Investment_Terms.pdf",
      date: "Uploaded 4 hours ago • Processing...",
      type: "Term Sheet",
      status: "Pending",
      statusStyle: "bg-primary-100 text-text-secondary border-border"
    }
  ];

  return (
    <Shell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Document Submission</h1>
          <p className="text-[13px] text-text-secondary">
            Upload contract agreements, NDA templates, or corporate filings for instant AI risk assessment.
          </p>
        </div>

        {/* Upload Container */}
        <div className="bg-white border border-border rounded p-6 shadow-sm">
          {!analyzing ? (
            <div className="space-y-6">
              
              {/* File Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center transition-all ${
                  dragActive 
                    ? "border-primary bg-primary-50/50" 
                    : "border-border bg-primary-50/10 hover:bg-primary-50/35"
                }`}
              >
                <div className="w-12 h-12 rounded bg-white border border-border flex items-center justify-center mb-4 shadow-sm">
                  <Upload className="w-5 h-5 text-text-secondary" />
                </div>
                
                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-[13px] font-semibold text-primary">{selectedFile.name}</p>
                    <p className="text-[11px] text-text-secondary">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[13px] font-semibold text-primary">Click to upload or drag and drop</p>
                    <p className="text-[11px] text-text-secondary">PDF, DOCX, or TXT (Max 50MB)</p>
                  </div>
                )}
                
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="mt-4 px-4 py-1.5 bg-white border border-border rounded text-[12px] font-medium text-text-secondary hover:text-primary hover:border-primary cursor-pointer transition-colors shadow-xs"
                >
                  Choose File
                </label>
              </div>

              {/* Options & Action strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-[12px] font-medium text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableRiskScoring}
                      onChange={(e) => setEnableRiskScoring(e.target.checked)}
                      className="w-3.5 h-3.5 text-primary border-border rounded focus:ring-primary/20 cursor-pointer"
                    />
                    <span>Enable Risk Scoring</span>
                  </label>
                  <label className="flex items-center gap-2 text-[12px] font-medium text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clauseExtraction}
                      onChange={(e) => setClauseExtraction(e.target.checked)}
                      className="w-3.5 h-3.5 text-primary border-border rounded focus:ring-primary/20 cursor-pointer"
                    />
                    <span>Clause Extraction</span>
                  </label>
                </div>
                
                <button
                  onClick={startAnalysis}
                  disabled={!selectedFile}
                  className={`px-5 py-2 rounded text-[13px] font-medium transition-colors flex items-center gap-2 ${
                    selectedFile
                      ? "bg-primary text-white hover:bg-primary-light"
                      : "bg-primary-100 text-text-secondary border border-border cursor-not-allowed"
                  }`}
                >
                  <span>Begin Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : (
            /* Analysis Progress state */
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
              <div className="w-10 h-10 rounded bg-primary-100 flex items-center justify-center animate-spin">
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-2 w-full">
                <h3 className="font-semibold text-[14px] text-primary">Analyzing Document...</h3>
                <p className="text-[12px] text-text-secondary italic h-4">{statusMessage}</p>
                {/* Progress bar container */}
                <div className="w-full h-1.5 bg-primary-100 rounded-full overflow-hidden mt-4">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-text-muted text-right font-medium">{progress}%</div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Documents */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-[14px] text-primary">Recent Documents</h3>
            <button 
              onClick={() => navigate("/library")}
              className="text-[11px] font-semibold text-text-secondary hover:text-primary transition-colors"
            >
              View All Library
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentDocs.map((doc, idx) => (
              <div 
                key={idx}
                onClick={() => navigate("/analysis/1")}
                className="bg-white border border-border rounded p-4 flex flex-col justify-between hover:shadow-sm cursor-pointer transition-all hover:border-primary-light"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-7 h-7 rounded bg-primary-100 flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-semibold rounded uppercase tracking-wider border ${doc.statusStyle}`}>
                      {doc.status}
                    </span>
                  </div>
                  <h4 className="font-semibold text-[13px] text-primary leading-snug truncate">{doc.name}</h4>
                  <p className="text-[11px] text-text-secondary mt-1">{doc.date}</p>
                </div>
                
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  <span>{doc.type}</span>
                  {doc.status === "Pending" ? (
                    <RefreshCw className="w-3 h-3 text-text-muted animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Shell>
  );
}
