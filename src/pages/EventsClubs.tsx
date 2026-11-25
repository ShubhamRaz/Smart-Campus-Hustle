import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { CalendarDays, Users, QrCode, CheckCircle2, Award, Plus, MapPin, Clock } from 'lucide-react';

export const EventsClubs: React.FC = () => {
  const { tenant, user } = useAuth();
  const { addNotification } = useNotifications();

  const [events, setEvents] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventsData();
  }, [tenant]);

  const fetchEventsData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events', {
        headers: {
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setClubs(data.clubs || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterEvent = async (eventId: string, title: string) => {
    try {
      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        },
        body: JSON.stringify({ eventId })
      });

      if (res.ok) {
        const data = await res.json();
        addNotification(
          'Registered for Event',
          `Digital QR Pass #${data.qrTicket} issued for ${title}.`,
          'SUCCESS'
        );
        fetchEventsData();
      }
    } catch {
      alert('Event registration failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-campus-600" />
            Events, Student Clubs & Cultural Activities
          </h2>
          <p className="text-xs text-slate-500">
            Module 12: Club directory, dean approvals, event registration, QR-ticket check-in & participation credentials
          </p>
        </div>
      </div>

      {/* Clubs Directory Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Official University Student Societies & Clubs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          {clubs.map((c) => (
            <div key={c.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-campus-100 text-campus-800">
                  {c.category}
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-2 mb-1">{c.name}</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed mb-3">{c.description}</p>
              </div>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>{c.member_count} Active Members</span>
                <span className="text-campus-600 font-semibold">Join Club</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Campus Events & QR Ticketing */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Upcoming Hackathons, Symposia & Cultural Festivals</h3>

        <div className="space-y-4 text-xs">
          {events.map((evt) => (
            <div key={evt.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-base">{evt.title}</span>
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                    {evt.dean_approval_status}
                  </span>
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed">{evt.description}</p>

                <div className="flex flex-wrap gap-3 text-slate-500 text-[11px]">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-campus-600" /> {evt.venue}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-campus-600" /> {evt.event_date} ({evt.start_time} - {evt.end_time})</span>
                  <span>Registered: <strong>{evt.registered_count} / {evt.capacity}</strong></span>
                </div>
              </div>

              <div className="shrink-0 text-right">
                {evt.is_registered ? (
                  <div className="space-y-1">
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs inline-flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5" /> Pass Issued (Scan Ready)
                    </span>
                    <div className="text-[10px] text-slate-400">Present ticket at registration desk</div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleRegisterEvent(evt.id, evt.title)}
                    className="px-4 py-2.5 rounded-xl bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs shadow-md shadow-campus-600/20"
                  >
                    Register & Get QR Ticket
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
