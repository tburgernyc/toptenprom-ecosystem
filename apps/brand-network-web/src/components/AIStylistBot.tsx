"use client";

import { useState, useRef, useEffect } from "react";
import { useChat, type Message } from "ai/react";
import { Sparkles, X, Send, User } from "lucide-react";

export function AIStylistBot() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanding Chat Pane */}
      {isOpen && (
        <div 
          className="glass-card mb-4 w-[calc(100vw-48px)] sm:w-[380px] h-[500px] max-h-[75vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300 origin-bottom-right"
          style={{ 
            boxShadow: "0 10px 40px -10px var(--color-primary-glow)",
            borderColor: "var(--color-border-glow)"
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-elevated)" }}>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: "var(--color-primary-subtle)", color: "var(--color-primary)" }}>
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: "var(--color-text)" }}>AI Stylist</h3>
                <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--color-primary)" }}>Online</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full transition-colors"
              style={{ color: "var(--color-text-muted)" }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = "var(--color-text)"; e.currentTarget.style.background = "var(--color-bg-glass)"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.background = "transparent"; }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: "var(--color-bg)" }}>
            {/* Initial Welcome Message */}
            {messages.length === 0 && (
              <div className="flex flex-col gap-1 items-start max-w-[85%]">
                <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}>
                  Welcome to Top 10 Prom! ✨ I'm your personal AI Stylist. Are you looking for the perfect prom dress, scheduling a fitting, or looking for tailoring advice?
                </div>
              </div>
            )}

            {messages.map((m: Message) => (
              <div 
                key={m.id} 
                className={`flex gap-2 items-end max-w-[85%] ${m.role === 'user' ? 'self-end flex-row-reverse float-right' : 'self-start'}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full" style={{ 
                  background: m.role === 'user' ? "var(--color-bg-elevated)" : "var(--color-primary-subtle)", 
                  color: m.role === 'user' ? "var(--color-text-muted)" : "var(--color-primary)",
                  border: m.role === 'user' ? "1px solid var(--color-border)" : "none"
                }}>
                  {m.role === 'user' ? <User size={12} /> : <Sparkles size={12} />}
                </div>

                {/* Message Bubble */}
                <div 
                  className={`px-4 py-2.5 rounded-2xl text-sm ${m.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`} 
                  style={{ 
                    background: m.role === 'user' ? "var(--color-primary)" : "var(--color-bg-elevated)", 
                    color: m.role === 'user' ? "var(--color-text-inverse)" : "var(--color-text)", 
                    border: m.role === 'user' ? "none" : "1px solid var(--color-border)"
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2 items-end self-start max-w-[85%]">
                <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full" style={{ background: "var(--color-primary-subtle)", color: "var(--color-primary)" }}>
                  <Sparkles size={12} />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
                  <span className="block h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-primary)", animation: "dotBounce 1.2s ease-in-out 0s infinite" }} />
                  <span className="block h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-primary)", animation: "dotBounce 1.2s ease-in-out 0.2s infinite" }} />
                  <span className="block h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-primary)", animation: "dotBounce 1.2s ease-in-out 0.4s infinite" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-elevated)" }}>
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about styles, seasons, or boutiques..."
                className="w-full pl-4 pr-12 py-3 rounded-full text-base sm:text-sm outline-none transition-all"
                style={{ 
                  background: "var(--color-bg)", 
                  color: "var(--color-text)", 
                  border: "1px solid var(--color-border)"
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--color-border)"}
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="absolute right-2 p-1.5 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: input.trim() ? "var(--color-primary)" : "transparent",
                  color: input.trim() ? "var(--color-text-inverse)" : "var(--color-text-subtle)",
                }}
              >
                <Send size={16} className={input.trim() ? "translate-x-[-1px] translate-y-[1px]" : ""} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Trigger Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 rounded-full px-5 py-3 shadow-lg transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-5"
          style={{
            background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))",
            color: "var(--color-text-inverse)",
            boxShadow: "0 4px 20px var(--color-primary-glow)",
          }}
        >
          <Sparkles size={18} className="group-hover:animate-pulse" />
          <span className="text-sm font-semibold tracking-wide">AI Stylist</span>
        </button>
      )}
    </div>
  );
}
