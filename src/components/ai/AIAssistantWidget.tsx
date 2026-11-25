import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bot, Send, Sparkles, X, ShieldCheck, AlertCircle, HelpCircle } from 'lucide-react';

interface AIAssistantWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  context?: any;
}

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({ isOpen, onClose }) => {
  const { user, tenant } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! I am your Smart Campus AI Assistant. I have secure real-time access to your academic policies, course attendance, examination rules, and campus facilities. How can I help you today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const quickPrompts = [
    "What is my attendance percentage and shortage risk?",
    "How do I apply for On-Duty (OD) student leave?",
    "When are the end-semester exams and hall tickets due?",
    "What are the 24/7 campus emergency contact numbers?"
  ];

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim() || loading) return;

    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: q }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        },
        body: JSON.stringify({ query: q })
      });

      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'ai', text: data.answer, context: data.referencedData }]);
    } catch {
      setMessages(prev => [...prev, { sender: 'ai', text: "I'm having trouble connecting to the university database right now. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[95vw] sm:w-[420px] max-h-[620px] h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-campus-700 via-campus-600 to-indigo-700 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
              Campus AI Copilot
              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded-full bg-white/20">Mod 9</span>
            </h3>
            <p className="text-[11px] text-campus-100 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-300" /> Grounded in Institutional Database
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-slate-50/50">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-wrap ${
              m.sender === 'user'
                ? 'bg-campus-600 text-white rounded-tr-xs shadow-md shadow-campus-600/10'
                : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80 shadow-sm'
            }`}>
              {m.text}
              {m.context?.privacyRestricted && (
                <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-amber-700 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-600" /> Privacy Governance Rule Active
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 flex items-center gap-2 text-slate-500">
              <div className="w-2 h-2 rounded-full bg-campus-500 animate-ping" />
              <span className="text-xs">Analyzing institutional rules...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto flex gap-1.5 no-scrollbar">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-campus-50 hover:text-campus-700 text-[11px] text-slate-600 transition-colors border border-slate-200"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything about academics, rules, timetable..."
          className="flex-1 bg-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-campus-500 border-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-campus-600 text-white disabled:opacity-40 hover:bg-campus-700 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
