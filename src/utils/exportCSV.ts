import { COLUNAS_TABELA } from "@/data/constants";
import { diasAtrasoLabel } from "./formatters";

export function exportToCSV(rows: string[][], filename: string = "contas-receber") {
  const headers = COLUNAS_TABELA.map(([label]) => label);
  const csvRows = [headers.join(";")];

  rows.forEach((r) => {
    const line = COLUNAS_TABELA.map(([, col]) => {
      if (col === "dias") return diasAtrasoLabel(r[9], r[0] === "ok");
      return (r[col as number] || "").replace(/;/g, ",");
    });
    csvRows.push(line.join(";"));
  });

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
