import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { UserCheck, Building, Heart, MessageSquare, Linkedin, Award, Send } from 'lucide-react';

export const AlumniNetwork: React.FC = () => {
  const { tenant } = useAuth();
  const { addNotification } = useNotifications();

  const [alumni, setAlumni] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mentorship state
  const [selectedAlumni, setSelectedAlumni] = useState<any | null>(null);
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAlumniData();
  }, [tenant]);

  const fetchAlumniData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alumni', {
        headers: {
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAlumni(data.alumni || []);
        setDonations(data.donations || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMentorship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlumni) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/alumni/mentorship', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        },
        body: JSON.stringify({
          alumniId: selectedAlumni.id,
          topic,
          message
        })
      });

      if (res.ok) {
        addNotification('Mentorship Requested', `Request sent to ${selectedAlumni.name}.`, 'SUCCESS');
        setSelectedAlumni(null);
        setTopic('');
        setMessage('');
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
            <UserCheck className="w-6 h-6 text-campus-600" />
            Alumni Relations, Mentorship & Philanthropy
          </h2>
          <p className="text-xs text-slate-500">
            Module 15: Verified alumni directory, career mentoring, graduate referrals & institutional endowments
          </p>
        </div>
      </div>

      {/* Grid: Alumni Directory & Endowment Contributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Alumni Directory */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Distinguished Alumni Directory</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {alumni.map((alum) => (
                <div key={alum.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={alum.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                        alt={alum.name}
                        className="w-12 h-12 rounded-full object-cover border border-slate-300"
                      />
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{alum.name}</h4>
                        <div className="text-slate-500 text-[11px]">Class of {alum.graduation_year} • {alum.degree}</div>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 mb-3">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" /> {alum.current_company}
                      </div>
                      <div className="text-slate-600 text-[11px]">{alum.designation}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Available for Mentoring
                    </span>

                    <button
                      onClick={() => setSelectedAlumni(alum)}
                      className="px-3 py-1.5 rounded-xl bg-campus-600 hover:bg-campus-700 text-white font-bold text-[11px]"
                    >
                      Connect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Endowments & Giving */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Alumni Endowments & Giving
            </h3>
            <p className="text-xs text-slate-500">Contributions supporting student scholarships and research labs</p>

            <div className="space-y-3 text-xs">
              {donations.map((d) => (
                <div key={d.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{d.donor_name}</span>
                    <span className="font-black text-emerald-600 font-mono">₹{d.amount.toLocaleString()}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Fund: {d.purpose.replace('_', ' ')}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Receipt: #{d.receipt_number}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mentorship Modal */}
      {selectedAlumni && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 animate-in zoom-in-95">
            <h3 className="font-extrabold text-base text-slate-900">Request Mentorship from {selectedAlumni.name}</h3>
            <p className="text-xs text-slate-500">{selectedAlumni.designation} at {selectedAlumni.current_company}</p>

            <form onSubmit={handleRequestMentorship} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mentorship Focus / Topic</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Distributed systems interview prep, Graduate school advice"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Message to Alumni</label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Introduce yourself and what advice you are looking for..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlumni(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-campus-600 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? 'Sending Request...' : 'Send Mentorship Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
