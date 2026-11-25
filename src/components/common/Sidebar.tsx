import React from 'react';
import { 
  LayoutDashboard, GraduationCap, ShieldAlert, Users, Wrench, 
  CreditCard, BookOpen, Bus, Bot, LineChart, Briefcase, 
  CalendarDays, UtensilsCrossed, Building2, UserCheck, Search, 
  CreditCard as IdCard, MessageSquareWarning, Network, Smartphone, 
  Workflow, ShieldCheck, ChevronRight
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'university'
  | 'academic'
  | 'emergency'
  | 'visitors'
  | 'maintenance'
  | 'finance'
  | 'library'
  | 'transport'
  | 'ai-assistant'
  | 'analytics'
  | 'placement'
  | 'events'
  | 'cafeteria'
  | 'resources'
  | 'alumni'
  | 'lost-found'
  | 'identity'
  | 'grievance'
  | 'saas'
  | 'mobile-pwa'
  | 'automation'
  | 'security';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, isOpen, onCloseMobile }) => {
  const sections = [
    {
      title: 'CORE PLATFORM',
      items: [
        { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
        { id: 'university', label: 'Mewar University Directory', icon: Building2 },
        { id: 'academic', label: 'Academic & LMS Hub', icon: GraduationCap, badge: 'Mod 1-2' },
        { id: 'identity', label: 'Digital University ID', icon: IdCard, badge: 'Mod 17' },
      ]
    },
    {
      title: 'CAMPUS OPERATIONS',
      items: [
        { id: 'emergency', label: 'Safety & SOS Center', icon: ShieldAlert, badge: 'Mod 4', alert: true },
        { id: 'visitors', label: 'Visitor Management', icon: Users, badge: 'Mod 3' },
        { id: 'maintenance', label: 'Facility Maintenance', icon: Wrench, badge: 'Mod 5' },
        { id: 'transport', label: 'Smart Transport & GPS', icon: Bus, badge: 'Mod 8' },
        { id: 'cafeteria', label: 'Cafeteria & Dining', icon: UtensilsCrossed, badge: 'Mod 13' },
        { id: 'resources', label: 'Resource Booking', icon: Building2, badge: 'Mod 14' },
        { id: 'lost-found', label: 'Lost & Found Vault', icon: Search, badge: 'Mod 16' },
      ]
    },
    {
      title: 'FINANCE & SCHOLASTICS',
      items: [
        { id: 'finance', label: 'Financial Ledger & Razorpay', icon: CreditCard, badge: 'Mod 6' },
        { id: 'library', label: 'Digital Library & E-Books', icon: BookOpen, badge: 'Mod 7' },
      ]
    },
    {
      title: 'AI & STUDENT SUCCESS',
      items: [
        { id: 'ai-assistant', label: 'AI Student Copilot', icon: Bot, badge: 'Mod 9' },
        { id: 'analytics', label: 'Early Warning Analytics', icon: LineChart, badge: 'Mod 10' },
        { id: 'placement', label: 'Placement & Careers', icon: Briefcase, badge: 'Mod 11' },
        { id: 'events', label: 'Clubs & Campus Events', icon: CalendarDays, badge: 'Mod 12' },
        { id: 'alumni', label: 'Alumni Network & Gifts', icon: UserCheck, badge: 'Mod 15' },
      ]
    },
    {
      title: 'ENTERPRISE & GOVERNANCE',
      items: [
        { id: 'grievance', label: 'Grievance & Anti-Ragging', icon: MessageSquareWarning, badge: 'Mod 18' },
        { id: 'saas', label: 'Multi-Campus SaaS Admin', icon: Network, badge: 'Mod 19' },
        { id: 'mobile-pwa', label: 'Mobile & Offline PWA', icon: Smartphone, badge: 'Mod 20' },
        { id: 'automation', label: 'Administrative Automation', icon: Workflow, badge: 'Mod 21' },
        { id: 'security', label: 'Security & Audit Trail', icon: ShieldCheck, badge: 'Mod 22' },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 lg:w-72 bg-white border-r border-slate-200 
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-campus-600 flex items-center justify-center text-white font-black text-sm">
              MU
            </div>
            <div>
              <div className="font-extrabold text-slate-900 tracking-tight text-sm">
                Smart Campus Hustle
              </div>
              <div className="text-[10px] text-slate-400">Mewar University Portal</div>
            </div>
          </div>
          <button 
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-xs">
          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              <div className="px-3 mb-2 font-semibold text-[10px] uppercase tracking-wider text-slate-400">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id as NavTab);
                        onCloseMobile();
                      }}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-medium transition-all group
                        ${isActive 
                          ? 'bg-campus-600 text-white shadow-sm shadow-campus-600/30' 
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.alert ? 'text-red-500' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono shrink-0 ml-1 ${
                          isActive 
                            ? 'bg-white/20 text-white' 
                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          <div className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              ACID SQLite Cloud
            </span>
            <span className="font-mono text-[10px] text-slate-400">Integrated Portal</span>
          </div>
        </div>
      </aside>
    </>
  );
};
