'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuth, ROLE_LABELS } from '../../lib/auth';
import { useStore } from '../../store';

interface Props { children: React.ReactNode; activePath?: string; }

const NAV_MANAGER = [
  { section: 'Intelligence', items: [
    { label: 'Overview', path: '/dashboard', icon: 'grid' },
    { label: 'Fuzzy Engine', path: '/dashboard?view=fuzzy', icon: 'cpu' },
    { label: 'ML Engine', path: '/dashboard?view=ml', icon: 'activity' },
  ]},
  { section: 'Team', items: [
    { label: 'Members', path: '/dashboard?view=members', icon: 'users' },
    { label: 'Collaboration', path: '/collab', icon: 'link' },
    { label: 'Forecasting', path: '/dashboard?view=forecast', icon: 'trending-up' },
  ]},
  { section: 'Operations', items: [
    { label: 'Alerts', path: '/dashboard?view=alerts', icon: 'bell', badge: 'alerts' },
    { label: 'Checkpoints', path: '/dashboard?view=checkpoints', icon: 'save' },
    { label: 'Audit Log', path: '/dashboard?view=audit', icon: 'list' },
  ]},
];

const NAV_ADMIN = [
  ...NAV_MANAGER.slice(0, 2),
  { section: 'Operations', items: [
    { label: 'Alerts', path: '/dashboard?view=alerts', icon: 'bell', badge: 'alerts' },
    { label: 'Checkpoints', path: '/dashboard?view=checkpoints', icon: 'save' },
    { label: 'Audit Log', path: '/dashboard?view=audit', icon: 'list' },
  ]},
  { section: 'Access Control', items: [
    { label: 'RBAC Config', path: '/dashboard?view=rbac', icon: 'shield' },
    { label: 'Rate Limits', path: '/dashboard?view=ratelimits', icon: 'sliders' },
  ]},
];

const NAV_MEMBER = [
  { section: 'My Workspace', items: [
    { label: 'My Dashboard', path: '/member', icon: 'user' },
    { label: 'Collaboration', path: '/collab', icon: 'link' },
    { label: 'My Forecast', path: '/member?view=forecast', icon: 'trending-up' },
  ]},
  { section: 'Team', items: [
    { label: 'Team Overview', path: '/dashboard', icon: 'grid' },
    { label: 'Alerts', path: '/member?view=alerts', icon: 'bell', badge: 'alerts' },
  ]},
];

// Icon → simple SVG or text label
function NavIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    grid: '▦', cpu: '◎', activity: '∿', users: '◉', link: '⊙', 'trending-up': '↗',
    bell: '◇', save: '▣', list: '≡', shield: '⬡', sliders: '⊟', user: '○',
  };
  return <span className="nav-icon" style={{ fontSize: 12 }}>{icons[name] ?? '·'}</span>;
}

const NOTIFS = [
  { id: 'n1', title: 'Critical: Alex Chen', body: 'Burnout score reached 91.3 — intervention required', time: '2m ago', unread: true, level: 'red' },
  { id: 'n2', title: 'Sprint 15 analysis ready', body: 'Team capacity projected at 123%', time: '14m ago', unread: true, level: 'amber' },
  { id: 'n3', title: 'Prediction cycle complete', body: 'All 8 members updated. Avg score: 63.2', time: '32m ago', unread: false, level: 'green' },
  { id: 'n4', title: 'Knowledge silo detected', body: 'Alex holds 78% of payment module knowledge', time: '1h ago', unread: false, level: 'amber' },
  { id: 'n5', title: 'Checkpoint saved', body: 'Sprint14-EOD snapshot created successfully', time: '2h ago', unread: false, level: 'blue' },
];

