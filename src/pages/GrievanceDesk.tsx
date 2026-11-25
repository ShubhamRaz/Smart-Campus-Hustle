import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { MessageSquareWarning, ShieldAlert, CheckCircle2, Clock, Plus, Lock, Send } from 'lucide-react';

export const GrievanceDesk: React.FC = () => {
  const { tenant } = useAuth();
  const { addNotification } = useNotifications();

  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [category, setCategory] = useState('ANTI_RAGGING');
  const [confidentiality, setConfidentiality] = useState<'CONFIDENTIAL' | 'STRICTLY_ANONYMOUS'>('CONFIDENTIAL');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGrievances();
  }, [tenant]);

  const fetchGrievances = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/grievances', {
        headers: {
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setGrievances(data.grievances || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/grievances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        },
        body: JSON.stringify({
          category,
          confidentialityLevel: confidentiality,
          subject,
          details
        })
      });

      if (res.ok) {
        const data = await res.json();
        addNotification(
          'Grievance Registered',
          `Ticket #${data.trackingTicketNumber} assigned. Auto-escalation window: ${data.autoEscalationDeadline}.`,
          category === 'ANTI_RAGGING' ? 'EMERGENCY' : 'SUCCESS'
        );
        setShowModal(false);
        setSubject('');
        setDetails('');
        fetchGrievances();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquareWarning className="w-6 h-6 text-red-600" />
            Confidential Grievance & Anti-Ragging Portal
          </h2>
          <p className="text-xs text-slate-500">
            Module 18: Student grievances, strictly anonymous submissions, zero-tolerance anti-ragging escalation & 72-hour SLA tracking
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-red-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>File Confidential Grievance</span>
        </button>
      </div>

      {/* Grievances List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Grievance Case Tracking & Committee Resolution</h3>

        <div className="space-y-3 text-xs">
          {grievances.map((g) => (
            <div key={g.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[11px] text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      #{g.tracking_ticket_number}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      g.category === 'ANTI_RAGGING' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {g.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                      <Lock className="w-3 h-3" /> {g.confidentiality_level}
                    </span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    g.priority === 'EMERGENCY_CRITICAL' ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {g.priority}
                  </span>
                </div>

                <h4 className="font-extrabold text-slate-900 text-sm">{g.subject}</h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">{g.details}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                  <span>Submitter: <strong className="text-slate-700">{g.submitter_name}</strong></span>
                  <span className="font-mono text-red-600 font-bold">
                    Escalation Deadline: 72 Hours from receipt
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Status: {g.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 animate-in zoom-in-95">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              File Protected Grievance
            </h3>
            <p className="text-xs text-slate-500">
              Zero retaliation policy. Anti-ragging cases trigger immediate SMS alerts to the Dean and Proctor.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="ANTI_RAGGING">Zero-Tolerance Anti-Ragging</option>
                    <option value="ACADEMIC_DISPUTE">Academic Grading Dispute</option>
                    <option value="HOSTEL_MESS">Hostel & Mess Grievance</option>
                    <option value="HARASSMENT">Harassment & Discrimination</option>
                    <option value="FACILITY">Campus Infrastructure Safety</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Confidentiality Tier</label>
                  <select
                    value={confidentiality}
                    onChange={(e) => setConfidentiality(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="CONFIDENTIAL">Confidential (Dean Review Only)</option>
                    <option value="STRICTLY_ANONYMOUS">Strictly Anonymous (Zero Identity)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Summarize the incident or complaint..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  required
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide dates, locations, witnesses, or specific incidents..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'File Protected Grievance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
