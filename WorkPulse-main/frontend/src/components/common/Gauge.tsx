'use client';
import { scoreColor } from '../../utils/colors';

interface Props { score: number; size?: number; }

export default function Gauge({ score, size = 180 }: Props) {
  const color = scoreColor(score);
  const cx = size / 2, cy = size * 0.58, r = size * 0.38;
  const start = -Math.PI * 0.85, end = Math.PI * 0.85;
  const total = end - start;
  const angle = start + total * Math.min(1, score / 100);

  const polar = (a: number, radius = r) => ({
    x: cx + radius * Math.cos(a),
    y: cy + radius * Math.sin(a),
  });

  const p1 = polar(start), p2 = polar(end), pa = polar(angle);
  const largeAll = total > Math.PI ? 1 : 0;
  const largeActive = (angle - start) > Math.PI ? 1 : 0;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => {
    const a = start + total * t;
    return { inner: polar(a, r - 10), outer: polar(a, r - 2) };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size * 0.65}`} width={size} height={size * 0.65} style={{ display: 'block' }}>
      <defs>
        <filter id="gg"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* Track */}
      <path d={`M${p1.x},${p1.y} A${r},${r} 0 ${largeAll} 1 ${p2.x},${p2.y}`}
        fill="none" stroke="#e4e7ec" strokeWidth="8" strokeLinecap="round"/>
      {/* Active arc */}
      {score > 0 && (
        <path d={`M${p1.x},${p1.y} A${r},${r} 0 ${largeActive} 1 ${pa.x},${pa.y}`}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          filter="url(#gg)" opacity="0.9"/>
      )}
      {/* Needle dot */}
      <circle cx={pa.x} cy={pa.y} r="5" fill={color} filter="url(#gg)"/>
      <circle cx={pa.x} cy={pa.y} r="2.5" fill="#fff"/>
      {/* Tick marks */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.inner.x} y1={t.inner.y} x2={t.outer.x} y2={t.outer.y}
          stroke="#d0d5dd" strokeWidth="1"/>
      ))}
      {/* Labels */}
      <text x={polar(start, r + 12).x} y={polar(start, r + 12).y}
        fill="#98a2b3" fontSize="8" fontFamily="monospace" textAnchor="middle">0</text>
      <text x={polar(end, r + 12).x} y={polar(end, r + 12).y}
        fill="#98a2b3" fontSize="8" fontFamily="monospace" textAnchor="middle">100</text>
    </svg>
  );
}
