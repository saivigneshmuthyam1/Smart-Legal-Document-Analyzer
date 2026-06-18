import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { analyzeText, analyzePdf, analyzeImage, getHistory } from "@/services/api";
import { 
  Upload, 
  FileText, 
  ArrowRight, 
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Type,
  FileUp,
  CheckCircle2,
  FolderOpen,
  Cloud,
  Camera,
  Image as ImageIcon,
  Crop,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Copy,
  Check,
  Info
} from "lucide-react";
import Tesseract from "tesseract.js";


// Mock legal texts for cloud storage import simulation
const CLOUD_MOCK_FILES = [
  {
    name: "NDA_Draft_Acme.pdf",
    type: "Non-Disclosure Agreement",
    size: "145 KB",
    content: `MUTUAL NON-DISCLOSURE AGREEMENT
This Mutual Non-Disclosure Agreement (the "Agreement") is made and entered into as of January 15, 2026 (the "Effective Date"), by and between Acme Corp, a Delaware corporation, and Beta LLC, a California limited liability company.

1. Purpose. The parties wish to evaluate a potential business relationship. In connection with this evaluation, either party may disclose proprietary and confidential information.
2. Term of Confidentiality. The receiving party's obligations under this Agreement shall continue for a period of 5 years from the date of disclosure.
3. Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the State of California, without reference to conflict of laws principles.`
  },
  {
    name: "MSA_Standard_2026.pdf",
    type: "Master Services Agreement",
    size: "320 KB",
    content: `MASTER SERVICES AGREEMENT
This Master Services Agreement is entered into by and between Acme Corp ("Client") and Delta Inc ("Service Provider"), effective as of March 1, 2026.

1. Services and Compensation. Service Provider shall perform consulting and engineering services. Client shall pay all invoices within Net-90 days of receipt. Any late payments shall accrue interest at 1.5% per month.
2. Limitation of Liability. In no event shall Service Provider's total liability under this Agreement exceed the sum of $10,000, or the fees paid in the last month.
3. Governing Law. This Agreement shall be governed by and construed under the laws of the State of California.
4. Indemnification. Service Provider shall indemnify Client for any third-party claims arising out of intellectual property infringement.`
  },
  {
    name: "Vendor_Agreement_v3.pdf",
    type: "Vendor Contract",
    size: "110 KB",
    content: `VENDOR AGREEMENT
This Vendor Agreement is between Supplier Global Goods and Retailer Acme Corp, effective June 1, 2026.

1. Product Supply. Supplier shall supply consumer goods to Retailer.
2. Liability Cap. Supplier's liability under this agreement is strictly limited and capped at 0.5x the contract value of products delivered.
3. Payment terms. Payment terms are Net-60 days.
4. Governing Law. This contract is governed by and construed under Texas state law.`
  },
  {
    name: "Consulting_Agreement_Draft.pdf",
    type: "Consulting Contract",
    size: "98 KB",
    content: `CONSULTING SERVICES AGREEMENT
This Consulting Services Agreement is entered into by and between Acme Corp and Consultant Jane Doe, effective April 10, 2026.

1. Scope. Consultant shall perform software development consulting.
2. Payment. Client shall pay Consultant $150 per hour. Payment terms are Net-30 days.
3. Intellectual Property. All work product developed by Consultant shall be owned exclusively by Client.
4. Governing Law. This Agreement is governed by the laws of the State of Delaware.`
  }
];

