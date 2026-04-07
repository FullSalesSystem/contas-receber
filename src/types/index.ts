// ── Tipos do sistema de Contas a Receber ──────────────────────────

/** Índices das colunas no array de dados */
export enum Col {
  DtInclusao = 0,
  Nome = 1,
  Produto = 2,
  Celular = 3,
  Pagamento = 4,
  ValorTotal = 5,
  EmAtraso = 6,
  ParcAtraso = 7,
  ParcVencer = 8,
  DtParcela = 9,
  ClienteAtivo = 10,
  Acordo = 11,
  Acesso = 12,
  Serasa = 13,
  Protesto = 14,
  Juridico = 15,
  StatusWA = 16,
  DtContato = 17,
  ValorRecebido = 18,
  UltAlteracao = 19,
}

export type DebtorRow = string[];

export type Produto = "Aceleracao" | "Ativacao" | "HSE" | "Gestao eventos";
export type FormaPagamento = "Boleto" | "Cartao" | "PIX";
export type StatusWA = "Acordo fechado" | "Negociando" | "Respondeu" | "Enviado" | "Nao Respondeu" | "Entrar em contato";
export type StatusAcesso = "Liberado" | "Bloqueado" | "Verificar";
export type StatusCliente = "Sim" | "Nao" | "Verificar" | "Solicitou cancelamento";
export type StatusAcordo = "Sim" | "Nao" | "Negociando";
export type StatusJuridico = "Nao" | "Sim - JUR RB" | "Sim - JUR Freire" | "Verificar";

export interface ColorPair {
  bg: string;
  tx: string;
}

export interface DebtorForm {
  nome: string;
  produto: string;
  celular: string;
  pagamento: string;
  vlTotal: string;
  emAtraso: string;
  parcAtraso: string;
  parcVencer: string;
  dtParcela: string;
}

export interface ClientMeta {
  obs: string;
  hist: string[];
}

export interface SearchFilter {
  key: string;
  label: string;
  type: string;
  opts?: string[];
  idx: number | null;
  val?: string;
  from?: string;
  to?: string;
}

export interface DashboardStats {
  totalVendido: number;
  totalAtraso: number;
  totalRecebido: number;
  porProduto: Record<string, number>;
  porRisco: Record<string, number>;
  porStatusWA: Record<string, number>;
  porPagamento: Record<string, number>;
}

export type TabName = "Dashboard" | "Devedores" | "Pesquisa" | "Controle" | "Novo Devedor";
