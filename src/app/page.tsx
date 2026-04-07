"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { DEVEDORES_INICIAIS } from "@/data/devedores";
import {
  CORES_PRODUTO, CORES_PRODUTO_CHART, CORES_STATUS_WA, CORES_STATUS_WA_CHART,
  CORES_RISCO, CORES_RISCO_CHART, CORES_PAGAMENTO_CHART,
  CAMPOS_OBRIGATORIOS, TABS, CAMPOS_PESQUISA, COLUNAS_TABELA,
  FORM_VAZIO, THEME as D,
} from "@/data/constants";
import {
  parseValor, parseDataBR, isDataValida, calcDiasAtraso,
  diasAtrasoLabel, diasAtrasoStyle, formatarCelular,
  mascaraCelular, mascaraMonetaria, mascaraData, formatarData,
  timestampAtual, formatarMoeda, formatarMoedaCurta,
} from "@/utils/formatters";
import { exportToCSV } from "@/utils/exportCSV";
import type { ColorPair, ClientMeta, SearchFilter } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDebounce } from "@/hooks/useDebounce";
import { usePagination } from "@/hooks/usePagination";
import AuthGate from "@/components/AuthGate";
import Donut from "@/components/Donut";
import ClientCard, { type AuditEntry } from "@/components/ClientCard";
import Pagination from "@/components/Pagination";
import ImportModal from "@/components/ImportModal";
import ToastContainer, { useToast } from "@/components/Toast";
import { CardSkeleton, DonutSkeleton } from "@/components/Skeleton";

// ── Estilos compartilhados ──────────────────────────────────────────
const TH: React.CSSProperties = {
  padding: "6px 10px", fontSize: 13, fontWeight: 500, color: "#111",
  background: "#f0f0f0", border: "1px solid #222", whiteSpace: "nowrap",
  cursor: "pointer", userSelect: "none", position: "sticky", top: 0, zIndex: 2,
};
const TD: React.CSSProperties = {
  padding: "5px 10px", fontSize: 13, border: "1px solid #bbb",
  whiteSpace: "nowrap", color: "#111", background: "#fff",
};
const TDm: React.CSSProperties = { ...TD, color: "#444" };
const DC: React.CSSProperties = {
  background: D.card, border: `1px solid ${D.border}`, borderRadius: 10,
  padding: "1rem 1.25rem",
};

const FIELD_NAMES: Record<number, string> = {
  0: "Dt.Inclusao", 1: "Nome", 2: "Produto", 3: "Celular", 4: "Pagamento",
  5: "Vl.Total", 6: "Em Atraso", 7: "P.Atraso", 8: "P.Vencer", 9: "Dt.Parcela",
  10: "Cli.Ativo", 11: "Acordo", 12: "Acesso", 13: "SERASA", 14: "Protesto",
  15: "Juridico", 16: "Status WA", 17: "Dt.Contato", 18: "Vl.Recebido",
};

// ── Helpers de render ───────────────────────────────────────────────
function pill(val: string, map: Record<string, ColorPair>) {
  const c = map[val];
  if (!c) return <span style={{ fontSize: 11, color: "#888" }}>{val || "--"}</span>;
  return (
    <span style={{
      fontSize: 11, padding: "1px 7px", borderRadius: 10,
      background: c.bg, color: c.tx, fontWeight: 500, whiteSpace: "nowrap",
    }}>
      {val}
    </span>
  );
}

function yn(v: string) {
  if (v === "Sim") return <span style={{ fontSize: 11, color: "#27500A", fontWeight: 500 }}>Sim</span>;
  if (v === "Nao") return <span style={{ fontSize: 11, color: "#bbb" }}>Nao</span>;
  return <span style={{ fontSize: 11, color: "#888" }}>{v || "--"}</span>;
}

