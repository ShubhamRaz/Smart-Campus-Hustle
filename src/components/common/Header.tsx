import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useOffline } from '../../context/OfflineContext';
import { getCampusName, getInstitutionName } from '../../config/university';
import { 
  AlertTriangle, Bell, Wifi, WifiOff, Building, UserCircle, 
  ChevronDown, ShieldAlert, Sparkles, LogOut, CheckCircle2, RefreshCw 
} from 'lucide-react';

interface HeaderProps {
  onOpenSOSModal: () => void;
  onOpenQRScanner: () => void;
  onToggleAICopilot: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSOSModal, onOpenQRScanner, onToggleAICopilot }) => {
  const { user, tenant, campuses, activeCampus, switchCampus, switchTenant, tenantsList, switchDemoRole, logout } = useAuth();
  const { notifications, unreadCount, notificationError, markAllRead } = useNotifications();
  const { isOnline, syncQueue } = useOffline();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showTenantMenu, setShowTenantMenu] = useState(false);

  const demoUsers = [
    { name: 'Md Aarif Hussain', role: 'STUDENT', email: 'aarav.patel@student.apex.edu.in', dept: 'CS', tenant: 'tenant_apex' },
    { name: 'Ananya Sengupta (Risk Alert)', role: 'STUDENT', email: 'ananya.s@student.apex.edu.in', dept: 'CS', tenant: 'tenant_apex' },
    { name: 'Rajesh Patel (Parent demo)', role: 'PARENT', email: 'rajesh.patel@gmail.com', dept: 'Guardian', tenant: 'tenant_apex' },
    { name: 'Mewar Campus Warden (Demo)', role: 'WARDEN', email: 'warden@mewaruniversity.demo', dept: 'Student Welfare', tenant: 'tenant_apex' },
    { name: 'Mewar Campus Counsellor (Demo)', role: 'COUNSELLOR', email: 'counsellor@mewaruniversity.demo', dept: 'Student Counselling', tenant: 'tenant_apex' },
    { name: 'Prof. Arvind Namboodiri', role: 'FACULTY', email: 'arvind.n@apex.edu.in', dept: 'CS & AI', tenant: 'tenant_apex' },
    { name: 'Dr. Radhika Sharma', role: 'UNIVERSITY_ADMIN', email: 'dean@apex.edu.in', dept: 'Dean Academic', tenant: 'tenant_apex' },
    { name: 'Havildar Gurpreet Singh', role: 'SECURITY_GUARD', email: 'security.gate1@apex.edu.in', dept: 'Security', tenant: 'tenant_apex' },
    { name: 'Manoj Kumar', role: 'MAINTENANCE_STAFF', email: 'facilities.tech@apex.edu.in', dept: 'HVAC & Civil', tenant: 'tenant_apex' },
    { name: 'Dr. Sumita Das', role: 'LIBRARIAN', email: 'library@apex.edu.in', dept: 'Central Library', tenant: 'tenant_apex' },
    { name: 'Vikramaditya Roy', role: 'PLATFORM_OWNER', email: 'owner@smartcampus.cloud', dept: 'SaaS SuperAdmin', tenant: 'tenant_apex' },
    { name: 'Prof. K. Venkatesh', role: 'UNIVERSITY_ADMIN', email: 'provost@metro.edu.in', dept: 'Metro Tech Admin', tenant: 'tenant_metro' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-6 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Branding & Tenant Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-campus-600 to-campus-400 flex items-center justify-center text-white shadow-md shadow-campus-500/20 font-bold text-lg">
              {getInstitutionName(tenant?.id, tenant?.name).charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg leading-tight">
                  Smart Campus Hustle
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-campus-50 text-campus-700 border border-campus-200 hidden sm:inline-block">
                  {tenant?.subscription_plan || 'ENTERPRISE'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  <Building className="w-3 h-3 text-slate-400" />
                  {getCampusName(activeCampus?.id, activeCampus?.name)}
                </span>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => setShowTenantMenu(!showTenantMenu)}
                  className="text-campus-600 hover:text-campus-800 font-medium inline-flex items-center gap-0.5"
                >
                  Switch Institution <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Tenant Switcher Dropdown */}
          {showTenantMenu && (
            <div className="absolute top-16 left-4 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Select University Tenant
              </div>
              {tenantsList.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    switchTenant(t.id);
                    setShowTenantMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-colors ${
                    tenant?.id === t.id ? 'bg-campus-50 text-campus-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-medium">{getInstitutionName(t.id, t.name)}</div>
                    <div className="text-xs text-slate-400">{t.domain}</div>
                  </div>
                  {tenant?.id === t.id && <CheckCircle2 className="w-4 h-4 text-campus-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online / Offline Status Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Sync</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Offline Safe ({syncQueue.length} queued)</span>
              </>
            )}
          </div>

          {/* 1-Tap SOS Emergency Button (Module 4) */}
          <button
            onClick={onOpenSOSModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emergency-600 hover:bg-emergency-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-emergency-600/30 transition-all"
            title="Instant 1-Tap Emergency Assistance Dispatch"
          >
            <ShieldAlert className="w-4 h-4 animate-bounce" />
            <span className="hidden sm:inline">1-TAP SOS</span>
          </button>

          {/* AI Copilot Floating Toggle (Module 9 & 10) */}
          <button
            onClick={onToggleAICopilot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {/* Real-time Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                markAllRead();
              }}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 relative transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emergency-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {showNotifMenu && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-semibold text-slate-900 text-sm">Institutional Alerts</h4>
                  <span className="text-xs text-slate-400">{notifications.length} updates</span>
                </div>
                <div className="mt-2 max-h-72 overflow-y-auto space-y-2.5">
                  {notificationError && (
                    <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      {notificationError}
                    </p>
                  )}
                  {notifications.length === 0 && !notificationError && (
                    <p className="py-5 text-center text-xs text-slate-500">No notifications yet.</p>
                  )}
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl text-xs border ${
                        n.type === 'EMERGENCY'
                          ? 'bg-red-50 border-red-200 text-red-900'
                          : n.type === 'SUCCESS'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-slate-50 border-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="font-semibold">{n.title}</div>
                      <div className="mt-0.5 text-slate-600">{n.message}</div>
                      <div className="mt-1 text-[10px] text-slate-400">{n.timestamp}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <img
                src={user?.photo_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100'}
                alt={user?.name || 'User'}
                className="w-7 h-7 rounded-full object-cover border border-slate-300"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                  {user?.name?.split(' ')[0] || 'User'}
                </div>
                <div className="text-[10px] font-medium text-campus-600 leading-tight">
                  {user?.role?.replace('_', ' ') || 'GUEST'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Role Switcher Drawer */}
            {showRoleSwitcher && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Demo Persona / Role
                </div>
                <div className="max-h-80 overflow-y-auto space-y-1">
                  {demoUsers.map((du, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        switchDemoRole({ email: du.email, tenant_id: du.tenant });
                        setShowRoleSwitcher(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        user?.email === du.email ? 'bg-campus-50 text-campus-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900">{du.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {du.role} • {du.dept}
                        </div>
                      </div>
                      {user?.email === du.email && <CheckCircle2 className="w-4 h-4 text-campus-600" />}
                    </button>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      logout();
                      setShowRoleSwitcher(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 font-medium flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
