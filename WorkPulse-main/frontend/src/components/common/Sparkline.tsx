'use client';
interface Props { values: number[]; width?: number; height?: number; color?: string; }
export default function Sparkline({ values, width = 80, height = 26, color = '#1a56db' }: Props) {
  if (values.length < 2) return null;
  const mn = Math.min(...values), mx = Math.max(...values), range = mx - mn || 1;
  const pad = 2, w = width-pad*2, h = height-pad*2;
  const pts = values.map((v,i) => ({ x: pad+(i/(values.length-1))*w, y: pad+h-((v-mn)/range)*h }));
  const d = pts.map((p,i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const last = pts[pts.length-1];
  return (
    <svg width={width} height={height} style={{ display:'block' }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
      <circle cx={last.x} cy={last.y} r="2.5" fill={color}/>
    </svg>
  );
}
