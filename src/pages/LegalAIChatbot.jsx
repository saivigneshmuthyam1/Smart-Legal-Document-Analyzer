import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { chatMessages, mockChatResponses } from "@/data/mockData";
import { 
  Send, 
  ArrowLeft, 
  Sparkles, 
  User, 
  Bot, 
  ArrowUpRight,
  Clock,
  ChevronRight
} from "lucide-react";

export default function LegalAIChatbot() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I'm your AI Legal Assistant. I've analyzed the NDA Agreement between Acme Corporation and TechVenture Startups. How can I help you understand this document?",
      time: "10:30 AM"
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestionChips = [
    "What is the termination clause?",
    "Are there compliance risks?",
    "Summarize this contract.",
    "Identify risky obligations."
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (text) => {
    if (!text.trim()) return;

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

    // Get response index
    let responseText = mockChatResponses[Math.floor(Math.random() * mockChatResponses.length)];
    if (text.toLowerCase().includes("terminate") || text.toLowerCase().includes("termination")) {
      responseText = mockChatResponses[3]; // Term and survival
    } else if (text.toLowerCase().includes("risk") || text.toLowerCase().includes("compliance")) {
      responseText = mockChatResponses[2]; // severity levels
    } else if (text.toLowerCase().includes("summarize") || text.toLowerCase().includes("summary")) {
      responseText = "This is a mutual Non-Disclosure Agreement between Acme Corporation and TechVenture Startups governing confidential information shared for exploring a strategic partnership. Active term is 2 years, with surviving obligations for 5 years. It contains highly restrictive non-compete covenants (3 years) and uncapped liability.";
    }

    setTimeout(() => {
      setIsTyping(false);
      const assistantMsg = {
        id: messages.length + 2,
        role: "assistant",
        content: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    }, 1200);
  };

  return (
    <Shell>
      <div className="flex flex-col h-[calc(100vh-180px)] space-y-4">
        
        {/* Chat Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(`/analysis/${id || '1'}`)}
              className="p-1.5 border border-border bg-white rounded text-text-secondary hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-md font-semibold text-primary">Lexicon AI Legal Assistant</h1>
              <p className="text-[11px] text-text-secondary flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-risk-green rounded-full"></span>
                <span>Contextualized: Project Alpha NDA Agreement</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-risk-blue animate-pulse" />
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">GPT-4 Contract Intelligence</span>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 border border-border rounded bg-white p-5 shadow-xs">
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
                }`}>
                  {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble content */}
                <div className="space-y-1">
                  <div className={`p-3.5 rounded text-[13px] leading-relaxed shadow-xs ${
                    isAI 
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
            <div className="flex gap-3 max-w-[85%] self-start">
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
                className="px-3 py-1 bg-white border border-border rounded text-[11px] text-text-secondary font-medium hover:border-primary hover:text-primary transition-all flex items-center gap-1 group shadow-xs"
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
              placeholder="Ask a question about the termination, indemnification, or liability clauses..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 px-4 py-2 border border-border rounded text-[13px] text-primary placeholder-text-muted focus:outline-none focus:border-primary bg-white shadow-xs"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded hover:bg-primary-light transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </Shell>
  );
}
