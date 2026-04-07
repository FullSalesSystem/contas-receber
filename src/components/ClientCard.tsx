"use client";

import { SELECT_OPTIONS } from "@/data/constants";
import { diasAtrasoLabel } from "@/utils/formatters";

export interface AuditEntry {
  ts: string;
  field: string;
  from: string;
  to: string;
}

interface ClientCardProps {
  open: boolean;
  data: string[] | null;
  originalData: string[] | null;
  onChange: (idx: number, val: string) => void;
  obs: string;
  onObs: (val: string) => void;
  audit: AuditEntry[];
  onClose: () => void;
  onSave: () => void;
  onWhatsApp: () => void;
}

const INPUT_STYLE: React.CSSProperties = {
  padding: "7px 10px", fontSize: 13, border: "1px solid #ccc",
  borderRadius: 6, color: "#111", outline: "none",
  background: "#fff", width: "100%", boxSizing: "border-box",
};

const FIELDS = [
  { label: "Dt. Inclusao", idx: 0 },
  { label: "Nome", idx: 1 },
  { label: "Produto", idx: 2, sel: true },
  { label: "Celular", idx: 3 },
  { label: "Pagamento", idx: 4, sel: true },
  { label: "Valor total", idx: 5 },
  { label: "Em atraso", idx: 6 },
  { label: "Parc. em atraso", idx: 7 },
  { label: "Parc. a vencer", idx: 8 },
  { label: "Dt. parcela", idx: 9 },
  { label: "Dias em atraso", ro: true, idx: -1 },
  { label: "Cliente ativo", idx: 10, sel: true },
  { label: "Acordo", idx: 11, sel: true },
  { label: "Acesso", idx: 12, sel: true },
  { label: "SERASA", idx: 13, sel: true },
  { label: "Protesto", idx: 14, sel: true },
  { label: "Juridico", idx: 15, sel: true },
  { label: "Status WA", idx: 16, sel: true },
  { label: "Dt. contato", idx: 17 },
  { label: "Valor recebido", idx: 18 },
  { label: "Ult. alteracao", ro: true, idx: -2 },
];

