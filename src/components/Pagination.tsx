"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  startIdx: number;
  endIdx: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  light?: boolean;
}

export default function Pagination({
  page, totalPages, totalItems, startIdx, endIdx,
  pageSize, onPageChange, onPageSizeChange, light = false,
}: PaginationProps) {
  const bg = light ? "#fff" : "#141414";
  const border = light ? "#ddd" : "#2a2a2a";
  const text = light ? "#111" : "#f0f0f0";
  const muted = light ? "#888" : "#888";
  const btnBg = light ? "#f5f5f5" : "#1a1a1a";
  const btnBorder = light ? "#ccc" : "#333";

  const btn = (label: string, onClick: () => void, disabled: boolean): React.ReactNode => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "4px 10px", fontSize: 12, borderRadius: 4, cursor: disabled ? "default" : "pointer",
        border: `1px solid ${btnBorder}`, background: btnBg, color: disabled ? muted : text,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 12px", background: bg, border: `1px solid ${border}`,
      borderRadius: "0 0 8px 8px", borderTop: "none", flexWrap: "wrap", gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: muted }}>
        <span>{startIdx}-{endIdx} de {totalItems}</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(+e.target.value)}
          style={{
            padding: "2px 6px", fontSize: 11, border: `1px solid ${btnBorder}`,
            borderRadius: 4, background: btnBg, color: text,
          }}
        >
          {[10, 25, 50, 100].map((s) => (
            <option key={s} value={s}>{s}/pag</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {btn("<<", () => onPageChange(1), page <= 1)}
        {btn("<", () => onPageChange(page - 1), page <= 1)}
        <span style={{ fontSize: 12, color: text, padding: "0 8px" }}>
          {page}/{totalPages}
        </span>
        {btn(">", () => onPageChange(page + 1), page >= totalPages)}
        {btn(">>", () => onPageChange(totalPages), page >= totalPages)}
      </div>
    </div>
  );
}
