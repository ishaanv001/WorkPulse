'use client';
import { useState } from 'react';
import { useAuth, ROLE_LABELS } from '../../lib/auth';

const DEMO = [
  { email: 'sarah@workpulse.io', role: 'Manager', desc: 'Full dashboard access', icon: '👩‍💼' },
  { email: 'alex@workpulse.io', role: 'Member', desc: 'Personal + collab views', icon: '👨‍💻' },
  { email: 'maya@workpulse.io', role: 'Team Lead', desc: 'Team overview access', icon: '👩‍🔧' },
  { email: 'david@workpulse.io', role: 'Admin', desc: 'System administration', icon: '⚙️' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('sarah@workpulse.io');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const u = await login(email, password);
      window.location.href = (u.role === 'member' || u.role === 'team_lead') ? '/member' : '/dashboard';
    } catch (err: any) { setError(err.message); setLoading(false); }
  };

  return (
    <div className="auth-shell">
      <div className="auth-wrap">
        <div className="demo-accounts">
          <div className="demo-title">Demo accounts</div>
          {DEMO.map(d => (
            <div key={d.email} className={`demo-card${email === d.email ? ' sel' : ''}`} onClick={() => setEmail(d.email)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{d.icon}</span>
                <div>
                  <div className="demo-card-role">{d.role}</div>
                  <div className="demo-card-desc">{d.desc}</div>
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 10, padding: '9px 12px', borderRadius: 'var(--r-md)', background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', fontSize: 11, color: 'var(--accent)', lineHeight: 1.5 }}>
            <strong>🔑 Any password works</strong>
            <div style={{ color: 'var(--muted)', marginTop: 2 }}>This is a demo — use any password with the accounts above.</div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-mark">WP</div>
            <div className="auth-logo-text">WorkPulse</div>
          </div>
          <div className="auth-title">Welcome back</div>
          <div className="auth-sub">AI-powered workload intelligence for your team</div>
          {error && <div className="err-msg">⚠ {error}</div>}
          <form onSubmit={handle}>
            <div className="field">
              <label className="field-label">Email</label>
              <input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.io" required/>
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <input className="field-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required/>
            </div>
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }}/>
                  Signing in…
                </span>
              ) : 'Sign in →'}
            </button>
          </form>
          <div className="auth-link">
            Don't have an account?{' '}
            <a onClick={() => window.location.href = '/signup'}>Create one</a>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
