"use client";

import { useState, useRef } from "react";
import { parseCSV, readFileAsText, type ImportResult } from "@/utils/importCSV";
import { THEME as D } from "@/data/constants";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (rows: string[][]) => void;
  dark?: boolean;
}

export default function ImportModal({ open, onClose, onImport, dark = true }: ImportModalProps) {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const bg = dark ? D.card : "#fff";
  const border = dark ? D.border : "#ddd";
  const text = dark ? D.text : "#111";
  const muted = dark ? D.muted : "#888";

  const processFile = async (file: File) => {
    setFileName(file.name);
    const content = await readFileAsText(file);
    const res = parseCSV(content);
    setResult(res);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleConfirm = () => {
    if (result && result.rows.length > 0) {
      onImport(result.rows);
      setResult(null);
      setFileName("");
      onClose();
    }
  };

  const handleCancel = () => {
    setResult(null);
    setFileName("");
    onClose();
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 300,
      background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: bg, borderRadius: 12, border: `1px solid ${border}`,
        width: "100%", maxWidth: 520, padding: "1.5rem", boxSizing: "border-box",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${border}`,
        }}>
          <span style={{ fontWeight: 500, fontSize: 15, color: text }}>Importar planilha CSV</span>
          <button onClick={handleCancel} style={{
            background: "none", border: "none", fontSize: 22, cursor: "pointer",
            color: muted, lineHeight: 1,
          }}>x</button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? "#185FA5" : border}`,
            borderRadius: 8, padding: "2rem", textAlign: "center",
            cursor: "pointer", marginBottom: 16,
            background: dragging ? (dark ? "#0c2240" : "#E6F1FB") : "transparent",
            transition: "all 0.2s",
          }}
        >
          <div style={{ fontSize: 13, color: text, marginBottom: 4 }}>
            {fileName ? fileName : "Arraste um arquivo CSV aqui ou clique para selecionar"}
          </div>
          <div style={{ fontSize: 11, color: muted }}>
            Formatos aceitos: .csv (separado por ; ou ,)
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        {/* Accepted columns hint */}
        <div style={{
          fontSize: 11, color: muted, marginBottom: 12, padding: "8px 10px",
          background: dark ? "#1a1a1a" : "#f8f8f8", borderRadius: 6,
        }}>
          <strong>Colunas aceitas:</strong> Nome, Produto, Celular, Pagamento, Valor Total, Em Atraso,
          Parc. Atraso, Parc. Vencer, Dt. Parcela, Cliente Ativo, Acordo, Acesso, SERASA, Protesto,
          Juridico, Status WA, Dt. Contato, Valor Recebido
        </div>

        {/* Result preview */}
        {result && (
          <div style={{
            padding: "10px 12px", borderRadius: 8, marginBottom: 16,
            background: result.success > 0 ? (dark ? "#0a2e0a" : "#EAF3DE") : (dark ? D.redDim : "#FCEBEB"),
            border: `1px solid ${result.success > 0 ? "#1a5c1a" : D.red}`,
          }}>
            <div style={{
              fontSize: 13, fontWeight: 500, marginBottom: 4,
              color: result.success > 0 ? "#97C459" : D.redTx,
            }}>
              {result.success > 0
                ? `${result.success} registros prontos para importar`
                : "Nenhum registro valido encontrado"}
            </div>
            {result.errors.length > 0 && (
              <div style={{ fontSize: 11, color: muted, maxHeight: 80, overflowY: "auto" }}>
                {result.errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={handleCancel} style={{
            padding: "7px 18px", fontSize: 13, borderRadius: 6, cursor: "pointer",
            border: `1px solid ${border}`, background: dark ? D.card : "#f5f5f5",
            color: dark ? D.muted : "#555",
          }}>
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!result || result.success === 0}
            style={{
              padding: "7px 22px", fontSize: 13, borderRadius: 6, cursor: "pointer",
              border: "none", background: result && result.success > 0 ? "#185FA5" : "#555",
              color: "#fff", fontWeight: 500,
              opacity: result && result.success > 0 ? 1 : 0.5,
            }}
          >
            Importar {result ? result.success : 0} registros
          </button>
        </div>
      </div>
    </div>
  );
}
