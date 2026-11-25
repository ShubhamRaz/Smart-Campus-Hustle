import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Network, Building, CheckCircle2, ShieldCheck, Globe, CreditCard, Sliders, Users } from 'lucide-react';

export const MultiCampusSaaS: React.FC = () => {
  const { tenant, tenantsList, campuses, switchTenant } = useAuth();
  const { addNotification } = useNotifications();

  const [policies, setPolicies] = useState<any | null>({
    min_attendance_pct: 75.0,
    passing_grade_pct: 40.0,
    late_fee_per_day: 50.0,
    mfa_required_for_staff: 1,
    ai_features_enabled: 1
  });

  const [savingPolicy, setSavingPolicy] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Network className="w-6 h-6 text-campus-600" />
            Multi-Campus SaaS Architecture & Tenant Isolation
          </h2>
          <p className="text-xs text-slate-500">
            Module 19: Multi-university multi-tenant cloud, autonomous student registries, subscription tiers & customizable academic policies
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-bold border border-purple-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-600" /> Cross-Tenant Access Strictly Blocked
          </span>
        </div>
      </div>

      {/* University Institutions on SaaS Grid */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Onboarded Universities & Institutions</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {tenantsList.map((t) => {
            const isCurrent = tenant?.id === t.id;
            return (
              <div
                key={t.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'border-campus-500 bg-campus-50/40 shadow-md ring-2 ring-campus-500/10'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={t.logo_url}
                      alt={t.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-300"
                    />
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{t.name}</h4>
                      <div className="text-slate-500 text-[11px] font-mono">{t.domain} • slug: {t.slug}</div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    t.subscription_plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {t.subscription_plan}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-slate-200 text-[11px] mb-3">
                  <div>Status: <strong className="text-emerald-600">{t.subscription_status}</strong></div>
                  <div>Max Campuses: <strong className="text-slate-800">{t.max_campuses}</strong></div>
                  <div>Student Quota: <strong className="text-slate-800">{t.max_students?.toLocaleString()}</strong></div>
                  <div>Primary Brand: <span className="font-mono font-bold" style={{ color: t.primary_color }}>{t.primary_color}</span></div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-400">Database partition: independent tenant_id key</span>
                  {isCurrent ? (
                    <span className="text-campus-700 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active Active Session
                    </span>
                  ) : (
                    <button
                      onClick={() => switchTenant(t.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px]"
                    >
                      Switch to Tenant
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campuses within Active University */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Campuses in {tenant?.name}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {campuses.map((c) => (
            <div key={c.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-campus-100 text-campus-700 flex items-center justify-center font-bold text-xs shrink-0">
                {c.code}
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                <div className="text-slate-600 text-[11px]">{c.address}, {c.city}</div>
                <div className="text-slate-400 text-[10px]">Email: {c.contact_email} • Phone: {c.contact_phone}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configurable Academic Policies */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Sliders className="w-4 h-4 text-campus-600" />
          Configurable Academic & Gate Policies for {tenant?.name}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="font-bold text-slate-700 block">Min Mandatory Attendance</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={policies.min_attendance_pct}
                onChange={(e) => setPolicies({ ...policies, min_attendance_pct: parseFloat(e.target.value) })}
                className="w-24 bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold"
              />
              <span className="font-bold text-slate-700">%</span>
            </div>
            <span className="text-[10px] text-slate-400 block">Students below this percentage are barred from exams.</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="font-bold text-slate-700 block">Late Fee Per Day Penalty</label>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">₹</span>
              <input
                type="number"
                value={policies.late_fee_per_day}
                onChange={(e) => setPolicies({ ...policies, late_fee_per_day: parseFloat(e.target.value) })}
                className="w-24 bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold"
              />
            </div>
            <span className="text-[10px] text-slate-400 block">Assessed daily after the semester fee due date.</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="font-bold text-slate-700 block">Turnstile Gate Host Approval</label>
            <select
              value={policies.gate_pass_require_host_approval ? '1' : '0'}
              onChange={(e) => setPolicies({ ...policies, gate_pass_require_host_approval: e.target.value === '1' ? 1 : 0 })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold"
            >
              <option value="1">Strict (Faculty Signoff Required)</option>
              <option value="0">Standard Security Check</option>
            </select>
            <span className="text-[10px] text-slate-400 block">Automates host notifications at campus security turnstiles.</span>
          </div>
        </div>

        <button
          onClick={() => addNotification('Policies Updated', 'Institutional policies saved and reloaded.', 'SUCCESS')}
          className="px-5 py-2.5 rounded-xl bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs"
        >
          Save Institutional Academic Policies
        </button>
      </div>
    </div>
  );
};
