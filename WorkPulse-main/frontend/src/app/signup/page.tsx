'use client';
import { useState } from 'react';
import { useAuth, SignupData } from '../../lib/auth';

const ROLES: Array<{ id: SignupData['role']; icon: string; label: string; desc: string }> = [
  { id: 'manager', icon: '👩‍💼', label: 'Manager', desc: 'Full team visibility' },
  { id: 'team_lead', icon: '🧑‍🔧', label: 'Team Lead', desc: 'Lead and coordinate' },
  { id: 'member', icon: '👨‍💻', label: 'Member', desc: 'Personal dashboard' },
  { id: 'admin', icon: '⚙️', label: 'Admin', desc: 'System access' },
];

export default function SignupPage() {
  const { signup } = useAuth();
  const [form, setForm] = useState<SignupData>({ name:'', email:'', password:'', role:'manager', teamName:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const u = await signup(form);
      window.location.href = u.role === 'member' ? '/member' : '/dashboard';
    } catch (err: any) { setError(err.message); setLoading(false); }
  };

  return (
    <div className="auth-shell">
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-mark">WP</div>
            <div className="auth-logo-text">WorkPulse</div>
          </div>
          <div className="auth-title">Create your account</div>
          <div className="auth-sub">Set up workload intelligence for your team</div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
            {[1,2].map(s => (
              <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? 'var(--accent)' : 'var(--border)', transition: 'background .2s' }}/>
            ))}
          </div>
          {error && <div className="err-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <>
                <div className="field-row">
                  <div className="field">
                    <label className="field-label">Full name</label>
                    <input className="field-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" required/>
                  </div>
                  <div className="field">
                    <label className="field-label">Team name</label>
                    <input className="field-input" value={form.teamName} onChange={e => set('teamName', e.target.value)} placeholder="Engineering" required/>
                  </div>
                </div>
                <div className="field">
                  <label className="field-label">Work email</label>
                  <input className="field-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@company.io" required/>
                </div>
                <div className="field">
                  <label className="field-label">Password</label>
                  <input className="field-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 6 characters" required minLength={6}/>
                </div>
                <button type="button" className="auth-btn" onClick={() => { if (form.name && form.email && form.password && form.teamName) setStep(2); }}>Continue</button>
              </>
            )}
            {step === 2 && (
              <>
                <div className="field">
                  <label className="field-label">Your role</label>
                  <div className="role-selector">
                    {ROLES.map(r => (
                      <div key={r.id} className={`role-opt${form.role === r.id ? ' sel' : ''}`} onClick={() => set('role', r.id)}>
                        <div style={{ fontSize: 20, marginBottom: 2 }}>{r.icon}</div>
                        <div className="role-opt-name">{r.label}</div>
                        <div className="role-opt-desc">{r.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: '10px 13px', borderRadius: 'var(--r-md)', background: 'var(--surface3)', border: '1px solid var(--border)', marginBottom: 8, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--text)' }}>{form.name}</strong> joining <strong style={{ color: 'var(--accent)' }}>{form.teamName}</strong> as <strong style={{ color: 'var(--text)' }}>{form.role}</strong>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
                  <button type="submit" className="auth-btn" style={{ flex: 2, marginTop: 0 }} disabled={loading}>
                    {loading ? 'Creating account...' : 'Launch WorkPulse'}
                  </button>
                </div>
              </>
            )}
          </form>
          <div className="auth-link">Already have an account? <a onClick={() => window.location.href = '/login'}>Sign in</a></div>
        </div>
      </div>
    </div>
  );
}
