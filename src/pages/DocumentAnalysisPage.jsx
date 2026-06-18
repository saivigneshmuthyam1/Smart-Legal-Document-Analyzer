import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Search, 
  Sparkles, 
  MessageSquare,
  FileText,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Check,
  CheckCircle2,
  XCircle,
  FileSignature,
  Send,
  History,
  AtSign,
  User,
  Users,
  Copy,
  RotateCw,
  Image as ImageIcon
} from "lucide-react";
import ExportSettingsModal from "@/components/ui/ExportSettingsModal";
import { generateReportPDF } from "@/lib/pdfGenerator";


// Mock legal team members for tagging
const TEAM_MEMBERS = [
  { name: "Harvey Specter", email: "harvey@specterlaw.com" },
  { name: "Mike Ross", email: "mike@specterlaw.com" },
  { name: "Louis Litt", email: "louis@specterlaw.com" },
  { name: "Donna Paulsen", email: "donna@specterlaw.com" }
];

export default function DocumentAnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userName } = useAuth();
  const { currentAnalysis, loadAnalysis, setAnalysis, loading, error } = useAnalysis();
  const [zoom, setZoom] = useState(100);
  const [activeHighlight, setActiveHighlight] = useState(null);

  // Tab state: "overview", "playbook", "collaboration"
  const [activeTab, setActiveTab] = useState("overview");

  // Viewer tab state for image analysis: "image", "text", "clauses"
  const [viewerTab, setViewerTab] = useState("image");
  const [imageRotation, setImageRotation] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopyText = () => {
    if (currentAnalysis?.metadata?.extracted_ocr_text) {
      navigator.clipboard.writeText(currentAnalysis.metadata.extracted_ocr_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };


  // API loading states
  const [updating, setUpdating] = useState(false);

  // Comment input state
  const [commentText, setCommentText] = useState("");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  // E-Signature integration states
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signingProgress, setSigningProgress] = useState(0);
  const [signingMessage, setSigningMessage] = useState("");

  // PDF Export States & Refs
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    summary: true,
    risks: true,
    clauses: true,
    metadata: true,
    docInfo: true,
    stats: true,
    riskScore: true,
    timestamp: true,
  });
  const [activeTriggerRef, setActiveTriggerRef] = useState(null);

  const exportTriggerRef1 = useRef(null);
  const exportTriggerRef2 = useRef(null);

  const handleGeneratePDF = () => {
    setIsExportModalOpen(false);
    generateReportPDF(currentAnalysis, exportSettings);
  };

  // Load analysis data
  useEffect(() => {
    if (id) {
      loadAnalysis(id).catch(() => {});
    }
  }, [id]);

  const handleHighlightClick = (title) => {
    setActiveHighlight(title === activeHighlight ? null : title);
  };

  // Sync update helper with backend PUT endpoint
  const syncAnalysisUpdate = async (updatedFields) => {
    setUpdating(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await axios.put(`${apiBaseUrl}/analysis/${id}`, updatedFields);
      setAnalysis(response.data);
    } catch (err) {
      console.error("Failed to sync analysis updates with Supabase:", err);
    } finally {
      setUpdating(false);
    }
  };

  // Toggle risk resolution state
  const handleToggleRisk = async (riskTitle) => {
    if (!currentAnalysis) return;
    const updatedRisks = currentAnalysis.risks.map(r => {
      if (r.title === riskTitle) {
        return { ...r, resolved: !r.resolved };
      }
      return r;
    });

    const toggledRisk = currentAnalysis.risks.find(r => r.title === riskTitle);
    const wasResolved = toggledRisk ? !toggledRisk.resolved : false;
    
    // Add audit log entry
    const newLog = {
      id: String(Date.now()),
      event: `Risk "${riskTitle}" marked as ${wasResolved ? "Resolved" : "Unresolved"} by ${userName || "User"}`,
      timestamp: new Date().toISOString()
    };
    
    const updatedMetadata = {
      ...currentAnalysis.metadata,
      audit_log: [...(currentAnalysis.metadata?.audit_log || []), newLog]
    };

    await syncAnalysisUpdate({
      risks: updatedRisks,
      metadata: updatedMetadata
    });
  };

  // Add collaboration comment
  const handleAddComment = async (e) => {
    if (e) e.preventDefault();
    if (!commentText.trim() || !currentAnalysis) return;

    const newComment = {
      id: String(Date.now()),
      author: userName || "User",
      text: commentText.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedMetadata = {
      ...currentAnalysis.metadata,
      comments: [...(currentAnalysis.metadata?.comments || []), newComment]
    };

    setCommentText("");
    setTagDropdownOpen(false);

    await syncAnalysisUpdate({
      metadata: updatedMetadata
    });
  };

  // E-Signature Mock Dispatch Sequence
  const dispatchSignatureRequest = async (e) => {
    e.preventDefault();
    if (!signerName.trim() || !signerEmail.trim()) return;

    setSigningProgress(1);
    setSigningMessage("Preparing contract envelope details...");
    await new Promise(r => setTimeout(r, 600));

    setSigningProgress(35);
    setSigningMessage("Connecting to DocuSign API services...");
    await new Promise(r => setTimeout(r, 600));

    setSigningProgress(65);
    setSigningMessage(`Uploading contract PDF & setting signature anchors for ${signerEmail}...`);
    await new Promise(r => setTimeout(r, 600));

    setSigningProgress(100);
    setSigningMessage("Signature request successfully dispatched via DocuSign envelope!");
    await new Promise(r => setTimeout(r, 400));

    // Update DB
    const newLog = {
      id: String(Date.now()),
      event: `Contract dispatched for DocuSign E-Signature to ${signerName} (${signerEmail}) by ${userName || "User"}`,
      timestamp: new Date().toISOString()
    };

    const updatedMetadata = {
      ...currentAnalysis.metadata,
      signing_status: "Sent for Signature",
      signer_details: { name: signerName, email: signerEmail },
      audit_log: [...(currentAnalysis.metadata?.audit_log || []), newLog]
    };

    await syncAnalysisUpdate({
      metadata: updatedMetadata
    });

    setIsSignModalOpen(false);
    setSigningProgress(0);
    setSigningMessage("");
    setSignerName("");
    setSignerEmail("");
  };

  // Loading state
  if (loading && !currentAnalysis) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-20" role="status" aria-label="Loading analysis">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded bg-primary-100 flex items-center justify-center animate-spin">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <p className="text-[13px] text-text-secondary">Loading document analysis...</p>
          </div>
        </div>
      </Shell>
    );
  }

  // Error state
  if (error && !currentAnalysis) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <div className="w-10 h-10 rounded bg-risk-red-light flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-risk-red" />
            </div>
            <h3 className="text-[15px] font-semibold text-primary">Failed to Load Analysis</h3>
            <p className="text-[13px] text-text-secondary">{error}</p>
            <button
              onClick={() => loadAnalysis(id).catch(() => {})}
              className="px-4 py-2 bg-primary text-white text-[13px] font-medium rounded hover:bg-primary-light transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // Extract data from analysis
  const data = currentAnalysis || {};
  const summary = data.summary || {};
  const risks = data.risks || [];
  const clauses = data.clauses || {};
  const metadata = data.metadata || {};

  const totalClauses = (clauses.standard_clauses?.length || 0) + (clauses.non_standard_clauses?.length || 0);
  const overallRiskScore = risks.length > 0
    ? (risks.reduce((sum, r) => sum + (r.severity_weight || 1), 0) / risks.length * 3.33).toFixed(1)
    : "0.0";
  const riskLabelColor = parseFloat(overallRiskScore) >= 7 ? "text-risk-red" : parseFloat(overallRiskScore) >= 4 ? "text-risk-amber" : "text-risk-green";

  // Build document text from clauses for display
  const allClauses = [...(clauses.standard_clauses || []), ...(clauses.non_standard_clauses || [])];

  // Resolve calculations
  const totalRisks = risks.length;
  const resolvedRisks = risks.filter(r => r.resolved).length;
  const resolvePercentage = totalRisks > 0 ? Math.round((resolvedRisks / totalRisks) * 100) : 100;
  const allRisksResolved = resolvedRisks === totalRisks && totalRisks > 0;

  // Playbook score calculation
  const playbookAudits = metadata.playbook_analysis || [];
  const totalPlaybookRules = playbookAudits.length;
  const compliantPlaybookRules = playbookAudits.filter(a => a.compliant).length;
  const playbookScore = totalPlaybookRules > 0 ? Math.round((compliantPlaybookRules / totalPlaybookRules) * 100) : 100;

  return (
    <Shell>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Left Side: Document Viewer (3/5 columns) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Image analysis view selection tabs */}
          {metadata.is_image_analysis && (
            <div className="flex border border-border text-[12px] font-medium text-text-secondary bg-white rounded overflow-hidden shadow-sm font-sans">
              <button
                type="button"
                onClick={() => setViewerTab("image")}
                className={`flex-1 py-2 text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  viewerTab === "image"
                    ? "bg-primary text-white font-bold"
                    : "hover:bg-primary-50 text-primary"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Original Image</span>
              </button>
              <button
                type="button"
                onClick={() => setViewerTab("text")}
                className={`flex-1 py-2 text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  viewerTab === "text"
                    ? "bg-primary text-white font-bold"
                    : "hover:bg-primary-50 text-primary"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Extracted Text</span>
              </button>
              <button
                type="button"
                onClick={() => setViewerTab("clauses")}
                className={`flex-1 py-2 text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  viewerTab === "clauses"
                    ? "bg-primary text-white font-bold"
                    : "hover:bg-primary-50 text-primary"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Audited Clauses</span>
              </button>
            </div>
          )}

          {/* Standard Viewer Bar (Zoom & Download) - Hidden only in OCR text mode */}
          {(!metadata.is_image_analysis || viewerTab !== "text") && (
            <div className="bg-white border border-border rounded p-3 flex items-center justify-between shadow-xs font-sans">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-text-secondary" aria-hidden="true" />
                <span className="text-[12px] font-semibold text-primary uppercase tracking-tight truncate max-w-xs md:max-w-md">
                  {metadata.document_type || "Legal Document"} — {metadata.parties?.join(" & ") || ""}
                </span>
              </div>
              
              {/* Zoom & Rotation Controls */}
              <div className="flex items-center gap-4 text-text-secondary">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setZoom(prev => Math.max(50, prev - 10))}
                    className="p-1 hover:bg-primary-50 rounded transition-colors cursor-pointer"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-semibold w-10 text-center">{zoom}%</span>
                  <button 
                    onClick={() => setZoom(prev => Math.min(200, prev + 10))}
                    className="p-1 hover:bg-primary-50 rounded transition-colors cursor-pointer"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {metadata.is_image_analysis && viewerTab === "image" && (
                  <>
                    <div className="h-4 w-px bg-border"></div>
                    <button
                      onClick={() => setImageRotation(r => (r + 90) % 360)}
                      className="p-1.5 hover:bg-primary-50 rounded transition-colors cursor-pointer text-text-secondary hover:text-primary flex items-center gap-1 text-[11px] font-medium"
                      title="Rotate Image"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Rotate</span>
                    </button>
                  </>
                )}
                
                <div className="h-4 w-px bg-border"></div>
                <button 
                  ref={exportTriggerRef1}
                  onClick={() => {
                    setActiveTriggerRef(exportTriggerRef1);
                    setIsExportModalOpen(true);
                  }}
                  className="p-1.5 hover:bg-primary-50 rounded transition-colors cursor-pointer text-text-secondary hover:text-primary" 
                  aria-label="Export Compliance Report Settings"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Original Image View */}
          {metadata.is_image_analysis && viewerTab === "image" && (
            <div className="bg-white border border-border rounded shadow-md p-6 flex flex-col gap-5 items-center font-sans">
              
              {/* AI Enhancement metrics card */}
              <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-3 border border-border rounded bg-primary-50/20">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Legal Document Confidence</span>
                  <span className="text-md font-bold text-primary block mt-1">{metadata.document_confidence_score || "N/A"}</span>
                </div>
                <div className="p-3 border border-border rounded bg-primary-50/20">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Image Quality Score</span>
                  <span className="text-md font-bold text-primary block mt-1">{metadata.image_quality_score || "N/A"}</span>
                </div>
                <div className="p-3 border border-border rounded bg-primary-50/20">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">OCR Accuracy</span>
                  <span className="text-md font-bold text-primary block mt-1">{metadata.ocr_confidence || "N/A"}</span>
                </div>
              </div>

              {/* Original Image frame */}
              <div className="border border-border rounded bg-slate-50 w-full overflow-hidden flex items-center justify-center p-4 min-h-[450px]">
                <img
                  src={metadata.image_base64}
                  alt="Original Legal Document Upload"
                  className="max-h-[520px] object-contain rounded shadow-sm select-none"
                  style={{
                    transform: `rotate(${imageRotation}deg) scale(${zoom / 100})`,
                    transformOrigin: "center center",
                    transition: "transform 0.15s ease-out"
                  }}
                />
              </div>
            </div>
          )}

          {/* Extracted Raw OCR text view */}
          {metadata.is_image_analysis && viewerTab === "text" && (
            <div className="bg-white border border-border rounded shadow-md p-6 space-y-4 font-sans">
              <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-bold text-[14px] text-primary">Extracted Document Text</h3>
                    <p className="text-[11px] text-text-secondary mt-0.5">OCR Accuracy: <span className="font-semibold text-primary">{metadata.ocr_confidence}</span></p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-3 py-1.5 bg-primary-50 text-primary border border-primary/20 rounded hover:bg-primary-100 hover:border-primary/40 transition-colors cursor-pointer text-[12px] font-semibold flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-risk-green" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Text"}</span>
                </button>
              </div>
              
              <div className="w-full px-4 py-3 border border-border rounded text-[13px] text-primary bg-slate-50 font-serif leading-relaxed whitespace-pre-line max-h-[500px] overflow-y-auto break-words select-text">
                {metadata.extracted_ocr_text || "No extracted text available."}
              </div>
            </div>
          )}

          {/* Audited Clauses / PDF text viewer layout */}
          {(!metadata.is_image_analysis || viewerTab === "clauses") && (
            <div 
              className="bg-white border border-border rounded shadow-md p-10 min-h-[700px] relative font-serif select-text selection:bg-risk-blue/20 overflow-x-hidden"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center", transition: "transform 0.15s ease-out" }}
            >
              {/* Page Header */}
              <div className="flex justify-between items-center text-[10px] text-text-muted font-sans border-b border-border/40 pb-3 mb-6 font-semibold uppercase tracking-wider">
                <span>Juris Precision System Workspace</span>
                <span>{metadata.effective_date || "N/A"}</span>
              </div>

              {/* Document Content from Analysis */}
              <div className="space-y-4 text-[13px] leading-[1.8] text-primary whitespace-pre-line text-justify break-words">
                <h2 className="text-center font-bold font-sans text-[15px] uppercase mb-4 tracking-tight">
                  {metadata.document_type || "Legal Document"}
                </h2>

                {metadata.parties && metadata.parties.length > 0 && (
                  <p className="font-sans text-[12px] text-text-secondary">
                    <strong>Parties:</strong> {metadata.parties.join(", ")}
                    {metadata.effective_date && <> | <strong>Effective Date:</strong> {metadata.effective_date}</>}
                  </p>
                )}

                {/* Render clauses as document sections */}
                {allClauses.map((clause, idx) => {
                  const isNonStandard = (clauses.non_standard_clauses || []).some(c => c.title === clause.title);
                  const matchingRisk = risks.find(r => 
                    r.title.toLowerCase().includes(clause.title.toLowerCase().split(" ")[0]) ||
                    clause.title.toLowerCase().includes(r.title.toLowerCase().split(" ")[0])
                  );
                  const isHighlighted = activeHighlight === clause.title;
                  const isResolved = matchingRisk?.resolved;
                  
                  const borderColor = matchingRisk 
                    ? (isResolved ? "border-risk-green/40" : matchingRisk.severity_weight === 3 ? "border-risk-red" : matchingRisk.severity_weight === 2 ? "border-risk-amber" : "border-primary")
                    : "border-primary/20";
                  
                  const bgColor = matchingRisk
                    ? (isResolved
                      ? (isHighlighted ? "bg-risk-green-light" : "bg-risk-green-light/25")
                      : (isHighlighted 
                        ? (matchingRisk.severity_weight === 3 ? "bg-risk-red-light" : "bg-risk-amber-light")
                        : (matchingRisk.severity_weight === 3 ? "bg-risk-red-light/35" : "bg-risk-amber-light/35")))
                    : (isHighlighted ? "bg-primary-50" : "");

                  return (
                    <div key={idx}>
                      <p className="font-semibold font-sans text-[11px] uppercase tracking-wider text-text-secondary mt-6">
                        {clause.title}
                      </p>
                      <div 
                        onClick={() => handleHighlightClick(clause.title)}
                        className={`relative px-2.5 py-1.5 rounded cursor-pointer transition-all border-l-2 ${borderColor} ${bgColor} hover:bg-primary-50`}
                        role="button"
                        tabIndex={0}
                        aria-label={`Clause: ${clause.title}`}
                      >
                        {isNonStandard && (
                          <span className="font-sans font-bold text-[9px] text-risk-amber absolute -right-0 top-0 px-1.5 py-0.5 rounded bg-white border border-risk-amber/30 uppercase tracking-wider">
                            Non-Standard
                          </span>
                        )}
                        {isResolved && (
                          <span className="font-sans font-bold text-[9px] text-risk-green absolute -right-0 top-0 px-1.5 py-0.5 rounded bg-white border border-risk-green/30 uppercase tracking-wider">
                            Resolved
                          </span>
                        )}
                        <p className="text-[12px] leading-relaxed select-text">{clause.content}</p>
                      </div>
                    </div>
                  );
                })}

                {allClauses.length === 0 && (
                  <p className="text-[13px] text-text-secondary italic text-center py-8">
                    No clause content available for display.
                  </p>
                )}
              </div>

              {/* Page Footer */}
              <div className="absolute bottom-6 left-10 right-10 flex justify-between items-center text-[10px] text-text-muted font-sans border-t border-border/40 pt-3">
                <span>{metadata.document_type || "Document"}</span>
                <span>Analyzed by Lexicon AI</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: AI Analysis Panel (2/5 columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Actions Card */}
          <div className="bg-white border border-border rounded p-4 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Integration Actions</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-[10px] font-bold border rounded uppercase tracking-wider ${
                  metadata.signing_status === "Sent for Signature"
                    ? "bg-risk-blue-light text-risk-blue border-risk-blue/20"
                    : "bg-primary-50 text-text-secondary border-border"
                }`}>
                  {metadata.signing_status || "Not Sent"}
                </span>
                {metadata.signing_status === "Sent for Signature" && (
                  <span className="text-[10px] text-text-secondary truncate max-w-[120px]">
                    to {metadata.signer_details?.name}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsSignModalOpen(true)}
              disabled={!allRisksResolved || updating}
              className={`px-4 py-2 border rounded text-[12px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                allRisksResolved
                  ? "bg-white border-primary text-primary hover:bg-primary-50"
                  : "bg-primary-50 border-border text-text-muted cursor-not-allowed"
              }`}
              title={!allRisksResolved ? "Resolve all identified risks before sending for signature" : "Send for e-signature"}
            >
              <FileSignature className="w-4 h-4" />
              <span>Send E-Sign</span>
            </button>
          </div>

          {/* Tab Menu */}
          <div className="flex border-b border-border text-[12px] font-medium text-text-secondary bg-white rounded-t border-t border-l border-r">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "border-primary text-primary font-bold bg-primary-50/10"
                  : "border-transparent hover:text-primary hover:bg-primary-50/20"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("playbook")}
              className={`flex-grow py-3 text-center border-b-2 transition-all cursor-pointer ${
                activeTab === "playbook"
                  ? "border-primary text-primary font-bold bg-primary-50/10"
                  : "border-transparent hover:text-primary hover:bg-primary-50/20"
              }`}
            >
              Playbook ({compliantPlaybookRules}/{totalPlaybookRules})
            </button>
            <button
              onClick={() => setActiveTab("collaboration")}
              className={`flex-grow py-3 text-center border-b-2 transition-all cursor-pointer ${
                activeTab === "collaboration"
                  ? "border-primary text-primary font-bold bg-primary-50/10"
                  : "border-transparent hover:text-primary hover:bg-primary-50/20"
              }`}
            >
              Activity & Chat
            </button>
          </div>

          {/* Tab content area */}
          <div className="bg-white border-l border-r border-b border-border rounded-b p-5 shadow-sm min-h-[300px]">
            {activeTab === "overview" && (
              <div className="space-y-5">
                {/* Executive Summary */}
                <div className="bg-primary-50 p-4 border border-border rounded space-y-2">
                  <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Executive Summary</h4>
                  <p className="text-[12px] text-primary leading-relaxed">
                    {summary.main_summary || "No summary available."}
                  </p>
                  {summary.tldr && (
                    <p className="text-[11px] text-text-secondary italic mt-2 leading-relaxed">
                      <strong>TL;DR:</strong> {summary.tldr}
                    </p>
                  )}
                </div>

                {/* Key Points */}
                {summary.key_points && summary.key_points.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Key Points</h4>
                    <ul className="space-y-1">
                      {summary.key_points.map((point, idx) => (
                        <li key={idx} className="text-[12px] text-primary flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0"></span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* KPI strip */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 border border-border rounded text-center">
                    <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Clauses</span>
                    <span className="text-md font-bold text-primary block mt-1">{totalClauses}</span>
                  </div>
                  <div className={`p-3 border border-border rounded text-center ${parseFloat(overallRiskScore) >= 4 ? "bg-risk-amber-light/30 border-risk-amber/15" : "bg-risk-green-light/30 border-risk-green/15"}`}>
                    <span className={`text-[9px] font-bold uppercase tracking-wider block ${riskLabelColor}`}>Risk Score</span>
                    <span className={`text-md font-bold block mt-1 ${riskLabelColor}`}>{overallRiskScore}<span className="text-[10px] text-text-secondary font-medium">/10</span></span>
                  </div>
                  <div className="p-3 border border-border rounded text-center bg-primary-50/50">
                    <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Risks Resolved</span>
                    <span className="text-md font-bold text-primary block mt-1">{resolvedRisks}/{totalRisks}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "playbook" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-primary-50/50 border border-border rounded">
                  <div>
                    <h4 className="font-semibold text-[13px] text-primary">Playbook Auditing Summary</h4>
                    <p className="text-[10.5px] text-text-secondary mt-0.5">{compliantPlaybookRules} out of {totalPlaybookRules} policies compliant</p>
                  </div>
                  
                  {/* Dynamic percentage ring */}
                  <div className="relative flex items-center justify-center w-12 h-12">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="24" cy="24" r="20" className="text-border" strokeWidth="3.5" fill="transparent" stroke="currentColor" />
                      <circle cx="24" cy="24" r="20" className={playbookScore >= 75 ? "text-risk-green" : playbookScore >= 50 ? "text-risk-amber" : "text-risk-red"} strokeWidth="3.5" fill="transparent" strokeDasharray="125.6" strokeDashoffset={125.6 - (125.6 * playbookScore) / 100} strokeLinecap="round" stroke="currentColor" />
                    </svg>
                    <span className="absolute text-[11px] font-bold text-primary">{playbookScore}%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {playbookAudits.map((audit, idx) => (
                    <div key={idx} className="p-3 border border-border rounded space-y-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <h5 className="font-semibold text-[12px] text-primary leading-snug">{audit.rule}</h5>
                        {audit.compliant ? (
                          <span className="flex items-center gap-1 text-[9px] text-risk-green font-bold uppercase shrink-0 border border-risk-green/20 bg-risk-green-light px-1.5 py-0.5 rounded">
                            <Check className="w-2.5 h-2.5" />
                            <span>Compliant</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] text-risk-red font-bold uppercase shrink-0 border border-risk-red/20 bg-risk-red-light px-1.5 py-0.5 rounded">
                            <span>Non-Compliant</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-secondary leading-relaxed bg-primary-50/20 p-2 rounded">{audit.explanation}</p>
                    </div>
                  ))}

                  {playbookAudits.length === 0 && (
                    <div className="text-center py-6">
                      <AlertCircle className="w-8 h-8 text-text-muted mx-auto mb-2" />
                      <p className="text-[12px] text-text-secondary">No playbook rules defined in settings for this analysis.</p>
                      <button 
                        onClick={() => navigate("/settings")}
                        className="text-[11px] font-semibold text-primary mt-1 hover:underline cursor-pointer"
                      >
                        Configure Playbook Rules
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "collaboration" && (
              <div className="space-y-4">
                
                {/* Team member directory */}
                <div className="p-3 border border-border rounded bg-primary-50/20 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-text-secondary" />
                    <span className="text-[11.5px] font-semibold text-primary">Team Directory</span>
                  </div>
                  <span className="text-[10px] text-text-secondary">{TEAM_MEMBERS.length} Active Analysts</span>
                </div>

                {/* Audit Logs / Activity timeline */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    <span>Audit History Log</span>
                  </h4>
                  <div className="border border-border rounded max-h-[150px] overflow-y-auto p-3 space-y-2.5 text-[11px] bg-primary-50/10">
                    {(metadata.audit_log || []).map((log) => (
                      <div key={log.id} className="flex gap-2 items-start text-text-secondary leading-normal">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                        <div className="flex-grow">
                          <p className="text-primary font-medium">{log.event}</p>
                          <span className="text-[9.5px] text-text-muted">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                    {(!metadata.audit_log || metadata.audit_log.length === 0) && (
                      <p className="text-text-muted italic text-center py-2">No activity logged yet.</p>
                    )}
                  </div>
                </div>

                <hr className="border-border/60" />

                {/* Interactive Comments list */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Document Comments</span>
                  </h4>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {(metadata.comments || []).map((comm) => (
                      <div key={comm.id} className="p-2.5 border border-border/70 rounded bg-white space-y-1">
                        <div className="flex justify-between items-center text-[10.5px]">
                          <span className="font-bold text-primary flex items-center gap-1">
                            <span className="w-4 h-4 rounded-full bg-primary-100 flex items-center justify-center text-[8px] font-bold">{comm.author[0]}</span>
                            <span>{comm.author}</span>
                          </span>
                          <span className="text-[9px] text-text-muted">{new Date(comm.timestamp).toLocaleDateString()} {new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-[11.5px] text-text-secondary leading-relaxed pl-5 whitespace-pre-wrap">
                          {comm.text.split(/(\s+)/).map((word, i) => {
                            if (word.startsWith("@")) {
                              return <span key={i} className="text-risk-blue font-semibold hover:underline cursor-pointer">{word}</span>;
                            }
                            return word;
                          })}
                        </p>
                      </div>
                    ))}
                    {(!metadata.comments || metadata.comments.length === 0) && (
                      <p className="text-[11px] text-text-muted italic text-center py-4 bg-primary-50/20 rounded">No comments yet. Leave a note below!</p>
                    )}
                  </div>
                </div>

                {/* Leave Comment Form */}
                <form onSubmit={handleAddComment} className="relative mt-2">
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <textarea
                        value={commentText}
                        onChange={(e) => {
                          setCommentText(e.target.value);
                          if (e.target.value.endsWith("@")) {
                            setTagDropdownOpen(true);
                          } else if (!e.target.value.includes("@") || e.target.value.endsWith(" ")) {
                            setTagDropdownOpen(false);
                          }
                        }}
                        placeholder="Add your audit comment... (use @ to tag)"
                        rows={2}
                        className="w-full px-3 py-2 border border-border rounded text-[12px] text-primary focus:outline-none focus:border-primary bg-white pr-8 placeholder-text-muted resize-none leading-relaxed"
                      />
                      <button
                        type="button"
                        onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
                        className="absolute right-2.5 top-2.5 text-text-muted hover:text-primary transition-colors cursor-pointer"
                        aria-label="Tag team member"
                      >
                        <AtSign className="w-3.5 h-3.5" />
                      </button>

                      {/* Tag Dropdown Overlay */}
                      {tagDropdownOpen && (
                        <div className="absolute left-0 bottom-full mb-1 w-full bg-white border border-border rounded shadow-lg z-20 max-h-[120px] overflow-y-auto">
                          {TEAM_MEMBERS.map((tm, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setCommentText(prev => prev.endsWith("@") ? prev + tm.name : prev + " @" + tm.name);
                                setTagDropdownOpen(false);
                              }}
                              className="px-3 py-1.5 hover:bg-primary-50 text-[11px] text-primary flex justify-between items-center cursor-pointer"
                            >
                              <span className="font-semibold">{tm.name}</span>
                              <span className="text-text-muted text-[10px]">{tm.email}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={!commentText.trim() || updating}
                      className="px-3 bg-primary text-white text-[12px] font-semibold rounded hover:bg-primary-light transition-colors flex items-center justify-center cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>

              </div>
            )}
          </div>

          {/* Risk Detection Cards list */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Risk Audit Resolution</h4>
              <span className="text-[10px] text-text-secondary font-bold uppercase">{resolvedRisks}/{totalRisks} Mitigated</span>
            </div>
            
            <div className="space-y-4">
              {risks.length > 0 ? risks.map((risk, idx) => {
                const isHigh = risk.severity_weight === 3 || (risk.severity || "").toLowerCase() === "high";
                const isMedium = risk.severity_weight === 2 || (risk.severity || "").toLowerCase() === "medium";
                const isActive = activeHighlight === risk.title;
                const isResolved = risk.resolved;

                return (
                  <div 
                    key={idx}
                    className={`p-4 border rounded shadow-xs transition-all duration-300 ${
                      isActive
                        ? (isResolved ? "bg-risk-green-light border-risk-green shadow-sm" : isHigh ? "bg-risk-red-light border-risk-red shadow-sm" : "bg-risk-amber-light border-risk-amber shadow-sm")
                        : `bg-white border-border ${isResolved ? "hover:border-risk-green/40" : isHigh ? "hover:border-risk-red/40" : "hover:border-risk-amber/40"}`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Resolve Checkbox */}
                      <input
                        type="checkbox"
                        checked={!!isResolved}
                        disabled={updating}
                        onChange={() => handleToggleRisk(risk.title)}
                        className="w-4 h-4 mt-0.5 text-risk-green border-border rounded focus:ring-risk-green/20 cursor-pointer shrink-0"
                        title="Mark risk as resolved"
                      />
                      
                      <div className="flex-grow space-y-1">
                        <div 
                          onClick={() => setActiveHighlight(risk.title === activeHighlight ? null : risk.title)}
                          className="flex justify-between items-start cursor-pointer"
                        >
                          <h5 className={`font-semibold text-[13px] ${isResolved ? "text-text-secondary line-through" : "text-primary"}`}>{risk.title}</h5>
                          <span className={`px-1.5 py-0.5 text-[8.5px] font-bold rounded border uppercase tracking-wider shrink-0 ${
                            isResolved ? "bg-risk-green-light text-risk-green border-risk-green/10"
                            : isHigh ? "bg-risk-red-light text-risk-red border-risk-red/10"
                            : isMedium ? "bg-risk-amber-light text-risk-amber border-risk-amber/10"
                            : "bg-risk-green-light text-risk-green border-risk-green/10"
                          }`}>
                            {isResolved ? "Resolved" : risk.severity}
                          </span>
                        </div>
                        <p className={`text-[12px] leading-relaxed ${isResolved ? "text-text-muted" : "text-text-secondary"}`}>{risk.description}</p>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="p-4 border border-border rounded bg-white text-center">
                  <p className="text-[12px] text-text-secondary">No risks detected in this document.</p>
                </div>
              )}
            </div>
          </div>

          {/* Export compliance report button */}
          <div className="pt-2">
            <button
              ref={exportTriggerRef2}
              onClick={() => {
                setActiveTriggerRef(exportTriggerRef2);
                setIsExportModalOpen(true);
              }}
              className="w-full py-2.5 bg-primary hover:bg-primary-light text-white text-[13px] font-bold rounded transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              aria-label="Export compliance report PDF settings dialog"
            >
              <Download className="w-4 h-4" />
              <span>Export Compliance Report</span>
            </button>
          </div>

          {/* Action Navigation Row */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(`/clauses/${id}`)}
              className="flex-1 py-2 bg-primary text-white text-[12px] font-semibold rounded hover:bg-primary-light transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              aria-label="View extracted clauses"
            >
              <span>Explore Extracted Clauses</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => navigate(`/risk-assessment/${id}`)}
              className="px-4 py-2 border border-border rounded bg-white text-text-secondary hover:text-primary transition-colors cursor-pointer"
              aria-label="View full risk assessment"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
            <button 
              onClick={() => navigate(`/chat/${id}`)}
              className="px-4 py-2 border border-border rounded bg-white text-text-secondary hover:text-primary transition-colors cursor-pointer"
              aria-label="Open AI chat assistant"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Export Settings Configuration Modal */}
      <ExportSettingsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onGenerate={handleGeneratePDF}
        settings={exportSettings}
        setSettings={setExportSettings}
        triggerRef={activeTriggerRef}
      />

      {/* E-Signature DocuSign Dispatch Modal */}
      {isSignModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-border shadow-xl max-w-md w-full overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-border flex items-center justify-between bg-primary-50/50">
              <div className="flex items-center gap-2">
                <FileSignature className="w-4.5 h-4.5 text-primary" />
                <h3 className="font-semibold text-[14px] text-primary">DocuSign Envelope Dispatch</h3>
              </div>
              <button 
                onClick={() => { if (signingProgress === 0) setIsSignModalOpen(false); }}
                className="p-1 hover:bg-primary-100 rounded text-text-secondary hover:text-primary transition-colors cursor-pointer"
                disabled={signingProgress > 0}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={dispatchSignatureRequest} className="p-5 space-y-4">
              {signingProgress === 0 ? (
                <>
                  <p className="text-[11.5px] text-text-secondary leading-relaxed">
                    Verify all risks have been resolved. Enter signer credential endpoints to dispatch the document envelope through DocuSign signature workflows.
                  </p>
                  
                  <div className="space-y-1.5">
                    <label htmlFor="signer-name" className="font-bold text-text-secondary uppercase text-[10px] tracking-wider block">Signer Full Name</label>
                    <input
                      id="signer-name"
                      type="text"
                      required
                      placeholder="e.g. Harvey Specter"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded text-[13px] text-primary focus:outline-none focus:border-primary bg-white"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label htmlFor="signer-email" className="font-bold text-text-secondary uppercase text-[10px] tracking-wider block">Signer Email Address</label>
                    <input
                      id="signer-email"
                      type="email"
                      required
                      placeholder="e.g. harvey@specterlaw.com"
                      value={signerEmail}
                      onChange={(e) => setSignerEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded text-[13px] text-primary focus:outline-none focus:border-primary bg-white"
                    />
                  </div>

                  <div className="p-3 bg-risk-blue-light/35 border border-risk-blue/20 rounded text-[11px] text-risk-blue flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>All compliance risks successfully resolved. Ready for legal endorsement.</span>
                  </div>
                </>
              ) : (
                /* Dynamic Progress bar */
                <div className="py-6 space-y-4 flex flex-col items-center justify-center text-center">
                  <RefreshCw className="w-7 h-7 text-primary animate-spin" />
                  <div className="w-full space-y-2">
                    <h4 className="font-semibold text-[13px] text-primary">Sending Signature Request...</h4>
                    <p className="text-[11px] text-text-secondary italic h-4 leading-tight">{signingMessage}</p>
                    <div className="w-full h-1.5 bg-primary-100 rounded-full overflow-hidden mt-3">
                      <div 
                        className="h-full bg-primary transition-all duration-350 ease-out" 
                        style={{ width: `${signingProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-border flex justify-end gap-3">
                {signingProgress === 0 && (
                  <>
                    <button 
                      type="button"
                      onClick={() => setIsSignModalOpen(false)}
                      className="px-4 py-2 bg-white border border-border rounded text-[12px] font-semibold text-text-secondary hover:text-primary cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-primary hover:bg-primary-light text-white text-[12px] font-semibold rounded cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Envelope</span>
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </Shell>
  );
}
