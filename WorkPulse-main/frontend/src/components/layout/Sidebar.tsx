'use client';
import { useStore } from '../../store';
import { ViewId } from '../../types';

interface NavItem { icon: string; label: string; view: ViewId; badge?: string; badgeCls?: string; }

const NAV: Array<{ section: string; items: NavItem[] }> = [
  { section: 'Intelligence', items: [
    { icon: '⬡', label: 'Dashboard', view: 'dashboard' },
    { icon: '◈', label: 'Fuzzy Engine', view: 'fuzzy' },
    { icon: '⊕', label: 'ML Engine', view: 'ml' },
  ]},
  { section: 'Team', items: [
    { icon: '◉', label: 'Members', view: 'members' },
    { icon: '⋈', label: 'Collaboration', view: 'collaboration' },
    { icon: '✦', label: 'Forecasting', view: 'forecast' },
  ]},
  { section: 'Operations', items: [
    { icon: '⚠', label: 'Alerts', view: 'alerts' },
    { icon: '⎏', label: 'Checkpoints', view: 'checkpoints' },
    { icon: '☰', label: 'Audit Log', view: 'audit' },
  ]},
  { section: 'Access', items: [
    { icon: '⊞', label: 'RBAC Config', view: 'rbac' },
  ]},
];

export default function Sidebar() {
  const { view, setView, alerts, predictions, team } = useStore();

  const critAlerts = alerts.filter(a => a.severity === 'emergency' || a.severity === 'critical').length;
  const burnoutCount = Object.values(predictions).filter(p => p.level === 'Burnout Risk').length;

  function getBadge(v: ViewId): { text?: string; cls?: string } | null {
    if (v === 'alerts' && critAlerts > 0) return { text: String(critAlerts), cls: 'red' };
    if (v === 'members' && burnoutCount > 0) return { text: String(burnoutCount), cls: 'red' };
    return null;
  }

  return (
    <div className="sidebar">
      {NAV.map(group => (
        <div key={group.section}>
          <div className="nav-section">{group.section}</div>
          {group.items.map(item => {
            const badge = getBadge(item.view);
            return (
              <div
                key={item.view}
                className={`nav-item${view === item.view ? ' active' : ''}`}
                onClick={() => setView(item.view)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {badge && <span className={`nav-badge ${badge.cls}`}>{badge.text}</span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
