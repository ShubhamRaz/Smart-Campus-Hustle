import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { NavTab } from '../components/common/Sidebar';
import { MewarChecklist } from '../components/dashboard/MewarChecklist';
import { formatCgpaOutOfTen, getCampusName, getInstitutionName, university } from '../config/university';
import { 
  GraduationCap, Calendar, Clock, CreditCard, ShieldAlert, Bus, 
  Sparkles, CheckCircle2, AlertTriangle, ArrowUpRight, BookOpen, 
  FileText, QrCode, UserCheck, Wrench 
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: NavTab) => void;
  onOpenSOS: () => void;
  onOpenScanner: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenSOS, onOpenScanner }) => {
  const { user, tenant, activeCampus } = useAuth();
  const [metrics, setMetrics] = useState<any | null>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [dues, setDues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const token = localStorage.getItem('smart_campus_token');
        const headers = {
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${token}`
        };

        const [mRes, tRes, dRes] = await Promise.all([
          fetch('/api/ai/success-analytics', { headers }),
          fetch('/api/academic/timetable', { headers }),
          fetch('/api/finance/dues', { headers })
        ]);

        if (mRes.ok) {
          const mData = await mRes.json();
          setMetrics(mData.metrics);
        }
        if (tRes.ok) {
          const tData = await tRes.json();
          const today = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
          setTimetable((tData.timetable || [])
            .filter((slot: { day_of_week: string }) => slot.day_of_week === today)
            .slice(0, 3));
        }
        if (dRes.ok) {
          const dData = await dRes.json();
          setDues(dData.dues || []);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [tenant]);

  const unpaidDuesTotal = dues
    .filter(d => d.status !== 'PAID')
    .reduce((sum, d) => sum + (d.balance_amount || 0), 0);
  const campusLocation = tenant?.id === 'tenant_apex'
    ? university.location
    : activeCampus?.city || university.location;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-campus-900 via-campus-800 to-indigo-950 text-white p-6 sm:p-8 shadow-xl shadow-campus-950/20">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-campus-200 text-xs font-semibold mb-3 border border-white/10">
            <span>{getInstitutionName(tenant?.id, tenant?.name)}</span> • <span>{getCampusName(activeCampus?.id, activeCampus?.name)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Scholar'}!
          </h1>
          <p className="mt-2 text-sm text-campus-100/90 leading-relaxed">
            Role: <span className="font-semibold text-white">{user?.role?.replace('_', ' ')}</span> • ID: <span className="font-mono text-campus-200">{user?.university_id}</span> • Department: <span className="text-white">{user?.department}</span>
          </p>

          {/* Quick Action Badges */}
          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('identity')}
              className="px-3.5 py-2 rounded-xl bg-white text-campus-900 font-bold text-xs flex items-center gap-1.5 hover:bg-campus-50 shadow-sm transition-all"
            >
              <QrCode className="w-3.5 h-3.5 text-campus-600" />
              <span>Show University ID</span>
            </button>
            <button
              onClick={() => onNavigate('academic')}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Academic Timetable</span>
            </button>
            <button
              onClick={onOpenScanner}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Turnstile Scanner</span>
            </button>
            <button
              onClick={onOpenSOS}
              className="px-3.5 py-2 rounded-xl bg-emergency-600 hover:bg-emergency-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emergency-600/30 transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
              <span>Emergency SOS</span>
            </button>
          </div>
        </div>

        {/* Decorative backdrop shapes */}
        <div className="absolute -right-10 -bottom-10 w-80 h-80 rounded-full bg-campus-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-20 top-10 w-40 h-40 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Attendance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              (metrics?.attendance_rate || 90) >= 75 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {metrics?.attendance_rate ? `${metrics.attendance_rate}%` : '96.4%'}
            </span>
            <span className={`text-xs font-semibold ${
              (metrics?.attendance_rate || 90) >= 75 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {(metrics?.attendance_rate || 90) >= 75 ? 'Above 75% Min' : 'Shortage Risk'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Institutional threshold: 75% (Mod 10)</p>
        </div>

        {/* Card 2: Cumulative GPA */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cumulative GPA</span>
            <div className="w-8 h-8 rounded-xl bg-campus-50 text-campus-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {formatCgpaOutOfTen(metrics?.gpa)}
            </span>
            <span className="text-xs font-semibold text-campus-600">/ 10.0</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">CGPA scale: 10.0 / Verified Transcripts</p>
        </div>

        {/* Card 3: Outstanding Fee Dues */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Financial Balance</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              ₹{unpaidDuesTotal.toLocaleString()}
            </span>
            <span className={`text-xs font-semibold ${unpaidDuesTotal === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {unpaidDuesTotal === 0 ? 'All Clear' : 'Dues Pending'}
            </span>
          </div>
          <button
            onClick={() => onNavigate('finance')}
            className="mt-1 text-[11px] text-campus-600 hover:underline flex items-center gap-1 font-medium"
          >
            Razorpay Test Checkout <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 4: Safety & Transit Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Smart Transit</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">Route 12</span>
            <span className="text-xs font-semibold text-indigo-600">On Schedule</span>
          </div>
          <button
            onClick={() => onNavigate('transport')}
            className="mt-1 text-[11px] text-campus-600 hover:underline flex items-center gap-1 font-medium"
          >
            Live GPS Map & Telematics <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Two Column Layout: Upcoming Lectures & Success Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Schedule & Active Academics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Today's Class Schedule</h3>
                <p className="text-xs text-slate-400">Live timetable integration for active semester</p>
              </div>
              <button
                onClick={() => onNavigate('academic')}
                className="text-xs font-semibold text-campus-600 hover:text-campus-800 flex items-center gap-1"
              >
                Full Timetable <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {timetable.length > 0 ? (
                timetable.map((t, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-campus-100 text-campus-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {t.code}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{t.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {t.room_number} • Faculty: {t.faculty_name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-800">{t.start_time} - {t.end_time}</div>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {t.day_of_week}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No pending lectures scheduled for the remainder of today.
                </div>
              )}
            </div>
          </div>

          {/* Quick Hub Launchers for Modules */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-1">Campus Services Quick Hub</h3>
            <p className="text-xs text-slate-400 mb-4">{campusLocation} · Direct access to student services</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { label: 'Digital Library', icon: BookOpen, tab: 'library', color: 'text-blue-600 bg-blue-50' },
                { label: 'Facility Ticket', icon: Wrench, tab: 'maintenance', color: 'text-amber-600 bg-amber-50' },
                { label: 'Mess & Cafeteria', icon: UserCheck, tab: 'cafeteria', color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Grievance Desk', icon: AlertTriangle, tab: 'grievance', color: 'text-red-600 bg-red-50' }
              ].map((svc, idx) => {
                const Icon = svc.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onNavigate(svc.tab as NavTab)}
                    className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all text-left flex flex-col gap-2 group"
                  >
                    <div className={`w-8 h-8 rounded-xl ${svc.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-slate-800 group-hover:text-campus-600">{svc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: AI Early Warning & Success Copilot */}
        <div className="space-y-6">
          <MewarChecklist userId={user?.id} />

          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-campus-950 text-white rounded-3xl p-6 shadow-lg shadow-indigo-950/20">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="font-bold text-sm">AI Student Success Copilot</h4>
                <p className="text-[10px] text-campus-200">Modules 9 & 10 Explainable Insights</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <span className="text-[10px] font-semibold uppercase text-emerald-300 tracking-wider">Evaluation</span>
                <p className="mt-1 text-slate-100 font-medium">
                  {metrics?.risk_level === 'LOW' 
                    ? 'Excellent academic trajectory. High engagement in Algorithm labs and 100% on-time project completion.'
                    : 'Attendance in Data Structures (CS201) has dropped to 71.8%. Early support session recommended.'
                  }
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <span className="text-[10px] font-semibold uppercase text-amber-300 tracking-wider">Recommended Action</span>
                <p className="mt-1 text-slate-100 text-[11px]">
                  {metrics?.supportRecommendations?.[0] || 'Explore student mentorship with alumni network and apply for Google Cloud placement opening.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('ai-assistant')}
              className="mt-5 w-full py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors shadow-sm"
            >
              Open AI Student Assistant
            </button>
          </div>

          {/* Institutional Compliance Pill */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Multi-Tenant SaaS Isolation
            </h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Every query, student record, and payment transaction is encrypted and isolated to <strong className="text-slate-800">{getInstitutionName(tenant?.id, tenant?.name)}</strong>. Cross-university leakage is strictly blocked by gateway middleware (Module 19 & 22).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
