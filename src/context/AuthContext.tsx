import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Tenant, Campus } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  tenant: Tenant | null;
  campuses: Campus[];
  activeCampus: Campus | null;
  tenantsList: Tenant[];
  loading: boolean;
  login: (email: string, password?: string, tenantId?: string) => Promise<boolean>;
  logout: () => void;
  switchTenant: (tenantId: string) => void;
  switchCampus: (campusId: string) => void;
  switchDemoRole: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('smart_campus_token'));
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [activeCampus, setActiveCampus] = useState<Campus | null>(null);
  const [tenantsList, setTenantsList] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizeUser = (rawUser: any): User => ({
    id: rawUser.id,
    tenant_id: rawUser.tenantId || rawUser.tenant_id,
    campus_id: rawUser.campusId || rawUser.campus_id,
    university_id: rawUser.universityId || rawUser.university_id,
    name: rawUser.name,
    email: rawUser.email,
    role: rawUser.role,
    department: rawUser.department,
    phone: rawUser.phone,
    photo_url: rawUser.photoUrl || rawUser.photo_url,
    card_status: rawUser.cardStatus || rawUser.card_status || 'ACTIVE',
    mfa_enabled: rawUser.mfaEnabled || rawUser.mfa_enabled
  });

  // Fetch initial tenant & demo user profile
  useEffect(() => {
    async function initAuth() {
      try {
        const saasRes = await fetch('/api/saas/tenants', {
          headers: { 'X-Tenant-ID': localStorage.getItem('smart_campus_tenant') || 'tenant_apex' }
        });
        if (saasRes.ok) {
          const data = await saasRes.json();
          setTenantsList(data.tenants || []);
          setTenant(data.currentTenant || data.tenants[0] || null);
          setCampuses(data.campuses || []);
          if (data.campuses && data.campuses.length > 0) {
            setActiveCampus(data.campuses[0]);
          }
        }

        // Try getting logged in user or default to student Aarav for instant demo
        const savedToken = localStorage.getItem('smart_campus_token');
        if (savedToken) {
          const meRes = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${savedToken}` }
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            setUser(normalizeUser(meData.user));
            setLoading(false);
            return;
          }
        }

        // Auto login demo student if no session
        await login('aarav.patel@student.apex.edu.in', 'password123', 'tenant_apex');
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password = 'password123', tenantId = 'tenant_apex') => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, tenantId })
      });

      if (!res.ok) return false;

      const data = await res.json();
      setToken(data.token);
      setUser(normalizeUser(data.user));
      localStorage.setItem('smart_campus_token', data.token);
      localStorage.setItem('smart_campus_tenant', data.user.tenantId);

      // Refresh SaaS tenant details
      const saasRes = await fetch('/api/saas/tenants', {
        headers: { 'X-Tenant-ID': data.user.tenantId }
      });
      if (saasRes.ok) {
        const saasData = await saasRes.json();
        setTenant(saasData.currentTenant);
        setCampuses(saasData.campuses || []);
        setActiveCampus(saasData.campuses?.[0] || null);
      }

      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('smart_campus_token');
  };

  const switchTenant = async (tenantId: string) => {
    localStorage.setItem('smart_campus_tenant', tenantId);
    if (tenantId === 'tenant_metro') {
      await login('provost@metro.edu.in', 'password123', 'tenant_metro');
    } else {
      await login('aarav.patel@student.apex.edu.in', 'password123', 'tenant_apex');
    }
  };

  const switchCampus = (campusId: string) => {
    const found = campuses.find(c => c.id === campusId);
    if (found) setActiveCampus(found);
  };

  const switchDemoRole = async (targetUser: Partial<User>) => {
    if (targetUser.email) {
      await login(targetUser.email, 'password123', targetUser.tenant_id || 'tenant_apex');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tenant,
        campuses,
        activeCampus,
        tenantsList,
        loading,
        login,
        logout,
        switchTenant,
        switchCampus,
        switchDemoRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
