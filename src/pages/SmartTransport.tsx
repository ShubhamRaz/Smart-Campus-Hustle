import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Bus, MapPin, Navigation, Clock, ShieldCheck, CheckCircle2, User, PhoneCall, Radio } from 'lucide-react';

export const SmartTransport: React.FC = () => {
  const { tenant } = useAuth();
  const { addNotification } = useNotifications();

  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [myAllocation, setMyAllocation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransportData();

    // Listen to real-time telemetry updates via SSE
    const evtSource = new EventSource('/api/live-stream');
    evtSource.addEventListener('BUS_TELEMATICS_UPDATE', (e) => {
      try {
        const update = JSON.parse(e.data);
        setVehicles(prev => prev.map(v => v.id === update.busId ? {
          ...v,
          current_lat: update.lat,
          current_lng: update.lng,
          speed_kmh: update.speedKmh,
          eta_minutes: update.etaMinutes
        } : v));
      } catch {}
    });

    return () => {
      evtSource.close();
    };
  }, [tenant]);

  const fetchTransportData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transport/routes', {
        headers: {
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRoutes(data.routes || []);
        setVehicles(data.vehicles || []);
        setMyAllocation(data.myAllocation);
      }
    } finally {
      setLoading(false);
    }
  };

  const activeVehicle = vehicles[0] || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bus className="w-6 h-6 text-campus-600" />
            Smart Campus Fleet & Telematics Tracker
          </h2>
          <p className="text-xs text-slate-500">
            Module 8: GPS telematics simulator, route stops, driver roster, student seat allocation & arrival alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-indigo-600 animate-pulse" /> Live Telematics Stream (5s Polling)
          </span>
        </div>
      </div>

      {/* Student Transport Pass Banner */}
      {myAllocation && (
        <div className="bg-gradient-to-r from-campus-900 to-indigo-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-campus-300 tracking-wider">
                Official Student Transport Allocation Pass
              </span>
              <h3 className="text-lg font-black mt-0.5">{myAllocation.route_name}</h3>
              <p className="text-xs text-campus-100">
                Assigned Bus: <strong className="text-white font-mono">{myAllocation.bus_number}</strong> • Pickup: <strong className="text-white">{myAllocation.pickup_stop}</strong> • Seat: <strong className="text-amber-300">{myAllocation.seat_number}</strong>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-right">
              <span className="text-[10px] text-campus-200 block">Next Stop ETA</span>
              <span className="text-2xl font-black text-white">{myAllocation.eta_minutes || 6} Mins</span>
            </div>
          </div>
        </div>
      )}

      {/* Live Map Telematics Simulator */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Real-Time Vehicle Positioning & Telematics</h3>
            <p className="text-xs text-slate-400">Simulated OBD-II / GPS tracker updating live coordinates</p>
          </div>
          {activeVehicle && (
            <div className="flex items-center gap-3 text-xs">
              <span className="font-mono text-slate-600">Speed: <strong className="text-slate-900">{activeVehicle.speed_kmh} km/h</strong></span>
              <span className="font-mono text-slate-600">GPS: <strong className="text-slate-900">{activeVehicle.current_lat}, {activeVehicle.current_lng}</strong></span>
            </div>
          )}
        </div>

        {/* Visual Map Representation */}
        <div className="relative h-64 sm:h-72 rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center p-6 text-white">
          {/* Subtle grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

          {/* Route path vector */}
          <div className="relative w-full max-w-xl z-10 space-y-6">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Start: Silk Board</span>
              <span className="text-campus-400 font-bold">In Transit: Bellandur EcoSpace</span>
              <span>Dest: Mewar University Campus</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 rounded-full bg-slate-800 relative">
              <div className="h-full rounded-full bg-gradient-to-r from-campus-500 to-indigo-500 w-3/4" />
              <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-campus-900 flex items-center justify-center shadow-lg shadow-campus-500/50 animate-pulse">
                <Bus className="w-4 h-4 text-campus-700" />
              </div>
            </div>

            <div className="flex justify-between text-[11px] text-slate-400">
              <div className="text-left">
                <div className="text-white font-bold">Driver: Balwinder Singh</div>
                <div>Phone: +91 98999 00112</div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold">Bus KA-01-EQ-9812</div>
                <div>Capacity: 45 Passengers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Routes List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Campus Transit Routes & Scheduled Stops</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {routes.map((r) => (
            <div key={r.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-900 text-sm">{r.route_name}</h4>
                <span className="font-bold text-campus-700 font-mono">₹{r.monthly_fee}/month</span>
              </div>
              <div className="text-slate-500 text-[11px]">
                {r.start_point} ➔ {r.end_point}
              </div>

              {/* Sequential Stops */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                <span className="text-[10px] font-bold uppercase text-slate-400">Route Stops & Timetable:</span>
                {r.stops?.map((stop: any, sIdx: number) => (
                  <div key={sIdx} className="flex justify-between items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-[11px]">
                    <span className="font-medium text-slate-700">{stop.name}</span>
                    <span className="font-mono text-slate-500">{stop.eta} AM</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
