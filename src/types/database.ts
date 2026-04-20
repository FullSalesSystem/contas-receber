export interface DevedorRow {
  id: number;
  dt_inclusao: string;
  nome: string;
  produto: string;
  celular: string;
  pagamento: string;
  valor_total: string;
  em_atraso: string;
  parc_atraso: string;
  parc_vencer: string;
  dt_parcela: string;
  cliente_ativo: string;
  acordo: string;
  acesso: string;
  serasa: string;
  protesto: string;
  juridico: string;
  status_wa: string;
  dt_contato: string;
  valor_recebido: string;
  dt_recebido: string;
  ult_alteracao: string;
  observacao: string;
  created_at: string;
  updated_at: string;
}

export interface AuditRow {
  id: number;
  devedor_id: number;
  ts: string;
  field: string;
  old_value: string;
  new_value: string;
  created_at: string;
}

export type DevedorInsert = Omit<DevedorRow, "id" | "created_at" | "updated_at">;
export type DevedorUpdate = Partial<DevedorInsert>;

// Column mapping: array index → DB column name
const COL_MAP: Record<number, keyof DevedorRow> = {
  0: "dt_inclusao", 1: "nome", 2: "produto", 3: "celular", 4: "pagamento",
  5: "valor_total", 6: "em_atraso", 7: "parc_atraso", 8: "parc_vencer",
  9: "dt_parcela", 10: "cliente_ativo", 11: "acordo", 12: "acesso",
  13: "serasa", 14: "protesto", 15: "juridico", 16: "status_wa",
  17: "dt_contato", 18: "valor_recebido", 19: "dt_recebido", 20: "ult_alteracao",
};

/** Convert DB row to the string array format used by the UI */
export function dbToArray(d: DevedorRow): string[] {
  const arr: string[] = [
    d.dt_inclusao || "", d.nome || "", d.produto || "", d.celular || "",
    d.pagamento || "", d.valor_total || "", d.em_atraso || "", d.parc_atraso || "",
    d.parc_vencer || "", d.dt_parcela || "", d.cliente_ativo || "", d.acordo || "",
    d.acesso || "", d.serasa || "", d.protesto || "", d.juridico || "",
    d.status_wa || "", d.dt_contato || "", d.valor_recebido || "", d.dt_recebido || "",
    d.ult_alteracao || "",
  ];
  // Store id as index 21 for reference
  arr[IDX_DB_ID] = String(d.id);
  // Store observacao as index 22
  arr[IDX_OBS] = d.observacao || "";
  return arr;
}

/** Index where DB id is stored in the UI array */
export const IDX_DB_ID = 21;
/** Index where observacao is stored in the UI array */
export const IDX_OBS = 22;

/** Convert string array back to DB update object */
export function arrayToUpdate(arr: string[]): DevedorUpdate {
  const result: DevedorUpdate = {};
  for (const [idx, col] of Object.entries(COL_MAP)) {
    (result as Record<string, string>)[col] = arr[+idx] || "";
  }
  result.observacao = arr[IDX_OBS] || "";
  return result;
}

/** Convert string array to insert object (for new records) */
export function arrayToInsert(arr: string[]): DevedorInsert {
  return {
    dt_inclusao: arr[0] || "",
    nome: arr[1] || "",
    produto: arr[2] || "",
    celular: arr[3] || "",
    pagamento: arr[4] || "",
    valor_total: arr[5] || "",
    em_atraso: arr[6] || "",
    parc_atraso: arr[7] || "",
    parc_vencer: arr[8] || "",
    dt_parcela: arr[9] || "",
    cliente_ativo: arr[10] || "Verificar",
    acordo: arr[11] || "Nao",
    acesso: arr[12] || "Verificar",
    serasa: arr[13] || "Nao",
    protesto: arr[14] || "Nao",
    juridico: arr[15] || "Nao",
    status_wa: arr[16] || "Entrar em contato",
    dt_contato: arr[17] || "",
    valor_recebido: arr[18] || "R$ 0,00",
    dt_recebido: arr[19] || "",
    ult_alteracao: arr[20] || "",
    observacao: arr[IDX_OBS] || "",
  };
}

/** Get the DB id from a UI row array */
export function getRowId(arr: string[]): number | null {
  const id = parseInt(arr[IDX_DB_ID], 10);
  return isNaN(id) ? null : id;
}

export interface Database {
  public: {
    Tables: {
      devedores: {
        Row: DevedorRow;
        Insert: DevedorInsert;
        Update: DevedorUpdate;
      };
      audit_trail: {
        Row: AuditRow;
        Insert: Omit<AuditRow, "id" | "created_at">;
        Update: never;
      };
    };
  };
}