export default function AppShell({ children, activePath = '' }: Props) {
  const { user, loading: authLoading, logout } = useAuth();
  const { alerts, metrics, init } = useStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [notifs, setNotifs] = useState(NOTIFS);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Route protection
  useEffect(() => {
    if (authLoading) return;
    if (!user) { window.location.href = '/login'; return; }
    // Members/team leads cannot access /dashboard — redirect to /member
    const isMemberRole = user.role === 'member' || user.role === 'team_lead';
    if (isMemberRole && activePath === '/dashboard') {
      window.location.href = '/member';
      return;
    }
  }, [user, authLoading, activePath]);

  useEffect(() => { init(); }, []);
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    return () => io.disconnect();
  });
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (!user) return null;
  const isAdmin = user.role === 'admin' || user.role === 'hr' || user.role === 'executive';
  const isMember = user.role === 'member' || user.role === 'team_lead';
  const navGroups = isAdmin ? NAV_ADMIN : isMember ? NAV_MEMBER : NAV_MANAGER;
  const critAlerts = alerts.filter(a => !a.dismissed && (a.severity === 'emergency' || a.severity === 'critical')).length;
  const unread = notifs.filter(n => n.unread).length;
  const levelDot: Record<string, string> = { red:'#b42318', amber:'#b54708', green:'#067647', blue:'#1a56db' };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="wp-logo" onClick={() => window.location.href = isMember ? '/member' : '/dashboard'}>
          <div className="wp-mark">WP</div>
          <div className="wp-name">WorkPulse</div>
        </div>
        {metrics && (
          <div className="topbar-badge">Sprint 14 · {metrics.teamSize} members · avg {metrics.avgScore}</div>
        )}
        <div className="topbar-sep"/>

        {/* Notifications */}
        <div className="notif-wrap" ref={notifRef}>
          <div className="notif-btn" onClick={() => { setNotifOpen(o => !o); setUserOpen(false); }} title="Notifications">
            {unread > 0 && <div className="notif-dot"/>}
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1.5a4.5 4.5 0 0 1 4.5 4.5v2l1 2.5H2.5L3.5 8V6A4.5 4.5 0 0 1 8 1.5zM6 13a2 2 0 0 0 4 0"/></svg>
          </div>
          {notifOpen && (
            <div className="notif-panel">
              <div className="notif-hd">
                <span className="notif-hd-t">Notifications</span>
                <span className="notif-hd-mark" onClick={() => setNotifs(n => n.map(x => ({ ...x, unread: false })))}>Mark all read</span>
              </div>
              {notifs.map(n => (
                <div key={n.id} className={`notif-item${n.unread ? ' unread' : ''}`}>
                  <div className="notif-icon" style={{ background: levelDot[n.level] + '18' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: levelDot[n.level] }}/>
                  </div>
                  <div className="notif-txt">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-body">{n.body}</div>
                    <div className="notif-time">{n.time}</div>
                  </div>
                  {n.unread && <div className="notif-ud"/>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="user-wrap" ref={userRef}>
          <div className="user-btn" onClick={() => { setUserOpen(o => !o); setNotifOpen(false); }}>
            <div className="user-av" style={{ background: user.color }}>{user.avatar}</div>
            <div>
              <div className="user-name">{user.name}</div>
              <div className="user-role-tag">{ROLE_LABELS[user.role]}</div>
            </div>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{ color: 'var(--muted)', marginLeft: 2 }}><path d="M1 3l4 4 4-4"/></svg>
          </div>
          {userOpen && (
            <div className="user-dd">
              <div className="user-dd-item" onClick={() => window.location.href = isMember ? '/member' : '/dashboard'}>Dashboard</div>
              <div className="user-dd-item" onClick={() => window.location.href = '/collab'}>Collaboration</div>
              <div className="user-dd-div"/>
              <div className="user-dd-item" onClick={() => { setShowTeamModal(true); setUserOpen(false); }}>Create Team</div>
              <div className="user-dd-div"/>
              <div className="user-dd-item danger" onClick={logout}>Sign out</div>
            </div>
          )}
        </div>
      </header>

      <nav className="sidebar">
        <div className="team-sw" onClick={() => setShowTeamModal(true)}>
          <div className="team-av">{user.teamName.slice(0, 2).toUpperCase()}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{user.teamName}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{metrics?.teamSize ?? 8} members</div>
          </div>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{ color: 'var(--muted)', marginLeft: 'auto' }}><path d="M1 3l4 4 4-4"/></svg>
        </div>

        {navGroups.map(group => (
          <div key={group.section}>
            <div className="nav-section">{group.section}</div>
            {group.items.map(item => (
              <div key={item.path}
                className={`nav-item${activePath.startsWith(item.path.split('?')[0]) && item.path.split('?')[0] === activePath ? ' active' : activePath === item.path ? ' active' : ''}`}
                onClick={() => window.location.href = item.path}>
                <NavIcon name={item.icon}/>
                {item.label}
                {item.badge === 'alerts' && critAlerts > 0 && (
                  <span className="nav-badge nb-red">{critAlerts}</span>
                )}
              </div>
            ))}
          </div>
        ))}

        <div className="spacer"/>
        {isMember && metrics && (
          <div className="my-score-card" onClick={() => window.location.href = '/member'}>
            <div className="my-score-lbl">My Workload</div>
            <div className="my-score-num">{metrics.avgScore}</div>
            <div className="my-score-sub">View details</div>
          </div>
        )}
      </nav>

      <main className="main">{children}</main>
      {showTeamModal && <TeamCreateModal onClose={() => setShowTeamModal(false)}/>}
    </div>
  );
}

function TeamCreateModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [done, setDone] = useState(false);
  const create = () => { if (!name.trim()) return; setDone(true); setTimeout(onClose, 1500); };
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--green-bg)', border: '1px solid var(--green-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'var(--green)', fontWeight: 700, fontSize: 18 }}>+</div>
            <div className="modal-title" style={{ textAlign: 'center' }}>Team created</div>
            <div className="modal-sub" style={{ textAlign: 'center' }}>{name} is ready. Setting up workspace...</div>
          </div>
        ) : (
          <>
            <div className="modal-title">Create a new team</div>
            <div className="modal-sub">Set up a workspace to start tracking workload intelligence for your team.</div>
            <div className="field">
              <label className="field-label">Team name</label>
              <input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Platform Engineering"/>
            </div>
            <div className="field">
              <label className="field-label">Description (optional)</label>
              <input className="field-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="What does this team own?"/>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>Included automatically</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>Hybrid fuzzy engine, 55-rule base, SHAP explainability, and 7-day LSTM forecasting will be configured for your team on first predict run.</div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={create} disabled={!name.trim()}>Create Team</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
