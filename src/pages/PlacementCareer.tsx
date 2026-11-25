import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Briefcase, Building, CheckCircle2, Clock, FileText, Send, UserCheck, Star } from 'lucide-react';

export const PlacementCareer: React.FC = () => {
  const { tenant, user } = useAuth();
  const { addNotification } = useNotifications();

  const [jobs, setJobs] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [resume, setResume] = useState<any | null>(null);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Resume builder editing state
  const [skills, setSkills] = useState('React, TypeScript, Node.js, Python, PostgreSQL, Docker');
  const [summary, setSummary] = useState('Computer Science undergraduate focused on high-throughput backend systems.');
  const [savingResume, setSavingResume] = useState(false);

  useEffect(() => {
    fetchPlacementData();
  }, [tenant]);

  const fetchPlacementData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/placements/jobs', {
        headers: {
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setCompanies(data.companies || []);
        setResume(data.resume);
        if (data.resume?.skills) setSkills(data.resume.skills);
        if (data.resume?.summary) setSummary(data.resume.summary);
        setMyApplications(data.myApplications || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyJob = async (jobId: string, jobTitle: string) => {
    try {
      const res = await fetch('/api/placements/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        },
        body: JSON.stringify({ jobId, resumeUrl: '/resumes/my_resume.pdf' })
      });

      if (res.ok) {
        addNotification('Application Submitted', `Applied for ${jobTitle}. Placement cell notified.`, 'SUCCESS');
        fetchPlacementData();
      }
    } catch {
      alert('Application failed.');
    }
  };

  const handleSaveResume = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingResume(true);
    try {
      const res = await fetch('/api/placements/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        },
        body: JSON.stringify({
          skills,
          summary,
          projects: [
            { title: 'Distributed Multi-Tenant Queue', description: 'Go message broker handling 120k msgs/sec' },
            { title: 'Smart Campus Assistant', description: 'Privacy-aware AI student records copilot' }
          ],
          certifications: [
            { name: 'AWS Certified Solutions Architect', year: '2025' }
          ]
        })
      });

      if (res.ok) {
        addNotification('Career Profile Updated', 'Resume builder saved to institutional database.', 'SUCCESS');
        fetchPlacementData();
      }
    } finally {
      setSavingResume(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-campus-600" />
            Placement & Career Advancement Cell
          </h2>
          <p className="text-xs text-slate-500">
            Module 11: Verified company postings, eligibility filtering, interactive resume builder & interview schedules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-campus-50 text-campus-800 font-bold text-xs border border-campus-200">
            Institutional Placement Rate: 94.2%
          </span>
        </div>
      </div>

      {/* Grid: Open Positions & Resume Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Job Openings & Application Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applications Status tracker */}
          {myApplications.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">My Active Job & Internship Applications</h3>
              <div className="space-y-2 text-xs">
                {myApplications.map((app) => (
                  <div key={app.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{app.job_title}</div>
                      <div className="text-slate-500 text-[11px]">{app.company_name} • CTC: ₹{app.ctc_lpa} LPA</div>
                      {app.interview_date && (
                        <div className="text-[10px] text-campus-600 font-bold mt-1">
                          Interview Slot: {new Date(app.interview_date).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <span className="px-3 py-1 rounded-full font-bold text-[10px] bg-purple-100 text-purple-800">
                      {app.stage}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Job Openings */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Verified Corporate Recruitment Opportunities</h3>

            <div className="space-y-4 text-xs">
              {jobs.map((job) => (
                <div key={job.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{job.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {job.tier}
                      </span>
                    </div>

                    <div className="text-slate-700 font-semibold text-xs flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      {job.company_name} • <span className="text-emerald-600 font-bold">₹{job.ctc_lpa} LPA CTC</span>
                    </div>

                    <p className="text-slate-500 text-[11px] leading-relaxed">{job.description}</p>

                    <div className="text-[10px] text-slate-400">
                      Eligible: {job.eligible_departments} • Min CGPA: {job.min_cgpa} • Max Backlogs: {job.max_backlogs}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {job.application_stage ? (
                      <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs inline-block">
                        Applied: {job.application_stage}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApplyJob(job.id, job.title)}
                        className="px-4 py-2.5 rounded-xl bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs shadow-md"
                      >
                        Apply with Profile
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Interactive Student Resume Builder */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-campus-600" />
              Dynamic Student Resume Builder
            </h3>
            <p className="text-xs text-slate-500">Live career profile reviewed during campus placement screening</p>

            <form onSubmit={handleSaveResume} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Core Technical Skills (CSV)</label>
                <textarea
                  rows={2}
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Professional Executive Summary</label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                <div className="font-bold text-slate-800">Featured Capstone Projects:</div>
                <div className="text-slate-600">• Distributed Multi-Tenant Queue (Go)</div>
                <div className="text-slate-600">• Smart Campus AI Records Assistant (React/Node)</div>
              </div>

              <button
                type="submit"
                disabled={savingResume}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                {savingResume ? 'Saving...' : 'Update Career Resume'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
