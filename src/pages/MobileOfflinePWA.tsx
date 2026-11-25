import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  Smartphone, Wifi, WifiOff, Download, QrCode, ShieldAlert, 
  CheckCircle2, RefreshCw, KeyRound, AlertTriangle 
} from 'lucide-react';

export const MobileOfflinePWA: React.FC = () => {
  const { tenant, user } = useAuth();
  const { isOnline, syncQueue, queueAction } = useOffline();
  const { addNotification } = useNotifications();

  const [emergencyResult, setEmergencyResult] = useState<any | null>(null);
  const [officerPin, setOfficerPin] = useState('EMERGENCY_OVERRIDE_9911');
  const [dualWitness, setDualWitness] = useState('user_admin_apex');

  const handleTestQueueOfflineItem = () => {
    queueAction('OFFLINE_DRAFT_MAINTENANCE', {
      title: 'Water dispenser empty in Library 2nd floor',
      timestamp: new Date().toISOString()
    });
    addNotification('Item Queued Offline', 'Saved to IndexedDB / local sync queue. Auto-syncs when online.', 'INFO');
  };

  const handleSimulateOutageOverride = async () => {
    try {
      const res = await fetch('/api/mobile/emergency-override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex'
        },
        body: JSON.stringify({
          officerId: 'user_guard_1',
          dualWitnessId: dualWitness,
          officerPin,
          reason: 'Severe network lightning strike emergency protocol',
          studentUniversityId: user?.university_id || 'MUR2600425'
        })
      });

      const data = await res.json();
      setEmergencyResult(data);
      if (data.success) {
        addNotification('Emergency Gate Passage Authorized', data.message, 'SUCCESS');
      }
    } catch (err: any) {
      alert('Override call failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-campus-600" />
            Mobile PWA & Offline Gate Pass Protocol
          </h2>
          <p className="text-xs text-slate-500">
            Module 20: Progressive Web App, offline caching, background synchronization queue & zero-trust turnstile security
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
            isOnline ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-amber-600" />}
            {isOnline ? 'Network Connected (Live Verification)' : 'Offline Mode (Local Cache Active)'}
          </span>
        </div>
      </div>

      {/* Critical Gate Pass Security Rule Callout */}
      <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-6 text-red-950 space-y-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
          <h3 className="font-extrabold text-sm sm:text-base text-red-900">
            MANDATORY GATE PASS SECURITY SPECIFICATION (Module 20)
          </h3>
        </div>
        <p className="text-xs leading-relaxed text-red-800">
          <strong>Security Mandate:</strong> Never treat an offline cached permission as proof of a currently valid gate pass. All gate turnstiles must verify cryptographic passes directly against the server when connectivity is available. If an institution-wide internet or power outage occurs, a separate controlled emergency procedure requiring <strong>dual-officer credentials</strong> is strictly enforced.
        </p>
      </div>

      {/* Two Column Grid: PWA Offline Capabilities & Controlled Outage Protocol */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Offline Caching & Queue */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Offline Cache & Background Sync Queue</h3>
          <p className="text-xs text-slate-500">Information available without active cell or Wi-Fi coverage</p>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Weekly Lecture Timetable</div>
                <div className="text-[11px] text-slate-500">Cached locally in CacheStorage & ServiceWorker</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Available Offline
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Visual Digital Student ID</div>
                <div className="text-[11px] text-slate-500">Cached for visual verification only (Static QR blocked)</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                Visual View Only
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Emergency Numbers Directory</div>
                <div className="text-[11px] text-slate-500">Local dialer links available instantly</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Always Ready
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Sync Queue: {syncQueue.length} pending operations</span>
            <button
              onClick={handleTestQueueOfflineItem}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold"
            >
              Enqueue Offline Draft Test
            </button>
          </div>
        </div>

        {/* Right: Emergency Outage Gate Passage Simulator */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-red-600" />
            Controlled Emergency Outage Protocol Simulator
          </h3>
          <p className="text-xs text-slate-500">
            Dual-officer override when campus WAN/LAN connections are completely down
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-medium text-slate-700 block mb-1">Student University ID</label>
              <input
                type="text"
                readOnly
                value={user?.university_id || 'MUR2600425'}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Witness Officer ID</label>
                <input
                  type="text"
                  value={dualWitness}
                  onChange={(e) => setDualWitness(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Emergency Override PIN</label>
                <input
                  type="password"
                  value={officerPin}
                  onChange={(e) => setOfficerPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleSimulateOutageOverride}
              className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20"
            >
              Execute Dual-Officer Emergency Gate Passage
            </button>

            {emergencyResult && (
              <div className={`p-4 rounded-2xl text-xs border ${
                emergencyResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-red-50 border-red-200 text-red-950'
              }`}>
                <div className="font-bold text-sm mb-1">
                  {emergencyResult.success ? 'Emergency Clearance Authorized' : 'Clearance Rejected'}
                </div>
                <div>{emergencyResult.message}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
