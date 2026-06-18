import React, { useState } from "react";
import Shell from "@/components/layout/Shell";
import { draftContract } from "@/services/api";
import { jsPDF } from "jspdf";
import { 
  FileText, 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Check, 
  Download, 
  Send,
  MessageSquare,
  Wrench,
  BookOpen
} from "lucide-react";

// Pre-defined templates config
const TEMPLATE_PRESETS = {
  nda: {
    title: "Mutual Non-Disclosure Agreement",
    fields: [
      { key: "disclosing_party", label: "Disclosing Party", default: "Acme Corp" },
      { key: "receiving_party", label: "Receiving Party", default: "Global Tech LLC" },
      { key: "term", label: "Confidentiality Term", default: "5 Years" },
      { key: "governing_law", label: "Governing Law", default: "Delaware" },
      { key: "purpose", label: "Disclosure Purpose", default: "Evaluating a strategic engineering collaboration" }
    ]
  },
  msa: {
    title: "Master Services Agreement",
    fields: [
      { key: "client_name", label: "Client Organization", default: "Acme Corp" },
      { key: "vendor_name", label: "Vendor Organization", default: "Consultants Inc" },
      { key: "payment_terms", label: "Payment Terms", default: "Net-30 days" },
      { key: "liability_cap", label: "Liability Limitation Cap", default: "1x Fees Paid" },
      { key: "governing_law", label: "Governing Law", default: "New York" }
    ]
  },
  consulting: {
    title: "Consulting Services Contract",
    fields: [
      { key: "client_name", label: "Client Name", default: "Acme Corp" },
      { key: "consultant_name", label: "Consultant Name", default: "Jane Doe" },
      { key: "hourly_rate", label: "Hourly Rate ($)", default: "150" },
      { key: "term", label: "Duration of Contract", default: "1 Year" },
      { key: "governing_law", label: "Governing Law", default: "California" }
    ]
  }
};

