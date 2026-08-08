'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface AuthUser {
  id: string; name: string; email: string;
  role: 'member' | 'team_lead' | 'manager' | 'hr' | 'executive' | 'admin';
  avatar: string; teamId: string; teamName: string;
  memberId?: string; // links to backend team member
  color: string;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (data: SignupData) => Promise<AuthUser>;
  logout: () => void;
}

export interface SignupData {
  name: string; email: string; password: string;
  role: AuthUser['role']; teamName: string;
}

const DEMO_USERS: AuthUser[] = [
  { id:'u1', name:'Sarah Miller',  email:'sarah@workpulse.io',  role:'manager',   avatar:'SM', teamId:'t1', teamName:'Engineering Alpha', memberId:'',     color:'#7c6df8' },
  { id:'u2', name:'Alex Chen',     email:'alex@workpulse.io',   role:'member',    avatar:'AC', teamId:'t1', teamName:'Engineering Alpha', memberId:'alex',  color:'#ef4444' },
  { id:'u3', name:'Maya Park',     email:'maya@workpulse.io',   role:'team_lead', avatar:'MP', teamId:'t1', teamName:'Engineering Alpha', memberId:'maya',  color:'#f97316' },
  { id:'u4', name:'David Chen',    email:'david@workpulse.io',  role:'admin',     avatar:'DC', teamId:'t1', teamName:'Engineering Alpha', memberId:'',     color:'#00c896' },
  { id:'u5', name:'Raj Joshi',     email:'raj@workpulse.io',    role:'member',    avatar:'RJ', teamId:'t1', teamName:'Engineering Alpha', memberId:'raj',   color:'#f5a623' },
];

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('wp_user');
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setLoading(false);
  }, []);

  const login = async (email: string, _password: string): Promise<AuthUser> => {
    await new Promise(r => setTimeout(r, 800)); // simulate network
    const u = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!u) throw new Error('Invalid email or password');
    localStorage.setItem('wp_user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const signup = async (data: SignupData): Promise<AuthUser> => {
    await new Promise(r => setTimeout(r, 1000));
    const colors = ['#00d4f5','#7c6df8','#00c896','#f5a623','#f53b57'];
    const initials = data.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
    const u: AuthUser = {
      id: 'u' + Date.now(),
      name: data.name, email: data.email, role: data.role,
      avatar: initials, teamId: 't_new', teamName: data.teamName,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    localStorage.setItem('wp_user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('wp_user');
    setUser(null);
    window.location.href = '/login';
  };

  return <Ctx.Provider value={{ user, loading, login, signup, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export const ROLE_LABELS: Record<AuthUser['role'], string> = {
  member: 'Team Member', team_lead: 'Team Lead', manager: 'Manager',
  hr: 'HR Specialist', executive: 'Executive', admin: 'System Admin',
};

export const ROLE_COLORS: Record<AuthUser['role'], string> = {
  member: '#9aadc8', team_lead: '#00c896', manager: '#f5a623',
  hr: '#7c6df8', executive: '#00d4f5', admin: '#f53b57',
};
