import React, { useState, useEffect, useRef } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../../lib/supabase';
import { usePlaybook } from '../../context/PlaybookContext';

const API_BASE = 'http://localhost:5000';

export default function WorkspaceView({ docId, navigate, showToast }) {
  const [activePanel, setActivePanel] = useState('overview'); // 'overview' | 'clauses' | 'risks' | 'definitions'
  const [documentText, setDocumentText] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [resolvedRisks, setResolvedRisks] = useState([]);
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: "Hello! I am your AI Contract Assistant. Ask me anything about this contract." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Redraft Modal state
  const [redraftOpen, setRedraftOpen] = useState(false);
  const [redraftTitle, setRedraftTitle] = useState('');
  const [redraftOriginal, setRedraftOriginal] = useState('');
  const [redraftSuggestion, setRedraftSuggestion] = useState('');
  const [isGeneratingRedraft, setIsGeneratingRedraft] = useState(false);
  const [targetClauseIdx, setTargetClauseIdx] = useState(-1);
  const [isVerifyingCompliance, setIsVerifyingCompliance] = useState(false);
  const [complianceStatus, setComplianceStatus] = useState(null);
  const { getActiveRules } = usePlaybook();

  // Export Modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    summary: true,
    risks: true,
    clauses: true,
    metadata: true
  });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    // If no docId is provided, try to fallback to the first uploaded file in localStorage
    let targetId = docId;
    if (!targetId) {
      const docList = JSON.parse(localStorage.getItem('documents') || '[]');
      const userDocs = docList.filter(doc => doc.id && !String(doc.id).startsWith('static'));
      if (userDocs.length > 0) {
        targetId = userDocs[0].id;
      }
    }

    if (targetId) {
      loadAnalysisData(targetId);
    } else {
      showToast("No active analysis session found. Showing demo metrics.");
      loadMockFallbacks();
    }
  }, [docId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);

  const loadAnalysisData = (id) => {
    fetch(`${API_BASE}/analyses/${id}/text`)
      .then(res => {
        if (!res.ok) throw new Error("Document text not found");
        return res.json();
      })
      .then(textData => {
        setDocumentText(textData.text);
        
        // Fetch/load cached analysis JSON
        const cached = localStorage.getItem(`analysis_${id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setAnalysisData(parsed);
          setResolvedRisks(parsed.metadata?.resolved_risks || []);
        } else {
          fetch(`${API_BASE}/analyses/${id}`)
            .then(res => res.json())
            .then(analysis => {
              localStorage.setItem(`analysis_${id}`, JSON.stringify(analysis));
              setAnalysisData(analysis);
              setResolvedRisks(analysis.metadata?.resolved_risks || []);
            });
        }
      })
      .catch(err => {
        console.error("Failed to load backend analysis session:", err);
        showToast("Error loading document. Loading demo fallbacks.");
        loadMockFallbacks();
      });
  };

  const loadMockFallbacks = () => {
    // Basic mock fallbacks
    setResolvedRisks([]);
    setDocumentText(
      "MASTER SERVICES AGREEMENT\n\nThis Agreement is entered into by Juris Precision Systems and TechFlow Inc. (effective Oct 24, 2023).\n\n" +
      "1. PAYMENT TERMS\nAll invoices must be paid within 30 days of receipt. Late payments will incur standard statutory interest fees.\n\n" +
      "2. LIMITATION OF LIABILITY\nTO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR INDIRECT, SPECIAL, OR CONSEQUENTIAL DAMAGES.\n\n" +
      "3. GOVERNING LAW\nThis Agreement is governed by the laws of the State of Delaware.\n"
    );
    setAnalysisData({
      document_id: "demo",
      filename: "Service_Agreement.pdf",
      summary: {
        main_summary: "A standard master services agreement outlining payment schedules, confidentiality covenants, and liability cap limitations.",
        tldr: "Standard agreement. Highly compliant expect for IP carveout in Section 4.",
        key_points: [
          "Net 30 payment schedule.",
          "State of Delaware governing law.",
          "Indemnification caps are missing."
        ]
      },
      risks: [
        {
          title: "Uncapped Infringement Claims",
          severity: "HIGH",
          description: "No cap is specified for intellectual property infringement indemnity, posing unlimited liabilities."
        },
        {
          title: "30-Day Payment Timeline",
          severity: "LOW",
          description: "Strict Net-30 payment intervals may trigger early collection overheads."
        }
      ],
      clauses: {
        standard_clauses: [
          { title: "Governing Law", content: "This Agreement is governed by the laws of the State of Delaware." }
        ],
        non_standard_clauses: [
          { title: "Limitation of Liability", content: "IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR INDIRECT, SPECIAL, OR CONSEQUENTIAL DAMAGES." }
        ]
      },
      metadata: {
        document_type: "Master Services Agreement",
        parties: ["Juris Precision Systems", "TechFlow Inc."],
        effective_date: "Oct 24, 2023"
      }
    });
  };

  const toggleRiskResolution = async (riskTitle) => {
    const isCurrentlyResolved = resolvedRisks.includes(riskTitle);
    const newStatus = !isCurrentlyResolved;
    
    // Optimistic update
    setResolvedRisks(prev => 
      newStatus ? [...prev, riskTitle] : prev.filter(r => r !== riskTitle)
    );

    if (analysisData && analysisData.document_id !== 'demo') {
      try {
        await fetch(`${API_BASE}/resolve_risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_id: analysisData.document_id,
            risk_title: riskTitle,
            is_resolved: newStatus
          })
        });
        
        // Update local cache so it persists on reload
        const cached = JSON.parse(localStorage.getItem(`analysis_${analysisData.document_id}`) || '{}');
        if (!cached.metadata) cached.metadata = {};
        cached.metadata.resolved_risks = newStatus 
          ? [...(cached.metadata.resolved_risks || []), riskTitle]
          : (cached.metadata.resolved_risks || []).filter(r => r !== riskTitle);
        localStorage.setItem(`analysis_${analysisData.document_id}`, JSON.stringify(cached));
        
      } catch (err) {
        console.error("Failed to update risk resolution", err);
        // Revert on failure
        setResolvedRisks(prev => 
          !newStatus ? [...prev, riskTitle] : prev.filter(r => r !== riskTitle)
        );
        showToast("Failed to save resolution status.");
      }
    }
  };

  const escapeHtml = (unsafe) => {
    if (typeof unsafe !== 'string') return "";
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // HTML Highlight Injector
  const getHighlightedTextHtml = () => {
    if (!documentText) return '';
    let highlighted = escapeHtml(documentText);
    if (!analysisData) return highlighted;

    const allClauses = [];
    if (analysisData.clauses) {
      if (analysisData.clauses.standard_clauses) allClauses.push(...analysisData.clauses.standard_clauses);
      if (analysisData.clauses.non_standard_clauses) allClauses.push(...analysisData.clauses.non_standard_clauses);
    }

    allClauses.forEach((clause, idx) => {
      const content = (clause.content || '').trim();
      if (content && content.length > 15) {
        const escapedContent = escapeHtml(content);
        // Replace whitespace with \s+ to match flexibly across newlines
        const flexPattern = escapedContent
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape special chars first
          .replace(/\\\s+/g, '\\s+') // make space escaped
          .replace(/\s+/g, '\\s+'); // flex spaces
          
        try {
          const regex = new RegExp(flexPattern, 'i');
          const match = highlighted.match(regex);
          
          if (match) {
            const domId = `highlight-clause-${idx}`;
            highlighted = highlighted.replace(regex, `
              <span id="${domId}" class="bg-blue-600/10 border-l-4 border-primary px-1 py-0.5 cursor-pointer font-semibold relative group transition-colors hover:bg-blue-600/20" onclick="document.getElementById('${domId}')?.scrollIntoView({ behavior: 'smooth', block: 'center' })">
                ${match[0]}
                <span class="absolute -top-7 left-0 bg-primary text-white text-[9px] font-label-md px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none select-none z-10">${escapeHtml(clause.title)}</span>
              </span>
            `);
          }
        } catch(e) {
          console.error("Regex generation failed for highlight", e);
        }
      }
    });

    return highlighted;
  };

  const scrollToClause = (idx) => {
    if (idx === -1) {
      showToast("Cannot determine exact clause location for this risk. It may be abstract.");
      return;
    }
    const el = document.getElementById(`highlight-clause-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-blue-600/30');
      setTimeout(() => el.classList.remove('bg-blue-600/30'), 2000);
    } else {
      showToast("Clause matches inside the document body were not found.");
    }
  };

  // Chat actions
  const sendChatMessage = (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const query = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: query }]);
    setChatInput('');
    setIsTyping(true);

    if (analysisData && analysisData.document_id !== 'demo') {
      fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: analysisData.document_id, question: query })
      })
      .then(res => {
        if (!res.ok) throw new Error("Chat request failed");
        return res.json();
      })
      .then(data => {
        setIsTyping(false);
        setChatMessages(prev => [...prev, { sender: 'ai', text: data.answer }]);
      })
      .catch(err => {
        setIsTyping(false);
        setChatMessages(prev => [...prev, { sender: 'ai', text: "Error querying chatbot. Please ensure your backend is running." }]);
        console.error(err);
      });
    } else {
      // Mock reply
      setTimeout(() => {
        setIsTyping(false);
        let reply = "This is a demo session. Section 2 has uncapped exposure. Let me know if you want to suggest redrafts.";
        if (query.toLowerCase().includes("liability")) {
          reply = "The critical liability risk is in Section 2. Liability is uncapped, which poses unlimited risk. I recommend applying a 1x cap.";
        }
        setChatMessages(prev => [...prev, { sender: 'ai', text: reply }]);
      }, 1000);
    }
  };

  const runQuickQuestion = (q) => {
    setChatInput(q);
    setTimeout(() => {
      // Simulate enter key trigger
      setChatMessages(prev => [...prev, { sender: 'user', text: q }]);
      setIsTyping(true);
      
      const endpoint = analysisData && analysisData.document_id !== 'demo' ? `${API_BASE}/chat` : null;
      if (endpoint) {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document_id: analysisData.document_id, question: q })
        })
        .then(res => res.json())
        .then(data => {
          setIsTyping(false);
          setChatMessages(prev => [...prev, { sender: 'ai', text: data.answer }]);
        })
        .catch(() => {
          setIsTyping(false);
          setChatMessages(prev => [...prev, { sender: 'ai', text: "Query failed." }]);
        });
      } else {
        setTimeout(() => {
          setIsTyping(false);
          setChatMessages(prev => [...prev, { sender: 'ai', text: `Demo Response regarding "${q}": Section 3 defines governing law as State of Delaware.` }]);
        }, 1000);
      }
    }, 100);
  };

  // Redraft Suggestions actions
  const openRedraft = (title, originalText, clauseIdx = -1) => {
    setRedraftTitle(title);
    setRedraftOriginal(originalText);
    setRedraftSuggestion('');
    setTargetClauseIdx(clauseIdx);
    setComplianceStatus(null);
    setRedraftOpen(true);
    setIsGeneratingRedraft(true);

    const prompt = `Based on the following contract clause, draft a balanced, highly professional, and compliant replacement that addresses the detected risk: "${originalText}". Risk detail: ${title}. Return only the replacement text without surrounding commentary.`;
    
    if (analysisData && analysisData.document_id !== 'demo') {
      fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: analysisData.document_id, question: prompt })
      })
      .then(async (res) => {
        if (!res.ok) {
           let errData = "Unknown error";
           try {
             const json = await res.json();
             errData = json.detail || JSON.stringify(json);
           } catch(e) {
             errData = await res.text();
           }
           throw new Error(errData);
        }
        return res.json();
      })
      .then(data => {
        setIsGeneratingRedraft(false);
        setRedraftSuggestion(data.answer);
        checkCompliance(data.answer);
      })
      .catch((err) => {
        console.error("Redraft error:", err);
        setIsGeneratingRedraft(false);
        setRedraftSuggestion(`Failed to generate redraft suggestion. Error: ${err.message}`);
      });
    } else {
      setTimeout(() => {
        setIsGeneratingRedraft(false);
        const demoText = `2. Limitation of Liability. Except for breach of confidentiality covenants under Section 5, in no event shall either party's aggregate liability exceed the total amounts paid or payable by Client under this Agreement in the twelve (12) months preceding the claim.`;
        setRedraftSuggestion(demoText);
        checkCompliance(demoText);
      }, 1500);
    }
  };

  const checkCompliance = async (textToVerify) => {
    if (!textToVerify || !textToVerify.trim()) return;
    setIsVerifyingCompliance(true);
    setComplianceStatus(null);
    try {
      const activeRules = getActiveRules ? getActiveRules() : [];
      const res = await fetch(`${API_BASE}/verify_clause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clause_text: textToVerify,
          playbook_rules: activeRules
        })
      });
      if (!res.ok) {
        throw new Error("Verification failed");
      }
      const data = await res.json();
      setComplianceStatus(data);
    } catch (err) {
      console.error(err);
      setComplianceStatus({
        compliant: false,
        reason: "Could not evaluate compliance due to server connection issue."
      });
    } finally {
      setIsVerifyingCompliance(false);
    }
  };

  const saveAnalysisToSupabase = async (id, updatedData) => {
    try {
      const { error } = await supabase
        .from('analyses')
        .update({
          clauses: updatedData.clauses,
          metadata: updatedData.metadata,
          risks: updatedData.risks,
          summary: updatedData.summary
        })
        .eq('document_id', id);

      if (error) {
        console.error("Error updating Supabase database:", error);
        showToast("Warning: Failed to sync changes to database cloud.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveClauseEdit = () => {
    if (!analysisData || targetClauseIdx === -1) {
      showToast("Cannot save edit: Invalid clause selection.");
      return;
    }

    const stdClauses = analysisData.clauses?.standard_clauses || [];
    const nonStdClauses = analysisData.clauses?.non_standard_clauses || [];
    const stdLength = stdClauses.length;

    let nextStandardClauses = [...stdClauses];
    let nextNonStandardClauses = [...nonStdClauses];

    if (targetClauseIdx < stdLength) {
      nextStandardClauses[targetClauseIdx] = {
        ...nextStandardClauses[targetClauseIdx],
        content: redraftSuggestion
      };
    } else {
      const nonStdIdx = targetClauseIdx - stdLength;
      nextNonStandardClauses[nonStdIdx] = {
        ...nextNonStandardClauses[nonStdIdx],
        content: redraftSuggestion
      };
    }

    const updatedAnalysis = {
      ...analysisData,
      clauses: {
        ...analysisData.clauses,
        standard_clauses: nextStandardClauses,
        non_standard_clauses: nextNonStandardClauses
      }
    };

    setAnalysisData(updatedAnalysis);
    localStorage.setItem(`analysis_${analysisData.document_id}`, JSON.stringify(updatedAnalysis));

    if (analysisData.document_id !== 'demo') {
      saveAnalysisToSupabase(analysisData.document_id, updatedAnalysis);
    }

    showToast("Clause updated and saved successfully.");
    setRedraftOpen(false);
  };

  const copyRedraft = () => {
    navigator.clipboard.writeText(redraftSuggestion);
    showToast("AI Redraft recommendation successfully copied to clipboard.");
    setRedraftOpen(false);
  };

  const handleDownloadReport = () => {
    if (analysisData && analysisData.document_id !== 'demo') {
      setExportModalOpen(true);
    } else {
      showToast("Demo report downloads are not active. Try uploading a real file.");
    }
  };

  const submitExport = () => {
    setExportModalOpen(false);
    showToast("Generating custom PDF Report...");
    
    const params = new URLSearchParams({
      inc_summary: exportSettings.summary,
      inc_risks: exportSettings.risks,
      inc_clauses: exportSettings.clauses,
      inc_meta: exportSettings.metadata
    });
    
    window.open(`${API_BASE}/report/${analysisData.document_id}?${params.toString()}`, '_blank');
  };

  if (!analysisData) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center space-y-sm">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary">sync</span>
          <p className="font-semibold text-on-surface">Loading workspace elements...</p>
        </div>
      </div>
    );
  }

  // Risk analytics
  const criticalCount = analysisData.risks.filter(r => (r.severity || '').toLowerCase() === 'high' || (r.severity || '').toLowerCase() === 'critical').length;
  const mediumCount = analysisData.risks.filter(r => (r.severity || '').toLowerCase() === 'medium').length;
  const lowCount = analysisData.risks.filter(r => (r.severity || '').toLowerCase() === 'low').length;
  const riskScore = Math.min(10, (criticalCount * 3 + mediumCount * 1.5 + lowCount * 0.5)).toFixed(1);

  const stdClauses = analysisData.clauses?.standard_clauses || [];
  const nonStdClauses = analysisData.clauses?.non_standard_clauses || [];



  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden text-left relative select-none">
      


      {/* Main Workspace split */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Pane: A4 Document Viewer */}
        <div className="w-[50%] border-r border-outline-variant bg-surface flex flex-col overflow-hidden">
          <div className="h-12 border-b border-outline-variant bg-surface-container-lowest px-md flex justify-between items-center shrink-0">
            <div className="flex items-center gap-sm font-semibold text-xs text-on-surface-variant min-w-0 flex-1 mr-4">
              <span className="material-symbols-outlined text-[18px] shrink-0">find_in_page</span>
              <span className="truncate max-w-[180px] font-bold" title={analysisData.filename || 'source_document.pdf'}>{analysisData.filename || 'source_document.pdf'}</span>
              <span className="text-[10px] text-outline-variant/60 px-xs shrink-0">|</span>
              <span className="text-on-surface font-bold capitalize truncate max-w-[140px]" title={analysisData.metadata?.document_type || "Contract Review"}>
                {analysisData.metadata?.document_type || "Contract Review"}
              </span>
              {analysisData.metadata?.parties && analysisData.metadata.parties.length > 0 && (
                <>
                  <span className="text-[10px] text-outline-variant/60 px-xs shrink-0">|</span>
                  <span className="font-semibold text-on-surface-variant truncate max-w-[180px]" title={analysisData.metadata.parties.join(" & ")}>{analysisData.metadata.parties.join(" & ")}</span>
                </>
              )}
            </div>
            <button 
              className="text-primary hover:underline font-semibold text-xs flex items-center gap-1"
              onClick={handleDownloadReport}
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Report PDF</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-lg flex justify-center bg-surface-dim/20 custom-scrollbar">
            <div className="w-full max-w-[800px] min-h-[900px] bg-surface-container-lowest border border-outline-variant/45 rounded-xl legal-shadow p-xl overflow-x-hidden">
              <div 
                className="font-serif text-sm text-on-surface leading-relaxed whitespace-pre-wrap break-words text-left select-text" 
                dangerouslySetInnerHTML={{ __html: getHighlightedTextHtml() }}
              />
            </div>
          </div>
        </div>

        {/* Right Pane: Analysis Panels */}
        <div className="w-[50%] bg-surface flex flex-col overflow-hidden">
          <div className="h-12 border-b border-outline-variant bg-surface-container-lowest px-md flex items-center justify-between shrink-0 select-none">
            <nav className="flex gap-md font-semibold text-xs h-full items-center">
              <button 
                className={`h-full px-sm border-b-2 transition-soft flex items-center gap-1.5 ${activePanel === 'overview' ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:text-primary'}`}
                onClick={() => setActivePanel('overview')}
              >
                <span className="material-symbols-outlined text-[16px]">description</span>
                <span>Overview</span>
              </button>
              <button 
                className={`h-full px-sm border-b-2 transition-soft flex items-center gap-1.5 ${activePanel === 'clauses' ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:text-primary'}`}
                onClick={() => setActivePanel('clauses')}
              >
                <span className="material-symbols-outlined text-[16px]">analytics</span>
                <span>Clauses</span>
              </button>
              <button 
                className={`h-full px-sm border-b-2 transition-soft flex items-center gap-1.5 ${activePanel === 'risks' ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:text-primary'}`}
                onClick={() => setActivePanel('risks')}
              >
                <span className="material-symbols-outlined text-[16px]">gavel</span>
                <span>Risks</span>
              </button>
              <button 
                className={`h-full px-sm border-b-2 transition-soft flex items-center gap-1.5 ${activePanel === 'definitions' ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:text-primary'}`}
                onClick={() => setActivePanel('definitions')}
              >
                <span className="material-symbols-outlined text-[16px]">menu_book</span>
                <span>Definitions</span>
              </button>
              <button 
                className={`h-full px-sm border-b-2 transition-soft flex items-center gap-1.5 ${activePanel === 'chat' ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:text-primary'}`}
                onClick={() => setActivePanel('chat')}
              >
                <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                <span>Assistant</span>
              </button>
            </nav>
            
            <div className="flex items-center gap-md pr-sm text-[10px] font-bold">
              <span className={`px-2 py-0.5 rounded ${riskScore > 6 ? 'bg-error-container text-on-error-container' : riskScore > 3 ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                Score: {riskScore}
              </span>
            </div>
          </div>
          
          {activePanel === 'chat' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Message history */}
              <div className="flex-1 overflow-y-auto p-md space-y-md custom-scrollbar bg-surface-container-low/10">
                {chatMessages.map((msg, mIdx) => (
                  <div 
                    key={`msg-${mIdx}`}
                    className={`flex gap-sm items-start max-w-[85%] ${msg.sender === 'user' ? 'ml-auto justify-end' : ''}`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 text-xs select-none">
                        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                      </div>
                    )}
                    <div 
                      className={`p-md rounded-xl font-body-md text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-surface-container-lowest border border-outline-variant/30 text-on-surface whitespace-pre-wrap'}`}
                      dangerouslySetInnerHTML={{ 
                        __html: msg.sender === 'user' ? escapeHtml(msg.text) : msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')
                      }}
                    />
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-sm items-start max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 text-xs select-none">
                      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    </div>
                    <div className="p-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant font-body-md text-xs flex gap-1 select-none">
                      <span className="h-2 w-2 bg-on-surface-variant rounded-full animate-bounce"></span>
                      <span className="h-2 w-2 bg-on-surface-variant rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="h-2 w-2 bg-on-surface-variant rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick questions */}
              <div className="p-sm bg-surface-container-low/40 border-t border-outline-variant/20 flex flex-wrap gap-xs shrink-0 select-none">
                <button 
                  className="px-2.5 py-1 bg-surface-container-lowest border border-outline-variant/30 text-[10px] font-semibold text-on-surface-variant rounded-md hover:border-primary transition-soft"
                  onClick={() => runQuickQuestion("What are the payment terms?")}
                >
                  Payment Terms?
                </button>
                <button 
                  className="px-2.5 py-1 bg-surface-container-lowest border border-outline-variant/30 text-[10px] font-semibold text-on-surface-variant rounded-md hover:border-primary transition-soft"
                  onClick={() => runQuickQuestion("Who are the signing parties?")}
                >
                  Parties?
                </button>
                <button 
                  className="px-2.5 py-1 bg-surface-container-lowest border border-outline-variant/30 text-[10px] font-semibold text-on-surface-variant rounded-md hover:border-primary transition-soft"
                  onClick={() => runQuickQuestion("What is the governing law?")}
                >
                  Governing Law?
                </button>
              </div>

              {/* Chat input */}
              <form onSubmit={sendChatMessage} className="p-md border-t border-outline-variant/30 flex gap-sm bg-surface-container-lowest shrink-0">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isTyping}
                  className="flex-1 bg-surface-container-low border border-outline-variant/40 rounded-lg px-md text-xs outline-none transition-soft focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="Ask AI a question about this contract..."
                />
                <button 
                  type="submit" 
                  disabled={isTyping}
                  className="w-10 h-10 bg-primary text-on-primary rounded-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-soft disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-lg custom-scrollbar space-y-lg">
            
            {/* PANEL: OVERVIEW */}
            {activePanel === 'overview' && (
              <div className="space-y-lg">
                {/* Score Card Grid */}
                <div className="grid grid-cols-3 gap-md">
                  <div className="bg-surface-container-lowest border border-outline-variant/30 p-md rounded-xl legal-shadow">
                    <p className="text-on-surface-variant font-label-md text-[10px] uppercase tracking-wider">Risk Index</p>
                    <span className="text-3xl font-display-lg text-error font-semibold block mt-1">
                      {riskScore}<span className="text-xs font-normal text-on-surface-variant">/10</span>
                    </span>
                  </div>
                  <div className="bg-surface-container-lowest border border-outline-variant/30 p-md rounded-xl legal-shadow">
                    <p className="text-on-surface-variant font-label-md text-[10px] uppercase tracking-wider">Compliance</p>
                    <span className={`inline-block px-2.5 py-1 rounded text-[9px] font-bold mt-2 font-label-md uppercase ${criticalCount > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {criticalCount > 0 ? "ACTION REQUIRED" : "COMPLIANT"}
                    </span>
                  </div>
                  <div className="bg-surface-container-lowest border border-outline-variant/30 p-md rounded-xl legal-shadow">
                    <p className="text-on-surface-variant font-label-md text-[10px] uppercase tracking-wider">Anomalies</p>
                    <span className="text-3xl font-display-lg text-primary font-semibold block mt-1">
                      {String(analysisData.risks.length + nonStdClauses.length).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="bg-surface-container-lowest border border-outline-variant/30 p-lg rounded-xl legal-shadow space-y-md">
                  <h4 className="font-semibold text-sm text-on-surface">Executive Summary</h4>
                  <div className="font-body-md text-sm text-on-surface-variant leading-relaxed prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{analysisData.summary?.main_summary}</ReactMarkdown>
                  </div>
                  {analysisData.summary?.tldr && (
                    <div className="text-xs bg-surface-container-low p-md rounded-lg border-l-2 border-primary mt-2 prose prose-sm prose-invert max-w-none">
                      <strong>TLDR:</strong> <ReactMarkdown>{analysisData.summary.tldr}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Focus Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div className="bg-surface-container-lowest border border-outline-variant/30 p-md rounded-xl legal-shadow space-y-sm">
                    <h5 className="font-semibold text-xs text-error">Risks Identified</h5>
                    <p className="text-2xl font-bold text-on-surface">{analysisData.risks.length}</p>
                    <p className="text-caption font-caption text-xs text-on-surface-variant">
                      {criticalCount} Critical, {mediumCount} Medium, {lowCount} Low severity.
                    </p>
                  </div>
                  <div className="bg-surface-container-lowest border border-outline-variant/30 p-md rounded-xl legal-shadow space-y-sm">
                    <h5 className="font-semibold text-xs text-primary">Sections Audited</h5>
                    <p className="text-2xl font-bold text-on-surface">{stdClauses.length + nonStdClauses.length}</p>
                    <p className="text-caption font-caption text-xs text-on-surface-variant">
                      {nonStdClauses.length} Non-Standard, {stdClauses.length} Standard clauses.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PANEL: CLAUSES */}
            {activePanel === 'clauses' && (
              <div className="space-y-md bg-surface-container-lowest border border-outline-variant/30 rounded-xl legal-shadow overflow-hidden">
                <div className="divide-y divide-outline-variant/20">
                  {nonStdClauses.map((cl, i) => (
                    <div 
                      key={`non-std-${i}`}
                      className="p-md flex items-start gap-md hover:bg-surface-container-low/20 transition-colors cursor-pointer group"
                      onClick={() => scrollToClause(i + stdClauses.length)}
                    >
                      <div className="shrink-0 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-semibold text-xs">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div className="flex-1 space-y-xs">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-on-surface text-sm group-hover:text-primary transition-colors">{cl.title}</h4>
                          <span className="px-2 py-0.5 rounded font-label-md text-[9px] font-bold bg-red-100 text-red-800">NON-STANDARD</span>
                        </div>
                        <p className="font-caption text-caption text-xs text-on-surface-variant line-clamp-2">"{cl.content}"</p>
                        <span className="text-primary font-label-md text-[10px] font-semibold block group-hover:underline pt-1">View in Document</span>
                      </div>
                    </div>
                  ))}
                  
                  {stdClauses.map((cl, i) => (
                    <div 
                      key={`std-${i}`}
                      className="p-md flex items-start gap-md hover:bg-surface-container-low/20 transition-colors cursor-pointer group"
                      onClick={() => scrollToClause(i)}
                    >
                      <div className="shrink-0 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-semibold text-xs">
                        {String(i + nonStdClauses.length + 1).padStart(2, '0')}
                      </div>
                      <div className="flex-1 space-y-xs">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-on-surface text-sm group-hover:text-primary transition-colors">{cl.title}</h4>
                          <span className="px-2 py-0.5 rounded font-label-md text-[9px] font-bold bg-green-100 text-green-800">STANDARD</span>
                        </div>
                        <p className="font-caption text-caption text-xs text-on-surface-variant line-clamp-2">"{cl.content}"</p>
                        <span className="text-primary font-label-md text-[10px] font-semibold block group-hover:underline pt-1">View in Document</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PANEL: RISKS */}
            {activePanel === 'risks' && (
              <div className="space-y-md">
                {/* Resolution Progress */}
                {analysisData.risks && analysisData.risks.length > 0 && (
                  <div className="bg-surface-container-low p-md rounded-xl mb-md">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-sm text-on-surface">Resolution Progress</span>
                      <span className="font-bold text-xs text-primary">{resolvedRisks.length} of {analysisData.risks.length} Resolved</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-500 ease-out"
                        style={{ width: `${(resolvedRisks.length / analysisData.risks.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {analysisData.risks.map((risk, idx) => {
                  const severityLower = (risk.severity || '').toLowerCase();
                  const isCritical = severityLower === 'high' || severityLower === 'critical';
                  const isResolved = resolvedRisks.includes(risk.title);
                  
                  const allClausesList = [...stdClauses, ...nonStdClauses];
                  
                  // Simple word overlap relevance scorer
                  const getRelevanceScore = (text, query) => {
                    if (!text || !query) return 0;
                    const words = query.toLowerCase().split(/\W+/).filter(w => w.length > 3); // ignore very short words
                    let score = 0;
                    const textLower = text.toLowerCase();
                    words.forEach(w => {
                      if (textLower.includes(w)) score++;
                    });
                    return score;
                  };

                  let bestMatchIdx = -1;
                  let maxScore = 0;
                  allClausesList.forEach((c, i) => {
                    // Exact substring matches get massive boost
                    let exactBoost = 0;
                    if (c.title.toLowerCase().includes(risk.title.toLowerCase()) || risk.title.toLowerCase().includes(c.title.toLowerCase())) {
                       exactBoost += 50;
                    }
                    const titleScore = getRelevanceScore(c.title + " " + c.content, risk.title);
                    const descScore = getRelevanceScore(c.content, risk.description);
                    const total = exactBoost + (titleScore * 2) + descScore;
                    
                    if (total > maxScore && total > 2) {
                      maxScore = total;
                      bestMatchIdx = i;
                    }
                  });
                  
                  const targetHighlightId = bestMatchIdx;

                  return (
                    <div 
                      key={`risk-${idx}`}
                      className={`relative overflow-hidden border border-outline-variant p-md rounded-r-lg transition-all flex flex-col gap-sm ${isResolved ? 'opacity-70 bg-surface-container-low grayscale-[30%]' : isCritical ? 'risk-chip-critical bg-surface-container-lowest' : 'risk-chip-medium bg-surface-container-lowest'}`}
                    >
                      <div className="flex justify-between items-start pr-8">
                        <h4 
                          className={`font-semibold text-sm cursor-pointer transition-colors ${isResolved ? 'text-on-surface-variant line-through' : 'text-on-surface hover:text-primary'}`}
                          onClick={() => !isResolved && scrollToClause(targetHighlightId)}
                        >
                          {risk.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded font-label-md text-[9px] font-bold uppercase ${isResolved ? 'bg-surface-container-high text-on-surface-variant' : isCritical ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                          {isResolved ? 'RESOLVED' : risk.severity}
                        </span>
                      </div>

                      <button 
                        className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isResolved ? 'bg-green-500 border-green-500 text-white' : 'border-outline-variant text-transparent hover:border-primary hover:text-primary/30'}`}
                        onClick={() => toggleRiskResolution(risk.title)}
                        title={isResolved ? "Mark as unresolved" : "Mark as resolved"}
                      >
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </button>

                      <div className={`font-caption text-caption text-xs leading-relaxed prose prose-sm prose-invert max-w-none ${isResolved ? 'text-on-surface-variant/70' : 'text-on-surface-variant'}`}>
                        <ReactMarkdown>{risk.description}</ReactMarkdown>
                      </div>
                      
                      {!isResolved && (
                        <div className="flex gap-md pt-xs select-none">
                          <button 
                            className="text-primary font-semibold text-xs hover:underline flex items-center gap-1"
                            onClick={() => scrollToClause(targetHighlightId)}
                          >
                            <span className="material-symbols-outlined text-[14px]">find_in_page</span>
                            <span>View in Doc</span>
                          </button>
                          <button 
                            className="text-primary font-semibold text-xs hover:underline flex items-center gap-1"
                            onClick={() => openRedraft(risk.title, risk.description, targetHighlightId)}
                          >
                            <span className="material-symbols-outlined text-[14px]">edit_note</span>
                            <span>Suggest Redraft</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* PANEL: DEFINITIONS */}
            {activePanel === 'definitions' && (
              <div className="bg-surface-container-lowest border border-outline-variant/35 rounded-xl overflow-hidden legal-shadow">
                <table className="w-full text-left border-collapse text-sm">
                  <tbody>
                    <tr className="border-b border-outline-variant/20">
                      <td className="p-4 font-mono text-xs font-semibold text-on-surface bg-surface-container-low/10 w-40">Document Type</td>
                      <td className="p-4 text-on-surface-variant">
                        {analysisData.metadata?.document_type || "Contract Analysis"}
                      </td>
                    </tr>
                    <tr className="border-b border-outline-variant/20">
                      <td className="p-4 font-mono text-xs font-semibold text-on-surface bg-surface-container-low/10">Parties Involved</td>
                      <td className="p-4 text-on-surface-variant">
                        {(analysisData.metadata?.parties || []).join(", ") || "Unspecified"}
                      </td>
                    </tr>
                    <tr className="border-b border-outline-variant/20">
                      <td className="p-4 font-mono text-xs font-semibold text-on-surface bg-surface-container-low/10">Effective Date</td>
                      <td className="p-4 text-on-surface-variant">
                        {analysisData.metadata?.effective_date || "Unknown"}
                      </td>
                    </tr>
                    {analysisData.summary?.key_points?.map((pt, pIdx) => (
                      <tr key={`pt-${pIdx}`} className="border-b border-outline-variant/20">
                        <td className="p-4 font-mono text-xs font-semibold text-on-surface bg-surface-container-low/10">
                          Key Point #{pIdx + 1}
                        </td>
                        <td className="p-4 text-on-surface-variant">{pt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
          )}
        </div>

      </div>

      {/* Suggest Redraft Dialog (Interactive Sandbox Modal) */}
      {redraftOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-5xl bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-xl shadow-2xl space-y-md text-left flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-sm border-b border-outline-variant/20 shrink-0">
              <h3 className="font-title-lg text-title-lg text-on-surface font-semibold flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">edit_document</span>
                <span>Interactive Redrafting Sandbox</span>
              </h3>
              <button 
                className="p-1 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant"
                onClick={() => setRedraftOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-lg min-h-0 py-sm">
              {/* Left Column: Original Text */}
              <div className="flex flex-col gap-sm h-full min-h-0">
                <div className="shrink-0 space-y-1">
                  <h5 className="font-semibold text-xs text-on-surface-variant uppercase tracking-wider">Detected Risk & Category</h5>
                  <p className="font-bold text-sm text-on-surface capitalize">{redraftTitle}</p>
                </div>
                
                <div className="flex-1 flex flex-col min-h-0 space-y-2">
                  <h5 className="font-semibold text-xs text-on-surface-variant uppercase tracking-wider shrink-0">Original Phrasing</h5>
                  <div className="flex-1 bg-surface-container-low border border-outline-variant/30 rounded-xl p-md overflow-y-auto font-mono text-xs select-text whitespace-pre-wrap leading-relaxed">
                    {redraftOriginal}
                  </div>
                </div>
              </div>

              {/* Right Column: Editable Sandbox */}
              <div className="flex flex-col gap-sm h-full min-h-0">
                <h5 className="font-semibold text-xs text-on-surface-variant uppercase tracking-wider shrink-0 flex items-center justify-between">
                  <span>Interactive Editor</span>
                  <span className="text-[10px] text-primary lowercase tracking-normal font-semibold">Editable</span>
                </h5>

                <div className="flex-1 flex flex-col min-h-0 space-y-md">
                  {isGeneratingRedraft ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-sm bg-surface-container-low/10 border border-outline-variant/30 border-dashed rounded-xl min-h-[200px]">
                      <span className="material-symbols-outlined text-primary animate-spin text-2xl">sync</span>
                      <span className="text-xs text-on-surface-variant font-semibold">Generating recommendations with Groq AI...</span>
                    </div>
                  ) : (
                    <textarea
                      value={redraftSuggestion}
                      onChange={(e) => setRedraftSuggestion(e.target.value)}
                      className="flex-1 w-full bg-surface-container-low/30 border border-outline-variant/40 rounded-xl p-md font-mono text-xs focus:ring-2 focus:ring-primary/5 focus:border-primary/30 outline-none transition-soft resize-none text-left leading-relaxed min-h-[200px]"
                      placeholder="Type or edit the redrafted clause here..."
                    />
                  )}

                  {/* Real-time Compliance Status */}
                  <div className="bg-surface-container p-md rounded-xl space-y-xs shrink-0 select-none">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">gavel</span>
                        Playbook Compliance
                      </span>
                      {!isGeneratingRedraft && !isVerifyingCompliance && (
                        <button
                          onClick={() => checkCompliance(redraftSuggestion)}
                          className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider flex items-center gap-0.5"
                          title="Evaluate current draft against rules"
                        >
                          <span className="material-symbols-outlined text-xs">refresh</span>
                          Re-Verify
                        </button>
                      )}
                    </div>

                    {isVerifyingCompliance ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant py-2">
                        <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                        <span>Evaluating rules compliance...</span>
                      </div>
                    ) : complianceStatus ? (
                      <div className={`p-sm rounded-lg border text-xs leading-relaxed space-y-1 ${complianceStatus.compliant ? 'bg-green-500/10 border-green-500/30 text-green-800 dark:text-green-300' : 'bg-orange-500/10 border-orange-500/30 text-orange-800 dark:text-orange-300'}`}>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="material-symbols-outlined text-[16px]">
                            {complianceStatus.compliant ? 'check_circle' : 'warning'}
                          </span>
                          <span>{complianceStatus.compliant ? 'Clause Compliant' : 'Clause Non-Compliant'}</span>
                        </div>
                        <p className="font-normal text-[11px] leading-relaxed">{complianceStatus.reason}</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-on-surface-variant italic py-1">No verification report generated yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-md pt-md border-t border-outline-variant/20 shrink-0">
              <button 
                className="flex-1 bg-surface-container-low border border-outline-variant/40 hover:bg-surface-container-high font-semibold py-3 rounded-lg text-on-surface transition-soft text-sm"
                onClick={() => setRedraftOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-1 bg-secondary-container text-on-secondary-container hover:bg-surface-container-high font-semibold py-3 rounded-lg transition-soft text-sm flex items-center justify-center gap-xs disabled:opacity-50"
                onClick={copyRedraft}
                disabled={isGeneratingRedraft}
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                <span>Copy Draft</span>
              </button>
              {targetClauseIdx !== -1 && (
                <button 
                  className="flex-1 bg-primary text-on-primary font-semibold py-3 rounded-lg hover:opacity-90 transition-soft text-sm flex items-center justify-center gap-xs disabled:opacity-50"
                  onClick={handleSaveClauseEdit}
                  disabled={isGeneratingRedraft || isVerifyingCompliance}
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Save & Replace in Contract</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Settings Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-xl shadow-2xl space-y-md text-left flex flex-col">
            <div className="flex justify-between items-center pb-sm border-b border-outline-variant/20">
              <h3 className="font-title-lg text-title-lg text-on-surface font-semibold flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">tune</span>
                <span>Export Settings</span>
              </h3>
              <button 
                className="p-1 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant"
                onClick={() => setExportModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-sm py-sm">
              <p className="text-xs text-on-surface-variant mb-4">Select which sections to include in the final PDF report:</p>
              
              {Object.entries(exportSettings).map(([key, value]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={value}
                      onChange={(e) => setExportSettings(prev => ({...prev, [key]: e.target.checked}))}
                    />
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${value ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant group-hover:border-primary text-transparent'}`}>
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-on-surface capitalize">{key}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-md pt-md border-t border-outline-variant/20 shrink-0">
              <button 
                className="flex-1 bg-surface-container-low border border-outline-variant/40 hover:bg-surface-container-high font-semibold py-3 rounded-lg text-on-surface transition-soft text-sm"
                onClick={() => setExportModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-[2] bg-primary text-on-primary font-semibold py-3 rounded-lg hover:opacity-90 transition-soft text-sm flex items-center justify-center gap-xs"
                onClick={submitExport}
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Generate PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
