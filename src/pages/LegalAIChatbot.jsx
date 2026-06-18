import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { chatWithDocument } from "@/services/api";
import { 
  Send, 
  ArrowLeft, 
  Sparkles, 
  User, 
  Bot, 
  ArrowUpRight,
  AlertCircle,
  RefreshCw
} from "lucide-react";

export default function LegalAIChatbot() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentAnalysis, loadAnalysis } = useAnalysis();
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I'm your AI Legal Assistant. I'm ready to answer questions about this document. What would you like to know?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatError, setChatError] = useState("");
  const messagesEndRef = useRef(null);

  // Load analysis context
  useEffect(() => {
    if (id) loadAnalysis(id).catch(() => {});
  }, [id]);

  // Update welcome message when analysis loads
  useEffect(() => {
    if (currentAnalysis && messages.length === 1) {
      const docType = currentAnalysis.metadata?.document_type || "Legal Document";
      const parties = currentAnalysis.metadata?.parties?.join(" and ") || "";
      const intro = parties 
        ? `Hello! I'm your AI Legal Assistant. I've analyzed the ${docType} between ${parties}. How can I help you understand this document?`
        : `Hello! I'm your AI Legal Assistant. I've analyzed this ${docType}. How can I help you understand this document?`;
      
      setMessages([{
        id: 1,
        role: "assistant",
        content: intro,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  }, [currentAnalysis]);

  const suggestionChips = [
    "What are the main risks?",
    "Summarize the key clauses",
    "Are there non-standard terms?",
    "What is the termination clause?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text) => {
    if (!text.trim() || isTyping) return;

    setChatError("");

    // Add user message
    const userMsg = {
      id: messages.length + 1,
      role: "user",
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    try {
      // Build context from analysis data
      let context = "";
      if (currentAnalysis) {
        context = JSON.stringify({
          summary: currentAnalysis.summary,
          risks: currentAnalysis.risks,
          clauses: currentAnalysis.clauses,
          metadata: currentAnalysis.metadata,
        });
      }

      const response = await chatWithDocument(id, text, context);
      
      const assistantMsg = {
        id: messages.length + 2,
        role: "assistant",
        content: response.answer || "I couldn't generate a response.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setChatError(err.message || "Failed to get a response. Please try again.");
      const errorMsg = {
        id: messages.length + 2,
        role: "assistant",
        content: `⚠️ Sorry, I encountered an error: ${err.message || "Unable to process your request."}. Please try again.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const docType = currentAnalysis?.metadata?.document_type || "Document";
  const parties = currentAnalysis?.metadata?.parties?.join(" & ") || "";

  return (
    <Shell>
      <div className="flex flex-col h-[calc(100vh-180px)] space-y-4">
        
        {/* Chat Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(`/analysis/${id}`)}
              className="p-1.5 border border-border bg-white rounded text-text-secondary hover:text-primary transition-colors"
              aria-label="Back to analysis"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-md font-semibold text-primary">Lexicon AI Legal Assistant</h1>
              <p className="text-[11px] text-text-secondary flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-risk-green rounded-full" aria-hidden="true"></span>
                <span>Contextualized: {parties || docType}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-risk-blue" aria-hidden="true" />
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">AI-Powered Chat</span>
          </div>
        </div>

        {/* Messages Body */}
        <div 
          className="flex-1 overflow-y-auto pr-2 space-y-4 border border-border rounded bg-white p-5 shadow-xs"
          role="log"
          aria-label="Chat messages"
          aria-live="polite"
        >
          {messages.map((msg) => {
            const isAI = msg.role === "assistant";
            return (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[85%] ${isAI ? "self-start" : "ml-auto flex-row-reverse"}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center border ${
                  isAI ? "bg-primary-100 border-primary/10 text-primary" : "bg-primary text-white border-primary"
                }`} aria-hidden="true">
                  {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble content */}
                <div className="space-y-1">
                  <div className={`p-3.5 rounded text-[13px] leading-relaxed shadow-xs ${
                    msg.isError
                      ? "bg-risk-red-light border border-risk-red/20 text-risk-red rounded-tl-none"
                      : isAI 
                        ? "bg-primary-50/70 border border-border text-primary rounded-tl-none" 
                        : "bg-primary text-white rounded-tr-none"
                  }`}>
                    {msg.content}
                  </div>
                  <div className={`text-[10px] text-text-muted ${isAI ? "" : "text-right"}`}>
                    {msg.time}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 max-w-[85%] self-start" role="status" aria-label="AI is typing">
              <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-primary-100 border border-primary/10 text-primary">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-primary-50/70 border border-border rounded rounded-tl-none flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Presets and Input Area */}
        <div className="space-y-3 pt-2">
          {/* Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                disabled={isTyping}
                className="px-3 py-1 bg-white border border-border rounded text-[11px] text-text-secondary font-medium hover:border-primary hover:text-primary transition-all flex items-center gap-1 group shadow-xs disabled:opacity-50"
                aria-label={`Ask: ${chip}`}
              >
                <span>{chip}</span>
                <ArrowUpRight className="w-3 h-3 text-text-muted group-hover:text-primary" />
              </button>
            ))}
          </div>

          {/* Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputVal);
            }} 
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask a question about this document..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={isTyping}
              className="flex-1 px-4 py-2 border border-border rounded text-[13px] text-primary placeholder-text-muted focus:outline-none focus:border-primary bg-white shadow-xs disabled:opacity-50"
              aria-label="Type your question"
            />
            <button
              type="submit"
              disabled={isTyping || !inputVal.trim()}
              className="px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded hover:bg-primary-light transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </Shell>
  );
}
