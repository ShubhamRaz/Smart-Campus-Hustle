import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCampusName, getInstitutionName } from '../../config/university';
import { useNotifications } from '../../context/NotificationContext';
import { ShieldAlert, AlertTriangle, PhoneCall, CheckCircle2, X, MapPin } from 'lucide-react';

interface SOSConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SOSConfirmModal: React.FC<SOSConfirmModalProps> = ({ isOpen, onClose }) => {
  const { tenant, user, activeCampus } = useAuth();
  const { addNotification } = useNotifications();
  const [alertType, setAlertType] = useState<'GENERAL_SOS' | 'MEDICAL' | 'HARASSMENT' | 'FIRE'>('GENERAL_SOS');
  const [locationText, setLocationText] = useState('');
  const [dispatched, setDispatched] = useState<any | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [gpsNotice, setGpsNotice] = useState('');

  if (!isOpen) return null;

  const handleTriggerSOS = async () => {
    setSubmitError('');
    setGpsNotice('');
    setDispatching(true);
    try {
      const position = await new Promise<GeolocationPosition | null>((resolve) => {
        if (!navigator.geolocation) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          resolve,
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
        );
      });

      const gpsCoordinates = position
        ? `${position.coords.latitude.toFixed(6)},${position.coords.longitude.toFixed(6)}`
        : null;
      if (!gpsCoordinates) {
        setGpsNotice('Device location is unavailable. Enter a nearby campus landmark before sending.');
      }
      const locationDescription = locationText.trim() || (gpsCoordinates ? 'Device GPS location' : '');
      if (!locationDescription) {
        setSubmitError('Enter your location or allow device location access before sending the alert.');
        return;
      }

      const res = await fetch('/api/emergency/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        },
        body: JSON.stringify({
          alertType,
          locationDescription,
          gpsCoordinates
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || `Alert request failed (${res.status})`);
      }
      setDispatched(data);
      addNotification(
        'EMERGENCY SOS RECORDED',
        `Campus portal recorded an alert for ${locationDescription}.`,
        'EMERGENCY'
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to send your alert. Call 112 for immediate help.');
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-red-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Banner */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center animate-bounce">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Campus Emergency SOS</h3>
              <p className="text-xs text-red-100">{getInstitutionName(tenant?.id, tenant?.name)} Rapid Safety Protocol</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/80">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!dispatched ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Send an emergency alert to the campus portal. This demo does not contact a live response team. For immediate help, call 112.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Emergency Category</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'GENERAL_SOS', label: 'General Threat / SOS' },
                    { id: 'MEDICAL', label: 'Medical Emergency' },
                    { id: 'HARASSMENT', label: 'Anti-Harassment' },
                    { id: 'FIRE', label: 'Fire / Hazard' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setAlertType(cat.id as any)}
                      className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                        alertType === cat.id
                          ? 'border-red-600 bg-red-50 text-red-900 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="sos-location" className="text-xs font-semibold text-slate-700 block mb-1">Your Current Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-red-500 absolute left-3 top-2.5" />
                  <input
                    id="sos-location"
                    type="text"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    placeholder={`${getCampusName(activeCampus?.id, activeCampus?.name)} — nearby building or landmark`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>
              {gpsNotice && <p role="status" className="text-[11px] text-amber-700">{gpsNotice}</p>}
              {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{submitError}</p>}

              <button
                onClick={handleTriggerSOS}
                disabled={dispatching}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:scale-98 text-white font-black text-sm shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {dispatching ? (
                  <span>TRANSMITTING SOS SIGNAL...</span>
                ) : (
                  <>
                    <ShieldAlert className="w-5 h-5" />
                    <span>SEND CAMPUS SOS ALERT</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                Immediate help: <a href="tel:112" className="font-bold text-red-700 underline">Call 112</a>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Alert recorded</h3>
                <p className="text-xs text-slate-500 mt-1">This portal has saved your emergency alert. It has not contacted a live response team.</p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-left text-xs space-y-2 text-red-950">
                <div className="flex justify-between">
                  <span className="text-red-700">Alert Reference:</span>
                  <span className="font-mono font-bold">{dispatched.sosId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700">Status:</span>
                  <span className="font-bold text-red-700">{dispatched.status}</span>
                </div>
                <div className="mt-2 text-[11px] text-red-800 bg-white/70 p-2 rounded-lg">
                  {dispatched.instructions}
                </div>
              </div>

              <a href="tel:112" className="block w-full rounded-xl bg-red-600 py-3 text-center text-xs font-bold text-white hover:bg-red-700">
                Call 112 for immediate help
              </a>
              <button
                onClick={() => { setDispatched(null); onClose(); }}
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold text-xs"
              >
                Acknowledge & Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