export default function DocumentSubmissionPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { setAnalysis } = useAnalysis();
  
  // Tab state: "file" or "text"
  const [activeTab, setActiveTab] = useState("file");
  
  // File upload state
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Text input state
  const [textContent, setTextContent] = useState("");
  
  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  
  // Recent documents from history
  const [recentDocs, setRecentDocs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Cloud Import simulation states
  const [cloudProvider, setCloudProvider] = useState("");
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);

  // Image analysis states
  const [imageStage, setImageStage] = useState("select"); // "select", "preview", "blur_warning", "ocr_processing", "invalid_document"
  const [imagePreview, setImagePreview] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [cropArea, setCropArea] = useState({ left: 15, top: 15, width: 70, height: 70 });
  const [isCropActive, setIsCropActive] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [qualityMetrics, setQualityMetrics] = useState({ isBlurry: false, qualityScore: 100, resolution: "", variance: 0 });
  const [invalidDocMetrics, setInvalidDocMetrics] = useState({ confidenceScore: "", reason: "" });


  // Fetch recent documents on mount
  useEffect(() => {
    async function fetchRecent() {
      try {
        const history = await getHistory(userId);
        setRecentDocs(history.slice(0, 3));
      } catch {
        // Silent fail — recent docs are not critical
      } finally {
        setHistoryLoading(false);
      }
    }
    fetchRecent();
  }, [userId]);

  const handleImageFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      loadImage(e.target.files[0]);
    }
  };

  const loadImage = (file) => {
    setError("");
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError("Supported formats: JPG, JPEG, PNG, WEBP.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setImageStage("preview");
      setZoom(100);
      setRotation(0);
      setIsCropActive(false);
      setCropArea({ left: 15, top: 15, width: 70, height: 70 });
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCrop = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      const cropX = (cropArea.left / 100) * img.naturalWidth;
      const cropY = (cropArea.top / 100) * img.naturalHeight;
      const cropW = (cropArea.width / 100) * img.naturalWidth;
      const cropH = (cropArea.height / 100) * img.naturalHeight;
      
      canvas.width = cropW;
      canvas.height = cropH;
      
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      
      const croppedBase64 = canvas.toDataURL("image/jpeg");
      setImagePreview(croppedBase64);
      setIsCropActive(false);
      setCropArea({ left: 15, top: 15, width: 70, height: 70 });
    };
    img.src = imagePreview;
  };

  const bakeTransforms = () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        const angleRad = (rotation * Math.PI) / 180;
        const absCos = Math.abs(Math.cos(angleRad));
        const absSin = Math.abs(Math.sin(angleRad));
        
        const newWidth = img.naturalWidth * absCos + img.naturalHeight * absSin;
        const newHeight = img.naturalWidth * absSin + img.naturalHeight * absCos;
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        ctx.translate(newWidth / 2, newHeight / 2);
        ctx.rotate(angleRad);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        
        const rotatedBase64 = canvas.toDataURL("image/jpeg", 0.95);
        resolve(rotatedBase64);
      };
      img.src = imagePreview;
    });
  };

  const analyzeImageQuality = (base64Image) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const width = Math.min(img.width, 400); // Small size for fast check
        const height = (width / img.width) * img.height;
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        
        try {
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          let mean = 0;
          const grayValues = new Float32Array(width * height);
          for (let i = 0; i < data.length; i += 4) {
            grayValues[i / 4] = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
          }
          
          const gradients = [];
          for (let y = 1; y < height - 1; y += 2) {
            for (let x = 1; x < width - 1; x += 2) {
              const idx = y * width + x;
              const val = grayValues[idx];
              const right = grayValues[idx + 1];
              const bottom = grayValues[idx + width];
              
              const dx = right - val;
              const dy = bottom - val;
              const mag = Math.sqrt(dx * dx + dy * dy);
              
              gradients.push(mag);
              mean += mag;
            }
          }
          
          mean = mean / gradients.length;
          
          let variance = 0;
          for (let i = 0; i < gradients.length; i++) {
            const diff = gradients[i] - mean;
            variance += diff * diff;
          }
          variance = variance / gradients.length;
          
          // Sobel-like edge variance is a robust measure of text blur.
          // Crisp text yields high variance (> 25-30), blurry text yields low variance (< 15).
          const isBlurry = variance < 20;
          const qualityScore = Math.min(100, Math.round(variance * 1.5));
          
          resolve({
            isBlurry,
            qualityScore,
            resolution: `${img.naturalWidth}x${img.naturalHeight}`,
            variance
          });
        } catch (e) {
          resolve({
            isBlurry: false,
            qualityScore: 90,
            resolution: `${img.naturalWidth}x${img.naturalHeight}`,
            variance: 50
          });
        }
      };
      img.src = base64Image;
    });
  };

  const runOcr = async (base64Image) => {
    setOcrProgress(0);
    try {
      const result = await Tesseract.recognize(
        base64Image,
        "eng",
        {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        }
      );
      return {
        text: result.data.text,
        confidence: Math.round(result.data.confidence)
      };
    } catch (err) {
      console.error("OCR extraction failed", err);
      throw new Error("Failed to extract text from the document image.");
    }
  };

  const handleAnalyzeImage = async () => {
    setError("");
    let currentImage = imagePreview;
    
    // Bake rotation first if there is any rotation
    if (rotation !== 0) {
      try {
        currentImage = await bakeTransforms();
        setImagePreview(currentImage);
        setRotation(0);
      } catch (err) {
        setError("Failed to rotate image pixels.");
        return;
      }
    }
    
    // 1) Blur detection
    setImageStage("ocr_processing");
    setOcrProgress(0);
    setStatusMessage("Evaluating image quality (blur & resolution)...");
    
    const quality = await analyzeImageQuality(currentImage);
    setQualityMetrics(quality);
    
    if (quality.isBlurry) {
      setImageStage("blur_warning");
      return;
    }
    
    // 2) Run OCR
    setStatusMessage("Extracting text from document image (OCR)...");
    let ocrResult;
    try {
      ocrResult = await runOcr(currentImage);
    } catch (err) {
      setError(err.message || "OCR failed.");
      setImageStage("preview");
      return;
    }
    
    // 3) Call backend to analyze the text and validate
    setAnalyzing(true);
    setStatusMessage("Validating legal document classification...");
    const activeRules = getActivePlaybookRules();
    
    try {
      const response = await analyzeImage(
        ocrResult.text,
        currentImage,
        `${ocrResult.confidence}%`,
        `${quality.qualityScore}%`,
        userId,
        activeRules
      );
      
      if (response.status === "invalid_document") {
        setInvalidDocMetrics({
          confidenceScore: response.confidence_score,
          reason: response.reason
        });
        setAnalyzing(false);
        setImageStage("invalid_document");
      } else {
        setStatusMessage("Analysis complete! Persisting compliance records...");
        setAnalysis(response);
        setTimeout(() => {
          navigate(`/analysis/${response.document_id}`);
        }, 500);
      }
    } catch (err) {
      setError(err.message || "Image analysis pipeline failed. Please retry.");
      setAnalyzing(false);
      setImageStage("preview");
    }
  };

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
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setError("");
    // Validate type
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported. Please upload a .pdf file.");
      return;
    }
    // Validate size (50 MB)
    if (file.size > 50 * 1024 * 1024) {
      setError("File size exceeds the 50 MB limit.");
      return;
    }
    setSelectedFile(file);
  };

  // Get active playbook rules from settings
  const getActivePlaybookRules = () => {
    try {
      const saved = localStorage.getItem("lexicon_playbook_rules");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filter(r => r.active).map(r => r.text);
      }
    } catch (e) {
      console.error("Failed to load playbook rules", e);
    }
    return [
      "Governing law must be Delaware or New York.",
      "Payment terms must not exceed Net-30 days.",
      "Limitation of liability must be capped at 1x contract value.",
      "Mutual indemnification is required for all vendor services."
    ];
  };

  const startAnalysis = async () => {
    setError("");
    setAnalyzing(true);
    setStatusMessage("Retrieving compliance playbook rules...");

    const activeRules = getActivePlaybookRules();

    try {
      let result;
      if (activeTab === "file" && selectedFile) {
        setStatusMessage("Uploading PDF and extracting text...");
        result = await analyzePdf(selectedFile, userId, activeRules);
      } else if (activeTab === "text" && textContent.trim()) {
        setStatusMessage("Auditing legal text against playbook policies with AI...");
        result = await analyzeText(textContent.trim(), userId, activeRules);
      } else {
        setError("Please upload a file or enter text to analyze.");
        setAnalyzing(false);
        return;
      }

      setStatusMessage("Analysis complete! Persisting compliance records...");
      setAnalysis(result);
      
      // Navigate to the analysis page
      setTimeout(() => {
        navigate(`/analysis/${result.document_id}`);
      }, 500);
    } catch (err) {
      setError(err.message || "Analysis failed. Please check your backend connection and try again.");
      setAnalyzing(false);
    }
  };

  // Run simulated cloud import analysis
  const handleImportCloudFile = async (mockFile) => {
    setIsCloudModalOpen(false);
    setError("");
    setAnalyzing(true);
    
    // Simulate integration lifecycle progress
    setStatusMessage(`Connecting to secure ${cloudProvider} instance...`);
    await new Promise(r => setTimeout(r, 600));
    
    setStatusMessage(`Fetching file "${mockFile.name}"...`);
    await new Promise(r => setTimeout(r, 500));
    
    setStatusMessage("Downloading file stream and caching locally...");
    await new Promise(r => setTimeout(r, 500));
    
    setStatusMessage("Parsing document stream and extracting text variables...");
    await new Promise(r => setTimeout(r, 400));
    
    setStatusMessage("Retrieving compliance playbook rules...");
    const activeRules = getActivePlaybookRules();
    
    try {
      setStatusMessage("Auditing legal text against playbook policies with AI...");
      const result = await analyzeText(mockFile.content, userId, activeRules);
      
      setStatusMessage("Analysis complete! Persisting compliance records...");
      setAnalysis(result);
      
      setTimeout(() => {
        navigate(`/analysis/${result.document_id}`);
      }, 500);
    } catch (err) {
      setError(err.message || "Cloud analysis failed. Please verify API key configuration.");
      setAnalyzing(false);
    }
  };

  const openCloudModal = (providerName) => {
    setCloudProvider(providerName);
    setIsCloudModalOpen(true);
  };

  const canSubmit = activeTab === "file" ? !!selectedFile : textContent.trim().length > 0;

  const getRiskInfo = (doc) => {
    const risks = doc.risks || [];
    const highCount = risks.filter(r => r.severity_weight === 3 || (r.severity || "").toLowerCase() === "high").length;
    if (highCount > 0) return { label: "High Risk", style: "bg-risk-red-light text-risk-red border-risk-red/10" };
    const medCount = risks.filter(r => r.severity_weight === 2 || (r.severity || "").toLowerCase() === "medium").length;
    if (medCount > 0) return { label: "Medium Risk", style: "bg-risk-amber-light text-risk-amber border-risk-amber/10" };
    return { label: "Low Risk", style: "bg-risk-green-light text-risk-green border-risk-green/10" };
  };

  return (
    <Shell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Document Submission</h1>
          <p className="text-[13px] text-text-secondary">
            Upload a PDF contract, paste legal text, or import from cloud storage for instant compliance auditing.
          </p>
        </div>

        {/* Upload Container */}
        <div className="bg-white border border-border rounded p-6 shadow-sm">
          {!analyzing ? (
            <div className="space-y-6">
              
              {/* Tab Switcher & Cloud Sync Row */}
              <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-border/60">
                <div className="flex items-center gap-1 p-1 bg-primary-50 rounded w-fit">
                  <button
                    onClick={() => { setActiveTab("file"); setError(""); }}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-[12px] font-medium transition-colors cursor-pointer ${
                      activeTab === "file"
                        ? "bg-white text-primary shadow-sm border border-border"
                        : "text-text-secondary hover:text-primary"
                    }`}
                    aria-label="Upload PDF file"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Upload PDF</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab("text"); setError(""); }}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-[12px] font-medium transition-colors cursor-pointer ${
                      activeTab === "text"
                        ? "bg-white text-primary shadow-sm border border-border"
                        : "text-text-secondary hover:text-primary"
                    }`}
                    aria-label="Paste text content"
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>Paste Text</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab("image"); setError(""); setImageStage("select"); }}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-[12px] font-medium transition-colors cursor-pointer ${
                      activeTab === "image"
                        ? "bg-white text-primary shadow-sm border border-border"
                        : "text-text-secondary hover:text-primary"
                    }`}
                    aria-label="Image analysis"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Image Analysis</span>
                  </button>
                </div>
                
                {/* Cloud integrations */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openCloudModal("Google Drive")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border rounded text-[11px] font-semibold text-text-secondary hover:text-primary hover:border-primary transition-colors cursor-pointer shadow-xs"
                  >
                    <Cloud className="w-3.5 h-3.5 text-blue-500" />
                    <span>Google Drive</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openCloudModal("OneDrive")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border rounded text-[11px] font-semibold text-text-secondary hover:text-primary hover:border-primary transition-colors cursor-pointer shadow-xs"
                  >
                    <Cloud className="w-3.5 h-3.5 text-sky-600" />
                    <span>OneDrive</span>
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-risk-red-light border border-risk-red/20 rounded text-[12px] text-risk-red" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {activeTab === "file" && (
                /* File Drag and Drop Zone */
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
                  role="region"
                  aria-label="File upload drop zone"
                >
                  <div className="w-12 h-12 rounded bg-white border border-border flex items-center justify-center mb-4 shadow-sm">
                    <Upload className="w-5 h-5 text-text-secondary" />
                  </div>
                  
                  {selectedFile ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 justify-center">
                        <CheckCircle2 className="w-4 h-4 text-risk-green" />
                        <p className="text-[13px] font-semibold text-primary">{selectedFile.name}</p>
                      </div>
                      <p className="text-[11px] text-text-secondary">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-[11px] text-risk-red hover:underline mt-1 cursor-pointer"
                        aria-label="Remove selected file"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[13px] font-semibold text-primary">Click to upload or drag and drop</p>
                      <p className="text-[11px] text-text-secondary">PDF files only (Max 50MB)</p>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden"
                    aria-label="Choose PDF file to upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="mt-4 px-4 py-1.5 bg-white border border-border rounded text-[12px] font-medium text-text-secondary hover:text-primary hover:border-primary cursor-pointer transition-colors shadow-xs"
                  >
                    Choose File
                  </label>
                </div>
              )}

              {activeTab === "text" && (
                /* Text Input Area */
                <div className="space-y-2">
                  <label htmlFor="text-input" className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    Paste Legal Document Text
                  </label>
                  <textarea
                    id="text-input"
                    placeholder="Paste the full text of your legal document here..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 border border-border rounded text-[13px] text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-y bg-white font-serif leading-relaxed"
                  />
                  <p className="text-[11px] text-text-muted text-right">
                    {textContent.length.toLocaleString()} characters
                  </p>
                </div>
              )}

              {activeTab === "image" && (
                /* Image Analysis Area */
                <div>
                  {imageStage === "select" && (
                    <div className="space-y-6">
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragActive(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            loadImage(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`border border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center transition-all ${
                          dragActive 
                            ? "border-primary bg-primary-50/50" 
                            : "border-border bg-primary-50/10 hover:bg-primary-50/35"
                        }`}
                      >
                        <div className="w-12 h-12 rounded bg-white border border-border flex items-center justify-center mb-4 shadow-sm">
                          <ImageIcon className="w-5 h-5 text-text-secondary" />
                        </div>
                        <p className="text-[13px] font-semibold text-primary">Upload or capture an image of the document</p>
                        <p className="text-[11px] text-text-secondary">JPG, JPEG, PNG, WEBP formats (Max 15MB)</p>
                        
                        <div className="flex gap-4 mt-6 flex-wrap justify-center font-sans">
                          {/* File Picker */}
                          <input
                            type="file"
                            id="image-file-upload"
                            onChange={handleImageFileChange}
                            accept="image/*"
                            className="hidden"
                          />
                          <label
                            htmlFor="image-file-upload"
                            className="px-4 py-2 bg-white border border-border rounded text-[12px] font-semibold text-text-secondary hover:text-primary hover:border-primary cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Choose Image File
                          </label>
                          
                          {/* Mobile Camera input */}
                          <input
                            type="file"
                            id="camera-photo-upload"
                            onChange={handleImageFileChange}
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                          />
                          <label
                            htmlFor="camera-photo-upload"
                            className="px-4 py-2 bg-primary text-white rounded text-[12px] font-semibold hover:bg-primary-light cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            Take Photo
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {imageStage === "preview" && (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center">
                        {/* Preview Window */}
                        <div className="relative border border-border rounded-lg bg-slate-50 w-full min-h-[300px] max-h-[450px] overflow-hidden flex items-center justify-center p-4">
                          <div className="relative overflow-visible max-w-full max-h-[400px] flex items-center justify-center">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="max-h-[380px] max-w-full rounded object-contain select-none shadow-sm"
                              style={{
                                transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
                                transformOrigin: "center center",
                                transition: "transform 0.15s ease-out"
                              }}
                            />
                            
                            {/* Dashed Crop Rectangle Overlay */}
                            {isCropActive && (
                              <div 
                                className="absolute border-2 border-dashed border-primary z-10 pointer-events-none"
                                style={{
                                  left: `${cropArea.left}%`,
                                  top: `${cropArea.top}%`,
                                  width: `${cropArea.width}%`,
                                  height: `${cropArea.height}%`
                                }}
                              >
                                <div className="absolute inset-0 bg-primary/10"></div>
                                <span className="absolute -top-6 left-0 bg-primary text-white text-[9px] font-bold px-1 rounded uppercase tracking-wider">Crop Area</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Controls Panel */}
                        <div className="w-full bg-slate-50 border-x border-b border-border rounded-b-lg p-4 flex flex-col gap-4 font-sans">
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            {/* Zoom / Rotate controls */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setZoom(z => Math.max(50, z - 10))}
                                className="p-1.5 bg-white border border-border rounded hover:text-primary hover:border-primary transition-colors cursor-pointer text-text-secondary"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4" />
                              </button>
                              <span className="text-[12px] font-medium w-12 text-center text-primary">{zoom}%</span>
                              <button
                                type="button"
                                onClick={() => setZoom(z => Math.min(200, z + 10))}
                                className="p-1.5 bg-white border border-border rounded hover:text-primary hover:border-primary transition-colors cursor-pointer text-text-secondary"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4" />
                              </button>
                              
                              <div className="h-6 w-px bg-border mx-1"></div>
                              
                              <button
                                type="button"
                                onClick={() => setRotation(r => (r + 90) % 360)}
                                className="p-1.5 bg-white border border-border rounded hover:text-primary hover:border-primary transition-colors cursor-pointer text-text-secondary flex items-center gap-1"
                                title="Rotate 90° Clockwise"
                              >
                                <RotateCw className="w-4 h-4" />
                                <span className="text-[11px] font-medium">Rotate</span>
                              </button>
                            </div>
                            
                            {/* Crop toggle / slider controls */}
                            <div className="flex items-center gap-2">
                              {!isCropActive ? (
                                <button
                                  type="button"
                                  onClick={() => setIsCropActive(true)}
                                  className="px-3 py-1.5 bg-white border border-border rounded hover:text-primary hover:border-primary transition-colors cursor-pointer text-text-secondary flex items-center gap-1.5 text-[12px] font-medium"
                                >
                                  <Crop className="w-4 h-4" />
                                  <span>Crop Area</span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={handleApplyCrop}
                                    className="px-3 py-1.5 bg-primary text-white rounded hover:bg-primary-light transition-colors cursor-pointer text-[12px] font-semibold"
                                  >
                                    Apply Crop
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsCropActive(false)}
                                    className="px-3 py-1.5 bg-white border border-border rounded hover:bg-primary-50 transition-colors cursor-pointer text-text-secondary text-[12px] font-medium"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Crop Bounding Box Adjustment Sliders */}
                          {isCropActive && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/60 pt-3 text-[11px] text-text-secondary">
                              <div className="space-y-1.5">
                                <div className="flex justify-between">
                                  <span>Horizontal Offset (Left): {cropArea.left}%</span>
                                  <span>Width: {cropArea.width}%</span>
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    type="range"
                                    min="0"
                                    max={100 - cropArea.width}
                                    value={cropArea.left}
                                    onChange={(e) => setCropArea(a => ({ ...a, left: parseInt(e.target.value) }))}
                                    className="w-full h-1 bg-primary-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                  />
                                  <input
                                    type="range"
                                    min="10"
                                    max={100 - cropArea.left}
                                    value={cropArea.width}
                                    onChange={(e) => setCropArea(a => ({ ...a, width: parseInt(e.target.value) }))}
                                    className="w-full h-1 bg-primary-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                  />
                                </div>
                              </div>
                              
                              <div className="space-y-1.5">
                                <div className="flex justify-between">
                                  <span>Vertical Offset (Top): {cropArea.top}%</span>
                                  <span>Height: {cropArea.height}%</span>
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    type="range"
                                    min="0"
                                    max={100 - cropArea.height}
                                    value={cropArea.top}
                                    onChange={(e) => setCropArea(a => ({ ...a, top: parseInt(e.target.value) }))}
                                    className="w-full h-1 bg-primary-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                  />
                                  <input
                                    type="range"
                                    min="10"
                                    max={100 - cropArea.top}
                                    value={cropArea.height}
                                    onChange={(e) => setCropArea(a => ({ ...a, height: parseInt(e.target.value) }))}
                                    className="w-full h-1 bg-primary-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Bottom strip */}
                      <div className="flex items-center justify-between pt-4 border-t border-border font-sans">
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setImageStage("select");
                          }}
                          className="px-4 py-2 bg-white border border-border rounded text-[12px] font-medium text-text-secondary hover:text-risk-red hover:border-risk-red/25 transition-colors cursor-pointer"
                        >
                          Retake / Select Another
                        </button>
                        
                        <button
                          type="button"
                          onClick={handleAnalyzeImage}
                          className="px-5 py-2 bg-primary hover:bg-primary-light text-white rounded text-[12px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Analyze Image</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action strip */}
              {activeTab !== "image" && (
                <div className="flex items-center justify-end gap-4 pt-2 border-t border-border">
                  <button
                    onClick={startAnalysis}
                    disabled={!canSubmit}
                    className={`px-5 py-2 rounded text-[13px] font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                      canSubmit
                        ? "bg-primary text-white hover:bg-primary-light"
                        : "bg-primary-100 text-text-secondary border border-border cursor-not-allowed"
                    }`}
                    aria-label="Begin document analysis"
                  >
                    <span>Begin Analysis</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>
          ) : activeTab === "image" && (imageStage === "ocr_processing" || imageStage === "blur_warning" || imageStage === "invalid_document") ? (
            /* Custom Image Analysis states that override the submission screen */
            <div className="space-y-6">
              {imageStage === "ocr_processing" && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto" role="status" aria-live="polite">
                  <div className="w-10 h-10 rounded bg-primary-100 flex items-center justify-center animate-spin">
                    <RefreshCw className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-2 w-full font-sans">
                    <h3 className="font-semibold text-[14px] text-primary">Running Quality Check & OCR...</h3>
                    <p className="text-[12px] text-text-secondary italic h-4 leading-relaxed">{statusMessage}</p>
                    
                    {ocrProgress > 0 && (
                      <div className="space-y-1.5 w-full mt-4">
                        <div className="flex justify-between text-[10px] font-bold text-text-secondary">
                          <span>Text Recognition (OCR)</span>
                          <span>{ocrProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-primary-50 rounded-full overflow-hidden border border-border">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${ocrProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    <p className="text-[10px] text-text-muted mt-2">Processing characters in WebAssembly. Please keep the window open.</p>
                  </div>
                </div>
              )}

              {imageStage === "blur_warning" && (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto font-sans">
                  <div className="w-12 h-12 rounded-full bg-risk-red-light border border-risk-red/10 flex items-center justify-center text-risk-red">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-[15px] text-primary">Image is Blurry</h3>
                    <p className="text-[12px] text-text-secondary leading-relaxed">
                      Image quality is too low for reliable legal analysis. Please make sure the document is well-lit, flat, and legible.
                    </p>
                    
                    <div className="bg-slate-50 border border-border rounded p-3 mt-4 text-left text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-text-secondary font-medium">Blur Level Variance:</span>
                        <span className="font-bold text-risk-red">{qualityMetrics.variance.toFixed(1)} (Min: 20.0)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary font-medium">Detected Resolution:</span>
                        <span className="font-bold text-primary">{qualityMetrics.resolution}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary font-medium">Readability check:</span>
                        <span className="font-bold text-risk-red">Unacceptable</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-2 w-full justify-center">
                    <button
                      onClick={() => {
                        const fileInput = document.getElementById("camera-photo-upload");
                        if (fileInput) fileInput.click();
                      }}
                      className="px-4 py-2 bg-primary text-white rounded text-[12px] font-semibold hover:bg-primary-light cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Retake Photo</span>
                    </button>
                    <button
                      onClick={() => {
                        const fileInput = document.getElementById("image-file-upload");
                        if (fileInput) fileInput.click();
                      }}
                      className="px-4 py-2 bg-white border border-border rounded text-[12px] font-medium text-text-secondary hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Another Image</span>
                    </button>
                  </div>
                </div>
              )}

              {imageStage === "invalid_document" && (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto font-sans">
                  <div className="w-12 h-12 rounded-full bg-risk-red-light border border-risk-red/10 flex items-center justify-center text-risk-red">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-2 w-full">
                    <h3 className="font-bold text-[15px] text-primary">Invalid Document Class</h3>
                    <p className="text-[12px] text-risk-red font-medium leading-relaxed bg-risk-red-light/35 border border-risk-red/10 px-3 py-2 rounded">
                      Uploaded image does not appear to contain a valid legal document.
                    </p>
                    
                    <div className="bg-slate-50 border border-border rounded p-4 text-left text-[11.5px] space-y-2 mt-4">
                      <div className="flex justify-between border-b border-border/60 pb-1.5">
                        <span className="text-text-secondary font-medium">Legal Document Confidence:</span>
                        <span className="font-bold text-risk-red">{invalidDocMetrics.confidenceScore}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-text-secondary font-semibold block">Classification Reason:</span>
                        <p className="text-primary italic leading-relaxed bg-white border border-border/40 p-2.5 rounded text-[11px] whitespace-pre-line">
                          {invalidDocMetrics.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-2 w-full justify-center">
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setImageStage("select");
                      }}
                      className="px-5 py-2.5 bg-primary text-white rounded text-[12px] font-semibold hover:bg-primary-light cursor-pointer transition-colors shadow-xs"
                    >
                      Upload Another Image
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Analysis Progress state */
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto" role="status" aria-live="polite">
              <div className="w-10 h-10 rounded bg-primary-100 flex items-center justify-center animate-spin">
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-2 w-full">
                <h3 className="font-semibold text-[14px] text-primary">Analyzing Document...</h3>
                <p className="text-[12px] text-text-secondary italic h-4 leading-relaxed">{statusMessage}</p>
                <div className="w-full h-1.5 bg-primary-100 rounded-full overflow-hidden mt-4">
                  <div className="h-full bg-primary rounded-full animate-pulse w-3/4"></div>
                </div>
                <p className="text-[10px] text-text-muted">This may take up to 30 seconds for complex documents.</p>
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
              className="text-[11px] font-semibold text-text-secondary hover:text-primary transition-colors cursor-pointer"
            >
              View All Library
            </button>
          </div>
          
          {historyLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white border border-border rounded p-4 animate-pulse">
                  <div className="w-7 h-7 rounded bg-primary-100 mb-3"></div>
                  <div className="w-3/4 h-3 bg-primary-100 rounded mb-2"></div>
                  <div className="w-1/2 h-2 bg-primary-100 rounded"></div>
                </div>
              ))}
            </div>
          ) : recentDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentDocs.map((doc) => {
                const risk = getRiskInfo(doc);
                const docName = doc.metadata?.document_type || "Legal Document";
                const date = doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "";
                const clauseCount = (doc.clauses?.standard_clauses?.length || 0) + (doc.clauses?.non_standard_clauses?.length || 0);
                
                return (
                  <div 
                    key={doc.document_id}
                    onClick={() => navigate(`/analysis/${doc.document_id}`)}
                    className="bg-white border border-border rounded p-4 flex flex-col justify-between hover:shadow-sm cursor-pointer transition-all hover:border-primary-light"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && navigate(`/analysis/${doc.document_id}`)}
                    aria-label={`Open analysis for ${docName}`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-7 h-7 rounded bg-primary-100 flex items-center justify-center">
                          <FileText className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-semibold rounded uppercase tracking-wider border ${risk.style}`}>
                          {risk.label}
                        </span>
                      </div>
                      <h4 className="font-semibold text-[13px] text-primary leading-snug truncate">{docName}</h4>
                      <p className="text-[11px] text-text-secondary mt-1">
                        {date} • {clauseCount} clauses
                      </p>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                      <span>{doc.metadata?.parties?.[0] || "Document"}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-border rounded p-8 text-center">
              <FileText className="w-8 h-8 text-text-muted mx-auto mb-3" />
              <p className="text-[13px] text-text-secondary">No documents analyzed yet. Upload your first document above.</p>
            </div>
          )}
        </div>
      </div>

      {/* Simulated Cloud File Picker Modal */}
      {isCloudModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-border shadow-xl max-w-lg w-full overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-border flex items-center justify-between bg-primary-50/50">
              <div className="flex items-center gap-2">
                <Cloud className="w-4.5 h-4.5 text-primary" />
                <h3 className="font-semibold text-[14px] text-primary">Import from {cloudProvider}</h3>
              </div>
              <button 
                onClick={() => setIsCloudModalOpen(false)}
                className="p-1 hover:bg-primary-100 rounded text-text-secondary hover:text-primary transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-[11.5px] text-text-secondary leading-relaxed">
                Connect and import legal documents directly from your organizational files in {cloudProvider}.
              </p>
              
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {CLOUD_MOCK_FILES.map((file, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleImportCloudFile(file)}
                    className="p-3 border border-border rounded flex items-center justify-between hover:bg-primary-50 hover:border-primary cursor-pointer transition-all bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary-100/60 flex items-center justify-center text-primary">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-[12.5px] text-primary leading-tight">{file.name}</h4>
                        <p className="text-[10px] text-text-secondary mt-0.5">{file.type} • {file.size}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-text-muted hover:text-primary uppercase tracking-wider">Import</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-3.5 border-t border-border flex justify-end bg-primary-50/10">
              <button 
                onClick={() => setIsCloudModalOpen(false)}
                className="px-4 py-2 bg-white border border-border rounded text-[12px] font-semibold text-text-secondary hover:text-primary cursor-pointer transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