export default function DraftingPage() {
  const [templateType, setTemplateType] = useState("nda");
  
  // Dynamic fields state map
  const [fields, setFields] = useState(() => {
    const initial = {};
    Object.keys(TEMPLATE_PRESETS).forEach(tKey => {
      initial[tKey] = {};
      TEMPLATE_PRESETS[tKey].fields.forEach(f => {
        initial[tKey][f.key] = f.default;
      });
    });
    return initial;
  });

  // Draft states
  const [draftText, setDraftText] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [refining, setRefining] = useState(false);
  const [copied, setCopied] = useState(false);

  // Chat refinement states
  const [userMsg, setUserMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  const handleFieldChange = (key, val) => {
    setFields({
      ...fields,
      [templateType]: {
        ...fields[templateType],
        [key]: val
      }
    });
  };

  const handleGenerateInitialDraft = async () => {
    setDrafting(true);
    setChatHistory([]);
    try {
      const activeParameters = fields[templateType];
      const result = await draftContract(TEMPLATE_PRESETS[templateType].title, activeParameters);
      setDraftText(result.draft);
      setChatHistory([
        { sender: "ai", text: `Here is your initial ${TEMPLATE_PRESETS[templateType].title} draft. Let me know if you'd like to adjust payment terms, governing laws, or liability parameters.` }
      ]);
    } catch (err) {
      console.error(err);
      setDraftText("Failed to generate draft. Please check your connection and OpenAI model settings.");
    } finally {
      setDrafting(false);
    }
  };

  const handleSendRefinement = async (e) => {
    e.preventDefault();
    if (!userMsg.trim() || refining || !draftText) return;

    const currentMsg = userMsg.trim();
    setUserMsg("");
    setChatHistory(prev => [...prev, { sender: "user", text: currentMsg }]);
    setRefining(true);

    try {
      const activeParameters = fields[templateType];
      const result = await draftContract(
        TEMPLATE_PRESETS[templateType].title,
        activeParameters,
        currentMsg,
        draftText
      );
      setDraftText(result.draft);
      setChatHistory(prev => [...prev, { sender: "ai", text: `I've updated the contract according to your prompt. You can check the revised draft in the editor pane.` }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: "ai", text: "Failed to refine draft. Let's try again." }]);
    } finally {
      setRefining(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!draftText) return;
    navigator.clipboard.writeText(draftText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleExportPDF = () => {
    if (!draftText) return;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const title = TEMPLATE_PRESETS[templateType].title;
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text(title.toUpperCase(), 20, 25);
    doc.line(20, 28, 190, 28);

    doc.setFont("times", "normal");
    doc.setFontSize(10.5);
    const splitText = doc.splitTextToSize(draftText, 170);
    
    let y = 38;
    splitText.forEach(line => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 6;
    });

    doc.save(`${templateType.toUpperCase()}_Draft_Lexicon.pdf`);
  };

  return (
    <Shell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <span>Interactive Drafting Workspace</span>
          </h1>
          <p className="text-[13px] text-text-secondary">
            Draft premium, compliant legal agreements in seconds. Select a standard template, specify contract parameters, and refine the clauses interactively with the AI Drafting chatbot.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          
          {/* Left Side: Template Configuration Form (2/5 columns) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Presets selectors */}
            <div className="bg-white border border-border rounded p-5 shadow-sm space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Contract Template Preset</span>
                <select
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded text-[13px] text-primary focus:outline-none focus:border-primary bg-white cursor-pointer font-medium"
                >
                  <option value="nda">Mutual Non-Disclosure Agreement</option>
                  <option value="msa">Master Services Agreement</option>
                  <option value="consulting">Consulting Services Agreement</option>
                </select>
              </div>

              <hr className="border-border/60" />

              {/* Dynamic parameters inputs */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Contract Parameters Configuration</span>
                
                <div className="space-y-3.5 text-[12px]">
                  {TEMPLATE_PRESETS[templateType].fields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <label htmlFor={`field-${field.key}`} className="font-bold text-text-secondary uppercase text-[10px] tracking-wider block">
                        {field.label}
                      </label>
                      <input
                        id={`field-${field.key}`}
                        type="text"
                        value={fields[templateType][field.key] || ""}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded text-[13px] text-primary focus:outline-none focus:border-primary bg-white placeholder-text-muted"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleGenerateInitialDraft}
                  disabled={drafting}
                  className="w-full py-2.5 bg-primary hover:bg-primary-light text-white text-[13px] font-bold rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {drafting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Drafting Agreement...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Contract Draft</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Chat refinement box */}
            {draftText && (
              <div className="bg-white border border-border rounded shadow-sm overflow-hidden flex flex-col justify-between h-[340px]">
                <div className="p-4 border-b border-border flex items-center gap-2 bg-primary-50/30">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-[13px] text-primary">AI Refinement Chatbot</h3>
                </div>
                
                {/* Chat window list */}
                <div className="p-4 overflow-y-auto flex-1 space-y-3 text-[11.5px] bg-primary-50/5">
                  {chatHistory.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`max-w-[85%] p-2.5 rounded ${
                        msg.sender === "user"
                          ? "ml-auto bg-primary text-white"
                          : "bg-primary-50 border border-border text-primary"
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  ))}
                  {refining && (
                    <div className="bg-primary-50 border border-border p-2.5 rounded max-w-[85%] flex items-center gap-2 text-text-secondary animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating agreement clauses...</span>
                    </div>
                  )}
                </div>

                {/* Send action form */}
                <form onSubmit={handleSendRefinement} className="p-3 border-t border-border bg-white flex gap-2">
                  <input
                    type="text"
                    disabled={refining}
                    placeholder="e.g. Change the governing law to New York..."
                    value={userMsg}
                    onChange={(e) => setUserMsg(e.target.value)}
                    className="flex-grow px-3 py-2 border border-border rounded text-[12.5px] text-primary focus:outline-none focus:border-primary bg-white placeholder-text-muted"
                  />
                  <button
                    type="submit"
                    disabled={refining || !userMsg.trim()}
                    className="p-2.5 bg-primary text-white rounded hover:bg-primary-light transition-all flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Side: Contract Preview and Exporter (3/5 columns) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Toolbar menu */}
            {draftText && (
              <div className="bg-white border border-border rounded p-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-text-secondary" />
                  <span className="text-[11.5px] font-bold text-primary uppercase tracking-wider">
                    Draft Preview Panel
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className="p-1.5 hover:bg-primary-50 rounded border border-border text-text-secondary hover:text-primary transition-all cursor-pointer bg-white flex items-center justify-center"
                    aria-label="Copy draft content"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-risk-green" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="p-1.5 hover:bg-primary-50 rounded border border-border text-text-secondary hover:text-primary transition-all cursor-pointer bg-white flex items-center justify-center"
                    aria-label="Download PDF report"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Content view screen */}
            <div className="bg-white border border-border rounded shadow-md min-h-[580px] p-8 relative font-serif select-text selection:bg-risk-blue/20 overflow-y-auto leading-relaxed">
              {draftText ? (
                <div className="space-y-4 text-[12.5px] leading-relaxed text-primary whitespace-pre-wrap select-text text-justify">
                  {draftText}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-32 text-center space-y-4 max-w-sm mx-auto">
                  <div className="w-12 h-12 rounded-full border border-border/80 flex items-center justify-center text-text-muted bg-primary-50/50">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-[13.5px] text-primary">Workspace Vacant</h4>
                    <p className="text-[11.5px] text-text-secondary">
                      Specify the configuration variables and launch the initial generation draft to fill this editor canvas.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </Shell>
  );
}
