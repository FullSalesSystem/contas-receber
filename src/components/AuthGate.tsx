"use client";

import { useState, useEffect } from "react";
import { THEME as D } from "@/data/constants";

const AUTH_KEY = "cr_auth_token";
const AUTH_PASS = process.env.NEXT_PUBLIC_AUTH_PASS || "admin123";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem(AUTH_KEY);
    if (token === "ok") setAuthed(true);
    setLoading(false);
  }, []);

  const handleLogin = () => {
    if (pass === AUTH_PASS) {
      sessionStorage.setItem(AUTH_KEY, "ok");
      setAuthed(true);
      setError("");
    } else {
      setError("Senha incorreta");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
    setPass("");
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: D.bg, color: D.text,
      }}>
        <div style={{ fontSize: 14 }}>Carregando...</div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: D.bg, fontFamily: "'Inter',system-ui,sans-serif",
      }}>
        <div style={{
          background: D.card, border: `1px solid ${D.border}`, borderRadius: 12,
          padding: "2rem", width: "100%", maxWidth: 360,
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: D.text, marginBottom: 4 }}>
            Contas a Receber
          </div>
          <div style={{ fontSize: 12, color: D.muted, marginBottom: 24 }}>
            Acesso restrito. Insira a senha.
          </div>

          <div style={{ marginBottom: 12 }}>
            <input
              type="password"
              value={pass}
              onChange={(e) => { setPass(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Senha"
              autoFocus
              style={{
                width: "100%", boxSizing: "border-box", padding: "10px 12px", fontSize: 14,
                border: `1px solid ${error ? D.red : D.border}`, borderRadius: 8,
                background: "#1a1a1a", color: D.text, outline: "none",
              }}
            />
            {error && <div style={{ fontSize: 11, color: D.redTx, marginTop: 4 }}>{error}</div>}
          </div>

          <button
            onClick={handleLogin}
            style={{
              width: "100%", padding: "10px", fontSize: 14, borderRadius: 8,
              cursor: "pointer", border: "none", background: "#185FA5",
              color: "#fff", fontWeight: 500,
            }}
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <button
        onClick={handleLogout}
        style={{
          position: "fixed", bottom: 12, right: 12, padding: "4px 12px",
          fontSize: 11, borderRadius: 6, cursor: "pointer",
          border: `1px solid ${D.border}`, background: D.card, color: D.muted,
          zIndex: 100, opacity: 0.6,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
      >
        Sair
      </button>
    </>
  );
}
