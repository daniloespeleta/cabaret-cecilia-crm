export type Coluna<T> = { header: string; get: (row: T) => string | number | null | undefined };

function escapeCSV(v: string | number | null | undefined) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportarCSV<T>(nomeArquivo: string, colunas: Coluna<T>[], linhas: T[]) {
  const head = colunas.map((c) => escapeCSV(c.header)).join(";");
  const body = linhas.map((r) => colunas.map((c) => escapeCSV(c.get(r))).join(";"));
  // BOM para o Excel reconhecer acentuação
  const csv = "\uFEFF" + [head, ...body].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nomeArquivo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function esc(s: string | number | null | undefined) {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string);
}

export function exportarPDF<T>(
  titulo: string,
  colunas: Coluna<T>[],
  linhas: T[],
  subtitulo?: string,
) {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>${esc(titulo)}</title>
<style>
  @page { margin: 18mm 14mm; }
  body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #111; }
  h1 { font-size: 18px; margin: 0 0 2px; letter-spacing: .02em; }
  .sub { font-size: 11px; color: #666; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; background: #111; color: #f5e6c8; padding: 6px 8px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e3e3e3; }
  tr:nth-child(even) td { background: #fafafa; }
  footer { margin-top: 16px; font-size: 10px; color: #888; }
</style></head><body>
<h1>Cabaret da Cecília — ${esc(titulo)}</h1>
<div class="sub">${esc(subtitulo ?? "")}${subtitulo ? " · " : ""}gerado em ${new Date().toLocaleString("pt-BR")}</div>
<table><thead><tr>${colunas.map((c) => `<th>${esc(c.header)}</th>`).join("")}</tr></thead>
<tbody>${linhas
    .map((r) => `<tr>${colunas.map((c) => `<td>${esc(c.get(r))}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>
<footer>${linhas.length} registro(s)</footer>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("Libere os pop-ups para gerar o PDF.");
    return;
  }
  win.document.write(html);
  win.document.close();
}

export function brl(v: number | string | null | undefined) {
  return Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
