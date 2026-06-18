import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getSystemStatus, 
  submitSupportTicket, 
  submitBugReport, 
  submitFeatureRequest 
} from "@/services/api";
import { 
  X, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  AlertTriangle, 
  Bot, 
  Server, 
  BookOpen, 
  Sparkles, 
  Send,
  RefreshCw,
  CheckCircle,
  FileText
} from "lucide-react";

const helpArticles = [
  {
    category: "Getting Started",
    title: "Introduction to Lexicon AI",
    content: "Welcome to Lexicon AI! Learn how to navigate your workspace, access your library, and understand your contract metrics dashboard.",
  },
  {
    category: "Uploading Documents",
    title: "Uploading PDFs for Analysis",
    content: "Upload agreements (NDAs, MSAs, Leases) up to 50MB. Make sure the files are not password-protected and contain readable text for the OCR parser.",
  },
  {
    category: "Contract Analysis",
    title: "Understanding Contract Summaries",
    content: "Our AI compiles legal jargon into clean executive summaries and TL;DR paragraphs, highlighting the core intent and involved parties.",
  },
  {
    category: "Risk Detection",
    title: "Risk Severity Weights & Flags",
    content: "Risks are categorized into Low, Medium, and High (Critical) severity, assigning weights from 1 to 3 to calculate an overall risk score.",
  },
  {
    category: "Clause Extraction",
    title: "Standard vs Non-Standard Clauses",
    content: "Standard clauses represent standard terms. Non-standard clauses highlight asymmetric liabilities, unusual termination terms, or restrictive covenants.",
  },
  {
    category: "Chatbot Usage",
    title: "Context-Aware AI Chat",
    content: "Ask direct questions (e.g. 'What is the governing law?') in the AI Assistant chat. The AI answers using the active document's context.",
  },
  {
    category: "Account Management",
    title: "Managing Settings and API Keys",
    content: "Retrieve your developer token under System Settings. Note that your user settings allow editing your profile and setting custom alerts.",
  }
];

const faqs = [
  {
    question: "What file formats are supported?",
    answer: "Currently, only PDF (.pdf) files and raw text submissions are supported for analysis.",
  },
  {
    question: "What is the maximum PDF size?",
    answer: "The maximum file size limit for uploaded PDF documents is 50 MB.",
  },
  {
    question: "How does risk detection work?",
    answer: "Lexicon AI evaluates your legal text against standard industry compliance rules and extracts risks, assigning severity weights based on liability exposure.",
  },
  {
    question: "Can I access previous analyses?",
    answer: "Yes. All analyzed documents are saved in your Document Library and History, letting you reopen them and ask context-aware questions at any time.",
  },
  {
    question: "How does the chatbot work?",
    answer: "The chatbot queries an OpenAI/Groq LLM model in real-time, passing the full structural context (summary, risks, clauses, metadata) of the document to answer your questions accurately.",
  }
];

