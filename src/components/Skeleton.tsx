"use client";

interface SkeletonProps {
  rows?: number;
  cards?: number;
}

export function TableSkeleton({ rows = 8 }: SkeletonProps) {
  return (
    <div style={{ borderRadius: 8, border: "1px solid #2a2a2a", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "flex", gap: 1, padding: "8px 10px",
        background: "#1a1a1a", borderBottom: "1px solid #2a2a2a",
      }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{
            height: 14, borderRadius: 4, background: "#2a2a2a",
            width: `${60 + Math.random() * 60}px`, animation: "pulse 1.5s ease-in-out infinite",
          }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} style={{
          display: "flex", gap: 1, padding: "10px 10px",
          borderBottom: "1px solid #1a1a1a",
        }}>
          {Array.from({ length: 8 }).map((_, ci) => (
            <div key={ci} style={{
              height: 12, borderRadius: 4, background: "#1a1a1a",
              width: `${40 + Math.random() * 80}px`,
              animation: "pulse 1.5s ease-in-out infinite",
              animationDelay: `${(ri * 8 + ci) * 50}ms`,
            }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ cards = 5 }: SkeletonProps) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
      gap: 12,
    }}>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} style={{
          background: "#141414", border: "1px solid #2a2a2a", borderRadius: 10,
          padding: "1rem 1.25rem",
        }}>
          <div style={{
            height: 10, width: 80, borderRadius: 4, background: "#2a2a2a",
            marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite",
          }} />
          <div style={{
            height: 22, width: 120, borderRadius: 4, background: "#1a1a1a",
            animation: "pulse 1.5s ease-in-out infinite",
            animationDelay: `${i * 100}ms`,
          }} />
        </div>
      ))}
    </div>
  );
}

export function DonutSkeleton() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
      gap: 16,
    }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{
          background: "#141414", border: "1px solid #2a2a2a", borderRadius: 10,
          padding: "1rem 1.25rem", display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          <div style={{
            height: 10, width: 80, borderRadius: 4, background: "#2a2a2a",
            marginBottom: 16, animation: "pulse 1.5s ease-in-out infinite",
          }} />
          <div style={{
            width: 120, height: 120, borderRadius: "50%",
            border: "18px solid #1a1a1a", boxSizing: "border-box",
            animation: "pulse 1.5s ease-in-out infinite",
            animationDelay: `${i * 150}ms`,
          }} />
        </div>
      ))}
    </div>
  );
}
