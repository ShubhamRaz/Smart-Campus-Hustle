import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCgpaOutOfTen, getInstitutionName } from '../config/university';
import { 
  Bot, Sparkles, Send, ShieldCheck, AlertCircle, LineChart, 
  CheckCircle2, BookOpen, Clock, HelpCircle, ArrowRight 
} from 'lucide-react';

export const AIAssistantView: React.FC = () => {
  const { tenant, user } = useAuth();
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'ai',
      text: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! I am your Smart Campus AI Assistant & Success Copilot. I have real-time access to authorized university services, academic schedules, examination rules, and attendance calculations. How can I assist your studies today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<any | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, [tenant]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/ai/success-analytics', {
        headers: {
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
      }
    } catch {}
  };

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
      setMessages(prev => [...prev, { sender: 'ai', text: "I'm having trouble querying the university database right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Bot className="w-6 h-6 text-indigo-600" />
          AI Student Assistant & Academic Success Analytics
        </h2>
        <p className="text-xs text-slate-500">
          Modules 9 & 10: Contextual student assistant, academic rule explanations, early warnings, attendance drift & non-punitive study guidance
        </p>
      </div>

      {/* Two Column Layout: Chat Interface & Success Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Conversational Assistant */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Campus Conversational Copilot</h4>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Grounded in {getInstitutionName(tenant?.id, tenant?.name)} DB (Zero Data Leakage)
                </span>
              </div>
            </div>

            <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-slate-300 font-mono">
              Module 9
            </span>
          </div>

          {/* Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 text-xs">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 leading-relaxed whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-campus-600 text-white rounded-tr-xs shadow-md shadow-campus-600/10'
                    : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200 shadow-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 flex items-center gap-2 text-slate-500 text-xs">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  Reasoning against university policies...
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          <div className="p-2.5 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
            {[
              "Explain my attendance calculation",
              "How to apply for sick or OD leave?",
              "When do exam registrations close?",
              "Show my timetable for this week",
              "Show me counselling records of another student"
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="shrink-0 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-campus-50 hover:text-campus-700 text-slate-700 border border-slate-200"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask questions about exam schedules, attendance, courses, services..."
              className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-campus-500 border-none"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-3 rounded-xl bg-campus-600 hover:bg-campus-700 text-white disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Col: Explainable Student Success Analytics (Module 10) */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <LineChart className="w-4 h-4 text-campus-600" />
                Student Success Analytics
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                metrics?.risk_level === 'LOW' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {metrics?.risk_level || 'LOW'} RISK
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500 font-medium">Institutional Attendance</span>
                  <span className="font-bold text-slate-900">{metrics?.attendance_rate || 96.4}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      (metrics?.attendance_rate || 96) >= 75 ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, metrics?.attendance_rate || 96)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500 font-medium">Assignment Completion</span>
                  <span className="font-bold text-slate-900">{metrics?.assignment_completion_rate || 100}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-campus-600" style={{ width: '95%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500 font-medium">Cumulative Grade (CGPA)</span>
                  <span className="font-bold text-slate-900">{formatCgpaOutOfTen(metrics?.gpa)} / 10.0</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: '92%' }} />
                </div>
              </div>
            </div>

            {/* Explainable Reasoning Factors */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400">Explainable Model Reasoning:</span>
              <div className="space-y-1.5 text-xs text-slate-700">
                {metrics?.explainableRiskFactors?.map((f: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Non-Punitive Recommendations */}
            <div className="pt-2 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400">Personalized Support Actions:</span>
              <div className="space-y-1.5 text-xs text-slate-700">
                {metrics?.supportRecommendations?.map((r: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-1.5 bg-indigo-50/60 p-2 rounded-xl border border-indigo-100 text-[11px] text-indigo-950">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
              <strong>Ethical AI Guardrail (Module 10):</strong> Predictions are strictly explainable and advisory. AI models never autonomously determine disciplinary action, grades, or access to university services.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