// ── App principal ───────────────────────────────────────────────────
function AppContent() {
  const { toasts, addToast, removeToast } = useToast();
  const [hydrated, setHydrated] = useState(false);

  // Persistent state
  const [rows, setRows] = useLocalStorage<string[][]>("cr_rows", DEVEDORES_INICIAIS.map((r) => [...r, r[17] || ""]));
  const [clientMeta, setClientMeta] = useLocalStorage<Record<number, ClientMeta & { audit?: AuditEntry[] }>>("cr_meta", {});

  // UI state
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({ ...FORM_VAZIO });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSuccess, setFormSuccess] = useState(false);

  // Filters tab Devedores
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 300);
  const [filterProd, setFilterProd] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterRisk, setFilterRisk] = useState("Todos");
  const [sortCol, setSortCol] = useState<number | "dias" | null>(null);
  const [sortDir, setSortDir] = useState(1);

  // Dashboard
  const [showValidation, setShowValidation] = useState(false);
  const [dashFrom, setDashFrom] = useState("");
  const [dashTo, setDashTo] = useState("");

  // Card de cliente
  const [cardOpen, setCardOpen] = useState(false);
  const [cardIdx, setCardIdx] = useState<number | null>(null);
  const [cardData, setCardData] = useState<string[] | null>(null);
  const [cardOriginal, setCardOriginal] = useState<string[] | null>(null);
  const [cardObs, setCardObs] = useState("");
  const [cardAudit, setCardAudit] = useState<AuditEntry[]>([]);

  // Pesquisa avançada
  const [advFilters, setAdvFilters] = useState<SearchFilter[]>([]);
  const [searchSortCol, setSearchSortCol] = useState<number | "dias" | null>(null);
  const [searchSortDir, setSearchSortDir] = useState(1);

  // Controle
  const [ctrlFrom, setCtrlFrom] = useState("");
  const [ctrlTo, setCtrlTo] = useState("");

  // Import
  const [importOpen, setImportOpen] = useState(false);

  // Hydration
  useEffect(() => { setHydrated(true); }, []);

  // Due date notifications on load
  useEffect(() => {
    if (!hydrated) return;
    let upcoming = 0;
    let overdue = 0;
    rows.forEach((r) => {
      if (r[0] === "ok") return;
      const dias = calcDiasAtraso(r[9]);
      if (dias !== null && dias > 0 && dias <= 7) upcoming++;
      if (dias !== null && dias > 365) overdue++;
    });
    if (upcoming > 0) addToast(`${upcoming} parcela(s) vencem nos proximos 7 dias`, "warning");
    if (overdue > 0) addToast(`${overdue} registro(s) com mais de 1 ano de atraso`, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // ── Callbacks ───────────────────────────────────────────────────
  const openCard = useCallback((r: string[], gi: number) => {
    const m = clientMeta[gi] || { obs: "", hist: [], audit: [] };
    setCardIdx(gi);
    setCardData([...r]);
    setCardOriginal([...r]);
    setCardObs(m.obs || "");
    setCardAudit(m.audit || []);
    setCardOpen(true);
  }, [clientMeta]);

  const closeCard = useCallback(() => {
    setCardOpen(false);
    setCardIdx(null);
    setCardData(null);
    setCardOriginal(null);
  }, []);

  const onCardChange = useCallback((idx: number, val: string) => {
    setCardData((p) => { const n = [...(p || [])]; n[idx] = val; return n; });
  }, []);

  const saveCard = useCallback(() => {
    if (cardIdx === null || !cardData || !cardOriginal) return;
    const ts = timestampAtual();
    const updated = [...cardData];
    updated[19] = ts;

    // Build field-level audit entries
    const newAudit: AuditEntry[] = [];
    for (let i = 0; i <= 18; i++) {
      if (cardData[i] !== cardOriginal[i]) {
        newAudit.push({
          ts,
          field: FIELD_NAMES[i] || `Col ${i}`,
          from: cardOriginal[i] || "",
          to: cardData[i] || "",
        });
      }
    }

    setRows((p) => p.map((r, i) => (i === cardIdx ? updated : r)));
    setClientMeta((p) => ({
      ...p,
      [cardIdx]: {
        obs: cardObs,
        hist: [...(p[cardIdx]?.hist || []), ts],
        audit: [...(p[cardIdx]?.audit || []), ...newAudit],
      },
    }));

    if (newAudit.length > 0) {
      addToast(`${newAudit.length} campo(s) alterado(s) em ${cardData[1]}`, "success");
    }
    closeCard();
  }, [cardData, cardOriginal, cardIdx, cardObs, closeCard, setRows, setClientMeta, addToast]);

  const openWhatsApp = useCallback((r: string[]) => {
    const nome = r[1].split("-")[0].trim().split(" ")[0];
    const msg = encodeURIComponent(`Ola ${nome}! Pendencia de ${r[6]} ref. ${r[2]}. Podemos negociar?`);
    window.open(`https://wa.me/55${r[3].replace(/\D/g, "")}?text=${msg}`, "_blank");
  }, []);

  const cardWhatsApp = useCallback(() => {
    if (cardData) openWhatsApp(cardData);
  }, [cardData, openWhatsApp]);

  const applyDateRange = (type: string, setFrom: (v: string) => void, setTo: (v: string) => void) => {
    const h = new Date();
    if (type === "semana") {
      const i = new Date(h); i.setDate(h.getDate() - h.getDay());
      const f = new Date(i); f.setDate(i.getDate() + 6);
      setFrom(formatarData(i)); setTo(formatarData(f));
    } else if (type === "mes") {
      setFrom(formatarData(new Date(h.getFullYear(), h.getMonth(), 1)));
      setTo(formatarData(new Date(h.getFullYear(), h.getMonth() + 1, 0)));
    } else if (type === "mesant") {
      setFrom(formatarData(new Date(h.getFullYear(), h.getMonth() - 1, 1)));
      setTo(formatarData(new Date(h.getFullYear(), h.getMonth(), 0)));
    } else if (type === "ano") {
      setFrom(formatarData(new Date(h.getFullYear(), 0, 1)));
      setTo(formatarData(new Date(h.getFullYear(), 11, 31)));
    } else { setFrom(""); setTo(""); }
  };

  const toggleSort = (col: number | "dias") => {
    if (sortCol === col) setSortDir((d) => -d);
    else { setSortCol(col); setSortDir(1); }
  };

  const sortArrow = (col: number | "dias") => sortCol === col ? (sortDir === 1 ? "^" : "v") : "";
  const searchSortArrow = (col: number | "dias") => searchSortCol === col ? (searchSortDir === 1 ? "^" : "v") : "";

  // ── Computed values ─────────────────────────────────────────────
  const duplicates = useMemo(() => {
    const nameMap: Record<string, number> = {};
    const phoneMap: Record<string, number> = {};
    const dups = new Set<number>();
    rows.forEach((r, i) => {
      const name = r[1].trim().toLowerCase();
      const phone = r[3].replace(/\D/g, "");
      if (name) {
        if (nameMap[name] !== undefined) { dups.add(i); dups.add(nameMap[name]); }
        else nameMap[name] = i;
      }
      if (phone.length >= 8) {
        if (phoneMap[phone] !== undefined) { dups.add(i); dups.add(phoneMap[phone]); }
        else phoneMap[phone] = i;
      }
    });
    return dups;
  }, [rows]);

  const incomplete = useMemo(() =>
    rows.map((r, i) => {
      const missing = CAMPOS_OBRIGATORIOS.filter((o) => !r[o.col] || r[o.col].trim() === "").map((o) => o.label);
      return missing.length > 0 ? { i, nome: r[1] || "(sem nome)", missing } : null;
    }).filter(Boolean) as { i: number; nome: string; missing: string[] }[],
  [rows]);

  const dashRows = useMemo(() => {
    if (!dashFrom && !dashTo) return rows;
    const f = parseDataBR(dashFrom);
    const t = parseDataBR(dashTo);
    return rows.filter((r) => {
      const dt = parseDataBR(r[9]);
      if (!dt) return false;
      if (f && dt < f) return false;
      if (t && dt > t) return false;
      return true;
    });
  }, [rows, dashFrom, dashTo]);

  const stats = useMemo(() => {
    let totalVendido = 0, totalAtraso = 0, totalRecebido = 0;
    const porProduto: Record<string, number> = {};
    const porRisco: Record<string, number> = { Juridico: 0, Protesto: 0, SERASA: 0, Regular: 0 };
    const porStatusWA: Record<string, number> = {};
    const porPagamento: Record<string, number> = {};

    dashRows.forEach((r) => {
      totalVendido += parseValor(r[5]);
      totalAtraso += parseValor(r[6]);
      totalRecebido += parseValor(r[18]);
      const prod = r[2] || "Sem produto";
      porProduto[prod] = (porProduto[prod] || 0) + parseValor(r[6]);
      const jur = r[15], serasa = r[13], protesto = r[14];
      if (jur.includes("Sim")) porRisco.Juridico += parseValor(r[6]);
      else if (protesto === "Sim") porRisco.Protesto += parseValor(r[6]);
      else if (serasa === "Sim") porRisco.SERASA += parseValor(r[6]);
      else porRisco.Regular += parseValor(r[6]);
      const wa = r[16] || "Sem status";
      porStatusWA[wa] = (porStatusWA[wa] || 0) + parseValor(r[6]);
      const pagRaw = r[4] || "";
      const pag = pagRaw.includes("Boleto") ? "Boleto" : pagRaw.includes("Cart") ? "Cartao" : pagRaw.includes("PIX") ? "PIX" : "Nao informado";
      porPagamento[pag] = (porPagamento[pag] || 0) + parseValor(r[6]);
    });

    return { totalVendido, totalAtraso, totalRecebido, porProduto, porRisco, porStatusWA, porPagamento };
  }, [dashRows]);

  const filtered = useMemo(() => {
    let rs = rows.filter((r) => {
      const name = r[1].toLowerCase();
      const prod = r[2];
      const jur = r[15], serasa = r[13], protesto = r[14], wa = r[16];
      if (debouncedSearch && !name.includes(debouncedSearch.toLowerCase()) && !prod.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      if (filterProd !== "Todos" && prod !== filterProd) return false;
      if (filterStatus !== "Todos" && wa !== filterStatus) return false;
      if (filterRisk === "Duplicado") return duplicates.has(rows.indexOf(r));
      if (filterRisk === "Juridico" && !jur.includes("Sim")) return false;
      if (filterRisk === "SERASA" && serasa !== "Sim") return false;
      if (filterRisk === "Protesto" && protesto !== "Sim") return false;
      if (filterRisk === "Regular" && (jur.includes("Sim") || serasa === "Sim" || protesto === "Sim")) return false;
      return true;
    });
    if (sortCol !== null) {
      rs = [...rs].sort((a, b) => {
        if (sortCol === "dias") {
          return ((calcDiasAtraso(b[9]) ?? -1) - (calcDiasAtraso(a[9]) ?? -1)) * sortDir;
        }
        return (a[sortCol] || "").localeCompare(b[sortCol] || "", "pt-BR") * sortDir;
      });
    }
    return rs;
  }, [rows, debouncedSearch, filterProd, filterStatus, filterRisk, sortCol, sortDir, duplicates]);

  // Pagination for devedores
  const devPag = usePagination(filtered, 25);

  const searchResults = useMemo(() => {
    if (advFilters.length === 0) return rows;
    return rows.filter((r) =>
      advFilters.every((f) => {
        const cellVal = f.idx !== null ? (r[f.idx] || "") : "";
        if (f.type === "select" || f.type === "text") {
          if (!f.val) return true;
          return cellVal.toLowerCase().includes(f.val!.toLowerCase());
        }
        if (f.type === "date_range") {
          const dt = parseDataBR(cellVal);
          if (!dt) return false;
          if (f.from) { const fr = parseDataBR(f.from); if (fr && dt < fr) return false; }
          if (f.to) { const to = parseDataBR(f.to); if (to && dt > to) return false; }
          return true;
        }
        if (f.type === "money_range") {
          const v = parseValor(cellVal);
          const fn = f.from ? parseFloat(f.from.replace(/[R$\s.]/g, "").replace(",", ".")) : null;
          const tn = f.to ? parseFloat(f.to.replace(/[R$\s.]/g, "").replace(",", ".")) : null;
          if (fn !== null && !isNaN(fn) && v < fn) return false;
          if (tn !== null && !isNaN(tn) && v > tn) return false;
          return true;
        }
        if (f.type === "num_range") {
          const v = parseInt(cellVal, 10) || 0;
          if (f.from !== "") { const n = parseInt(f.from!, 10); if (!isNaN(n) && v < n) return false; }
          if (f.to !== "") { const n = parseInt(f.to!, 10); if (!isNaN(n) && v > n) return false; }
          return true;
        }
        if (f.type === "dias_range") {
          const dd = calcDiasAtraso(r[9]);
          if (dd === null) return false;
          if (f.from !== "") { const n = parseInt(f.from!, 10); if (!isNaN(n) && dd < n) return false; }
          if (f.to !== "") { const n = parseInt(f.to!, 10); if (!isNaN(n) && dd > n) return false; }
          return true;
        }
        return true;
      })
    );
  }, [rows, advFilters]);

  const searchSorted = useMemo(() => {
    if (searchSortCol === null) return searchResults;
    return [...searchResults].sort((a, b) => {
      if (searchSortCol === "dias") {
        return ((calcDiasAtraso(b[9]) ?? -1) - (calcDiasAtraso(a[9]) ?? -1)) * searchSortDir;
      }
      return (a[searchSortCol] || "").localeCompare(b[searchSortCol] || "", "pt-BR") * searchSortDir;
    });
  }, [searchResults, searchSortCol, searchSortDir]);

  const searchPag = usePagination(searchSorted, 25);

  const searchMeta = useMemo(() => ({
    count: searchResults.length,
    atraso: searchResults.reduce((s, r) => s + parseValor(r[6]), 0),
    rec: searchResults.reduce((s, r) => s + parseValor(r[18]), 0),
    div: searchResults.reduce((s, r) => s + parseValor(r[5]), 0),
  }), [searchResults]);

  const ctrlStats = useMemo(() => {
    const fr = parseDataBR(ctrlFrom), to = parseDataBR(ctrlTo);
    const inRange = (dt: Date | null) => {
      if (!dt) return !fr && !to;
      if (fr && dt < fr) return false;
      if (to && dt > to) return false;
      return true;
    };
    let nc = 0, nd = 0, rec = 0, ac = 0, jur = 0, env = 0, neg = 0, ser = 0, pro = 0;
    const newItems: string[][] = [];
    rows.forEach((r) => {
      const dtI = parseDataBR(r[0]), dtC = parseDataBR(r[17]);
      if (inRange(dtI)) { nc++; nd += parseValor(r[5]); newItems.push(r); }
      if (inRange(dtC)) {
        const w = r[16] || "";
        if (w === "Acordo fechado") ac++;
        if (w === "Negociando") neg++;
        if (w === "Enviado") env++;
        if (r[15]?.includes("Sim")) jur++;
        if (r[13] === "Sim") ser++;
        if (r[14] === "Sim") pro++;
      }
      rec += parseValor(r[18]);
    });
    return { nc, nd, rec, ac, jur, env, neg, ser, pro, newItems };
  }, [rows, ctrlFrom, ctrlTo]);

  // ── Handlers ──────────────────────────────────────────────────
  const addFilter = (key: string) => {
    if (!key) return;
    const field = CAMPOS_PESQUISA.find((x) => x.key === key);
    if (!field || advFilters.find((x) => x.key === key)) return;
    const init = field.type === "select" || field.type === "text" ? { val: "" } : { from: "", to: "" };
    setAdvFilters((p) => [...p, { key, label: field.label, type: field.type, opts: field.opts || [], idx: field.idx, ...init }]);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.nome.trim()) errors.nome = "Nome obrigatorio";
    if (!form.produto) errors.produto = "Selecione um produto";
    if (!form.celular || form.celular.replace(/\D/g, "").length < 10) errors.celular = "Celular invalido";
    if (!form.pagamento) errors.pagamento = "Selecione a forma de pagamento";
    if (!form.vlTotal) errors.vlTotal = "Informe o valor total";
    if (!form.emAtraso) errors.emAtraso = "Informe o valor em atraso";
    if (form.dtParcela && !isDataValida(form.dtParcela)) errors.dtParcela = "Data invalida";
    const normName = form.nome.trim().toLowerCase();
    const normPhone = form.celular.replace(/\D/g, "");
    if (rows.some((r) => r[1].trim().toLowerCase() === normName)) errors.nome = "Ja existe devedor com esse nome";
    if (normPhone.length >= 10 && rows.some((r) => r[3].replace(/\D/g, "") === normPhone) && !errors.celular)
      errors.celular = "Ja existe devedor com esse celular";
    return errors;
  };

  const handleSubmit = () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    const ts = timestampAtual();
    const today = ts.split(" ")[0];
    const newRow = [
      today, form.nome.trim(), form.produto, form.celular.replace(/\D/g, ""),
      form.pagamento, form.vlTotal, form.emAtraso, form.parcAtraso, form.parcVencer,
      form.dtParcela, "Verificar", "Nao", "Verificar", "Nao", "Nao", "Nao",
      "Entrar em contato", "", "R$ 0,00", ts,
    ];
    setRows((p) => [...p, newRow]);
    setForm({ ...FORM_VAZIO });
    setFormErrors({});
    setFormSuccess(true);
    addToast(`${form.nome.trim()} cadastrado com sucesso`, "success");
    setTimeout(() => setFormSuccess(false), 3000);
  };

  const handleImport = (newRows: string[][]) => {
    setRows((p) => [...p, ...newRows]);
    addToast(`${newRows.length} registros importados com sucesso`, "success");
  };

  const setFormField = (field: string) => (val: string) => setForm((p) => ({ ...p, [field]: val }));

  // ── Render de linha da tabela ─────────────────────────────────
  const renderRow = (r: string[], i: number) => {
    const gi = rows.indexOf(r);
    const isDup = duplicates.has(gi);
    const isJur = r[15].includes("Sim");
    const bg = isDup ? "#fff0f0" : r[0] === "ok" ? "#f0fff4" : isJur ? "#fff5f5" : "#fff";

    return (
      <tr key={i} style={{ background: bg }}>
        <td style={TDm}>{isDataValida(r[0]) ? r[0] : ""}</td>
        <td style={{ ...TD, background: isDup ? "#fdd" : "#fff" }}>
          <span onClick={() => openCard(r, gi)} style={{ cursor: "pointer", color: "#185FA5", textDecoration: "underline", fontWeight: 500 }}>{r[1]}</span>
          {isDup && <span style={{ marginLeft: 5, fontSize: 10, color: "#A32D2D", fontWeight: 500 }}>dup</span>}
        </td>
        <td style={TD}>{pill(r[2], CORES_PRODUTO)}</td>
        <td style={TD}>{formatarCelular(r[3])}</td>
        <td style={TD}>{r[4]}</td>
        <td style={TD}>{r[5]}</td>
        <td style={{ ...TD, fontWeight: 500, color: parseValor(r[6]) > 0 ? "#A32D2D" : "#888" }}>{r[6]}</td>
        <td style={{ ...TD, textAlign: "center" }}>{r[7]}</td>
        <td style={{ ...TD, textAlign: "center" }}>{r[8]}</td>
        <td style={TD}>{r[9]}</td>
        <td style={{ ...TD, ...diasAtrasoStyle(r[9], r[0] === "ok"), fontWeight: 500 }}>{diasAtrasoLabel(r[9], r[0] === "ok")}</td>
        <td style={TD}>{yn(r[10])}</td>
        <td style={TD}>{yn(r[11])}</td>
        <td style={TD}>{pill(r[12], { Liberado: { bg: "#EAF3DE", tx: "#27500A" }, Bloqueado: { bg: "#FCEBEB", tx: "#791F1F" }, Verificar: { bg: "#FAEEDA", tx: "#633806" } })}</td>
        <td style={TD}>{yn(r[13])}</td>
        <td style={TD}>{yn(r[14])}</td>
        <td style={TD}>{pill(r[15], CORES_RISCO)}</td>
        <td style={TD}>{pill(r[16], CORES_STATUS_WA)}</td>
        <td style={TDm}>{r[17]}</td>
        <td style={{ ...TD, color: parseValor(r[18]) > 0 ? "#27500A" : "#bbb", fontWeight: parseValor(r[18]) > 0 ? 500 : 400 }}>{r[18]}</td>
        <td style={TDm}>{r[19] || ""}</td>
      </tr>
    );
  };

  const isLightTab = tab === 1 || tab === 2 || tab === 3;

  // ── Toolbar button style ─────────────────────────────────────
  const toolBtn = (dark: boolean): React.CSSProperties => ({
    padding: "4px 10px", fontSize: 11, borderRadius: 6, cursor: "pointer",
    border: `1px solid ${dark ? D.border : "#ccc"}`,
    background: dark ? D.card : "#f5f5f5",
    color: dark ? D.text : "#555",
  });

  return (
    <div style={{
      minHeight: "100vh", background: isLightTab ? "#f5f5f5" : D.bg,
      color: isLightTab ? "#111" : D.text, fontFamily: "'Inter',system-ui,sans-serif",
      position: "relative",
    }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 0, borderBottom: `1px solid ${isLightTab ? "#ddd" : D.border}`,
        background: isLightTab ? "#fff" : D.card, padding: "0 1rem",
        overflowX: "auto",
      }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: "10px 18px", fontSize: 13, fontWeight: tab === i ? 600 : 400,
            border: "none", borderBottom: tab === i ? "2px solid #185FA5" : "2px solid transparent",
            background: "none", cursor: "pointer", color: tab === i ? "#185FA5" : "#888",
            whiteSpace: "nowrap",
          }}>
            {t}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: D.muted }}>{rows.length} registros</span>
          <button onClick={() => setImportOpen(true)} style={toolBtn(!isLightTab)}>Importar CSV</button>
        </div>
      </div>

      {/* ═══════════ TAB 0: DASHBOARD ═══════════ */}
      {tab === 0 && (
        <div style={{ padding: "1.25rem", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ ...DC, marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: D.muted }}>Periodo:</span>
            {["semana", "mes", "mesant", "ano", "tudo"].map((t) => (
              <button key={t} onClick={() => applyDateRange(t, setDashFrom, setDashTo)} style={toolBtn(true)}>
                {t === "tudo" ? "Tudo" : t === "semana" ? "Semana" : t === "mes" ? "Mes" : t === "mesant" ? "Mes ant." : "Ano"}
              </button>
            ))}
            <input value={dashFrom} onChange={(e) => setDashFrom(mascaraData(e.target.value))} placeholder="De" style={{ padding: "4px 8px", fontSize: 12, border: `1px solid ${D.border}`, borderRadius: 6, background: D.card, color: D.text, width: 90 }} />
            <input value={dashTo} onChange={(e) => setDashTo(mascaraData(e.target.value))} placeholder="Ate" style={{ padding: "4px 8px", fontSize: 12, border: `1px solid ${D.border}`, borderRadius: 6, background: D.card, color: D.text, width: 90 }} />
          </div>

          {!hydrated ? <CardSkeleton /> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Total vendido", val: formatarMoedaCurta(stats.totalVendido), color: D.blueTx },
                { label: "Em atraso", val: formatarMoedaCurta(stats.totalAtraso), color: D.redTx },
                { label: "Recebido", val: formatarMoedaCurta(stats.totalRecebido), color: "#97C459" },
                { label: "Recuperacao", val: stats.totalAtraso > 0 ? (stats.totalRecebido / stats.totalAtraso * 100).toFixed(1) + "%" : "0%", color: "#FAC775" },
                { label: "Registros", val: dashRows.length.toString(), color: D.text },
              ].map((kpi) => (
                <div key={kpi.label} style={DC}>
                  <div style={{ fontSize: 11, color: D.muted, marginBottom: 4 }}>{kpi.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: kpi.color }}>{kpi.val}</div>
                </div>
              ))}
            </div>
          )}

          {!hydrated ? <DonutSkeleton /> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 16 }}>
              {[
                { title: "Por Produto", data: stats.porProduto, colors: CORES_PRODUTO_CHART, label: formatarMoedaCurta(stats.totalAtraso), sub: "em atraso" },
                { title: "Por Risco", data: Object.fromEntries(Object.entries(stats.porRisco).filter(([, v]) => v > 0)), colors: CORES_RISCO_CHART, label: formatarMoedaCurta(Object.values(stats.porRisco).reduce((s, v) => s + v, 0)), sub: "total risco" },
                { title: "Por Status WA", data: stats.porStatusWA, colors: CORES_STATUS_WA_CHART, label: formatarMoedaCurta(stats.totalAtraso), sub: "contato" },
                { title: "Por Pagamento", data: stats.porPagamento, colors: CORES_PAGAMENTO_CHART, label: formatarMoedaCurta(stats.totalAtraso), sub: "pagamento" },
              ].map((d) => (
                <div key={d.title} style={DC}>
                  <div style={{ fontSize: 12, color: D.muted, marginBottom: 10, fontWeight: 500 }}>{d.title}</div>
                  <Donut segments={Object.entries(d.data).map(([k, v]) => ({ val: v, color: d.colors[k] || "#888", label: k }))} label={d.label} sub={d.sub} />
                </div>
              ))}
            </div>
          )}

          <div style={DC}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: D.muted }}>
                Validacao ({incomplete.length} incompletos | {duplicates.size} duplicados)
              </span>
              <button onClick={() => setShowValidation((v) => !v)} style={toolBtn(true)}>
                {showValidation ? "Esconder" : "Ver detalhes"}
              </button>
            </div>
            {showValidation && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
                {incomplete.slice(0, 30).map((item, i) => (
                  <div key={i} style={{ fontSize: 11, color: D.muted }}>
                    <span style={{ color: D.redTx }}>{item.nome}</span>
                    <span style={{ color: D.faint }}> — falta: {item.missing.join(", ")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ TAB 1: DEVEDORES ═══════════ */}
      {tab === 1 && (
        <div style={{ padding: "1rem" }}>
          <div style={{
            display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center",
            background: "#fff", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd",
          }}>
            <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Buscar nome ou produto..." style={{ padding: "6px 10px", fontSize: 13, border: "1px solid #ccc", borderRadius: 6, color: "#111", outline: "none", width: 200, minWidth: 120 }} />
            <select value={filterProd} onChange={(e) => setFilterProd(e.target.value)} style={{ padding: "6px 8px", fontSize: 12, border: "1px solid #ccc", borderRadius: 6, color: "#111" }}>
              <option value="Todos">Produto: Todos</option>
              {["Aceleracao", "Ativacao", "HSE", "Gestao eventos"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "6px 8px", fontSize: 12, border: "1px solid #ccc", borderRadius: 6, color: "#111" }}>
              <option value="Todos">Status WA: Todos</option>
              {["Acordo fechado", "Negociando", "Respondeu", "Enviado", "Nao Respondeu", "Entrar em contato"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} style={{ padding: "6px 8px", fontSize: 12, border: "1px solid #ccc", borderRadius: 6, color: "#111" }}>
              <option value="Todos">Risco: Todos</option>
              {["Juridico", "SERASA", "Protesto", "Regular", "Duplicado"].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "#888" }}>{filtered.length} | {formatarMoeda(filtered.reduce((s, r) => s + parseValor(r[6]), 0))}</span>
              <button onClick={() => exportToCSV(filtered, "devedores")} style={toolBtn(false)}>Exportar CSV</button>
            </div>
          </div>
          <div style={{ overflowX: "auto", borderRadius: "8px 8px 0 0", border: "1px solid #ccc", borderBottom: "none" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 1600 }}>
              <thead>
                <tr>{COLUNAS_TABELA.map(([label, col]) => <th key={label} style={TH} onClick={() => toggleSort(col as number | "dias")}>{label} {sortArrow(col as number | "dias")}</th>)}</tr>
              </thead>
              <tbody>{devPag.pageItems.map((r, i) => renderRow(r, i))}</tbody>
            </table>
          </div>
          <Pagination page={devPag.page} totalPages={devPag.totalPages} totalItems={devPag.totalItems} startIdx={devPag.startIdx} endIdx={devPag.endIdx} pageSize={devPag.pageSize} onPageChange={devPag.setPage} onPageSizeChange={devPag.setPageSize} light />
        </div>
      )}

      {/* ═══════════ TAB 2: PESQUISA AVANÇADA ═══════════ */}
      {tab === 2 && (
        <div style={{ padding: "1rem", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ background: "#fff", padding: "12px 16px", borderRadius: 8, border: "1px solid #ddd", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: advFilters.length > 0 ? 10 : 0, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#555" }}>Filtro:</span>
              <select value="" onChange={(e) => addFilter(e.target.value)} style={{ padding: "5px 8px", fontSize: 12, border: "1px solid #ccc", borderRadius: 6, color: "#111" }}>
                <option value="">Adicionar...</option>
                {CAMPOS_PESQUISA.filter((f) => !advFilters.find((af) => af.key === f.key)).map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
              {advFilters.length > 0 && <button onClick={() => setAdvFilters([])} style={toolBtn(false)}>Limpar</button>}
              <div style={{ marginLeft: "auto", flexShrink: 0 }}>
                <button onClick={() => exportToCSV(searchResults, "pesquisa")} style={toolBtn(false)}>Exportar CSV</button>
              </div>
            </div>
            {advFilters.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {advFilters.map((f, fi) => (
                  <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "#f8f8f8", border: "1px solid #eee", borderRadius: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#555" }}>{f.label}:</span>
                    {f.type === "select" ? (
                      <select value={f.val || ""} onChange={(e) => setAdvFilters((p) => p.map((x, j) => j === fi ? { ...x, val: e.target.value } : x))} style={{ padding: "2px 6px", fontSize: 11, border: "1px solid #ccc", borderRadius: 4, color: "#111" }}>
                        <option value="">Todos</option>
                        {f.opts?.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type === "text" ? (
                      <input value={f.val || ""} onChange={(e) => setAdvFilters((p) => p.map((x, j) => j === fi ? { ...x, val: e.target.value } : x))} placeholder="Buscar..." style={{ padding: "2px 6px", fontSize: 11, border: "1px solid #ccc", borderRadius: 4, color: "#111", width: 100 }} />
                    ) : (
                      <>
                        <input value={f.from || ""} onChange={(e) => { const val = f.type === "money_range" ? mascaraMonetaria(e.target.value) : f.type === "date_range" ? mascaraData(e.target.value) : e.target.value; setAdvFilters((p) => p.map((x, j) => j === fi ? { ...x, from: val } : x)); }} placeholder="De" style={{ padding: "2px 6px", fontSize: 11, border: "1px solid #ccc", borderRadius: 4, color: "#111", width: 80 }} />
                        <input value={f.to || ""} onChange={(e) => { const val = f.type === "money_range" ? mascaraMonetaria(e.target.value) : f.type === "date_range" ? mascaraData(e.target.value) : e.target.value; setAdvFilters((p) => p.map((x, j) => j === fi ? { ...x, to: val } : x)); }} placeholder="Ate" style={{ padding: "2px 6px", fontSize: 11, border: "1px solid #ccc", borderRadius: 4, color: "#111", width: 80 }} />
                      </>
                    )}
                    <button onClick={() => setAdvFilters((p) => p.filter((_, j) => j !== fi))} style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer", color: "#aaa", lineHeight: 1 }}>x</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 12 }}>
            {[
              { label: "Resultados", val: searchMeta.count.toString() },
              { label: "Divida total", val: formatarMoeda(searchMeta.div) },
              { label: "Em atraso", val: formatarMoeda(searchMeta.atraso) },
              { label: "Recebido", val: formatarMoeda(searchMeta.rec) },
            ].map((m) => (
              <div key={m.label} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ fontSize: 11, color: "#888" }}>{m.label}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>{m.val}</div>
              </div>
            ))}
          </div>

          <div style={{ overflowX: "auto", borderRadius: "8px 8px 0 0", border: "1px solid #ccc", borderBottom: "none" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 1600 }}>
              <thead>
                <tr>{COLUNAS_TABELA.map(([label, col]) => <th key={label} style={TH} onClick={() => { if (searchSortCol === col) setSearchSortDir((d) => -d); else { setSearchSortCol(col as number | "dias"); setSearchSortDir(1); } }}>{label} {searchSortArrow(col as number | "dias")}</th>)}</tr>
              </thead>
              <tbody>{searchPag.pageItems.map((r, i) => renderRow(r, i))}</tbody>
            </table>
          </div>
          <Pagination page={searchPag.page} totalPages={searchPag.totalPages} totalItems={searchPag.totalItems} startIdx={searchPag.startIdx} endIdx={searchPag.endIdx} pageSize={searchPag.pageSize} onPageChange={searchPag.setPage} onPageSizeChange={searchPag.setPageSize} light />
        </div>
      )}

      {/* ═══════════ TAB 3: CONTROLE ═══════════ */}
      {tab === 3 && (
        <div style={{ padding: "1rem", maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ background: "#fff", padding: "12px 16px", borderRadius: 8, border: "1px solid #ddd", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#888" }}>Periodo:</span>
            {["semana", "mes", "mesant", "ano", "tudo"].map((t) => (
              <button key={t} onClick={() => applyDateRange(t, setCtrlFrom, setCtrlTo)} style={toolBtn(false)}>
                {t === "tudo" ? "Tudo" : t === "semana" ? "Semana" : t === "mes" ? "Mes" : t === "mesant" ? "Mes ant." : "Ano"}
              </button>
            ))}
            <input value={ctrlFrom} onChange={(e) => setCtrlFrom(mascaraData(e.target.value))} placeholder="De" style={{ padding: "4px 8px", fontSize: 12, border: "1px solid #ccc", borderRadius: 6, color: "#111", width: 90 }} />
            <input value={ctrlTo} onChange={(e) => setCtrlTo(mascaraData(e.target.value))} placeholder="Ate" style={{ padding: "4px 8px", fontSize: 12, border: "1px solid #ccc", borderRadius: 6, color: "#111", width: 90 }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Novos cadastros", val: ctrlStats.nc.toString(), color: "#185FA5" },
              { label: "Nova divida", val: formatarMoeda(ctrlStats.nd), color: "#A32D2D" },
              { label: "Total recebido", val: formatarMoeda(ctrlStats.rec), color: "#27500A" },
              { label: "Acordos fechados", val: ctrlStats.ac.toString(), color: "#639922" },
              { label: "Negociando", val: ctrlStats.neg.toString(), color: "#BA7517" },
              { label: "Enviados", val: ctrlStats.env.toString(), color: "#B4B2A9" },
              { label: "Juridico", val: ctrlStats.jur.toString(), color: "#E24B4A" },
              { label: "SERASA", val: ctrlStats.ser.toString(), color: "#FAC775" },
              { label: "Protesto", val: ctrlStats.pro.toString(), color: "#EF9F27" },
            ].map((item) => (
              <div key={item.label} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, color: "#888" }}>{item.label}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: item.color }}>{item.val}</div>
              </div>
            ))}
          </div>

          {ctrlStats.newItems.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 8 }}>Novos no periodo ({ctrlStats.newItems.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 300, overflowY: "auto" }}>
                {ctrlStats.newItems.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>
                    <span style={{ color: "#888", width: 80, flexShrink: 0 }}>{r[0]}</span>
                    <span style={{ fontWeight: 500, color: "#111", flex: 1 }}>{r[1]}</span>
                    {pill(r[2], CORES_PRODUTO)}
                    <span style={{ color: "#A32D2D", fontWeight: 500 }}>{r[5]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ TAB 4: NOVO DEVEDOR ═══════════ */}
      {tab === 4 && (
        <div style={{ padding: "1.25rem", maxWidth: 600, margin: "0 auto" }}>
          <div style={DC}>
            <div style={{ fontSize: 14, fontWeight: 500, color: D.text, marginBottom: 16 }}>Cadastrar novo devedor</div>
            {formSuccess && (
              <div style={{ padding: "8px 14px", borderRadius: 6, background: "#0a2e0a", border: "1px solid #1a5c1a", color: "#97C459", fontSize: 12, marginBottom: 12 }}>Devedor cadastrado com sucesso!</div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Nome */}
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ fontSize: 11, color: D.muted, fontWeight: 500, display: "block", marginBottom: 3 }}>Nome *</label>
                <input value={form.nome} onChange={(e) => setFormField("nome")(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", fontSize: 13, border: `1px solid ${formErrors.nome ? D.red : D.border}`, borderRadius: 6, background: "#1a1a1a", color: D.text, outline: "none" }} />
                {formErrors.nome && <div style={{ fontSize: 10, color: D.redTx, marginTop: 2 }}>{formErrors.nome}</div>}
              </div>
              {/* Produto */}
              <div>
                <label style={{ fontSize: 11, color: D.muted, fontWeight: 500, display: "block", marginBottom: 3 }}>Produto *</label>
                <select value={form.produto} onChange={(e) => setFormField("produto")(e.target.value)} style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${formErrors.produto ? D.red : D.border}`, borderRadius: 6, background: "#1a1a1a", color: D.text }}>
                  <option value="">Selecione...</option>
                  {["Aceleracao", "Ativacao", "HSE", "Gestao eventos"].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                {formErrors.produto && <div style={{ fontSize: 10, color: D.redTx, marginTop: 2 }}>{formErrors.produto}</div>}
              </div>
              {/* Celular */}
              <div>
                <label style={{ fontSize: 11, color: D.muted, fontWeight: 500, display: "block", marginBottom: 3 }}>Celular *</label>
                <input value={form.celular} onChange={(e) => setFormField("celular")(mascaraCelular(e.target.value))} placeholder="(00) 00000-0000" style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", fontSize: 13, border: `1px solid ${formErrors.celular ? D.red : D.border}`, borderRadius: 6, background: "#1a1a1a", color: D.text, outline: "none" }} />
                {formErrors.celular && <div style={{ fontSize: 10, color: D.redTx, marginTop: 2 }}>{formErrors.celular}</div>}
              </div>
              {/* Pagamento */}
              <div>
                <label style={{ fontSize: 11, color: D.muted, fontWeight: 500, display: "block", marginBottom: 3 }}>Pagamento *</label>
                <select value={form.pagamento} onChange={(e) => setFormField("pagamento")(e.target.value)} style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${formErrors.pagamento ? D.red : D.border}`, borderRadius: 6, background: "#1a1a1a", color: D.text }}>
                  <option value="">Selecione...</option>
                  {["Boleto", "Cartao", "PIX"].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                {formErrors.pagamento && <div style={{ fontSize: 10, color: D.redTx, marginTop: 2 }}>{formErrors.pagamento}</div>}
              </div>
              {/* Valor Total */}
              <div>
                <label style={{ fontSize: 11, color: D.muted, fontWeight: 500, display: "block", marginBottom: 3 }}>Valor total *</label>
                <input value={form.vlTotal} onChange={(e) => setFormField("vlTotal")(mascaraMonetaria(e.target.value))} placeholder="R$ 0,00" style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", fontSize: 13, border: `1px solid ${formErrors.vlTotal ? D.red : D.border}`, borderRadius: 6, background: "#1a1a1a", color: D.text, outline: "none" }} />
                {formErrors.vlTotal && <div style={{ fontSize: 10, color: D.redTx, marginTop: 2 }}>{formErrors.vlTotal}</div>}
              </div>
              {/* Em Atraso */}
              <div>
                <label style={{ fontSize: 11, color: D.muted, fontWeight: 500, display: "block", marginBottom: 3 }}>Valor em atraso *</label>
                <input value={form.emAtraso} onChange={(e) => setFormField("emAtraso")(mascaraMonetaria(e.target.value))} placeholder="R$ 0,00" style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", fontSize: 13, border: `1px solid ${formErrors.emAtraso ? D.red : D.border}`, borderRadius: 6, background: "#1a1a1a", color: D.text, outline: "none" }} />
                {formErrors.emAtraso && <div style={{ fontSize: 10, color: D.redTx, marginTop: 2 }}>{formErrors.emAtraso}</div>}
              </div>
              {/* Parcelas */}
              <div>
                <label style={{ fontSize: 11, color: D.muted, fontWeight: 500, display: "block", marginBottom: 3 }}>Parc. em atraso</label>
                <input value={form.parcAtraso} onChange={(e) => setFormField("parcAtraso")(e.target.value.replace(/\D/g, ""))} style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", fontSize: 13, border: `1px solid ${D.border}`, borderRadius: 6, background: "#1a1a1a", color: D.text, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: D.muted, fontWeight: 500, display: "block", marginBottom: 3 }}>Parc. a vencer</label>
                <input value={form.parcVencer} onChange={(e) => setFormField("parcVencer")(e.target.value.replace(/\D/g, ""))} style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", fontSize: 13, border: `1px solid ${D.border}`, borderRadius: 6, background: "#1a1a1a", color: D.text, outline: "none" }} />
              </div>
              {/* Data */}
              <div>
                <label style={{ fontSize: 11, color: D.muted, fontWeight: 500, display: "block", marginBottom: 3 }}>Dt. parcela</label>
                <input value={form.dtParcela} onChange={(e) => setFormField("dtParcela")(mascaraData(e.target.value))} placeholder="dd/mm/aaaa" style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", fontSize: 13, border: `1px solid ${formErrors.dtParcela ? D.red : D.border}`, borderRadius: 6, background: "#1a1a1a", color: D.text, outline: "none" }} />
                {formErrors.dtParcela && <div style={{ fontSize: 10, color: D.redTx, marginTop: 2 }}>{formErrors.dtParcela}</div>}
              </div>
            </div>
            <button onClick={handleSubmit} style={{ marginTop: 16, padding: "10px 28px", fontSize: 13, borderRadius: 6, cursor: "pointer", border: "none", background: "#185FA5", color: "#fff", fontWeight: 500, width: "100%" }}>Cadastrar devedor</button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ClientCard open={cardOpen} data={cardData} originalData={cardOriginal} onChange={onCardChange} obs={cardObs} onObs={setCardObs} audit={cardAudit} onClose={closeCard} onSave={saveCard} onWhatsApp={cardWhatsApp} />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onImport={handleImport} />
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      <AppContent />
    </AuthGate>
  );
}
