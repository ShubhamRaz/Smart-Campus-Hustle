import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Wrench, CheckCircle2, Clock, AlertTriangle, Star, Plus, Send } from 'lucide-react';

export const MaintenanceView: React.FC = () => {
  const { tenant, user } = useAuth();
  const { addNotification } = useNotifications();

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  // New Ticket Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ELECTRICAL');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Satisfaction rating modal state
  const [ratingTicket, setRatingTicket] = useState<any | null>(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [tenant]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/maintenance/tickets', {
        headers: {
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/maintenance/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        },
        body: JSON.stringify({
          title,
          category,
          location,
          description,
          priority,
          photoUrl: photoUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300'
        })
      });

      if (res.ok) {
        const data = await res.json();
        addNotification(
          'Work Order Created',
          `Ticket #${data.ticketId} auto-routed to ${data.assignedDepartment}.`,
          'SUCCESS'
        );
        setShowNewModal(false);
        setTitle('');
        setLocation('');
        setDescription('');
        fetchTickets();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!ratingTicket) return;
    try {
      const res = await fetch('/api/maintenance/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex'
        },
        body: JSON.stringify({
          ticketId: ratingTicket.id,
          studentRating: ratingVal,
          studentFeedback: ratingFeedback
        })
      });

      if (res.ok) {
        addNotification('Rating Saved', 'Satisfaction feedback recorded for Facilities SLA tracking.', 'SUCCESS');
        setRatingTicket(null);
        fetchTickets();
      }
    } catch {
      alert('Failed to submit satisfaction rating.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-600" />
            Facility Maintenance Management
          </h2>
          <p className="text-xs text-slate-500">
            Module 5: Request creation, photo attachments, auto department routing, SLA monitoring & student feedback
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Maintenance Request</span>
        </button>
      </div>

      {/* Tickets Grid */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Work Orders & SLA Status</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {tickets.map((t) => (
            <div key={t.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    {t.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.priority === 'URGENT' || t.priority === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {t.priority}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm mb-1">{t.title}</h4>
                <p className="text-slate-600 text-[11px] mb-2">{t.description}</p>
                <div className="text-slate-500 text-[11px] font-medium">📍 {t.location}</div>

                {t.photo_url && (
                  <img
                    src={t.photo_url}
                    alt="Ticket attachment"
                    className="mt-3 w-full h-32 object-cover rounded-xl border border-slate-200"
                  />
                )}

                <div className="mt-3 bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                  <div>Dept: <strong className="text-slate-800">{t.assigned_department}</strong></div>
                  <div>Tech: <span className="text-slate-700">{t.technician_name || 'Assigned to Shift Lead'}</span></div>
                  <div>SLA Window: <span className="font-mono text-campus-700 font-bold">{t.sla_due_hours} Hours Target</span></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className={`font-bold px-2 py-0.5 rounded-full ${
                  t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {t.status}
                </span>

                {t.status === 'RESOLVED' && !t.student_rating && (
                  <button
                    onClick={() => setRatingTicket(t)}
                    className="text-campus-600 font-bold hover:underline"
                  >
                    Rate Service ★
                  </button>
                )}

                {t.student_rating && (
                  <span className="text-amber-600 font-bold flex items-center gap-0.5">
                    {t.student_rating} ★ Rated
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Maintenance Request Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 animate-in zoom-in-95">
            <h3 className="font-extrabold text-base text-slate-900">Create Maintenance Work Order</h3>
            <p className="text-xs text-slate-500">Auto-routes to corresponding facility department based on issue category</p>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Water leak in 3rd floor washroom"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category (Auto Dept Routing)</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="ELECTRICAL">Electrical Maintenance</option>
                    <option value="PLUMBING">Plumbing & Sanitation</option>
                    <option value="HVAC">HVAC & Climate Control</option>
                    <option value="IT_HARDWARE">Network & Lab Hardware</option>
                    <option value="CARPENTRY">Carpentry & Furniture</option>
                    <option value="CIVIL">Civil Works & Masonry</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="NORMAL">Normal (48h SLA)</option>
                    <option value="HIGH">High (24h SLA)</option>
                    <option value="URGENT">Urgent (4h SLA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Precise Campus Location</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Aryabhata Hostel, Room 314"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe damage, sounds, smells, or safety hazards..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Photograph Attachment URL (Optional)</label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://... (or leave blank for campus stock photo)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? 'Dispatching...' : 'Dispatch Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Satisfaction Rating Modal */}
      {ratingTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 animate-in zoom-in-95">
            <h3 className="font-extrabold text-base text-slate-900">Rate Maintenance Quality</h3>
            <p className="text-xs text-slate-500">For ticket #{ratingTicket.id}: {ratingTicket.title}</p>

            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRatingVal(s)}
                  className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                    s <= ratingVal ? 'bg-amber-400 text-white shadow-md' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {s}★
                </button>
              ))}
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 text-xs">Student Feedback</label>
              <textarea
                rows={2}
                value={ratingFeedback}
                onChange={(e) => setRatingFeedback(e.target.value)}
                placeholder="Was the technician punctual? Was the problem cleanly fixed?"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button onClick={() => setRatingTicket(null)} className="px-4 py-2 text-slate-600">Cancel</button>
              <button
                onClick={handleSubmitRating}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
