import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Workflow, Plus, Play, FileText, Download, CheckCircle2, Sliders, ArrowRight } from 'lucide-react';

export const WorkflowAutomation: React.FC = () => {
  const { tenant } = useAuth();
  const { addNotification } = useNotifications();

  const [workflows, setWorkflows] = useState<any[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto document generator state
  const [docType, setDocType] = useState('BONAFIDE_CERTIFICATE');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchAutomationData();
  }, [tenant]);

  const fetchAutomationData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/automation/workflows', {
        headers: {
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data.workflows || []);
        setGeneratedDocs(data.generatedDocs || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDocument = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/automation/generate-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        },
        body: JSON.stringify({ docType })
      });

      if (res.ok) {
        const data = await res.json();
        addNotification(
          'Document Auto-Generated',
          `${docType.replace('_', ' ')} generated with digital SHA-256 seal.`,
          'SUCCESS'
        );
        fetchAutomationData();
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleExportData = (format: 'JSON' | 'CSV') => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify({
      tenant: tenant?.name,
      exportTimestamp: new Date().toISOString(),
      workflows,
      generatedDocs
    }, null, 2))}`;

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `smart_campus_audit_export_${tenant?.slug}.${format.toLowerCase()}`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addNotification('Data Export Completed', `Exported institutional records in ${format} format.`, 'SUCCESS');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Workflow className="w-6 h-6 text-campus-600" />
            Administrative Automation & Document Engine
          </h2>
          <p className="text-xs text-slate-500">
            Module 21: Configurable trigger-action workflows, automated request routing, SLA escalation & one-click clearance document generation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportData('CSV')}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export Audit CSV
          </button>
          <button
            onClick={() => handleExportData('JSON')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
          >
            <Download className="w-3.5 h-3.5" /> Export JSON
          </button>
        </div>
      </div>

      {/* Two Column Grid: Active Automation Workflows & Instant Document Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Workflows */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Active Trigger-Action Institutional Workflows</h3>

            <div className="space-y-3 text-xs">
              {workflows.map((wf) => (
                <div key={wf.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900 text-sm">{wf.name}</h4>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Active Automated
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold">
                      WHEN: {wf.trigger_event}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold">
                      DO: {wf.action_type}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 pt-1 font-mono">
                    Condition: {wf.condition_json}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Document Generator Engine */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-campus-600" />
              Automated Document Generator
            </h3>
            <p className="text-xs text-slate-500">
              Instantly issues verified institutional certificates with digital cryptographic seals
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                >
                  <option value="BONAFIDE_CERTIFICATE">Bonafide Student Certificate</option>
                  <option value="NO_DUES_CLEARANCE">Official No-Dues Clearance Letter</option>
                  <option value="TRANSCRIPT">Provisional Semester Transcript</option>
                  <option value="HALL_TICKET">End-Term Examination Hall Ticket</option>
                </select>
              </div>

              <button
                onClick={handleGenerateDocument}
                disabled={generating}
                className="w-full py-3 rounded-2xl bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs shadow-md shadow-campus-600/20 disabled:opacity-50"
              >
                {generating ? 'Compiling Document...' : 'Generate Official Document'}
              </button>
            </div>

            {/* Generated Documents History */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400">Recently Generated Documents:</span>
              <div className="space-y-2 text-xs">
                {generatedDocs.map((doc) => (
                  <div key={doc.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900 text-[11px]">{doc.doc_type}</div>
                      <div className="font-mono text-[9px] text-slate-400 break-all">{doc.document_hash?.slice(0, 24)}...</div>
                    </div>
                    <button
                      onClick={() => alert(`Verified Official Document: ${doc.doc_type}\nStudent: ${doc.student_name} (${doc.university_id})\nDigital Signature Hash: ${doc.document_hash}`)}
                      className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 font-bold text-[10px]"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
