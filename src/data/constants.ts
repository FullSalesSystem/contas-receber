import type { ColorPair } from "@/types";

// ── Cores por produto ──────────────────────────────────────────────
export const CORES_PRODUTO: Record<string, ColorPair> = {
  Aceleracao: { bg: "#E6F1FB", tx: "#0C447C" },
  Ativacao: { bg: "#EAF3DE", tx: "#27500A" },
  HSE: { bg: "#FAEEDA", tx: "#633806" },
  "Gestao eventos": { bg: "#EEEDFE", tx: "#3C3489" },
};

export const CORES_PRODUTO_CHART: Record<string, string> = {
  Aceleracao: "#378ADD",
  Ativacao: "#639922",
  HSE: "#BA7517",
  "Gestao eventos": "#7F77DD",
};

// ── Cores por status WhatsApp ──────────────────────────────────────
export const CORES_STATUS_WA: Record<string, ColorPair> = {
  "Acordo fechado": { bg: "#EAF3DE", tx: "#27500A" },
  Negociando: { bg: "#FAEEDA", tx: "#633806" },
  Respondeu: { bg: "#E6F1FB", tx: "#0C447C" },
  Enviado: { bg: "#F1EFE8", tx: "#444441" },
  "Nao Respondeu": { bg: "#FCEBEB", tx: "#791F1F" },
  "Entrar em contato": { bg: "#F1EFE8", tx: "#5F5E5A" },
};

export const CORES_STATUS_WA_CHART: Record<string, string> = {
  "Acordo fechado": "#639922",
  Negociando: "#BA7517",
  Respondeu: "#378ADD",
  Enviado: "#B4B2A9",
  "Nao Respondeu": "#E24B4A",
  "Entrar em contato": "#888780",
};

// ── Cores por risco ─────────────────────────────────────────────────
export const CORES_RISCO: Record<string, ColorPair> = {
  "Sim - JUR RB": { bg: "#FCEBEB", tx: "#791F1F" },
  "Sim - JUR Freire": { bg: "#FCEBEB", tx: "#791F1F" },
};

export const CORES_RISCO_CHART: Record<string, string> = {
  Juridico: "#E24B4A",
  Protesto: "#EF9F27",
  SERASA: "#FAC775",
  Regular: "#97C459",
};

// ── Cores por pagamento ─────────────────────────────────────────────
export const CORES_PAGAMENTO_CHART: Record<string, string> = {
  Boleto: "#378ADD",
  Cartao: "#7F77DD",
  PIX: "#639922",
  "Nao informado": "#888780",
};

// ── Tema dark ───────────────────────────────────────────────────────
export const THEME = {
  bg: "#0d0d0d",
  card: "#141414",
  border: "#2a2a2a",
  red: "#E24B4A",
  redDim: "#3a1010",
  redTx: "#ff6b6a",
  blue: "#378ADD",
  blueDim: "#0c2240",
  blueTx: "#6ab0ff",
  text: "#f0f0f0",
  muted: "#888",
  faint: "#444",
};

// ── Campos obrigatórios (para validação de completude) ──────────────
export const CAMPOS_OBRIGATORIOS = [
  { col: 1, label: "Nome" },
  { col: 2, label: "Produto" },
  { col: 3, label: "Celular" },
  { col: 4, label: "Pagamento" },
  { col: 5, label: "Vl. Total" },
  { col: 6, label: "Em Atraso" },
  { col: 7, label: "Parc. Atraso" },
  { col: 8, label: "Parc. a Vencer" },
  { col: 17, label: "Data Contato" },
];

// ── Tabs do sistema ─────────────────────────────────────────────────
export const TABS = ["Dashboard", "Devedores", "Pesquisa", "Controle", "Novo Devedor"] as const;

