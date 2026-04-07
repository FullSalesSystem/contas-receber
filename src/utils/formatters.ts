/** Converte string monetária BR para número (ex: "R$ 60.000,00" → 60000) */
export function parseValor(s: string | undefined | null): number {
  if (!s) return 0;
  return parseFloat(String(s).replace(/[R$\s.]/g, "").replace(",", ".")) || 0;
}

/** Parse data brasileira dd/mm/yyyy para Date */
export function parseDataBR(s: string | undefined | null): Date | null {
  if (!s || !s.trim()) return null;
  const parts = s.trim().split("/");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  const year = y.length === 2 ? "20" + y : y;
  const dt = new Date(+year, +m - 1, +d);
  return isNaN(dt.getTime()) ? null : dt;
}

/** Verifica se string é uma data válida */
export function isDataValida(s: string): boolean {
  return !!parseDataBR(s);
}

/** Calcula dias em atraso a partir de uma data */
export function calcDiasAtraso(s: string): number | null {
  const dt = parseDataBR(s);
  if (!dt) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diff = Math.floor((hoje.getTime() - dt.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

/** Label de dias em atraso */
export function diasAtrasoLabel(s: string, isOk: boolean): string {
  if (isOk) return "";
  if (!isDataValida(s)) return "Invalido";
  const dt = parseDataBR(s)!;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diff = Math.floor((hoje.getTime() - dt.getTime()) / 86400000);
  if (diff < 0) return "A vencer";
  if (diff === 0) return "Hoje";
  return diff + " dias";
}

/** Estilo de cor baseado nos dias em atraso */
export function diasAtrasoStyle(s: string, isOk: boolean): React.CSSProperties {
  if (isOk) return {};
  if (!isDataValida(s)) return { color: "#E24B4A", fontWeight: 500 };
  const dt = parseDataBR(s)!;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diff = Math.floor((hoje.getTime() - dt.getTime()) / 86400000);
  if (diff < 0) return { color: "#378ADD" };
  if (diff >= 365) return { color: "#791F1F", fontWeight: 500 };
  if (diff >= 180) return { color: "#A32D2D", fontWeight: 500 };
  if (diff >= 90) return { color: "#BA7517", fontWeight: 500 };
  if (diff >= 30) return { color: "#633806" };
  return { color: "#888" };
}

/** Formata celular para exibição */
export function formatarCelular(s: string): string {
  if (!s) return "";
  const d = s.replace(/\D/g, "");
  if (d.length === 11) return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7, 11);
  if (d.length === 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6, 10);
  return s;
}

/** Máscara de input celular */
export function mascaraCelular(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length === 11) return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  if (d.length >= 3) return "(" + d.slice(0, 2) + ") " + d.slice(2);
  return d;
}

/** Máscara de input monetário */
export function mascaraMonetaria(v: string): string {
  const d = v.replace(/\D/g, "");
  if (!d) return "";
  const n = parseInt(d, 10) / 100;
  return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Máscara de input data */
export function mascaraData(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length >= 5) return d.slice(0, 2) + "/" + d.slice(2, 4) + "/" + d.slice(4);
  if (d.length >= 3) return d.slice(0, 2) + "/" + d.slice(2);
  return d;
}

/** Formata Date para dd/mm/yyyy */
export function formatarData(dt: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return pad(dt.getDate()) + "/" + pad(dt.getMonth() + 1) + "/" + dt.getFullYear();
}

/** Timestamp atual dd/mm/yyyy HH:mm */
export function timestampAtual(): string {
  const t = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return pad(t.getDate()) + "/" + pad(t.getMonth() + 1) + "/" + t.getFullYear() + " " + pad(t.getHours()) + ":" + pad(t.getMinutes());
}

/** Formata valor monetário */
export function formatarMoeda(v: number): string {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Formata valor monetário abreviado (K, M) */
export function formatarMoedaCurta(v: number): string {
  if (v >= 1_000_000) return "R$ " + (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return "R$ " + (v / 1_000).toFixed(0) + "K";
  return formatarMoeda(v);
}