export default function ClientCard({
  open, data, originalData, onChange, obs, onObs, audit, onClose, onSave, onWhatsApp,
}: ClientCardProps) {
  if (!open || !data) return null;

  const getReadonlyValue = (idx: number) => {
    if (idx === -1) return diasAtrasoLabel(data[9], data[0] === "ok");
    if (idx === -2) return data[19] || "--";
    return "";
  };

  const isChanged = (idx: number) => {
    if (idx < 0 || !originalData) return false;
    return data[idx] !== originalData[idx];
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 200,
      background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-start",
      justifyContent: "center", paddingTop: 20, overflowY: "auto",
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, border: "1px solid #ccc",
        width: "100%", maxWidth: 740, padding: "1.5rem", boxSizing: "border-box",
        margin: "0 12px 20px",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid #eee",
        }}>
          <div>
            <span style={{ fontWeight: 500, fontSize: 15, color: "#111" }}>{data[1]}</span>
            {data[3] && (
              <button onClick={onWhatsApp} style={{
                marginLeft: 10, padding: "2px 8px", fontSize: 11, borderRadius: 4,
                cursor: "pointer", border: "1px solid #25D366", background: "#e8fbe8",
                color: "#128C7E", fontWeight: 500,
              }}>
                WhatsApp
              </button>
            )}
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 22, cursor: "pointer",
            color: "#aaa", lineHeight: 1,
          }}>x</button>
        </div>

        {/* Fields Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {FIELDS.map((f, i) => {
            const changed = isChanged(f.idx);
            return (
              <div key={i}>
                <label style={{
                  fontSize: 11, color: changed ? "#185FA5" : "#666",
                  fontWeight: 500, display: "block", marginBottom: 3,
                }}>
                  {f.label}
                  {changed && <span style={{ color: "#185FA5", marginLeft: 4 }}>*</span>}
                </label>
                {f.ro ? (
                  <div style={{
                    padding: "7px 10px", fontSize: 13, background: "#f5f5f5",
                    border: "1px solid #e5e5e5", borderRadius: 6, color: "#999",
                  }}>
                    {getReadonlyValue(f.idx)}
                  </div>
                ) : f.sel ? (
                  <select
                    value={data[f.idx] || ""}
                    onChange={(e) => onChange(f.idx, e.target.value)}
                    style={{
                      ...INPUT_STYLE,
                      borderColor: changed ? "#185FA5" : "#ccc",
                    }}
                  >
                    {(SELECT_OPTIONS[f.idx] || []).map((o) => (
                      <option key={o} value={o}>{o || "--"}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={data[f.idx] || ""}
                    onChange={(e) => onChange(f.idx, e.target.value)}
                    style={{
                      ...INPUT_STYLE,
                      borderColor: changed ? "#185FA5" : "#ccc",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Observations */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: "#666", display: "block", marginBottom: 4 }}>
            Observacao{" "}
            <span style={{ color: "#bbb", fontWeight: 400, fontSize: 10 }}>
              (somente no card, nao aparece na planilha)
            </span>
          </label>
          <textarea
            value={obs}
            onChange={(e) => onObs(e.target.value)}
            rows={3}
            placeholder="Escreva observacoes livres sobre este cliente..."
            style={{
              width: "100%", boxSizing: "border-box", padding: "8px 10px",
              fontSize: 13, border: "1px solid #ccc", borderRadius: 6,
              color: "#111", outline: "none", resize: "vertical", fontFamily: "inherit",
              background: "#fff",
            }}
          />
        </div>

        {/* Audit Trail */}
        <div style={{
          marginBottom: 16, background: "#f8f8f8", border: "1px solid #eee",
          borderRadius: 8, padding: "10px 14px",
        }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#555", marginBottom: 8 }}>
            Historico de alteracoes
            {audit.length > 0 && (
              <span style={{ fontWeight: 400, color: "#aaa", marginLeft: 4 }}>({audit.length})</span>
            )}
          </div>
          {audit.length === 0 ? (
            <div style={{ fontSize: 11, color: "#bbb", fontStyle: "italic" }}>
              Nenhuma alteracao registrada ainda.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 160, overflowY: "auto" }}>
              {[...audit].reverse().map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%", background: "#185FA5",
                    flexShrink: 0, display: "inline-block", marginTop: 4,
                  }} />
                  <div>
                    <span style={{ color: "#185FA5", fontWeight: 500 }}>{a.ts}</span>
                    <span style={{ color: "#888" }}> — </span>
                    <span style={{ color: "#555", fontWeight: 500 }}>{a.field}: </span>
                    <span style={{ color: "#A32D2D", textDecoration: "line-through" }}>{a.from || "(vazio)"}</span>
                    <span style={{ color: "#888" }}> → </span>
                    <span style={{ color: "#27500A" }}>{a.to || "(vazio)"}</span>
                  </div>
                  {i === 0 && (
                    <span style={{
                      fontSize: 10, background: "#E6F1FB", color: "#0C447C",
                      padding: "1px 6px", borderRadius: 8, fontWeight: 500, flexShrink: 0,
                    }}>
                      ultima
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          display: "flex", gap: 8, justifyContent: "flex-end",
          borderTop: "1px solid #eee", paddingTop: 12,
        }}>
          <button onClick={onClose} style={{
            padding: "7px 18px", fontSize: 13, borderRadius: 6, cursor: "pointer",
            border: "1px solid #ccc", background: "#f5f5f5", color: "#555",
          }}>
            Cancelar
          </button>
          <button onClick={onSave} style={{
            padding: "7px 22px", fontSize: 13, borderRadius: 6, cursor: "pointer",
            border: "none", background: "#185FA5", color: "#fff", fontWeight: 500,
          }}>
            Salvar alteracoes
          </button>
        </div>
      </div>
    </div>
  );
}
