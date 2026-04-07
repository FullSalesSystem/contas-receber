"use client";

interface DonutSegment {
  val: number;
  color: string;
  label: string;
}

interface DonutProps {
  segments: DonutSegment[];
  label: string;
  sub: string;
}

export default function Donut({ segments, label, sub }: DonutProps) {
  const r = 62, cx = 80, cy = 80, sw = 22;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.val, 0);

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct = total > 0 ? seg.val / total : 0;
    const dash = pct * circ;
    const arc = { ...seg, dash, offset, pct };
    offset += dash;
    return arc;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2a2a2a" strokeWidth={sw} />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none" stroke={a.color} strokeWidth={sw}
            strokeDasharray={`${a.dash} ${circ - a.dash}`}
            strokeDashoffset={circ / 4 - a.offset}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={13} fontWeight={500} fill="#f0f0f0">{label}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="#888">{sub}</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", maxWidth: 220 }}>
        {arcs.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
            <span style={{ color: "#888" }}>{a.label}</span>
            <span style={{ fontWeight: 500, color: "#f0f0f0" }}>{(a.pct * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
