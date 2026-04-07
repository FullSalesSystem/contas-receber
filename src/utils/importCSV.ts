import { timestampAtual } from "./formatters";

const HEADER_MAP: Record<string, number> = {
  "nome": 1, "name": 1, "cliente": 1,
  "produto": 2, "product": 2,
  "celular": 3, "telefone": 3, "phone": 3, "fone": 3,
  "pagamento": 4, "payment": 4, "forma pagamento": 4,
  "valor total": 5, "vl total": 5, "vl.total": 5, "total": 5,
  "em atraso": 6, "atraso": 6, "valor atraso": 6,
  "parc atraso": 7, "parcelas atraso": 7, "p.atraso": 7, "parc. atraso": 7,
  "parc vencer": 8, "parcelas vencer": 8, "p.vencer": 8, "parc. vencer": 8,
  "dt parcela": 9, "data parcela": 9, "dt.parcela": 9, "vencimento": 9,
  "cliente ativo": 10, "cli.ativo": 10, "ativo": 10,
  "acordo": 11,
  "acesso": 12,
  "serasa": 13,
  "protesto": 14,
  "juridico": 15,
  "status wa": 16, "whatsapp": 16,
  "dt contato": 17, "data contato": 17, "dt.contato": 17,
  "valor recebido": 18, "vl recebido": 18, "vl.recebido": 18, "recebido": 18,
};

export interface ImportResult {
  success: number;
  errors: string[];
  rows: string[][];
}

export function parseCSV(text: string): ImportResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { success: 0, errors: ["Arquivo vazio ou sem dados"], rows: [] };

  // Detect separator
  const sep = lines[0].includes(";") ? ";" : ",";

  const headerLine = lines[0].split(sep).map((h) => h.trim().replace(/"/g, "").toLowerCase());

  // Map headers to column indices
  const colMap: Record<number, number> = {};
  headerLine.forEach((h, i) => {
    const target = HEADER_MAP[h];
    if (target !== undefined) colMap[i] = target;
  });

  if (Object.keys(colMap).length === 0) {
    return { success: 0, errors: ["Nenhuma coluna reconhecida. Use nomes como: Nome, Produto, Celular, Valor Total, Em Atraso..."], rows: [] };
  }

  const result: string[][] = [];
  const errors: string[] = [];
  const ts = timestampAtual();
  const today = ts.split(" ")[0];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));

    // Create empty row with defaults
    const row = Array(20).fill("");
    row[0] = today;
    row[10] = "Verificar";
    row[11] = "Nao";
    row[12] = "Verificar";
    row[13] = "Nao";
    row[14] = "Nao";
    row[15] = "Nao";
    row[16] = "Entrar em contato";
    row[18] = "R$ 0,00";
    row[19] = ts;

    // Fill from CSV
    Object.entries(colMap).forEach(([csvIdx, rowIdx]) => {
      const val = cells[+csvIdx] || "";
      if (val) row[rowIdx] = val;
    });

    // Validate: needs at least a name
    if (!row[1].trim()) {
      errors.push(`Linha ${i + 1}: nome vazio, ignorada`);
      continue;
    }

    result.push(row);
  }

  return { success: result.length, errors, rows: result };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file, "UTF-8");
  });
}
