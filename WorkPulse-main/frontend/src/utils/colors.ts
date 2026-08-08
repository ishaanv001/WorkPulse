export const scoreColor = (s: number) =>
  s >= 76 ? '#b42318' : s >= 51 ? '#c4320a' : s >= 26 ? '#b54708' : '#067647';

export const levelColor = (l: string) =>
  l === 'Burnout Risk' ? '#b42318' : l === 'Overloaded' ? '#c4320a' : l === 'Busy' ? '#b54708' : '#067647';

export const levelBg = (l: string) =>
  l === 'Burnout Risk' ? '#fef3f2' : l === 'Overloaded' ? '#fff6ed' : l === 'Busy' ? '#fffaeb' : '#ecfdf3';

export const levelBd = (l: string) =>
  l === 'Burnout Risk' ? '#fecdca' : l === 'Overloaded' ? '#f9dbaf' : l === 'Busy' ? '#fedf89' : '#abefc6';

export const alertColor = (s: string) =>
  s === 'emergency' ? '#b42318' : s === 'critical' ? '#c4320a' : s === 'warning' ? '#b54708' : '#1a56db';

export const alertBg = (s: string) =>
  s === 'emergency' ? '#fef3f2' : s === 'critical' ? '#fff6ed' : s === 'warning' ? '#fffaeb' : '#eff4ff';

export const alertBd = (s: string) =>
  s === 'emergency' ? '#fecdca' : s === 'critical' ? '#f9dbaf' : s === 'warning' ? '#fedf89' : '#c7d7fd';

export const trendIcon = (t: string) =>
  t === 'worsening' ? 'up' : t === 'improving' ? 'down' : 'stable';

export const trendLabel = (t: string) =>
  t === 'worsening' ? 'Worsening' : t === 'improving' ? 'Improving' : 'Stable';

export const trendColor = (t: string) =>
  t === 'worsening' ? '#b42318' : t === 'improving' ? '#067647' : '#667085';

export const formatNumber = (n: number, dec = 1) =>
  isNaN(n) ? '0' : n.toFixed(dec);

export const fmtTimeAgo = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};