// ── Campos de pesquisa avançada ─────────────────────────────────────
export const CAMPOS_PESQUISA = [
  { key: "nome", label: "Nome", idx: 1, type: "text" },
  { key: "produto", label: "Produto", idx: 2, type: "select", opts: ["Aceleracao", "Ativacao", "HSE", "Gestao eventos"] },
  { key: "celular", label: "Celular", idx: 3, type: "text" },
  { key: "pag", label: "Pagamento", idx: 4, type: "select", opts: ["Boleto", "Cartao", "PIX"] },
  { key: "vlTotal", label: "Valor total", idx: 5, type: "money_range" },
  { key: "atraso", label: "Em atraso", idx: 6, type: "money_range" },
  { key: "parcAt", label: "Parc. atraso", idx: 7, type: "num_range" },
  { key: "parcVc", label: "Parc. vencer", idx: 8, type: "num_range" },
  { key: "dtParc", label: "Dt. parcela", idx: 9, type: "date_range" },
  { key: "dias", label: "Dias em atraso", idx: null, type: "dias_range" },
  { key: "cliAt", label: "Cliente ativo", idx: 10, type: "select", opts: ["Sim", "Nao", "Verificar", "Solicitou cancelamento"] },
  { key: "acordo", label: "Acordo", idx: 11, type: "select", opts: ["Sim", "Nao", "Negociando"] },
  { key: "acesso", label: "Acesso", idx: 12, type: "select", opts: ["Liberado", "Bloqueado", "Verificar"] },
  { key: "serasa", label: "SERASA", idx: 13, type: "select", opts: ["Sim", "Nao"] },
  { key: "prot", label: "Protesto", idx: 14, type: "select", opts: ["Sim", "Nao"] },
  { key: "jur", label: "Juridico", idx: 15, type: "select", opts: ["Nao", "Sim - JUR RB", "Sim - JUR Freire"] },
  { key: "wa", label: "Status WA", idx: 16, type: "select", opts: ["Acordo fechado", "Negociando", "Respondeu", "Enviado", "Nao Respondeu", "Entrar em contato"] },
  { key: "dtCont", label: "Dt. contato", idx: 17, type: "date_range" },
  { key: "vlRec", label: "Vl. recebido", idx: 18, type: "money_range" },
  { key: "dtRec", label: "Dt. recebido", idx: 19, type: "date_range" },
];

// ── Colunas da tabela principal ─────────────────────────────────────
export const COLUNAS_TABELA: [string, number | "dias"][] = [
  ["Dt.Inclusao", 0], ["Nome", 1], ["Produto", 2], ["Celular", 3],
  ["Pagamento", 4], ["Vl.Total", 5], ["Em Atraso", 6], ["P.Atraso", 7],
  ["P.Vencer", 8], ["Dt.Parcela", 9], ["Dias", "dias"], ["Cli.Ativo", 10],
  ["Acordo", 11], ["Acesso", 12], ["SERASA", 13], ["Protesto", 14],
  ["Juridico", 15], ["Status WA", 16], ["Dt.Contato", 17], ["Vl.Recebido", 18],
  ["Dt.Recebido", 19], ["Ult.Alt.", 20],
];

// ── Opções de select para edição ────────────────────────────────────
export const SELECT_OPTIONS: Record<number, string[]> = {
  2: ["", "Aceleracao", "Ativacao", "HSE", "Gestao eventos"],
  4: ["", "Boleto", "Cartao", "PIX"],
  10: ["", "Sim", "Nao", "Verificar", "Solicitou cancelamento"],
  11: ["", "Sim", "Nao", "Negociando"],
  12: ["", "Liberado", "Bloqueado", "Verificar"],
  13: ["", "Sim", "Nao"],
  14: ["", "Sim", "Nao"],
  15: ["", "Nao", "Sim - JUR RB", "Sim - JUR Freire", "Verificar"],
  16: ["", "Acordo fechado", "Negociando", "Respondeu", "Enviado", "Nao Respondeu", "Entrar em contato"],
};

// ── Formulário vazio ────────────────────────────────────────────────
export const FORM_VAZIO: Record<string, string> = {
  nome: "", produto: "", celular: "", pagamento: "",
  vlTotal: "", emAtraso: "", parcAtraso: "", parcVencer: "", dtParcela: "",
};
