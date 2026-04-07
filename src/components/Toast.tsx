"use client";

import { useState, useEffect, useCallback } from "react";

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

const COLORS = {
  success: { bg: "#0a2e0a", border: "#1a5c1a", text: "#97C459" },
  error: { bg: "#3a1010", border: "#791F1F", text: "#ff6b6a" },
  warning: { bg: "#2e2000", border: "#633806", text: "#FAC775" },
  info: { bg: "#0c2240", border: "#185FA5", text: "#6ab0ff" },
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastItem["type"] = "info") => {
    const id = Date.now().toString();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => {
      setToasts((p) => p.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: "fixed", top: 16, right: 16, zIndex: 1000,
      display: "flex", flexDirection: "column", gap: 8, maxWidth: 360,
    }}>
      {toasts.map((t) => {
        const c = COLORS[t.type];
        return (
          <div
            key={t.id}
            style={{
              padding: "10px 14px", borderRadius: 8,
              background: c.bg, border: `1px solid ${c.border}`,
              color: c.text, fontSize: 13,
              display: "flex", alignItems: "center", gap: 8,
              animation: "slideIn 0.3s ease-out",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => onRemove(t.id)}
              style={{
                background: "none", border: "none", color: c.text,
                cursor: "pointer", fontSize: 16, lineHeight: 1, opacity: 0.6,
              }}
            >
              x
            </button>
          </div>
        );
      })}
    </div>
  );
}