export default function SupportDrawer({ isOpen, onClose }) {
  const { userName, userEmail } = useAuth();
  const drawerRef = useRef(null);
  
  // Tab state: "help" | "contact" | "bug" | "feature" | "docs" | "status"
  const [activeTab, setActiveTab] = useState("help");
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  
  // FAQ accordion state: stores indices of open FAQs
  const [openFaqIdx, setOpenFaqIdx] = useState(null);
  
  // Status state
  const [systemStatus, setSystemStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");
  
  // Contact Support Form state
  const [ticketForm, setTicketForm] = useState({ subject: "", message: "" });
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState("");
  const [ticketError, setTicketError] = useState("");
  
  // Report Bug Form state
  const [bugForm, setBugForm] = useState({ title: "", description: "", steps: "", severity: "Low" });
  const [bugLoading, setBugLoading] = useState(false);
  const [bugSuccess, setBugSuccess] = useState("");
  const [bugError, setBugError] = useState("");
  
  // Feature Request Form state
  const [featureForm, setFeatureForm] = useState({ title: "", description: "", impact: "" });
  const [featureLoading, setFeatureLoading] = useState(false);
  const [featureSuccess, setFeatureSuccess] = useState("");
  const [featureError, setFeatureError] = useState("");

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch status on tab change to status
  useEffect(() => {
    if (activeTab === "status" && isOpen) {
      fetchStatus();
    }
  }, [activeTab, isOpen]);

  // Trap focus inside drawer for accessibility when open
  useEffect(() => {
    if (!isOpen) return;
    const focusableElements = drawerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex="0"]'
    );
    if (focusableElements && focusableElements.length > 0) {
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      const handleTabTrap = (e) => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      };
      
      firstElement.focus();
      window.addEventListener('keydown', handleTabTrap);
      return () => window.removeEventListener('keydown', handleTabTrap);
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    setStatusLoading(true);
    setStatusError("");
    try {
      const statusData = await getSystemStatus();
      setSystemStatus(statusData);
    } catch (err) {
      setStatusError("Failed to fetch system status. Please verify backend connection.");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      setTicketError("Please fill out all required fields.");
      return;
    }
    setTicketLoading(true);
    setTicketError("");
    setTicketSuccess("");
    try {
      await submitSupportTicket({
        name: userName,
        email: userEmail,
        subject: ticketForm.subject.trim(),
        message: ticketForm.message.trim()
      });
      setTicketSuccess("Support request submitted successfully! Our team will contact you shortly.");
      setTicketForm({ subject: "", message: "" });
    } catch (err) {
      setTicketError(err.message || "Failed to submit request. Please try again.");
    } finally {
      setTicketLoading(false);
    }
  };

  const handleBugSubmit = async (e) => {
    e.preventDefault();
    if (!bugForm.title.trim() || !bugForm.description.trim() || !bugForm.steps.trim()) {
      setBugError("Please fill out all required fields.");
      return;
    }
    setBugLoading(true);
    setBugError("");
    setBugSuccess("");
    try {
      await submitBugReport({
        title: bugForm.title.trim(),
        description: bugForm.description.trim(),
        steps_to_reproduce: bugForm.steps.trim(),
        severity: bugForm.severity
      });
      setBugSuccess("Bug reported successfully! Thank you for helping us improve.");
      setBugForm({ title: "", description: "", steps: "", severity: "Low" });
    } catch (err) {
      setBugError(err.message || "Failed to submit bug report. Please try again.");
    } finally {
      setBugLoading(false);
    }
  };

  const handleFeatureSubmit = async (e) => {
    e.preventDefault();
    if (!featureForm.title.trim() || !featureForm.description.trim() || !featureForm.impact.trim()) {
      setFeatureError("Please fill out all required fields.");
      return;
    }
    setFeatureLoading(true);
    setFeatureError("");
    setFeatureSuccess("");
    try {
      await submitFeatureRequest({
        title: featureForm.title.trim(),
        description: featureForm.description.trim(),
        business_impact: featureForm.impact.trim()
      });
      setFeatureSuccess("Feature request submitted successfully! We review all feedback for roadmap consideration.");
      setFeatureForm({ title: "", description: "", impact: "" });
    } catch (err) {
      setFeatureError(err.message || "Failed to submit feature request. Please try again.");
    } finally {
      setFeatureLoading(false);
    }
  };

  // Filter Help Articles & FAQs based on Search
  const filteredArticles = helpArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: "help", label: "Help & FAQs" },
    { id: "contact", label: "Contact Support" },
    { id: "bug", label: "Report a Bug" },
    { id: "feature", label: "Feature Request" },
    { id: "docs", label: "Documentation" },
    { id: "status", label: "System Status" }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" role="dialog" aria-modal="true" aria-label="Support Center Panel">
      {/* Backdrop Backdrop Overlay */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/40 transition-opacity backdrop-blur-xs animate-fade-in"
        aria-hidden="true"
      />

      {/* Slide-over Content Drawer */}
      <div 
        ref={drawerRef}
        className="relative w-full max-w-2xl bg-background border-l border-border h-full shadow-2xl flex flex-col z-35 animate-slide-in"
      >
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-primary flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" aria-hidden="true" />
              <span>Lexicon AI Support Center</span>
            </h2>
            <p className="text-[11.5px] text-text-secondary mt-0.5">Explore guides, check system status, or submit tickets.</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded hover:bg-primary-50 text-text-secondary hover:text-primary transition-colors cursor-pointer"
            aria-label="Close support panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Menu */}
        <div className="bg-white border-b border-border px-4 shrink-0 overflow-x-auto">
          <nav className="flex gap-1 py-1" aria-label="Support sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setTicketSuccess(""); setBugSuccess(""); setFeatureSuccess(""); }}
                className={`px-3.5 py-2 text-[12.5px] font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-text-secondary hover:text-primary hover:border-border/40"
                }`}
                aria-selected={activeTab === tab.id}
                role="tab"
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Drawer Scrollable Body Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* HELP CENTER & FAQS TAB */}
          {activeTab === "help" && (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-text-muted" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search articles and FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded text-[13px] placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-xs"
                  aria-label="Search support content"
                />
              </div>

              {/* Categorized Help Articles */}
              <div className="space-y-3">
                <h3 className="text-[11.5px] font-bold text-text-secondary uppercase tracking-wider">Help Center Articles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredArticles.map((article, idx) => (
                    <div key={idx} className="p-4 border border-border bg-white rounded shadow-xs hover:border-primary-light hover:shadow-sm transition-all duration-300">
                      <span className="text-[9.5px] font-semibold text-text-muted uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary-50 border border-primary/5">{article.category}</span>
                      <h4 className="font-semibold text-[13px] text-primary mt-2">{article.title}</h4>
                      <p className="text-[12px] text-text-secondary leading-relaxed mt-1">{article.content}</p>
                    </div>
                  ))}
                  {filteredArticles.length === 0 && (
                    <p className="text-[12px] text-text-secondary italic col-span-2">No help articles match your search.</p>
                  )}
                </div>
              </div>

              {/* FAQs Accordion */}
              <div className="space-y-3 pt-2">
                <h3 className="text-[11.5px] font-bold text-text-secondary uppercase tracking-wider">Frequently Asked Questions</h3>
                <div className="border border-border bg-white rounded divide-y divide-border overflow-hidden shadow-xs">
                  {filteredFaqs.map((faq, idx) => {
                    const isOpen = openFaqIdx === idx;
                    return (
                      <div key={idx} className="transition-colors">
                        <button
                          onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                          className="w-full p-4 flex items-center justify-between text-left font-semibold text-[13px] text-primary hover:bg-primary-50/50 cursor-pointer transition-colors"
                          aria-expanded={isOpen}
                          aria-controls={`faq-answer-${idx}`}
                        >
                          <span>{faq.question}</span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                        </button>
                        {isOpen && (
                          <div 
                            id={`faq-answer-${idx}`}
                            className="px-4 pb-4 pt-1 text-[12px] text-text-secondary leading-relaxed bg-primary-50/15"
                            role="region"
                          >
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredFaqs.length === 0 && (
                    <p className="text-[12px] text-text-secondary italic p-4">No FAQs match your search.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CONTACT SUPPORT TAB */}
          {activeTab === "contact" && (
            <div className="bg-white border border-border p-6 rounded shadow-sm space-y-6">
              <div>
                <h3 className="font-semibold text-[14px] text-primary">Contact Legal Operations Support</h3>
                <p className="text-[12px] text-text-secondary mt-0.5">Submit an institutional request. Our dedicated legal engineers will resolve it.</p>
              </div>

              {ticketSuccess ? (
                <div className="p-4 bg-risk-green-light border border-risk-green/20 rounded flex items-start gap-2.5 text-risk-green text-[12px]" role="alert">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Submission Successful</span>
                    <span className="block mt-0.5">{ticketSuccess}</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleTicketSubmit} className="space-y-4 text-[12px]">
                  {ticketError && (
                    <div className="p-3 bg-risk-red-light border border-risk-red/20 rounded text-risk-red text-[11.5px]" role="alert">
                      {ticketError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Requester Name</span>
                      <input 
                        type="text" 
                        value={userName} 
                        disabled 
                        className="w-full px-3 py-2 border border-border bg-primary-50 rounded text-[13px] text-text-secondary cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Email Address</span>
                      <input 
                        type="email" 
                        value={userEmail} 
                        disabled 
                        className="w-full px-3 py-2 border border-border bg-primary-50 rounded text-[13px] text-text-secondary cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="ticket-subject" className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Subject</label>
                    <input 
                      id="ticket-subject"
                      type="text" 
                      required
                      placeholder="e.g. OCR PDF parser failing on Lease agreement"
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                      className="w-full px-3 py-2 border border-border bg-white rounded text-[13px] text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="ticket-message" className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Message Description</label>
                    <textarea 
                      id="ticket-message"
                      rows={5}
                      required
                      placeholder="Describe the issue you are facing in detail..."
                      value={ticketForm.message}
                      onChange={(e) => setTicketForm({...ticketForm, message: e.target.value})}
                      className="w-full px-3 py-2 border border-border bg-white rounded text-[13px] text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={ticketLoading}
                    className="w-full py-2 bg-primary hover:bg-primary-light text-white text-[13px] font-semibold rounded flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                  >
                    {ticketLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{ticketLoading ? "Submitting Request..." : "Submit Support Request"}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* REPORT A BUG TAB */}
          {activeTab === "bug" && (
            <div className="bg-white border border-border p-6 rounded shadow-sm space-y-6">
              <div>
                <h3 className="font-semibold text-[14px] text-primary">Report a System Bug</h3>
                <p className="text-[12px] text-text-secondary mt-0.5">Discovered a system issue? Document the bug parameters below.</p>
              </div>

              {bugSuccess ? (
                <div className="p-4 bg-risk-green-light border border-risk-green/20 rounded flex items-start gap-2.5 text-risk-green text-[12px]" role="alert">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Bug Report Logged</span>
                    <span className="block mt-0.5">{bugSuccess}</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBugSubmit} className="space-y-4 text-[12px]">
                  {bugError && (
                    <div className="p-3 bg-risk-red-light border border-risk-red/20 rounded text-risk-red text-[11.5px]" role="alert">
                      {bugError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="bug-title" className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Bug Title</label>
                      <input 
                        id="bug-title"
                        type="text" 
                        required
                        placeholder="e.g. Chatbot fails on long PDF context"
                        value={bugForm.title}
                        onChange={(e) => setBugForm({...bugForm, title: e.target.value})}
                        className="w-full px-3 py-2 border border-border bg-white rounded text-[13px] text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="bug-severity" className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Severity</label>
                      <select 
                        id="bug-severity"
                        value={bugForm.severity}
                        onChange={(e) => setBugForm({...bugForm, severity: e.target.value})}
                        className="w-full px-3 py-2 border border-border bg-white rounded text-[13px] text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer"
                      >
                        <option value="Low">Low (UI glitch, minor issue)</option>
                        <option value="Medium">Medium (Incorrect counts, stats discrepancies)</option>
                        <option value="High">High (Endpoint returns error, analysis fails)</option>
                        <option value="Critical">Critical (System down, auth crashes)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="bug-desc" className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Description</label>
                    <textarea 
                      id="bug-desc"
                      rows={3}
                      required
                      placeholder="Describe what occurred compared to the expected behavior..."
                      value={bugForm.description}
                      onChange={(e) => setBugForm({...bugForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-border bg-white rounded text-[13px] text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="bug-steps" className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Steps to Reproduce</label>
                    <textarea 
                      id="bug-steps"
                      rows={3}
                      required
                      placeholder="1. Navigate to dashboard&#10;2. Click PDF upload&#10;3. Select corrupted file..."
                      value={bugForm.steps}
                      onChange={(e) => setBugForm({...bugForm, steps: e.target.value})}
                      className="w-full px-3 py-2 border border-border bg-white rounded text-[13px] text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={bugLoading}
                    className="w-full py-2 bg-primary hover:bg-primary-light text-white text-[13px] font-semibold rounded flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                  >
                    {bugLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                    <span>{bugLoading ? "Submitting Bug Report..." : "Log Bug Report"}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* FEATURE REQUEST TAB */}
          {activeTab === "feature" && (
            <div className="bg-white border border-border p-6 rounded shadow-sm space-y-6">
              <div>
                <h3 className="font-semibold text-[14px] text-primary">Request a Feature</h3>
                <p className="text-[12px] text-text-secondary mt-0.5">Share your workflow requirements with our product engineering team.</p>
              </div>

              {featureSuccess ? (
                <div className="p-4 bg-risk-green-light border border-risk-green/20 rounded flex items-start gap-2.5 text-risk-green text-[12px]" role="alert">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Feature Request Registered</span>
                    <span className="block mt-0.5">{featureSuccess}</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFeatureSubmit} className="space-y-4 text-[12px]">
                  {featureError && (
                    <div className="p-3 bg-risk-red-light border border-risk-red/20 rounded text-risk-red text-[11.5px]" role="alert">
                      {featureError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label htmlFor="feature-title" className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Feature Title</label>
                    <input 
                      id="feature-title"
                      type="text" 
                      required
                      placeholder="e.g. Export extracted clauses to Word DOCX format"
                      value={featureForm.title}
                      onChange={(e) => setFeatureForm({...featureForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-border bg-white rounded text-[13px] text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="feature-desc" className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Description</label>
                    <textarea 
                      id="feature-desc"
                      rows={4}
                      required
                      placeholder="Describe the feature request, user workflow, and target goals..."
                      value={featureForm.description}
                      onChange={(e) => setFeatureForm({...featureForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-border bg-white rounded text-[13px] text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="feature-impact" className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Business Impact</label>
                    <textarea 
                      id="feature-impact"
                      rows={3}
                      required
                      placeholder="Explain how this feature accelerates deal closing, contract audits, or firm efficiency..."
                      value={featureForm.impact}
                      onChange={(e) => setFeatureForm({...featureForm, impact: e.target.value})}
                      className="w-full px-3 py-2 border border-border bg-white rounded text-[13px] text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={featureLoading}
                    className="w-full py-2 bg-primary hover:bg-primary-light text-white text-[13px] font-semibold rounded flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                  >
                    {featureLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{featureLoading ? "Registering Request..." : "Submit Feature Request"}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* DOCUMENTATION TAB */}
          {activeTab === "docs" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border/80">
                <h3 className="font-semibold text-[14px] text-primary">System Documentation</h3>
                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Developer & User resources</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a 
                  href="https://supabase.com/docs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-5 border border-border bg-white rounded shadow-xs hover:border-primary hover:shadow-sm transition-all group flex flex-col justify-between h-36"
                  aria-label="Open User Guide in new tab"
                >
                  <div>
                    <BookOpen className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors mb-2" aria-hidden="true" />
                    <h4 className="font-semibold text-[13px] text-primary">User Guide</h4>
                    <p className="text-[12px] text-text-secondary mt-1">End-to-end user manual detailing document upload, summaries, and chat usage.</p>
                  </div>
                </a>

                <a 
                  href="https://fastapi.tiangolo.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-5 border border-border bg-white rounded shadow-xs hover:border-primary hover:shadow-sm transition-all group flex flex-col justify-between h-36"
                  aria-label="Open API Documentation in new tab"
                >
                  <div>
                    <FileText className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors mb-2" aria-hidden="true" />
                    <h4 className="font-semibold text-[13px] text-primary">API Documentation</h4>
                    <p className="text-[12px] text-text-secondary mt-1">Detailed documentation of the FastAPI endpoints, request schemas, and payloads.</p>
                  </div>
                </a>

                <a 
                  href="https://github.com/openai/openai-python" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-5 border border-border bg-white rounded shadow-xs hover:border-primary hover:shadow-sm transition-all group flex flex-col justify-between h-36"
                  aria-label="Open Legal Analyzer Guide in new tab"
                >
                  <div>
                    <Sparkles className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors mb-2" aria-hidden="true" />
                    <h4 className="font-semibold text-[13px] text-primary">Legal Analyzer Guide</h4>
                    <p className="text-[12px] text-text-secondary mt-1">Overview of how the AI model parses contracts, computes risk, and extracts clauses.</p>
                  </div>
                </a>

                <a 
                  href="https://platform.openai.com/docs/guides/chat" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-5 border border-border bg-white rounded shadow-xs hover:border-primary hover:shadow-sm transition-all group flex flex-col justify-between h-36"
                  aria-label="Open Chatbot Guide in new tab"
                >
                  <div>
                    <Bot className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors mb-2" aria-hidden="true" />
                    <h4 className="font-semibold text-[13px] text-primary">Chatbot Guide</h4>
                    <p className="text-[12px] text-text-secondary mt-1">Guide on leveraging the context-aware chatbot for contract auditing.</p>
                  </div>
                </a>
              </div>
            </div>
          )}

          {/* SYSTEM STATUS TAB */}
          {activeTab === "status" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border/80 pb-2">
                <div>
                  <h3 className="font-semibold text-[14px] text-primary">System Health Status</h3>
                  <p className="text-[11px] text-text-secondary mt-0.5">Live checking of server, database, and LLM integrations.</p>
                </div>
                <button
                  onClick={fetchStatus}
                  disabled={statusLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-white rounded text-[12px] text-text-secondary hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
                  aria-label="Refresh system status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${statusLoading ? "animate-spin" : ""}`} />
                  <span>{statusLoading ? "Checking..." : "Check Status"}</span>
                </button>
              </div>

              {statusError && (
                <div className="p-3.5 bg-risk-red-light border border-risk-red/20 rounded text-risk-red text-[12px]" role="alert">
                  {statusError}
                </div>
              )}

              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Backend Server Status */}
                <div className="p-4 border border-border bg-white rounded shadow-xs flex flex-col justify-between h-28">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">API Backend</span>
                    <Server className="w-4.5 h-4.5 text-text-muted" aria-hidden="true" />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${systemStatus ? "bg-risk-green animate-pulse" : "bg-text-muted"}`} aria-hidden="true"></span>
                    <span className="font-bold text-[14px] text-primary">
                      {systemStatus ? "Online" : "Unknown"}
                    </span>
                  </div>
                </div>

                {/* Database Status */}
                <div className="p-4 border border-border bg-white rounded shadow-xs flex flex-col justify-between h-28">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Database Agent</span>
                    <Server className="w-4.5 h-4.5 text-text-muted" aria-hidden="true" />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${systemStatus?.database === "online" ? "bg-risk-green animate-pulse" : "bg-risk-red"}`} aria-hidden="true"></span>
                    <span className="font-bold text-[14px] text-primary">
                      {systemStatus ? (systemStatus.database === "online" ? "Online" : "Offline") : "Unknown"}
                    </span>
                  </div>
                </div>

                {/* AI Service Status */}
                <div className="p-4 border border-border bg-white rounded shadow-xs flex flex-col justify-between h-28">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">AI Service Client</span>
                    <Bot className="w-4.5 h-4.5 text-text-muted" aria-hidden="true" />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${systemStatus?.ai_service === "online" ? "bg-risk-green animate-pulse" : "bg-risk-red"}`} aria-hidden="true"></span>
                    <span className="font-bold text-[14px] text-primary">
                      {systemStatus ? (systemStatus.ai_service === "online" ? "Online" : "Offline") : "Unknown"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Details */}
              <div className="p-4 border border-border bg-white rounded text-[11.5px] text-text-secondary leading-relaxed">
                <strong>Deployment Note:</strong> If any components display as <span className="text-risk-red font-semibold">Offline</span>, please ensure that your environment configurations (`backend/.env` and `.env`) are correctly configured with valid Supabase DB client credentials and LLM keys, and verify the FastAPI server port.
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
