import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function GlobalChat({ isOpen, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am Lexicon AI. How can I assist you with your legal documents today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [suggestions, setSuggestions] = useState([
    "Summarize recent uploads",
    "Find high-risk clauses",
    "Explain indemnification"
  ]);
  const [contextDoc, setContextDoc] = useState(null);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const fetchAISuggestions = async () => {
      if (!user || !isOpen) return;
      try {
        const response = await fetch('http://localhost:5000/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions from backend');
        }

        const data = await response.json();
        if (data && data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        }
      } catch (err) {
        console.error("Failed to load context for suggestions:", err);
      }
    };

    fetchAISuggestions();
  }, [user, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:5000/global_chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, question: userMsg })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I am having trouble connecting to the server right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = async (text) => {
    if (!user) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:5000/global_chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, question: text })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I am having trouble connecting to the server right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Chat Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-surface-container-lowest border-l border-outline-variant/40 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
        
        {/* Header */}
        <div className="flex items-center justify-between px-lg py-md border-b border-outline-variant/30 bg-surface-container-low/30">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            </div>
            <div>
              <h3 className="font-title-md text-title-md font-semibold text-on-surface">Lexicon Assistant</h3>
              <p className="text-caption font-caption text-on-surface-variant flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-lg space-y-lg scrollbar-thin">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 text-sm font-body-md shadow-sm ${msg.role === 'user' ? 'bg-primary text-on-primary rounded-tr-sm' : 'bg-surface-container border border-outline-variant/30 text-on-surface rounded-tl-sm'}`}>
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl p-4 bg-surface-container border border-outline-variant/30 rounded-tl-sm flex items-center gap-1">
                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length < 3 && !isTyping && (
          <div className="px-lg pb-md flex gap-2 flex-wrap">
            {suggestions.map((s, i) => (
              <button 
                key={i} 
                onClick={() => handleSuggestionClick(s)}
                className="px-3 py-1.5 rounded-full border border-outline-variant/50 bg-surface-container-low text-on-surface-variant font-medium text-xs hover:bg-surface-container-high hover:text-primary hover:border-primary/40 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-md border-t border-outline-variant/30 bg-surface-container-lowest">
          <div className="relative flex items-end gap-2 bg-surface-container-low rounded-xl p-2 border border-outline-variant/50 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/5 transition-soft">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-[44px] py-3 px-2 text-sm text-on-surface placeholder:text-on-surface-variant"
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-11 h-11 shrink-0 flex items-center justify-center rounded-lg bg-primary text-on-primary disabled:opacity-50 disabled:bg-surface-container-high disabled:text-on-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] ml-1">send</span>
            </button>
          </div>
          <p className="text-center text-[10px] text-on-surface-variant mt-2">
            Lexicon AI can make mistakes. Verify important information.
          </p>
        </div>

      </div>
    </>
  );
}
